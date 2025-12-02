/**
 * Security Tests Routes - OWASP Security Testing
 */

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { executeSecurityTest } from "../runner/securityrunner";
import {
  buildSecurityScanPrompt,
  buildVulnerabilityAnalysisPrompt,
} from "../llm/securityPrompts";
import OpenAI from "openai";

const router = Router();
const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * GET /api/security-tests
 * List all security tests for a project
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const where: any = { userId };
    if (projectId) {
      where.projectId = projectId;
    }

    const tests = await prisma.securityTest.findMany({
      where,
      include: {
        project: true,
        runs: {
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate summary metrics
    const testsWithMetrics = tests.map((test) => ({
      ...test,
      lastRun: test.runs[0] || null,
      totalRuns: test.runs.length,
    }));

    res.json({ data: testsWithMetrics });
  } catch (error: any) {
    console.error("Error fetching security tests:", error);
    res.status(500).json({ error: "Failed to fetch security tests" });
  }
});

/**
 * GET /api/security-tests/:id
 * Get a specific security test
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const test = await prisma.securityTest.findFirst({
      where: { id, userId },
      include: {
        project: true,
        runs: {
          orderBy: { startedAt: "desc" },
          take: 10,
          include: {
            vulnerabilities: {
              orderBy: { severity: "desc" },
            },
          },
        },
      },
    });

    if (!test) {
      return res.status(404).json({ error: "Security test not found" });
    }

    res.json({ data: test });
  } catch (error: any) {
    console.error("Error fetching security test:", error);
    res.status(500).json({ error: "Failed to fetch security test" });
  }
});

/**
 * POST /api/security-tests
 * Create a new security test
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      name,
      description,
      targetUrl,
      projectId,
      scanType,
      checkSqlInjection,
      checkXss,
      checkCsrf,
      checkAuthBypass,
      checkSensitiveData,
      checkSecurityHeaders,
      checkSslTls,
      checkDirectoryTraversal,
      authType,
      authConfig,
      aiPrompt,
    } = req.body;

    // Validate required fields
    if (!name || !targetUrl || !projectId) {
      return res.status(400).json({
        error: "Missing required fields: name, targetUrl, projectId",
      });
    }

    // If AI prompt provided, enhance the security test configuration
    let enhancedConfig: any = null;
    if (aiPrompt) {
      try {
        const prompt = buildSecurityScanPrompt({
          targetUrl,
          scanType: scanType || "full",
          checks: {
            sqlInjection: checkSqlInjection !== false,
            xss: checkXss !== false,
            csrf: checkCsrf !== false,
            authBypass: checkAuthBypass !== false,
            sensitiveData: checkSensitiveData !== false,
            securityHeaders: checkSecurityHeaders !== false,
            sslTls: checkSslTls !== false,
            directoryTraversal: checkDirectoryTraversal !== false,
          },
          authType,
          authConfig,
          customPrompt: aiPrompt,
        });

        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content:
                "You are a cybersecurity expert. Generate security test configurations in JSON format.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
        });

        const aiResponse = completion.choices[0]?.message?.content;
        if (aiResponse) {
          // Try to extract JSON from response
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            enhancedConfig = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (error) {
        console.error("AI enhancement failed:", error);
        // Continue without AI enhancement
      }
    }

    const test = await prisma.securityTest.create({
      data: {
        userId,
        projectId,
        name,
        description,
        targetUrl,
        scanType: scanType || "full",
        checkSqlInjection: checkSqlInjection !== false,
        checkXss: checkXss !== false,
        checkCsrf: checkCsrf !== false,
        checkAuthBypass: checkAuthBypass !== false,
        checkSensitiveData: checkSensitiveData !== false,
        checkSecurityHeaders: checkSecurityHeaders !== false,
        checkSslTls: checkSslTls !== false,
        checkDirectoryTraversal: checkDirectoryTraversal !== false,
        authType: authType || "none",
        authConfig: authConfig || null,
        aiPrompt: aiPrompt || null,
        status: "ready",
      },
    });

    res.status(201).json({
      data: test,
      aiEnhanced: !!enhancedConfig,
      enhancedConfig,
    });
  } catch (error: any) {
    console.error("Error creating security test:", error);
    res.status(500).json({ error: "Failed to create security test" });
  }
});

/**
 * PUT /api/security-tests/:id
 * Update a security test
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const test = await prisma.securityTest.findFirst({
      where: { id, userId },
    });

    if (!test) {
      return res.status(404).json({ error: "Security test not found" });
    }

    const {
      name,
      description,
      targetUrl,
      scanType,
      checkSqlInjection,
      checkXss,
      checkCsrf,
      checkAuthBypass,
      checkSensitiveData,
      checkSecurityHeaders,
      checkSslTls,
      checkDirectoryTraversal,
      authType,
      authConfig,
      aiPrompt,
    } = req.body;

    const updatedTest = await prisma.securityTest.update({
      where: { id },
      data: {
        name: name || test.name,
        description: description !== undefined ? description : test.description,
        targetUrl: targetUrl || test.targetUrl,
        scanType: scanType || test.scanType,
        checkSqlInjection:
          checkSqlInjection !== undefined
            ? checkSqlInjection
            : test.checkSqlInjection,
        checkXss: checkXss !== undefined ? checkXss : test.checkXss,
        checkCsrf: checkCsrf !== undefined ? checkCsrf : test.checkCsrf,
        checkAuthBypass:
          checkAuthBypass !== undefined
            ? checkAuthBypass
            : test.checkAuthBypass,
        checkSensitiveData:
          checkSensitiveData !== undefined
            ? checkSensitiveData
            : test.checkSensitiveData,
        checkSecurityHeaders:
          checkSecurityHeaders !== undefined
            ? checkSecurityHeaders
            : test.checkSecurityHeaders,
        checkSslTls: checkSslTls !== undefined ? checkSslTls : test.checkSslTls,
        checkDirectoryTraversal:
          checkDirectoryTraversal !== undefined
            ? checkDirectoryTraversal
            : test.checkDirectoryTraversal,
        authType: authType !== undefined ? authType : test.authType,
        authConfig: authConfig !== undefined ? authConfig : test.authConfig,
        aiPrompt: aiPrompt !== undefined ? aiPrompt : test.aiPrompt,
      },
    });

    res.json({ data: updatedTest });
  } catch (error: any) {
    console.error("Error updating security test:", error);
    res.status(500).json({ error: "Failed to update security test" });
  }
});

/**
 * DELETE /api/security-tests/:id
 * Delete a security test
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const test = await prisma.securityTest.findFirst({
      where: { id, userId },
    });

    if (!test) {
      return res.status(404).json({ error: "Security test not found" });
    }

    await prisma.securityTest.delete({
      where: { id },
    });

    res.json({ message: "Security test deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting security test:", error);
    res.status(500).json({ error: "Failed to delete security test" });
  }
});

/**
 * POST /api/security-tests/:id/run
 * Run a security test
 */
router.post("/:id/run", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const test = await prisma.securityTest.findFirst({
      where: { id, userId },
    });

    if (!test) {
      return res.status(404).json({ error: "Security test not found" });
    }

    // Execute security test in background
    executeSecurityTest(id).catch((error) => {
      console.error(`Security test ${id} execution failed:`, error);
    });

    res.json({
      message: "Security test started",
      testId: id,
    });
  } catch (error: any) {
    console.error("Error starting security test:", error);
    res.status(500).json({ error: "Failed to start security test" });
  }
});

/**
 * GET /api/security-tests/:id/runs
 * Get run history for a security test
 */
router.get("/:id/runs", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const test = await prisma.securityTest.findFirst({
      where: { id, userId },
    });

    if (!test) {
      return res.status(404).json({ error: "Security test not found" });
    }

    const runs = await prisma.securityTestRun.findMany({
      where: { securityTestId: id },
      include: {
        vulnerabilities: {
          orderBy: { severity: "desc" },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 50,
    });

    res.json({ data: runs });
  } catch (error: any) {
    console.error("Error fetching security test runs:", error);
    res.status(500).json({ error: "Failed to fetch security test runs" });
  }
});

/**
 * GET /api/security-tests/:id/vulnerabilities
 * Get all vulnerabilities for a security test
 */
router.get("/:id/vulnerabilities", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const test = await prisma.securityTest.findFirst({
      where: { id, userId },
    });

    if (!test) {
      return res.status(404).json({ error: "Security test not found" });
    }

    // Get all vulnerabilities from all runs
    const runs = await prisma.securityTestRun.findMany({
      where: { securityTestId: id },
      include: {
        vulnerabilities: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    // Flatten vulnerabilities from all runs
    const allVulnerabilities = runs.flatMap((run) =>
      run.vulnerabilities.map((vuln) => ({
        ...vuln,
        runId: run.id,
        runStartedAt: run.startedAt,
      }))
    );

    res.json({ data: allVulnerabilities });
  } catch (error: any) {
    console.error("Error fetching vulnerabilities:", error);
    res.status(500).json({ error: "Failed to fetch vulnerabilities" });
  }
});

/**
 * PATCH /api/vulnerabilities/:id/status
 * Update vulnerability status (open, acknowledged, fixed, false_positive)
 */
router.patch(
  "/vulnerabilities/:id/status",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (
        !["open", "acknowledged", "fixed", "false_positive"].includes(status)
      ) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const vulnerability = await prisma.vulnerability.update({
        where: { id },
        data: {
          status,
          fixedAt: status === "fixed" ? new Date() : null,
        },
      });

      res.json({ data: vulnerability });
    } catch (error: any) {
      console.error("Error updating vulnerability status:", error);
      res.status(500).json({ error: "Failed to update vulnerability status" });
    }
  }
);

export default router;
