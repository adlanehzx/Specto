import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { executeApiTestWithRetry } from "../runner/apirunner";
import {
  buildApiTestGenerationPrompt,
  buildApiTestFromCurlPrompt,
} from "../llm/apiPrompts";

const router = Router();
const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * GET /api/api-tests
 * List all API tests for the authenticated user
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { projectId, status } = req.query;

    const where: any = { userId };

    if (projectId) {
      where.projectId = projectId as string;
    }

    const apiTests = await prisma.apiTest.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        runs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            assertions: true,
          },
        },
        flakinessReport: true,
        _count: {
          select: {
            runs: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add computed fields
    const enrichedTests = apiTests.map((test) => {
      const latestRun = test.runs[0];
      const successCount = test.runs.filter(
        (r: any) => r.status === "success"
      ).length;
      const successRate =
        test._count.runs > 0 ? (successCount / test._count.runs) * 100 : 0;

      return {
        ...test,
        latestRun,
        successRate: Math.round(successRate),
        runsCount: test._count.runs,
      };
    });

    res.json(enrichedTests);
  } catch (error: any) {
    console.error("Error fetching API tests:", error);
    res.status(500).json({ error: "Failed to fetch API tests" });
  }
});

/**
 * GET /api/api-tests/:id
 * Get a specific API test with all runs
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const apiTest = await prisma.apiTest.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        project: true,
        runs: {
          orderBy: { createdAt: "desc" },
          include: {
            assertions: true,
          },
        },
        healingAttempts: {
          orderBy: { createdAt: "desc" },
          include: {
            validationRun: true,
          },
        },
        flakinessReport: true,
      },
    });

    if (!apiTest) {
      return res.status(404).json({ error: "API test not found" });
    }

    res.json(apiTest);
  } catch (error: any) {
    console.error("Error fetching API test:", error);
    res.status(500).json({ error: "Failed to fetch API test" });
  }
});

/**
 * POST /api/api-tests
 * Create a new API test
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      name,
      description,
      prompt,
      method,
      url,
      headers,
      body,
      queryParams,
      authType,
      authConfig,
      expectedStatus,
      assertions,
      timeout,
      maxRetries,
      retryDelay,
      autoHealingEnabled,
      projectId,
    } = req.body;

    // Validation
    if (!name || !method || !url) {
      return res.status(400).json({
        error: "Missing required fields: name, method, url",
      });
    }

    const validMethods = [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
      "HEAD",
      "OPTIONS",
    ];
    if (!validMethods.includes(method.toUpperCase())) {
      return res.status(400).json({
        error: `Invalid HTTP method. Must be one of: ${validMethods.join(
          ", "
        )}`,
      });
    }

    const apiTest = await prisma.apiTest.create({
      data: {
        userId,
        projectId: projectId || null,
        name,
        description,
        prompt,
        method: method.toUpperCase(),
        url,
        headers: headers || {},
        body: body || null,
        queryParams: queryParams || {},
        authType: authType || "none",
        authConfig: authConfig || {},
        expectedStatus: expectedStatus || 200,
        assertions: assertions || [],
        timeout: timeout || 30000,
        maxRetries: maxRetries || 3,
        retryDelay: retryDelay || 1000,
        autoHealingEnabled: autoHealingEnabled !== false,
      },
      include: {
        project: true,
      },
    });

    res.status(201).json(apiTest);
  } catch (error: any) {
    console.error("Error creating API test:", error);
    res.status(500).json({ error: "Failed to create API test" });
  }
});

/**
 * POST /api/api-tests/generate
 * Generate API test configuration from natural language using AI
 */
router.post("/generate", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { prompt, apiEndpoint } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: "AI generation not available. OPENAI_API_KEY not configured.",
      });
    }

    const systemPrompt = buildApiTestGenerationPrompt(prompt, apiEndpoint);

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const generatedText = completion.choices[0]?.message?.content;

    if (!generatedText) {
      throw new Error("No response from AI");
    }

    // Parse JSON from response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON from AI response");
    }

    const config = JSON.parse(jsonMatch[0]);

    res.json({
      success: true,
      config,
      rawResponse: generatedText,
    });
  } catch (error: any) {
    console.error("Error generating API test:", error);
    res.status(500).json({
      error: "Failed to generate API test",
      details: error.message,
    });
  }
});

/**
 * POST /api/api-tests/from-curl
 * Convert cURL command to API test configuration
 */
router.post("/from-curl", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { curlCommand } = req.body;

    if (!curlCommand) {
      return res.status(400).json({ error: "cURL command is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: "AI conversion not available. OPENAI_API_KEY not configured.",
      });
    }

    const systemPrompt = buildApiTestFromCurlPrompt(curlCommand);

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const generatedText = completion.choices[0]?.message?.content;

    if (!generatedText) {
      throw new Error("No response from AI");
    }

    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON from AI response");
    }

    const config = JSON.parse(jsonMatch[0]);

    res.json({
      success: true,
      config,
    });
  } catch (error: any) {
    console.error("Error converting cURL:", error);
    res.status(500).json({
      error: "Failed to convert cURL command",
      details: error.message,
    });
  }
});

/**
 * POST /api/api-tests/:id/run
 * Execute an API test
 */
router.post("/:id/run", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    // Verify ownership
    const apiTest = await prisma.apiTest.findFirst({
      where: { id, userId },
    });

    if (!apiTest) {
      return res.status(404).json({ error: "API test not found" });
    }

    // Execute test (async, will complete in background)
    const runId = await executeApiTestWithRetry(id);

    // Fetch the run result
    const run = await prisma.apiTestRun.findUnique({
      where: { id: runId },
      include: {
        assertions: true,
      },
    });

    res.json({
      success: true,
      run,
    });
  } catch (error: any) {
    console.error("Error executing API test:", error);
    res.status(500).json({
      error: "Failed to execute API test",
      details: error.message,
    });
  }
});

/**
 * PUT /api/api-tests/:id
 * Update an API test
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    // Verify ownership
    const existingTest = await prisma.apiTest.findFirst({
      where: { id, userId },
    });

    if (!existingTest) {
      return res.status(404).json({ error: "API test not found" });
    }

    const {
      name,
      description,
      method,
      url,
      headers,
      body,
      queryParams,
      authType,
      authConfig,
      expectedStatus,
      assertions,
      timeout,
      maxRetries,
      retryDelay,
      autoHealingEnabled,
      isActive,
    } = req.body;

    const apiTest = await prisma.apiTest.update({
      where: { id },
      data: {
        name,
        description,
        method: method?.toUpperCase(),
        url,
        headers,
        body,
        queryParams,
        authType,
        authConfig,
        expectedStatus,
        assertions,
        timeout,
        maxRetries,
        retryDelay,
        autoHealingEnabled,
        isActive,
      },
      include: {
        project: true,
      },
    });

    res.json(apiTest);
  } catch (error: any) {
    console.error("Error updating API test:", error);
    res.status(500).json({ error: "Failed to update API test" });
  }
});

/**
 * DELETE /api/api-tests/:id
 * Delete an API test
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    // Verify ownership
    const apiTest = await prisma.apiTest.findFirst({
      where: { id, userId },
    });

    if (!apiTest) {
      return res.status(404).json({ error: "API test not found" });
    }

    await prisma.apiTest.delete({
      where: { id },
    });

    res.json({ success: true, message: "API test deleted" });
  } catch (error: any) {
    console.error("Error deleting API test:", error);
    res.status(500).json({ error: "Failed to delete API test" });
  }
});

/**
 * GET /api/api-tests/:id/runs
 * Get all runs for a specific API test
 */
router.get("/:id/runs", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { limit = "50", offset = "0" } = req.query;

    // Verify ownership
    const apiTest = await prisma.apiTest.findFirst({
      where: { id, userId },
    });

    if (!apiTest) {
      return res.status(404).json({ error: "API test not found" });
    }

    const runs = await prisma.apiTestRun.findMany({
      where: { apiTestId: id },
      include: {
        assertions: true,
      },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    });

    const total = await prisma.apiTestRun.count({
      where: { apiTestId: id },
    });

    res.json({
      runs,
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });
  } catch (error: any) {
    console.error("Error fetching API test runs:", error);
    res.status(500).json({ error: "Failed to fetch API test runs" });
  }
});

export default router;
