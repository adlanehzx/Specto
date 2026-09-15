import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);
const prisma = new PrismaClient();

interface JestResult {
  success: boolean;
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  testResults: Array<{
    name: string;
    status: string;
    duration: number;
    failureMessages?: string[];
  }>;
  coverageMap?: {
    total: {
      lines: { pct: number };
      statements: { pct: number };
      functions: { pct: number };
      branches: { pct: number };
    };
  };
}

/**
 * Exécute un test unitaire avec Jest
 * @param testId - ID du test dans la base de données
 * @returns ID du run créé
 */
export async function executeUnitTest(testId: string): Promise<string> {
  console.log(`[unitrunner] Executing test ${testId}`);

  // Créer le run avec status "running"
  const run = await prisma.unitTestRun.create({
    data: {
      unitTestId: testId,
      status: "running",
      startedAt: new Date(),
    },
  });

  try {
    // Récupérer le test depuis la DB
    const test = await prisma.unitTest.findUnique({
      where: { id: testId },
    });

    if (!test) {
      throw new Error(`Unit test ${testId} not found`);
    }

    // Créer un répertoire temporaire pour l'exécution
    const tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specto-unit-test-")
    );

    try {
      // 1. Créer le fichier source
      const sourceFileName = `source-${testId}.ts`;
      const sourceFilePath = path.join(tempDir, sourceFileName);
      await fs.writeFile(sourceFilePath, test.sourceCode);

      // 2. Créer le fichier de test
      const testFileName = `test-${testId}.test.ts`;
      const testFilePath = path.join(tempDir, testFileName);
      await fs.writeFile(testFilePath, test.generatedCode);

      // 3. Créer un package.json minimal
      const packageJson = {
        name: "specto-unit-test",
        version: "1.0.0",
        type: "module",
        scripts: {
          test: "jest --json --coverage",
        },
      };
      await fs.writeFile(
        path.join(tempDir, "package.json"),
        JSON.stringify(packageJson, null, 2)
      );

      // 4. Créer une configuration Jest
      const jestConfig = {
        preset: "ts-jest",
        testEnvironment: "node",
        roots: [tempDir],
        testMatch: ["**/*.test.ts"],
        collectCoverage: true,
        coverageReporters: ["json", "text"],
        transform: {
          "^.+\\.ts$": "ts-jest",
        },
      };
      await fs.writeFile(
        path.join(tempDir, "jest.config.json"),
        JSON.stringify(jestConfig, null, 2)
      );

      // 5. Installer les dépendances nécessaires (Jest + TypeScript)
      console.log("[unitrunner] Installing Jest dependencies...");
      await execAsync(
        "npm install --no-save jest @types/jest ts-jest typescript",
        {
          cwd: tempDir,
        }
      );

      // 6. Exécuter Jest
      console.log("[unitrunner] Running Jest...");
      const { stdout, stderr } = await execAsync("npm test", {
        cwd: tempDir,
        timeout: 60000, // 60 secondes max
      });

      // 7. Parser les résultats Jest
      const jestOutput = stdout.toString();
      let jestResults: JestResult;

      try {
        // Jest retourne du JSON quand --json est utilisé
        const jsonMatch = jestOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jestResults = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON output from Jest");
        }
      } catch (parseError) {
        console.error("[unitrunner] Failed to parse Jest output:", jestOutput);
        throw new Error("Failed to parse Jest results");
      }

      // 8. Extraire la couverture
      let coveragePercent = 0;
      if (jestResults.coverageMap && jestResults.coverageMap.total) {
        const { lines, statements, functions, branches } =
          jestResults.coverageMap.total;
        coveragePercent =
          (lines.pct + statements.pct + functions.pct + branches.pct) / 4;
      }

      // 9. Mettre à jour le run avec les résultats
      await prisma.unitTestRun.update({
        where: { id: run.id },
        data: {
          status: jestResults.success ? "passed" : "failed",
          completedAt: new Date(),
          duration: Date.now() - run.startedAt.getTime(),
          totalTests: jestResults.numTotalTests,
          passedTests: jestResults.numPassedTests,
          failedTests: jestResults.numFailedTests,
          coverage: coveragePercent,
          results: jestResults.testResults as any,
          error: jestResults.success ? null : "Some tests failed",
        },
      });

      console.log(
        `[unitrunner] Test ${testId} completed: ${jestResults.numPassedTests}/${jestResults.numTotalTests} passed`
      );

      return run.id;
    } finally {
      // Nettoyer le répertoire temporaire
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`[unitrunner] Error executing test ${testId}:`, error);

    // Mettre à jour le run avec l'erreur
    await prisma.unitTestRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        duration: Date.now() - run.startedAt.getTime(),
        error: (error as Error).message,
      },
    });

    throw error;
  }
}

/**
 * Exécute plusieurs tests unitaires en parallèle
 * @param testIds - Array d'IDs de tests
 * @param maxParallel - Nombre maximum de tests en parallèle (défaut: 3)
 * @returns Array d'IDs de runs créés
 */
export async function executeUnitTestsBatch(
  testIds: string[],
  maxParallel: number = 3
): Promise<string[]> {
  console.log(
    `[unitrunner] Executing ${testIds.length} tests (${maxParallel} parallel)`
  );

  const results: string[] = [];
  const batches: string[][] = [];

  // Diviser en batches
  for (let i = 0; i < testIds.length; i += maxParallel) {
    batches.push(testIds.slice(i, i + maxParallel));
  }

  // Exécuter batch par batch
  for (const batch of batches) {
    const batchResults = await Promise.allSettled(
      batch.map((testId) => executeUnitTest(testId))
    );

    batchResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        console.error(
          `[unitrunner] Test ${batch[index]} failed:`,
          result.reason
        );
      }
    });
  }

  return results;
}

/**
 * Exécute un test unitaire avec retry en cas d'échec
 * @param testId - ID du test
 * @param maxRetries - Nombre maximum de tentatives (défaut: 2)
 * @returns ID du run réussi
 */
export async function executeUnitTestWithRetry(
  testId: string,
  maxRetries: number = 2
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[unitrunner] Attempt ${attempt + 1}/${
          maxRetries + 1
        } for test ${testId}`
      );
      const runId = await executeUnitTest(testId);

      // Vérifier si le test a réussi
      const run = await prisma.unitTestRun.findUnique({
        where: { id: runId },
      });

      if (run && run.status === "passed") {
        return runId;
      }

      if (attempt < maxRetries) {
        console.log(`[unitrunner] Test failed, retrying in 2 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      lastError = error as Error;
      console.error(`[unitrunner] Attempt ${attempt + 1} failed:`, error);

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  throw lastError || new Error("Test failed after all retries");
}
