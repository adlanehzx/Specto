/**
 * Agent Routes
 *
 * API endpoints for Specto Agent to register tunnel mappings
 */

import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

const router = Router();
const prisma = new PrismaClient();

// Redis client for storing tunnel mappings
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
});

/**
 * Tunnel mapping data structure
 */
interface TunnelMapping {
  port: number;
  url: string;
  status: "active" | "failed";
}

interface RegisterTunnelsRequest {
  tunnels: TunnelMapping[];
}

/**
 * POST /api/agent/register
 *
 * Register tunnel mappings from agent
 * Stores userId → {port: url} mapping in Redis with 1 hour TTL
 */
router.post("/register", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User ID not found in token",
      });
    }

    const { tunnels } = req.body as RegisterTunnelsRequest;

    if (!tunnels || !Array.isArray(tunnels)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "tunnels array is required",
      });
    }

    // Validate tunnel mappings
    for (const tunnel of tunnels) {
      if (!tunnel.port || !tunnel.url || !tunnel.status) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Each tunnel must have port, url, and status",
        });
      }
    }

    // 1. Store tunnels in Redis with 1 hour TTL (pour cache rapide)
    const redisKey = `agent:tunnels:${userId}`;
    const tunnelData = tunnels.reduce((acc, t) => {
      acc[t.port] = t.url;
      return acc;
    }, {} as Record<number, string>);

    await redis.set(redisKey, JSON.stringify(tunnelData), "EX", 3600);

    // 2. Sync to Database (pour persistance et affichage frontend)
    const createdTunnels = [];
    for (const tunnel of tunnels) {
      // Vérifier si un tunnel existe déjà pour ce port (même utilisateur)
      const existingTunnel = await prisma.tunnel.findFirst({
        where: {
          userId,
          port: tunnel.port,
          status: "active",
        },
      });

      if (existingTunnel) {
        // Mettre à jour l'URL si changée (cloudflared génère de nouvelles URLs)
        if (existingTunnel.url !== tunnel.url) {
          await prisma.tunnel.update({
            where: { id: existingTunnel.id },
            data: { url: tunnel.url },
          });
          createdTunnels.push(existingTunnel.id);
        }
      } else {
        // Créer un nouveau tunnel dans la DB
        const newTunnel = await prisma.tunnel.create({
          data: {
            url: tunnel.url,
            port: tunnel.port,
            status: "active",
            userId,
            agentId: "specto-agent", // Identifier les tunnels créés par l'agent
          },
        });
        createdTunnels.push(newTunnel.id);
      }
    }

    console.log(
      `[Agent] ✅ Registered ${tunnels.length} tunnel(s) for user ${userId}`
    );
    for (const tunnel of tunnels) {
      console.log(
        `[Agent]    • Port ${tunnel.port}: ${tunnel.url} (${tunnel.status})`
      );
    }

    return res.status(200).json({
      success: true,
      message: `Registered ${tunnels.length} tunnel(s)`,
      tunnels: tunnelData,
      createdIds: createdTunnels,
      expiresIn: 3600,
    });
  } catch (error: any) {
    console.error("[Agent] ❌ Error registering tunnels:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

/**
 * GET /api/agent/tunnels
 *
 * Get active tunnel mappings for authenticated user
 */
router.get("/tunnels", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User ID not found in token",
      });
    }

    const redisKey = `agent:tunnels:${userId}`;
    const tunnelDataStr = await redis.get(redisKey);

    if (!tunnelDataStr) {
      return res.status(200).json({
        success: true,
        tunnels: {},
        message: "No active tunnels found",
      });
    }

    const tunnels = JSON.parse(tunnelDataStr);
    const ttl = await redis.ttl(redisKey);

    return res.status(200).json({
      success: true,
      tunnels,
      expiresIn: ttl > 0 ? ttl : 0,
    });
  } catch (error: any) {
    console.error("[Agent] ❌ Error fetching tunnels:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

/**
 * DELETE /api/agent/tunnels
 *
 * Clear all tunnel mappings for authenticated user
 * Ferme aussi les tunnels dans la database
 */
router.delete("/tunnels", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User ID not found in token",
      });
    }

    // 1. Clear Redis cache
    const redisKey = `agent:tunnels:${userId}`;
    await redis.del(redisKey);

    // 2. Fermer tous les tunnels actifs de l'agent dans la DB
    const closedTunnels = await prisma.tunnel.updateMany({
      where: {
        userId,
        status: "active",
        agentId: "specto-agent",
      },
      data: {
        status: "closed",
        closedAt: new Date(),
      },
    });

    console.log(
      `[Agent] 🗑️  Cleared tunnel mappings for user ${userId} (${closedTunnels.count} tunnels closed)`
    );

    return res.status(200).json({
      success: true,
      message: "Tunnel mappings cleared",
      closedCount: closedTunnels.count,
    });
  } catch (error: any) {
    console.error("[Agent] ❌ Error clearing tunnels:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

/**
 * Helper function: Get agent tunnel URL for a specific port and user
 * Used by other services (e.g., testGenerator) to resolve localhost URLs
 *
 * @param userId - User ID
 * @param port - Port number
 * @returns Tunnel URL or null if not found
 */
export async function getAgentTunnelUrl(
  userId: string,
  port: number
): Promise<string | null> {
  try {
    const redisKey = `agent:tunnels:${userId}`;
    const tunnelDataStr = await redis.get(redisKey);

    if (!tunnelDataStr) {
      return null;
    }

    const tunnels = JSON.parse(tunnelDataStr);
    return tunnels[port] || null;
  } catch (error) {
    console.error("[Agent] ❌ Error fetching tunnel URL:", error);
    return null;
  }
}

export default router;
