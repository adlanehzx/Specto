/**
 * Test Routes
 *
 * Routes pour gérer les tests Playwright
 */

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import { addTestToQueue } from "../queue";
import { validatePrompt, analyzePrompt } from "../services/promptValidator";
import { getOrCreateTunnel } from "../services/tunnelManager";
import { isLocalUrl, extractPortFromUrl } from "../tunnel/cloudflare";
import {
  getFlakyTests,
  getFlakinessStats,
  getFlakinessReport,
} from "../services/flakinessService";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/tests
 * Liste des tests de l'utilisateur connecté
 */
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!; // Garanti par le middleware authenticate
    const { projectId } = req.query; // Filtrer par projet si fourni

    const whereClause: any = { userId };

    // Ajouter le filtre de projet si fourni
    if (projectId) {
      whereClause.projectId = projectId as string;
    }

    const tests = await prisma.test.findMany({
      where: whereClause,
      include: {
        results: {
          orderBy: { createdAt: "desc" },
          take: 1, // Dernier résultat uniquement
        },
        _count: {
          select: { results: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Ajouter le dernier résultat directement
    const testsWithLastResult = tests.map((test) => ({
      ...test,
      lastResult: test.results[0] || null,
    }));

    res.json(testsWithLastResult);
  } catch (error: any) {
    console.error("Error fetching tests:", error);
    res.status(500).json({
      error: "Erreur lors de la récupération des tests",
      message: error.message,
    });
  }
});

/**
 * GET /api/tests/:id
 * Détails d'un test spécifique
 */
router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const test = await prisma.test.findFirst({
      where: {
        id,
        userId, // S'assurer que le test appartient à l'utilisateur
      },
      include: {
        results: {
          orderBy: { createdAt: "desc" },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!test) {
      return res.status(404).json({
        error: "Test non trouvé",
      });
    }

    res.json(test);
  } catch (error: any) {
    console.error("Error fetching test:", error);
    res.status(500).json({
      error: "Erreur lors de la récupération du test",
      message: error.message,
    });
  }
});

/**
 * POST /api/tests/validate-prompt
 * Valider un prompt avant création
 */
router.post(
  "/validate-prompt",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({
          error: "Prompt requis",
        });
      }

      // Valider le prompt
      const validation = await validatePrompt(prompt);

      // Analyser le prompt pour des stats détaillées
      const analysis = analyzePrompt(prompt);

      res.json({
        ...validation,
        analysis,
      });
    } catch (error: any) {
      console.error("Error validating prompt:", error);
      res.status(500).json({
        error: "Erreur lors de la validation du prompt",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/tests
 * Créer un nouveau test
 */
router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const {
      url,
      prompt,
      projectId, // Ajout du projectId
      keepTunnelOpen = false,
      maxRetries = 3,
      retryDelay = 1000,
      autoHealingEnabled = true,
      assertions = null,
      executeImmediately = true, // Par défaut, on exécute immédiatement
    } = req.body;
    const userId = req.userId!;

    // Validation
    if (!url || !prompt) {
      return res.status(400).json({
        error: "URL et prompt requis",
      });
    }

    // Gérer le tunnel si URL locale
    let tunnelId: string | undefined;

    if (isLocalUrl(url)) {
      const port = extractPortFromUrl(url);

      if (port) {
        console.log(
          `[Tests] Local URL detected, managing tunnel for port ${port}...`
        );

        // Récupérer ou créer un tunnel actif
        const tunnel = await getOrCreateTunnel({
          userId,
          port,
        });

        tunnelId = tunnel.id;

        console.log(
          `[Tests] ${
            tunnel.isNew ? "Created new" : "Reusing existing"
          } tunnel: ${tunnel.url}`
        );
      } else {
        return res.status(400).json({
          error:
            "Cannot extract port from local URL. Use format: http://localhost:PORT",
        });
      }
    }

    // Créer le test dans la base de données (sans code pour l'instant)
    const test = await prisma.test.create({
      data: {
        userId,
        projectId: projectId || undefined, // Associer au projet si fourni
        url,
        prompt,
        code: "", // Sera généré par le worker
        tunnelId, // Référence au tunnel si URL locale
        keepTunnelOpen: keepTunnelOpen || false,
        maxRetries,
        retryDelay,
        autoHealingEnabled,
        assertions: assertions || undefined,
      },
    });

    // Ajouter le test à la queue SEULEMENT si executeImmediately = true
    let job = null;
    if (executeImmediately) {
      job = await addTestToQueue({
        testId: test.id,
        url,
        prompt,
        userId,
        keepTunnelOpen: keepTunnelOpen || false,
      });
    }

    res.status(201).json({
      success: true,
      testId: test.id,
      jobId: job?.id || null,
      status: executeImmediately ? "pending" : "created",
      test,
    });
  } catch (error: any) {
    console.error("Error creating test:", error);
    res.status(500).json({
      error: "Erreur lors de la création du test",
      message: error.message,
    });
  }
});

/**
 * DELETE /api/tests/:id
 * Supprimer un test
 */
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Vérifier que le test existe et appartient à l'utilisateur
    const test = await prisma.test.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!test) {
      return res.status(404).json({
        error: "Test non trouvé",
      });
    }

    // Supprimer le test (cascade vers results)
    await prisma.test.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Test supprimé",
    });
  } catch (error: any) {
    console.error("Error deleting test:", error);
    res.status(500).json({
      error: "Erreur lors de la suppression du test",
      message: error.message,
    });
  }
});

/**
 * GET /api/tests/flaky/list
 * Récupérer tous les tests flaky de l'utilisateur
 */
router.get("/flaky/list", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const flakyTests = await getFlakyTests(userId);

    res.json({
      success: true,
      count: flakyTests.length,
      tests: flakyTests,
    });
  } catch (error: any) {
    console.error("Error fetching flaky tests:", error);
    res.status(500).json({
      error: "Erreur lors de la récupération des tests flaky",
      message: error.message,
    });
  }
});

/**
 * GET /api/tests/flaky/stats
 * Statistiques globales de flakiness
 */
router.get(
  "/flaky/stats",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;

      const stats = await getFlakinessStats(userId);

      res.json({
        success: true,
        stats,
      });
    } catch (error: any) {
      console.error("Error fetching flakiness stats:", error);
      res.status(500).json({
        error: "Erreur lors de la récupération des statistiques",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/tests/:id/flakiness
 * Rapport de flakiness d'un test spécifique
 */
router.get(
  "/:id/flakiness",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      // Vérifier que le test appartient à l'utilisateur
      const test = await prisma.test.findFirst({
        where: { id, userId },
        select: { id: true },
      });

      if (!test) {
        return res.status(404).json({
          error: "Test non trouvé",
        });
      }

      const report = await getFlakinessReport(id);

      if (!report) {
        return res.status(404).json({
          error:
            "Aucun rapport de flakiness disponible (minimum 5 exécutions requises)",
        });
      }

      res.json({
        success: true,
        report,
      });
    } catch (error: any) {
      console.error("Error fetching flakiness report:", error);
      res.status(500).json({
        error: "Erreur lors de la récupération du rapport",
        message: error.message,
      });
    }
  }
);

export default router;
