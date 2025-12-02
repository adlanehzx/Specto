import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/auth.js";
import { executePerformanceTest } from "../runner/k6runner.js";
import {
  buildK6ScriptPrompt,
  buildPerformanceAnalysisPrompt,
} from "../llm/performancePrompts.js";
import OpenAI from "openai";

const router = express.Router();
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Appliquer l'authentification à toutes les routes
router.use(authMiddleware);

/**
 * POST /api/performance-tests
 * Créer un nouveau test de performance
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      url,
      method = "GET",
      headers,
      body,
      vus = 10,
      duration = 30,
      rampUp = 10,
      maxResponseTime,
      minRPS,
      maxErrorRate,
      prompt,
      projectId,
    } = req.body;
    const userId = req.user!.id;

    if (!name || !url) {
      return res.status(400).json({ error: "name and url are required" });
    }

    // Valider les valeurs
    if (vus < 1 || vus > 1000) {
      return res.status(400).json({ error: "vus must be between 1 and 1000" });
    }

    if (duration < 10 || duration > 3600) {
      return res
        .status(400)
        .json({ error: "duration must be between 10 and 3600 seconds" });
    }

    // Créer le test
    const test = await prisma.performanceTest.create({
      data: {
        name,
        userId,
        projectId: projectId || null,
        url,
        method,
        headers: headers || null,
        body: body || null,
        vus,
        duration,
        rampUp,
        maxResponseTime: maxResponseTime || null,
        minRPS: minRPS || null,
        maxErrorRate: maxErrorRate || null,
        prompt: prompt || null,
      },
      include: {
        project: true,
      },
    });

    res.json(test);
  } catch (error) {
    console.error("Error creating performance test:", error);
    res.status(500).json({
      error: "Failed to create performance test",
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/performance-tests
 * Liste tous les tests de performance de l'utilisateur
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.user!.id;
    const { projectId } = req.query;

    const where: any = { userId };

    if (projectId) {
      where.projectId = projectId as string;
    }

    const tests = await prisma.performanceTest.findMany({
      where,
      include: {
        project: true,
        runs: {
          orderBy: { startedAt: "desc" },
          take: 1, // Latest run only
        },
        _count: {
          select: {
            runs: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Enrichir avec les stats
    const enrichedTests = tests.map((test) => {
      const latestRun = test.runs[0];
      const totalRuns = test._count.runs;

      return {
        ...test,
        latestRun: latestRun || null,
        totalRuns,
        stats: latestRun
          ? {
              avgResponseTime: latestRun.avgResponseTime,
              p95ResponseTime: latestRun.p95ResponseTime,
              requestsPerSecond: latestRun.requestsPerSecond,
              errorRate: latestRun.errorRate,
            }
          : null,
      };
    });

    res.json(enrichedTests);
  } catch (error) {
    console.error("Error fetching performance tests:", error);
    res.status(500).json({
      error: "Failed to fetch performance tests",
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/performance-tests/:id
 * Récupérer les détails d'un test de performance
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const test = await prisma.performanceTest.findFirst({
      where: { id, userId },
      include: {
        project: true,
        runs: {
          orderBy: { startedAt: "desc" },
          take: 10, // Last 10 runs
        },
      },
    });

    if (!test) {
      return res.status(404).json({ error: "Performance test not found" });
    }

    // Calculer les stats globales
    const allRuns = await prisma.performanceTestRun.findMany({
      where: {
        performanceTestId: id,
        status: { in: ["passed", "failed"] },
      },
    });

    const passedRuns = allRuns.filter((r) => r.status === "passed").length;
    const failedRuns = allRuns.filter((r) => r.status === "failed").length;
    const totalRuns = allRuns.length;

    const avgP95 =
      allRuns.length > 0
        ? allRuns.reduce((sum, r) => sum + (r.p95ResponseTime || 0), 0) /
          allRuns.length
        : 0;

    const avgRPS =
      allRuns.length > 0
        ? allRuns.reduce((sum, r) => sum + (r.requestsPerSecond || 0), 0) /
          allRuns.length
        : 0;

    res.json({
      ...test,
      stats: {
        totalRuns,
        passedRuns,
        failedRuns,
        successRate: totalRuns > 0 ? (passedRuns / totalRuns) * 100 : 0,
        avgP95ResponseTime: avgP95,
        avgRequestsPerSecond: avgRPS,
      },
    });
  } catch (error) {
    console.error("Error fetching performance test:", error);
    res.status(500).json({
      error: "Failed to fetch performance test",
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/performance-tests/:id/runs
 * Récupérer l'historique des runs
 */
router.get("/:id/runs", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;

    // Vérifier que le test appartient à l'utilisateur
    const test = await prisma.performanceTest.findFirst({
      where: { id, userId },
    });

    if (!test) {
      return res.status(404).json({ error: "Performance test not found" });
    }

    const runs = await prisma.performanceTestRun.findMany({
      where: { performanceTestId: id },
      orderBy: { startedAt: "desc" },
      take: limit,
    });

    res.json(runs);
  } catch (error) {
    console.error("Error fetching runs:", error);
    res.status(500).json({
      error: "Failed to fetch runs",
      details: (error as Error).message,
    });
  }
});

/**
 * POST /api/performance-tests/:id/run
 * Exécuter un test de performance
 */
router.post("/:id/run", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Vérifier que le test appartient à l'utilisateur
    const test = await prisma.performanceTest.findFirst({
      where: { id, userId },
    });

    if (!test) {
      return res.status(404).json({ error: "Performance test not found" });
    }

    // Exécuter le test (asynchrone)
    const runId = await executePerformanceTest(id);

    res.json({
      message: "Performance test started",
      runId,
    });
  } catch (error) {
    console.error("Error running performance test:", error);
    res.status(500).json({
      error: "Failed to run performance test",
      details: (error as Error).message,
    });
  }
});

/**
 * POST /api/performance-tests/:id/analyze
 * Analyser les résultats avec l'IA et suggérer des optimisations
 */
router.post("/:id/analyze", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Vérifier que le test appartient à l'utilisateur
    const test = await prisma.performanceTest.findFirst({
      where: { id, userId },
      include: {
        runs: {
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!test) {
      return res.status(404).json({ error: "Performance test not found" });
    }

    const latestRun = test.runs[0];
    if (!latestRun) {
      return res.status(400).json({ error: "No run found for this test" });
    }

    // Construire le prompt pour l'IA
    const prompt = buildPerformanceAnalysisPrompt(latestRun.results, {
      url: test.url,
      method: test.method,
      vus: test.vus,
      duration: test.duration,
    });

    // Appeler l'IA
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const analysisText = completion.choices[0].message.content || "{}";

    // Extraire le JSON de la réponse
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    res.json({
      analysis,
      run: latestRun,
    });
  } catch (error) {
    console.error("Error analyzing performance test:", error);
    res.status(500).json({
      error: "Failed to analyze performance test",
      details: (error as Error).message,
    });
  }
});

/**
 * PUT /api/performance-tests/:id
 * Mettre à jour un test de performance
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const {
      name,
      url,
      method,
      headers,
      body,
      vus,
      duration,
      rampUp,
      maxResponseTime,
      minRPS,
      maxErrorRate,
      prompt,
    } = req.body;

    // Vérifier que le test appartient à l'utilisateur
    const existing = await prisma.performanceTest.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Performance test not found" });
    }

    // Construire les données de mise à jour
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (url !== undefined) updateData.url = url;
    if (method !== undefined) updateData.method = method;
    if (headers !== undefined) updateData.headers = headers;
    if (body !== undefined) updateData.body = body;
    if (vus !== undefined) updateData.vus = vus;
    if (duration !== undefined) updateData.duration = duration;
    if (rampUp !== undefined) updateData.rampUp = rampUp;
    if (maxResponseTime !== undefined)
      updateData.maxResponseTime = maxResponseTime;
    if (minRPS !== undefined) updateData.minRPS = minRPS;
    if (maxErrorRate !== undefined) updateData.maxErrorRate = maxErrorRate;
    if (prompt !== undefined) updateData.prompt = prompt;

    const updated = await prisma.performanceTest.update({
      where: { id },
      data: updateData,
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating performance test:", error);
    res.status(500).json({
      error: "Failed to update performance test",
      details: (error as Error).message,
    });
  }
});

/**
 * DELETE /api/performance-tests/:id
 * Supprimer un test de performance
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Vérifier que le test appartient à l'utilisateur
    const test = await prisma.performanceTest.findFirst({
      where: { id, userId },
    });

    if (!test) {
      return res.status(404).json({ error: "Performance test not found" });
    }

    // Supprimer (cascade les runs et metrics)
    await prisma.performanceTest.delete({
      where: { id },
    });

    res.json({ message: "Performance test deleted successfully" });
  } catch (error) {
    console.error("Error deleting performance test:", error);
    res.status(500).json({
      error: "Failed to delete performance test",
      details: (error as Error).message,
    });
  }
});

export default router;
