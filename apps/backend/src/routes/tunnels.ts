/**
 * Tunnel Management Routes
 *
 * Routes pour gérer les tunnels Cloudflare (depuis la base de données)
 */

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import {
  getActiveTunnels,
  getTunnelHistory,
  closeTunnel,
  closeAllUserTunnels,
} from "../services/tunnelManager";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/tunnels
 * Liste tous les tunnels de l'utilisateur (actifs + fermés)
 */
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { limit = 50 } = req.query;

    const tunnels = await getTunnelHistory(userId, Number(limit));

    res.json({
      success: true,
      count: tunnels.length,
      tunnels,
    });
  } catch (error: any) {
    console.error("Error fetching tunnels:", error);
    res.status(500).json({
      error: "Erreur lors de la récupération des tunnels",
      message: error.message,
    });
  }
});

/**
 * GET /api/tunnels/active
 * Liste uniquement les tunnels actifs
 */
router.get("/active", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const tunnels = await getActiveTunnels(userId);

    res.json({
      success: true,
      count: tunnels.length,
      tunnels,
    });
  } catch (error: any) {
    console.error("Error fetching active tunnels:", error);
    res.status(500).json({
      error: "Erreur lors de la récupération des tunnels actifs",
      message: error.message,
    });
  }
});

/**
 * GET /api/tunnels/:id
 * Détails d'un tunnel spécifique
 */
router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const tunnel = await prisma.tunnel.findFirst({
      where: {
        id,
        userId, // S'assurer que le tunnel appartient à l'utilisateur
      },
      include: {
        tests: {
          select: {
            id: true,
            url: true,
            prompt: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!tunnel) {
      return res.status(404).json({
        error: "Tunnel non trouvé",
      });
    }

    res.json({
      success: true,
      tunnel,
    });
  } catch (error: any) {
    console.error("Error fetching tunnel:", error);
    res.status(500).json({
      error: "Erreur lors de la récupération du tunnel",
      message: error.message,
    });
  }
});

/**
 * DELETE /api/tunnels/:id
 * Fermer manuellement un tunnel actif
 */
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Vérifier que le tunnel existe et appartient à l'utilisateur
    const tunnel = await prisma.tunnel.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!tunnel) {
      return res.status(404).json({
        error: "Tunnel non trouvé",
      });
    }

    if (tunnel.status === "closed") {
      return res.status(400).json({
        error: "Ce tunnel est déjà fermé",
      });
    }

    // Fermer le tunnel
    await closeTunnel(id);

    res.json({
      success: true,
      message: "Tunnel fermé avec succès",
      tunnel: {
        id: tunnel.id,
        url: tunnel.url,
        port: tunnel.port,
        closedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error("Error closing tunnel:", error);
    res.status(500).json({
      error: "Erreur lors de la fermeture du tunnel",
      message: error.message,
    });
  }
});

/**
 * DELETE /api/tunnels
 * Fermer tous les tunnels actifs de l'utilisateur
 */
router.delete("/", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const closedCount = await closeAllUserTunnels(userId);

    res.json({
      success: true,
      message: `${closedCount} tunnel(s) fermé(s)`,
      closedCount,
    });
  } catch (error: any) {
    console.error("Error closing all tunnels:", error);
    res.status(500).json({
      error: "Erreur lors de la fermeture des tunnels",
      message: error.message,
    });
  }
});

/**
 * GET /api/tunnels/stats/summary
 * Statistiques d'utilisation des tunnels
 */
router.get(
  "/stats/summary",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;

      // Count tunnels by status
      const [activeTunnels, allTunnels] = await Promise.all([
        prisma.tunnel.count({
          where: {
            userId,
            status: "active",
          },
        }),
        prisma.tunnel.count({
          where: { userId },
        }),
      ]);

      // Get tunnels by port
      const tunnelsByPort = await prisma.tunnel.groupBy({
        by: ["port"],
        where: { userId },
        _count: {
          port: true,
        },
        orderBy: {
          _count: {
            port: "desc",
          },
        },
      });

      res.json({
        success: true,
        stats: {
          total: allTunnels,
          active: activeTunnels,
          closed: allTunnels - activeTunnels,
          byPort: tunnelsByPort.map((item) => ({
            port: item.port,
            count: item._count.port,
          })),
        },
      });
    } catch (error: any) {
      console.error("Error fetching tunnel stats:", error);
      res.status(500).json({
        error: "Erreur lors de la récupération des statistiques",
        message: error.message,
      });
    }
  }
);

export default router;
