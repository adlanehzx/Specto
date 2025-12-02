import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { authMiddleware } from "../middleware/auth.js";
import {
  buildFunctionAnalysisPrompt,
  buildFunctionTestPrompt,
  buildTestOptimizationPrompt,
} from "../llm/unitPrompts.js";
import { executeUnitTest } from "../runner/unitrunner.js";

const router = Router();
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * POST /api/unit-tests/analyze
 * Analyse les fonctions et retourne un score d'importance (IA uniquement pour scoring)
 */
router.post("/analyze", async (req, res) => {
  try {
    const { functions } = req.body;

    if (!functions || !Array.isArray(functions)) {
      return res.status(400).json({ error: "Functions array is required" });
    }

    // Générer le prompt pour l'analyse IA
    const prompt = buildFunctionAnalysisPrompt(functions);

    // Appel à l'IA pour le scoring
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const analysis = JSON.parse(completion.choices[0].message.content || "{}");

    res.json({ scoredFunctions: analysis.functions || [] });
  } catch (error) {
    console.error("Error analyzing functions:", error);
    res
      .status(500)
      .json({
        error: "Failed to analyze functions",
        details: (error as Error).message,
      });
  }
});

/**
 * POST /api/unit-tests/generate-for-function
 * Génère les tests Jest pour une fonction spécifique
 */
router.post("/generate-for-function", async (req, res) => {
  try {
    const {
      functionName,
      functionCode,
      filePath,
      importance,
      context,
      isAsync,
      parameters,
    } = req.body;
    const userId = req.user!.id;

    if (!functionName || !functionCode) {
      return res
        .status(400)
        .json({ error: "functionName and functionCode are required" });
    }

    // Déterminer le niveau de tests basé sur l'importance
    let testDepth: "exhaustive" | "standard" | "basic" = "standard";
    if (importance >= 90) testDepth = "exhaustive";
    else if (importance < 70) testDepth = "basic";

    // Générer le prompt pour la génération de tests
    const prompt = buildFunctionTestPrompt(
      functionName,
      functionCode,
      testDepth,
      context
    );

    // Appel à l'IA pour générer les tests
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const generatedTests = completion.choices[0].message.content || "";

    // Sauvegarder en base de données
    const unitTest = await prisma.unitTest.create({
      data: {
        name: `Tests for ${functionName}`,
        userId,
        projectId: req.body.projectId || null,
        sourceFile: filePath || "unknown",
        functionName,
        sourceCode: functionCode,
        generatedCode: generatedTests,
        importance: importance || 0,
        framework: "jest",
        language: "typescript",
      },
    });

    res.json({
      testId: unitTest.id,
      generatedTests,
      importance,
      testDepth,
    });
  } catch (error) {
    console.error("Error generating tests:", error);
    res
      .status(500)
      .json({
        error: "Failed to generate tests",
        details: (error as Error).message,
      });
  }
});

/**
 * GET /api/unit-tests
 * Liste tous les tests unitaires de l'utilisateur
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.user!.id;
    const { projectId, importance } = req.query;

    const where: any = { userId };

    if (projectId) {
      where.projectId = projectId as string;
    }

    if (importance) {
      where.importance = { gte: parseInt(importance as string) };
    }

    const unitTests = await prisma.unitTest.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        runs: {
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { importance: "desc" },
    });

    // Calculer les statistiques pour chaque test
    const testsWithStats = unitTests.map((test) => ({
      ...test,
      totalRuns: test.runs.length,
      lastRun: test.runs[0] || null,
      successRate:
        test.runs.length > 0 && test.runs[0].status === "passed" ? 100 : 0,
    }));

    res.json({ unitTests: testsWithStats });
  } catch (error) {
    console.error("Error fetching unit tests:", error);
    res.status(500).json({ error: "Failed to fetch unit tests" });
  }
});

/**
 * GET /api/unit-tests/:id
 * Récupère les détails d'un test unitaire
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const unitTest = await prisma.unitTest.findFirst({
      where: { id, userId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        runs: {
          orderBy: { startedAt: "desc" },
          take: 10,
        },
      },
    });

    if (!unitTest) {
      return res.status(404).json({ error: "Unit test not found" });
    }

    // Calculer les statistiques
    const totalRuns = await prisma.unitTestRun.count({
      where: { unitTestId: id },
    });

    const passedRuns = await prisma.unitTestRun.count({
      where: { unitTestId: id, status: "passed" },
    });

    const avgCoverage = await prisma.unitTestRun.aggregate({
      where: { unitTestId: id, coverage: { not: null } },
      _avg: { coverage: true },
    });

    res.json({
      ...unitTest,
      stats: {
        totalRuns,
        passedRuns,
        failedRuns: totalRuns - passedRuns,
        successRate:
          totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 0,
        avgCoverage: avgCoverage._avg.coverage || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching unit test:", error);
    res.status(500).json({ error: "Failed to fetch unit test" });
  }
});

/**
 * GET /api/unit-tests/:id/runs
 * Récupère l'historique des exécutions
 */
router.get("/:id/runs", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Vérifier que le test appartient à l'utilisateur
    const unitTest = await prisma.unitTest.findFirst({
      where: { id, userId },
    });

    if (!unitTest) {
      return res.status(404).json({ error: "Unit test not found" });
    }

    const runs = await prisma.unitTestRun.findMany({
      where: { unitTestId: id },
      orderBy: { startedAt: "desc" },
      take: 50,
    });

    res.json({ runs });
  } catch (error) {
    console.error("Error fetching test runs:", error);
    res.status(500).json({ error: "Failed to fetch test runs" });
  }
});

/**
 * POST /api/unit-tests/:id/run
 * Exécute un test unitaire (appelé depuis le CLI uniquement)
 */
router.post("/:id/run", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Vérifier que le test appartient à l'utilisateur
    const unitTest = await prisma.unitTest.findFirst({
      where: { id, userId },
    });

    if (!unitTest) {
      return res.status(404).json({ error: "Unit test not found" });
    }

    // Exécuter le test
    const runId = await executeUnitTest(id);

    res.json({
      message: "Test execution started",
      runId,
    });
  } catch (error) {
    console.error("Error running unit test:", error);
    res
      .status(500)
      .json({
        error: "Failed to run unit test",
        details: (error as Error).message,
      });
  }
});

/**
 * POST /api/unit-tests/:id/optimize
 * Optimise les tests basés sur l'historique d'échecs
 */
router.post("/:id/optimize", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const unitTest = await prisma.unitTest.findFirst({
      where: { id, userId },
      include: {
        runs: {
          where: { status: "failed" },
          orderBy: { startedAt: "desc" },
          take: 5,
        },
      },
    });

    if (!unitTest) {
      return res.status(404).json({ error: "Unit test not found" });
    }

    if (unitTest.runs.length === 0) {
      return res.status(400).json({ error: "No failed runs to optimize from" });
    }

    // Extraire l'historique des échecs
    const failureHistory = unitTest.runs.map((run) => ({
      testName: unitTest.functionName,
      error: run.error || "Unknown error",
      date: run.startedAt,
      results: run.results,
    }));

    // Générer des tests améliorés
    const prompt = buildTestOptimizationPrompt(
      unitTest.functionName,
      unitTest.generatedCode,
      failureHistory
    );

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const optimizedTests = completion.choices[0].message.content || "";

    // Mettre à jour les tests
    await prisma.unitTest.update({
      where: { id },
      data: { generatedCode: optimizedTests },
    });

    res.json({
      message: "Tests optimized successfully",
      optimizedTests,
    });
  } catch (error) {
    console.error("Error optimizing tests:", error);
    res
      .status(500)
      .json({
        error: "Failed to optimize tests",
        details: (error as Error).message,
      });
  }
});

/**
 * PUT /api/unit-tests/:id
 * Met à jour un test unitaire
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { name, generatedCode } = req.body;

    const unitTest = await prisma.unitTest.findFirst({
      where: { id, userId },
    });

    if (!unitTest) {
      return res.status(404).json({ error: "Unit test not found" });
    }

    const updated = await prisma.unitTest.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(generatedCode && { generatedCode }),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating unit test:", error);
    res.status(500).json({ error: "Failed to update unit test" });
  }
});

/**
 * DELETE /api/unit-tests/:id
 * Supprime un test unitaire
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const unitTest = await prisma.unitTest.findFirst({
      where: { id, userId },
    });

    if (!unitTest) {
      return res.status(404).json({ error: "Unit test not found" });
    }

    await prisma.unitTest.delete({
      where: { id },
    });

    res.json({ message: "Unit test deleted successfully" });
  } catch (error) {
    console.error("Error deleting unit test:", error);
    res.status(500).json({ error: "Failed to delete unit test" });
  }
});

export default router;
