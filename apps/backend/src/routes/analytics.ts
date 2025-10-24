/**
 * Analytics Routes
 *
 * API endpoints for test analytics and statistics
 */

import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { prisma } from "../db";

const router = Router();

/**
 * GET /api/analytics
 *
 * Get analytics data for authenticated user
 * Returns:
 * - Overall stats (total tests, success rate, avg duration)
 * - Timeline data (tests per day, last 30 days)
 * - Status breakdown (success/failure/error counts)
 * - Recent tests (last 10)
 */
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User ID not found in token",
      });
    }

    // 1. Get all tests for user with results
    const tests = await prisma.test.findMany({
      where: { userId },
      include: {
        results: {
          orderBy: { createdAt: "desc" },
          take: 1, // Latest result only
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Calculate overall stats
    const totalTests = tests.length;
    const testsWithResults = tests.filter((t) => t.results.length > 0);

    const successCount = testsWithResults.filter(
      (t) => t.results[0]?.status === "success"
    ).length;
    const failureCount = testsWithResults.filter(
      (t) => t.results[0]?.status === "failure"
    ).length;
    const errorCount = testsWithResults.filter(
      (t) => t.results[0]?.status === "error"
    ).length;
    const pendingCount = tests.length - testsWithResults.length;

    const successRate =
      testsWithResults.length > 0
        ? Math.round((successCount / testsWithResults.length) * 100)
        : 0;

    // 3. Calculate average duration
    const durationsInMs = testsWithResults
      .map((t) => t.results[0]?.duration)
      .filter((d): d is number => d !== null && d !== undefined);

    const avgDuration =
      durationsInMs.length > 0
        ? Math.round(
            durationsInMs.reduce((a, b) => a + b, 0) / durationsInMs.length
          )
        : 0;

    // 4. Timeline data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const timelineTests = await prisma.test.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
      },
    });

    // Group by day
    const timelineMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      timelineMap.set(dateStr, 0);
    }

    timelineTests.forEach((test) => {
      const dateStr = test.createdAt.toISOString().split("T")[0];
      const current = timelineMap.get(dateStr) || 0;
      timelineMap.set(dateStr, current + 1);
    });

    const timeline = Array.from(timelineMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 5. Recent tests (last 10)
    const recentTests = tests.slice(0, 10).map((test) => ({
      id: test.id,
      url: test.url,
      prompt:
        test.prompt.substring(0, 100) + (test.prompt.length > 100 ? "..." : ""),
      status: test.results[0]?.status || "pending",
      duration: test.results[0]?.duration || null,
      createdAt: test.createdAt,
    }));

    // 6. Return analytics
    return res.status(200).json({
      success: true,
      analytics: {
        overview: {
          totalTests,
          testsRun: testsWithResults.length,
          successRate,
          avgDuration,
        },
        statusBreakdown: {
          success: successCount,
          failure: failureCount,
          error: errorCount,
          pending: pendingCount,
        },
        timeline,
        recentTests,
      },
    });
  } catch (error: any) {
    console.error("[Analytics] ❌ Error fetching analytics:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

/**
 * GET /api/analytics/performance
 *
 * Get performance metrics over time
 * Returns daily average duration for last 30 days
 */
router.get(
  "/performance",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "User ID not found in token",
        });
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const results = await prisma.result.findMany({
        where: {
          test: { userId },
          createdAt: { gte: thirtyDaysAgo },
          duration: { not: null },
        },
        select: {
          createdAt: true,
          duration: true,
        },
      });

      // Group by day and calculate avg
      const perfMap = new Map<string, { total: number; count: number }>();

      results.forEach((result) => {
        const dateStr = result.createdAt.toISOString().split("T")[0];
        const current = perfMap.get(dateStr) || { total: 0, count: 0 };
        perfMap.set(dateStr, {
          total: current.total + (result.duration || 0),
          count: current.count + 1,
        });
      });

      const performance = Array.from(perfMap.entries())
        .map(([date, { total, count }]) => ({
          date,
          avgDuration: Math.round(total / count),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return res.status(200).json({
        success: true,
        performance,
      });
    } catch (error: any) {
      console.error("[Analytics] ❌ Error fetching performance:", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

export default router;
