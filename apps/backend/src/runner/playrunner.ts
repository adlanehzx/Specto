/**
 * Playwright Test Runner
 *
 * Ce module permet d'exécuter des tests Playwright dynamiquement
 * à partir de code TypeScript ou de fichiers de test.
 *
 * Fonctionnalités:
 * - Exécution de tests depuis du code en string
 * - Capture automatique des screenshots
 * - Récupération des logs et résultats
 * - Support du mode headless
 * - Parsing des résultats JSON
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

/**
 * Interface pour le résultat d'exécution d'un test
 */
export interface TestResult {
  /** Statut du test: 'passed', 'failed', 'timedOut', 'interrupted' */
  status: "passed" | "failed" | "timedOut" | "interrupted" | "error";

  /** Logs de l'exécution (stdout + stderr) */
  logs: string;

  /** Chemins absolus vers les screenshots capturés */
  screenshotPaths: string[];

  /** Durée d'exécution en millisecondes */
  duration: number;

  /** Nombre de tests exécutés */
  testsCount?: number;

  /** Nombre de tests réussis */
  passedCount?: number;

  /** Nombre de tests échoués */
  failedCount?: number;

  /** Message d'erreur si échec */
  errorMessage?: string;

  /** Stack trace en cas d'erreur */
  errorStack?: string;

  /** Résultats des assertions */
  assertions?: AssertionResult[];
}

/**
 * Interface pour une assertion à exécuter
 */
export interface AssertionConfig {
  type:
    | "text"
    | "element-visible"
    | "attribute"
    | "url"
    | "count"
    | "input-value";
  selector?: string;
  attribute?: string;
  expectedValue: string;
}

/**
 * Interface pour le résultat d'une assertion
 */
export interface AssertionResult {
  type: string;
  selector: string | null;
  attribute?: string | null;
  expectedValue: string;
  actualValue: string | null;
  passed: boolean;
  errorMessage: string | null;
}

/**
 * Options pour l'exécution de tests
 */
export interface RunTestOptions {
  /** Mode headless (défaut: true) */
  headless?: boolean;

  /** Timeout en millisecondes (défaut: 30000) */
  timeout?: number;

  /** Dossier pour les screenshots (défaut: temp) */
  screenshotDir?: string;

  /** Reporter Playwright (défaut: 'json') */
  reporter?: string;

  /** Nettoyer les fichiers temporaires après exécution (défaut: true) */
  cleanup?: boolean;

  /** Assertions à exécuter après le test */
  assertions?: AssertionConfig[];
}

/**
 * Exécute un test Playwright depuis du code TypeScript
 *
 * @param code - Code TypeScript du test Playwright
 * @param options - Options d'exécution
 * @returns Résultat de l'exécution
 *
 * @example
 * const result = await runTestFromCode(`
 *   import { test, expect } from '@playwright/test';
 *   test('example', async ({ page }) => {
 *     await page.goto('https://example.com');
 *     await expect(page).toHaveTitle(/Example/);
 *   });
 * `);
 *
 * console.log(result.status); // 'passed' | 'failed'
 * console.log(result.duration); // durée en ms
 * console.log(result.screenshotPaths); // chemins des screenshots
 */
export async function runTestFromCode(
  code: string,
  options: RunTestOptions = {}
): Promise<TestResult> {
  const {
    headless = true,
    timeout = 30000,
    screenshotDir,
    reporter = "json",
    cleanup = true,
    assertions = [],
  } = options;

  // Créer un dossier temporaire pour le test
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "playwright-test-"));
  const testFileName = "test-generated.spec.ts";
  const testFilePath = path.join(tempDir, testFileName);

  // Dossier pour les screenshots
  const screenshotPath = screenshotDir || path.join(tempDir, "screenshots");
  await fs.mkdir(screenshotPath, { recursive: true });

  // Chemin du fichier de résultats JSON
  const resultsPath = path.join(tempDir, "results.json");
  const assertionsResultsPath = path.join(tempDir, "assertion-results.json");

  const startTime = Date.now();

  try {
    // 1. Créer un lien symbolique vers node_modules du backend
    const backendNodeModules = path.join(process.cwd(), "node_modules");
    const tempNodeModules = path.join(tempDir, "node_modules");

    try {
      await fs.symlink(backendNodeModules, tempNodeModules, "dir");
      console.log(
        `[PlayRunner] Created symlink: ${tempNodeModules} -> ${backendNodeModules}`
      );
    } catch (linkError: any) {
      // Si le lien symbolique échoue, essayer de copier node_modules (plus lent)
      console.warn("[PlayRunner] Symlink failed, attempting copy...");
      try {
        await fs.cp(backendNodeModules, tempNodeModules, {
          recursive: true,
          filter: (src) => {
            // Copier seulement @playwright et playwright
            return (
              src.includes("@playwright") ||
              src.includes("node_modules/playwright") ||
              src === backendNodeModules
            );
          },
        });
      } catch (copyError) {
        console.error("[PlayRunner] Could not setup node_modules:", copyError);
      }
    }

    // 2. Injecter les assertions dans le code si présentes
    let testCode = code;
    if (assertions && assertions.length > 0) {
      const assertionsCode = generateAssertionsCode(assertions);
      // Injecter le code d'assertions avant le dernier '});' du test
      testCode = code.replace(/(\}\);)\s*$/, `${assertionsCode}\n$1`);
      console.log(
        `[PlayRunner] Injected ${assertions.length} assertions into test code`
      );
    }

    // 3. Sauvegarder le code dans un fichier temporaire
    await fs.writeFile(testFilePath, testCode, "utf-8");

    // 3. Créer une configuration Playwright temporaire
    const playwrightConfig = generatePlaywrightConfig(
      screenshotPath,
      headless,
      timeout
    );
    const configPath = path.join(tempDir, "playwright.config.ts");
    await fs.writeFile(configPath, playwrightConfig, "utf-8");

    // 4. Construire la commande playwright test
    const command = buildPlaywrightCommand(
      testFilePath,
      configPath,
      reporter,
      resultsPath
    );

    console.log(`[PlayRunner] Executing command: ${command}`);
    console.log(`[PlayRunner] Test file: ${testFilePath}`);
    console.log(`[PlayRunner] Screenshot dir: ${screenshotPath}`);

    // 5. Exécuter le test
    let stdout = "";
    let stderr = "";

    try {
      const { stdout: out, stderr: err } = await execAsync(command, {
        cwd: tempDir,
        timeout: timeout + 5000, // Ajouter 5s de marge
        env: {
          ...process.env,
          PWTEST_SKIP_TEST_OUTPUT: "1", // Réduire le bruit dans les logs
          NODE_PATH: path.join(process.cwd(), "node_modules"), // Utiliser node_modules du backend
        },
      });
      stdout = out;
      stderr = err;
    } catch (error: any) {
      // Playwright retourne exit code 1 si des tests échouent
      // Ce n'est pas nécessairement une erreur critique
      stdout = error.stdout || "";
      stderr = error.stderr || "";
    }

    const duration = Date.now() - startTime;

    // 6. Parser les résultats JSON
    const testResult = await parsePlaywrightResults(
      resultsPath,
      stdout,
      stderr,
      duration
    );

    // 7. Parser les résultats des assertions si présents
    if (assertions && assertions.length > 0) {
      try {
        const assertionsContent = await fs.readFile(
          assertionsResultsPath,
          "utf-8"
        );
        const assertionResults: AssertionResult[] =
          JSON.parse(assertionsContent);
        testResult.assertions = assertionResults;

        // Mettre à jour le statut du test si des assertions ont échoué
        const assertionsFailed = assertionResults.some((a) => !a.passed);
        if (assertionsFailed && testResult.status === "passed") {
          testResult.status = "failed";
          testResult.errorMessage = "Some assertions failed";
        }

        console.log(
          `[PlayRunner] Assertions executed: ${assertionResults.length}`
        );
        console.log(
          `[PlayRunner] Assertions passed: ${
            assertionResults.filter((a) => a.passed).length
          }`
        );
      } catch (error) {
        console.warn(
          "[PlayRunner] Could not parse assertion results:",
          (error as Error).message
        );
        testResult.assertions = [];
      }
    }

    // 8. Récupérer les screenshots (chercher dans tout le dossier temporaire)
    const screenshots = await collectScreenshots(tempDir);
    testResult.screenshotPaths = screenshots;

    console.log(
      `[PlayRunner] Test completed: ${testResult.status} in ${duration}ms`
    );
    console.log(`[PlayRunner] Screenshots found: ${screenshots.length}`);

    // 9. Nettoyer les fichiers temporaires si demandé
    if (cleanup) {
      await cleanupTempFiles(tempDir);
    }

    return testResult;
  } catch (error: any) {
    const duration = Date.now() - startTime;

    console.error("[PlayRunner] Error executing test:", error);

    // En cas d'erreur, essayer quand même de récupérer les screenshots
    let screenshots: string[] = [];
    try {
      screenshots = await collectScreenshots(tempDir);
    } catch (e) {
      // Ignorer les erreurs de screenshot en cas d'échec
    }

    if (cleanup) {
      try {
        await cleanupTempFiles(tempDir);
      } catch (e) {
        // Ignorer les erreurs de nettoyage
      }
    }

    return {
      status: "error",
      logs: `Error: ${error.message}\n\n${error.stack || ""}`,
      screenshotPaths: screenshots,
      duration,
      errorMessage: error.message,
      errorStack: error.stack,
    };
  }
}

/**
 * Exécute un test depuis un fichier .ts existant
 *
 * @param filePath - Chemin vers le fichier de test
 * @param options - Options d'exécution
 * @returns Résultat de l'exécution
 */
export async function runTestFromFile(
  filePath: string,
  options: RunTestOptions = {}
): Promise<TestResult> {
  const code = await fs.readFile(filePath, "utf-8");
  return runTestFromCode(code, options);
}

/**
 * Génère une configuration Playwright temporaire
 */
function generatePlaywrightConfig(
  screenshotDir: string,
  headless: boolean,
  timeout: number
): string {
  return `
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: ${timeout},
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: [['json', { outputFile: 'results.json' }]],
  
  use: {
    headless: ${headless},
    screenshot: 'on',
    video: 'off',
    trace: 'off',
    actionTimeout: ${timeout / 2},
    // Utiliser le Chromium du système Alpine au lieu de télécharger
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    }
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
`;
}

/**
 * Construit la commande playwright test en utilisant le binaire local
 */
function buildPlaywrightCommand(
  testFile: string,
  configPath: string,
  reporter: string,
  resultsPath: string
): string {
  // Utiliser le binaire playwright installé dans node_modules au lieu de npx
  const playwrightBin = path.join(
    process.cwd(),
    "node_modules",
    ".bin",
    "playwright"
  );

  const commands = [
    `node "${playwrightBin}"`,
    "test",
    `"${testFile}"`,
    `--config="${configPath}"`,
    `--reporter=${reporter}`,
  ];

  return commands.join(" ");
}

/**
 * Parse les résultats JSON générés par Playwright
 */
async function parsePlaywrightResults(
  resultsPath: string,
  stdout: string,
  stderr: string,
  duration: number
): Promise<TestResult> {
  const logs = `=== STDOUT ===\n${stdout}\n\n=== STDERR ===\n${stderr}`;

  try {
    // Lire le fichier de résultats JSON
    const resultsContent = await fs.readFile(resultsPath, "utf-8");
    const results = JSON.parse(resultsContent);

    // Analyser les résultats
    const suites = results.suites || [];
    let testsCount = 0;
    let passedCount = 0;
    let failedCount = 0;
    let status: TestResult["status"] = "passed";
    let errorMessage = "";
    let errorStack = "";

    // Parcourir tous les suites et tests
    for (const suite of suites) {
      if (suite.specs) {
        for (const spec of suite.specs) {
          testsCount++;

          if (spec.tests) {
            for (const test of spec.tests) {
              const results = test.results || [];
              for (const result of results) {
                if (result.status === "passed") {
                  passedCount++;
                } else if (result.status === "failed") {
                  failedCount++;
                  status = "failed";

                  // Capturer le message d'erreur
                  if (result.error) {
                    errorMessage = result.error.message || "";
                    errorStack = result.error.stack || "";
                  }
                } else if (result.status === "timedOut") {
                  status = "timedOut";
                  errorMessage = "Test timeout exceeded";
                } else if (result.status === "interrupted") {
                  status = "interrupted";
                  errorMessage = "Test was interrupted";
                }
              }
            }
          }
        }
      }
    }

    return {
      status,
      logs,
      screenshotPaths: [], // Sera rempli plus tard
      duration,
      testsCount,
      passedCount,
      failedCount,
      errorMessage: errorMessage || undefined,
      errorStack: errorStack || undefined,
    };
  } catch (error) {
    console.warn(
      "[PlayRunner] Could not parse results.json, using fallback parsing"
    );

    // Fallback: analyser les logs
    const hasPassed = stdout.includes("passed") || stderr.includes("passed");
    const hasFailed = stdout.includes("failed") || stderr.includes("failed");

    return {
      status: hasFailed ? "failed" : hasPassed ? "passed" : "error",
      logs,
      screenshotPaths: [],
      duration,
      testsCount: 1,
      passedCount: hasPassed ? 1 : 0,
      failedCount: hasFailed ? 1 : 0,
    };
  }
}

/**
 * Collecte tous les screenshots générés
 */
async function collectScreenshots(screenshotDir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(screenshotDir, { recursive: true });
    const screenshots: string[] = [];

    for (const file of files) {
      const filePath = path.join(screenshotDir, file.toString());
      const stat = await fs.stat(filePath);

      if (
        stat.isFile() &&
        (file.toString().endsWith(".png") || file.toString().endsWith(".jpg"))
      ) {
        screenshots.push(filePath);
      }
    }

    return screenshots;
  } catch (error) {
    console.warn(
      "[PlayRunner] Could not collect screenshots:",
      (error as Error).message
    );
    return [];
  }
}

/**
 * Nettoie les fichiers temporaires
 */
async function cleanupTempFiles(tempDir: string): Promise<void> {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log(`[PlayRunner] Cleaned up temp directory: ${tempDir}`);
  } catch (error) {
    console.warn(
      "[PlayRunner] Could not clean up temp files:",
      (error as Error).message
    );
  }
}

/**
 * Génère le code Playwright pour exécuter les assertions
 */
function generateAssertionsCode(assertions: AssertionConfig[]): string {
  if (!assertions || assertions.length === 0) {
    return "";
  }

  const assertionsCode = assertions
    .map((assertion, index) => {
      switch (assertion.type) {
        case "text":
          return `
  // Assertion ${index + 1}: Text Content
  try {
    const element_${index} = await page.locator('${
            assertion.selector
          }').first();
    const actualText_${index} = (await element_${index}.textContent())?.trim() || '';
    const expectedText_${index} = '${assertion.expectedValue}'.trim();
    const passed_${index} = actualText_${index} === expectedText_${index};
    assertionResults.push({
      type: 'text',
      selector: '${assertion.selector}',
      expectedValue: expectedText_${index},
      actualValue: actualText_${index},
      passed: passed_${index},
      errorMessage: passed_${index} ? null : \`Expected "\${expectedText_${index}}" but got "\${actualText_${index}}"\`
    });
  } catch (error) {
    assertionResults.push({
      type: 'text',
      selector: '${assertion.selector}',
      expectedValue: '${assertion.expectedValue}',
      actualValue: null,
      passed: false,
      errorMessage: error.message
    });
  }`;

        case "element-visible":
          return `
  // Assertion ${index + 1}: Element Visible
  try {
    const isVisible_${index} = await page.locator('${
            assertion.selector
          }').isVisible();
    assertionResults.push({
      type: 'element-visible',
      selector: '${assertion.selector}',
      expectedValue: 'true',
      actualValue: String(isVisible_${index}),
      passed: isVisible_${index},
      errorMessage: isVisible_${index} ? null : 'Element is not visible'
    });
  } catch (error) {
    assertionResults.push({
      type: 'element-visible',
      selector: '${assertion.selector}',
      expectedValue: 'true',
      actualValue: 'false',
      passed: false,
      errorMessage: error.message
    });
  }`;

        case "attribute":
          return `
  // Assertion ${index + 1}: Attribute Value
  try {
    const attrValue_${index} = await page.locator('${
            assertion.selector
          }').getAttribute('${assertion.attribute}');
    const actualAttr_${index} = attrValue_${index} || '';
    const expectedAttr_${index} = '${assertion.expectedValue}';
    const passed_${index} = actualAttr_${index} === expectedAttr_${index};
    assertionResults.push({
      type: 'attribute',
      selector: '${assertion.selector}',
      attribute: '${assertion.attribute}',
      expectedValue: expectedAttr_${index},
      actualValue: actualAttr_${index},
      passed: passed_${index},
      errorMessage: passed_${index} ? null : \`Expected attribute "${
            assertion.attribute
          }" to be "\${expectedAttr_${index}}" but got "\${actualAttr_${index}}"\`
    });
  } catch (error) {
    assertionResults.push({
      type: 'attribute',
      selector: '${assertion.selector}',
      attribute: '${assertion.attribute}',
      expectedValue: '${assertion.expectedValue}',
      actualValue: null,
      passed: false,
      errorMessage: error.message
    });
  }`;

        case "url":
          return `
  // Assertion ${index + 1}: URL Check
  try {
    const currentUrl_${index} = page.url();
    const expectedUrl_${index} = '${assertion.expectedValue}';
    const passed_${index} = currentUrl_${index}.includes(expectedUrl_${index});
    assertionResults.push({
      type: 'url',
      selector: null,
      expectedValue: expectedUrl_${index},
      actualValue: currentUrl_${index},
      passed: passed_${index},
      errorMessage: passed_${index} ? null : \`Expected URL to contain "\${expectedUrl_${index}}" but got "\${currentUrl_${index}}"\`
    });
  } catch (error) {
    assertionResults.push({
      type: 'url',
      selector: null,
      expectedValue: '${assertion.expectedValue}',
      actualValue: null,
      passed: false,
      errorMessage: error.message
    });
  }`;

        case "count":
          return `
  // Assertion ${index + 1}: Element Count
  try {
    const count_${index} = await page.locator('${assertion.selector}').count();
    const expectedCount_${index} = parseInt('${assertion.expectedValue}');
    const passed_${index} = count_${index} === expectedCount_${index};
    assertionResults.push({
      type: 'count',
      selector: '${assertion.selector}',
      expectedValue: '${assertion.expectedValue}',
      actualValue: String(count_${index}),
      passed: passed_${index},
      errorMessage: passed_${index} ? null : \`Expected \${expectedCount_${index}} elements but found \${count_${index}}\`
    });
  } catch (error) {
    assertionResults.push({
      type: 'count',
      selector: '${assertion.selector}',
      expectedValue: '${assertion.expectedValue}',
      actualValue: null,
      passed: false,
      errorMessage: error.message
    });
  }`;

        case "input-value":
          return `
  // Assertion ${index + 1}: Input Value
  try {
    const inputValue_${index} = await page.locator('${
            assertion.selector
          }').inputValue();
    const expectedInput_${index} = '${assertion.expectedValue}';
    const passed_${index} = inputValue_${index} === expectedInput_${index};
    assertionResults.push({
      type: 'input-value',
      selector: '${assertion.selector}',
      expectedValue: expectedInput_${index},
      actualValue: inputValue_${index},
      passed: passed_${index},
      errorMessage: passed_${index} ? null : \`Expected input value "\${expectedInput_${index}}" but got "\${inputValue_${index}}"\`
    });
  } catch (error) {
    assertionResults.push({
      type: 'input-value',
      selector: '${assertion.selector}',
      expectedValue: '${assertion.expectedValue}',
      actualValue: null,
      passed: false,
      errorMessage: error.message
    });
  }`;

        default:
          return "";
      }
    })
    .join("\n");

  return `
  // === ASSERTIONS ===
  const assertionResults: any[] = [];
  ${assertionsCode}
  
  // Écrire les résultats des assertions dans un fichier
  await require('fs').promises.writeFile(
    'assertion-results.json',
    JSON.stringify(assertionResults, null, 2),
    'utf-8'
  );
  `;
}

/**
 * Valide que Playwright est installé
 */
export async function validatePlaywrightInstallation(): Promise<boolean> {
  try {
    await execAsync("npx playwright --version");
    return true;
  } catch (error) {
    console.error(
      "[PlayRunner] Playwright is not installed. Run: npm install -D @playwright/test && npx playwright install"
    );
    return false;
  }
}
