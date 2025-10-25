/**
 * Scheduling Routes
 *
 * Routes pour la planification des tests :
 * - POST /api/schedule/test/:id - Planifier un test
 * - DELETE /api/schedule/test/:id - Annuler la planification
 * - PATCH /api/schedule/test/:id/toggle - Activer/désactiver un test planifié
 * - GET /api/schedule/tests - Liste des tests planifiés
 * - GET /api/schedule/stats - Statistiques de planification
 */

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import { testScheduler } from "../services/testScheduler";
import { cronJobsService } from "../services/cronJobs";

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/schedule/test/:id
 * Planifier un test pour exécution récurrente ou ponctuelle
 */
router.post("/test/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { frequency, nextRunAt } = req.body;

    // Validation
    if (!frequency && !nextRunAt) {
      return res.status(400).json({
        error: "Either 'frequency' or 'nextRunAt' must be provided",
      });
    }

    if (
      frequency &&
      !["hourly", "daily", "weekly", "monthly"].includes(frequency)
    ) {
      return res.status(400).json({
        error: "Invalid frequency. Must be: hourly, daily, weekly, or monthly",
      });
    }

    // Vérifier que le test appartient à l'utilisateur
    const test = await prisma.test.findUnique({
      where: { id },
    });

    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    if (test.userId !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Planifier le test
    await testScheduler.scheduleTest({
      testId: id,
      frequency: frequency || null,
      nextRunAt: nextRunAt ? new Date(nextRunAt) : undefined,
    });

    // Récupérer le test mis à jour
    const updatedTest = await prisma.test.findUnique({
      where: { id },
    });

    res.json({
      message: "Test scheduled successfully",
      test: updatedTest,
    });
  } catch (error) {
    console.error("Error scheduling test:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to schedule test",
    });
  }
});

/**
 * DELETE /api/schedule/test/:id
 * Annuler la planification d'un test
 */
router.delete(
  "/test/:id",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Vérifier que le test appartient à l'utilisateur
      const test = await prisma.test.findUnique({
        where: { id },
      });

      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }

      if (test.userId !== req.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Annuler la planification
      await testScheduler.unscheduleTest(id);

      res.json({ message: "Test unscheduled successfully" });
    } catch (error) {
      console.error("Error unscheduling test:", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to unschedule test",
      });
    }
  }
);

/**
 * PATCH /api/schedule/test/:id/toggle
 * Activer ou désactiver un test planifié (pause/resume)
 */
router.patch(
  "/test/:id/toggle",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          error: "'isActive' must be a boolean",
        });
      }

      // Vérifier que le test appartient à l'utilisateur
      const test = await prisma.test.findUnique({
        where: { id },
      });

      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }

      if (test.userId !== req.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Toggle
      await testScheduler.toggleScheduledTest(id, isActive);

      // Récupérer le test mis à jour
      const updatedTest = await prisma.test.findUnique({
        where: { id },
      });

      res.json({
        message: `Test ${isActive ? "activated" : "paused"} successfully`,
        test: updatedTest,
      });
    } catch (error) {
      console.error("Error toggling test:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to toggle test",
      });
    }
  }
);

/**
 * GET /api/schedule/tests
 * Liste de tous les tests planifiés de l'utilisateur
 */
router.get("/tests", authenticate, async (req: Request, res: Response) => {
  try {
    const tests = await testScheduler.getScheduledTests(req.userId!);

    res.json({
      tests,
      count: tests.length,
    });
  } catch (error) {
    console.error("Error fetching scheduled tests:", error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch scheduled tests",
    });
  }
});

/**
 * GET /api/schedule/stats
 * Statistiques de planification de l'utilisateur
 */
router.get("/stats", authenticate, async (req: Request, res: Response) => {
  try {
    const stats = await testScheduler.getSchedulingStats(req.userId!);

    res.json(stats);
  } catch (error) {
    console.error("Error fetching scheduling stats:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch stats",
    });
  }
});

/**
 * POST /api/schedule/cron/run-now
 * Exécuter manuellement les tâches cron (pour les tests/admin)
 */
router.post(
  "/cron/run-now",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { job } = req.body;

      if (job === "cleanup") {
        await cronJobsService.runTunnelCleanupNow();
        res.json({ message: "Tunnel cleanup executed" });
      } else if (job === "scheduler") {
        await cronJobsService.runScheduledTestsNow();
        res.json({ message: "Scheduled tests executed" });
      } else {
        res.status(400).json({
          error: "Invalid job. Must be 'cleanup' or 'scheduler'",
        });
      }
    } catch (error) {
      console.error("Error running cron job:", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to run cron job",
      });
    }
  }
);

/**
 * GET /api/schedule/cron/status
 * Statut des cron jobs
 */
router.get(
  "/cron/status",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const status = cronJobsService.getStatus();
      res.json({ jobs: status });
    } catch (error) {
      console.error("Error fetching cron status:", error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch cron status",
      });
    }
  }
);

export default router;
