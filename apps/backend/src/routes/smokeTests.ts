/**
 * Smoke Tests Routes
 * CRUD operations for smoke tests
 */

import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { authenticate } from "../middleware/auth";
import {
  buildSmokeTestGenerationPrompt,
  buildSmokeTestFromDocsPrompt,
  buildSmokeTestOptimizationPrompt,
  buildMicroservicesSmokeTestPrompt,
  buildStackSpecificSmokeTestPrompt,
  buildSmokeTestNamingPrompt,
} from "../llm/smokePrompts";
import {
  executeSmokeTest,
  executeSmokeTestWithRetry,
  executeSmokeTestsBatch,
} from "../runner/smokerunner";

const router = Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticate);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * GET /api/smoke-tests
 * List all smoke tests for authenticated user
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { projectId } = req.query;

    let whereClause: any = {};

    if (projectId) {
      // Project-based access: show tests in projects user owns or is member of
      whereClause = {
        projectId: projectId as string,
        project: {
          OR: [
            { createdBy: userId },
            { members: { some: { userId } } }
          ]
        }
      };
    } else {
      // No project specified: show only user's own tests
      whereClause = { userId };
    }

    const smokeTests = await prisma.smokeTest.findMany({
      where: whereClause,
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
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            successfulChecks: true,
            totalEndpoints: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(smokeTests);
  } catch (error) {
    console.error("Error fetching smoke tests:", error);
    res.status(500).json({ error: "Failed to fetch smoke tests" });
  }
});

/**
 * GET /api/smoke-tests/:id
 * Get single smoke test with details
 */
router.get("/:id", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const smokeTest = await prisma.smokeTest.findFirst({
      where: { id, userId },
      include: {
        project: true,
        runs: {
          orderBy: { startedAt: "desc" },
        },
      },
    });

    if (!smokeTest) {
      return res.status(404).json({ error: "Smoke test not found" });
    }

    res.json(smokeTest);
  } catch (error) {
    console.error("Error fetching smoke test:", error);
    res.status(500).json({ error: "Failed to fetch smoke test" });
  }
});

/**
 * POST /api/smoke-tests
 * Create new smoke test manually
 */
router.post("/", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      name,
      description,
      baseUrl,
      endpoints,
      projectId,
      schedule,
      retryOnFailure,
      maxRetries,
      retryDelayMs,
    } = req.body;

    // Validation
    if (!name || !baseUrl || !endpoints || !Array.isArray(endpoints)) {
      return res.status(400).json({
        error: "Missing required fields: name, baseUrl, endpoints",
      });
    }

    // Validate endpoints structure
    for (const endpoint of endpoints) {
      if (!endpoint.url || !endpoint.method || !endpoint.expectedStatus) {
        return res.status(400).json({
          error: "Each endpoint must have url, method, and expectedStatus",
        });
      }
    }

    const smokeTest = await prisma.smokeTest.create({
      data: {
        name,
        description,
        endpoints,
        userId,
        projectId: projectId || null,
        maxRetries: maxRetries ?? 3,
        retryDelay: retryDelayMs ?? 1000,
        generatedBy: "manual",
      },
      include: {
        project: true,
      },
    });

    res.status(201).json(smokeTest);
  } catch (error) {
    console.error("Error creating smoke test:", error);
    res.status(500).json({ error: "Failed to create smoke test" });
  }
});

/**
 * POST /api/smoke-tests/generate
 * Generate smoke test using AI
 */
router.post("/generate", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      baseUrl,
      description,
      apiDocs,
      services,
      stack,
      generationType = "description",
      projectId,
    } = req.body;

    if (!baseUrl) {
      return res.status(400).json({ error: "baseUrl is required" });
    }

    // Build prompt based on generation type
    let prompt: string;
    switch (generationType) {
      case "description":
        if (!description) {
          return res.status(400).json({ error: "description is required" });
        }
        prompt = buildSmokeTestGenerationPrompt(baseUrl, description);
        break;

      case "docs":
        if (!apiDocs) {
          return res.status(400).json({ error: "apiDocs is required" });
        }
        prompt = buildSmokeTestFromDocsPrompt(baseUrl, apiDocs);
        break;

      case "microservices":
        if (!services || !Array.isArray(services)) {
          return res.status(400).json({ error: "services array is required" });
        }
        prompt = buildMicroservicesSmokeTestPrompt(services);
        break;

      case "stack":
        if (!stack) {
          return res.status(400).json({ error: "stack is required" });
        }
        prompt = buildStackSpecificSmokeTestPrompt(baseUrl, stack);
        break;

      default:
        return res.status(400).json({ error: "Invalid generationType" });
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return res.status(500).json({ error: "Failed to generate smoke test" });
    }

    // Parse AI response (extract JSON)
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(500).json({
        error: "Failed to parse AI response",
        aiResponse,
      });
    }

    const endpoints = JSON.parse(jsonMatch[0]);

    // Generate name and description if not provided
    let finalName = description || "AI Generated Smoke Test";
    let finalDescription = description || "";

    if (!description) {
      const namingPrompt = buildSmokeTestNamingPrompt(endpoints, baseUrl);
      const namingCompletion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: namingPrompt }],
        temperature: 0.7,
      });

      const namingResponse = namingCompletion.choices[0]?.message?.content;
      if (namingResponse) {
        const namingMatch = namingResponse.match(/\{[\s\S]*\}/);
        if (namingMatch) {
          const naming = JSON.parse(namingMatch[0]);
          finalName = naming.name || finalName;
          finalDescription = naming.description || finalDescription;
        }
      }
    }

    // Create smoke test
    const smokeTest = await prisma.smokeTest.create({
      data: {
        name: finalName,
        description: finalDescription,
        endpoints,
        userId,
        projectId: projectId || null,
        prompt: prompt,
        generatedBy: "ai",
        maxRetries: 3,
        retryDelay: 1000,
      },
      include: {
        project: true,
      },
    });

    res.status(201).json({
      smokeTest,
      aiResponse: aiResponse,
      endpoints,
    });
  } catch (error) {
    console.error("Error generating smoke test:", error);
    res.status(500).json({
      error: "Failed to generate smoke test",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/smoke-tests/:id/run
 * Execute smoke test
 */
router.post("/:id/run", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { withRetry = false } = req.body;

    // Check ownership
    const smokeTest = await prisma.smokeTest.findFirst({
      where: { id, userId },
    });

    if (!smokeTest) {
      return res.status(404).json({ error: "Smoke test not found" });
    }

    // Execute test
    let runId: string;
    if (withRetry) {
      runId = await executeSmokeTestWithRetry(id);
    } else {
      runId = await executeSmokeTest(id);
    }

    // Fetch the run details
    const run = await prisma.smokeTestRun.findUnique({
      where: { id: runId },
    });

    res.json({
      message: "Smoke test executed",
      runId,
      run,
    });
  } catch (error) {
    console.error("Error executing smoke test:", error);
    res.status(500).json({
      error: "Failed to execute smoke test",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/smoke-tests/batch/run
 * Execute multiple smoke tests
 */
router.post("/batch/run", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { testIds, parallel = true } = req.body;

    if (!testIds || !Array.isArray(testIds)) {
      return res.status(400).json({ error: "testIds array is required" });
    }

    // Check ownership of all tests
    const smokeTests = await prisma.smokeTest.findMany({
      where: { id: { in: testIds }, userId },
    });

    if (smokeTests.length !== testIds.length) {
      return res.status(404).json({ error: "Some smoke tests not found" });
    }

    // Execute batch
    const runIds = await executeSmokeTestsBatch(testIds, parallel);

    // Fetch run details
    const runs = await prisma.smokeTestRun.findMany({
      where: { id: { in: runIds } },
      include: {
        smokeTest: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      message: "Smoke tests executed",
      runIds,
      runs,
    });
  } catch (error) {
    console.error("Error executing batch smoke tests:", error);
    res.status(500).json({
      error: "Failed to execute batch smoke tests",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/smoke-tests/:id/runs
 * Get all runs for a smoke test
 */
router.get("/:id/runs", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    // Check ownership
    const smokeTest = await prisma.smokeTest.findFirst({
      where: { id, userId },
    });

    if (!smokeTest) {
      return res.status(404).json({ error: "Smoke test not found" });
    }

    const runs = await prisma.smokeTestRun.findMany({
      where: { smokeTestId: id },
      orderBy: { startedAt: "desc" },
    });

    res.json(runs);
  } catch (error) {
    console.error("Error fetching smoke test runs:", error);
    res.status(500).json({ error: "Failed to fetch runs" });
  }
});

/**
 * GET /api/smoke-tests/:id/runs/:runId
 * Get single run details
 */
router.get("/:id/runs/:runId", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id, runId } = req.params;

    // Check ownership
    const smokeTest = await prisma.smokeTest.findFirst({
      where: { id, userId },
    });

    if (!smokeTest) {
      return res.status(404).json({ error: "Smoke test not found" });
    }

    const run = await prisma.smokeTestRun.findFirst({
      where: { id: runId, smokeTestId: id },
      include: {
        smokeTest: true,
      },
    });

    if (!run) {
      return res.status(404).json({ error: "Run not found" });
    }

    res.json(run);
  } catch (error) {
    console.error("Error fetching run:", error);
    res.status(500).json({ error: "Failed to fetch run" });
  }
});

/**
 * PUT /api/smoke-tests/:id
 * Update smoke test
 */
router.put("/:id", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const {
      name,
      description,
      baseUrl,
      endpoints,
      schedule,
      retryOnFailure,
      maxRetries,
      retryDelayMs,
    } = req.body;

    // Check ownership
    const existingSmokeTest = await prisma.smokeTest.findFirst({
      where: { id, userId },
    });

    if (!existingSmokeTest) {
      return res.status(404).json({ error: "Smoke test not found" });
    }

    const smokeTest = await prisma.smokeTest.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(baseUrl && { baseUrl }),
        ...(endpoints && { endpoints }),
        ...(schedule !== undefined && { schedule }),
        ...(retryOnFailure !== undefined && { retryOnFailure }),
        ...(maxRetries !== undefined && { maxRetries }),
        ...(retryDelayMs !== undefined && { retryDelayMs }),
      },
      include: {
        project: true,
      },
    });

    res.json(smokeTest);
  } catch (error) {
    console.error("Error updating smoke test:", error);
    res.status(500).json({ error: "Failed to update smoke test" });
  }
});

/**
 * DELETE /api/smoke-tests/:id
 * Delete smoke test
 */
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    // Check ownership
    const smokeTest = await prisma.smokeTest.findFirst({
      where: { id, userId },
    });

    if (!smokeTest) {
      return res.status(404).json({ error: "Smoke test not found" });
    }

    // Delete test and all runs (cascade)
    await prisma.smokeTest.delete({
      where: { id },
    });

    res.json({ message: "Smoke test deleted successfully" });
  } catch (error) {
    console.error("Error deleting smoke test:", error);
    res.status(500).json({ error: "Failed to delete smoke test" });
  }
});

/**
 * POST /api/smoke-tests/:id/optimize
 * Optimize smoke test based on failure history
 */
router.post("/:id/optimize", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    // Check ownership
    const smokeTest = await prisma.smokeTest.findFirst({
      where: { id, userId },
      include: {
        runs: {
          orderBy: { startedAt: "desc" },
          take: 10,
        },
      },
    });

    if (!smokeTest) {
      return res.status(404).json({ error: "Smoke test not found" });
    }

    // Build optimization prompt
    const prompt = buildSmokeTestOptimizationPrompt(
      smokeTest.endpoints as any[],
      smokeTest.runs
    );

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return res.status(500).json({ error: "Failed to optimize smoke test" });
    }

    // Parse AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({
        error: "Failed to parse AI response",
        aiResponse,
      });
    }

    const optimization = JSON.parse(jsonMatch[0]);

    res.json({
      currentEndpoints: smokeTest.endpoints,
      optimizedEndpoints: optimization.optimizedEndpoints,
      changes: optimization.changes,
      aiResponse,
    });
  } catch (error) {
    console.error("Error optimizing smoke test:", error);
    res.status(500).json({
      error: "Failed to optimize smoke test",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
