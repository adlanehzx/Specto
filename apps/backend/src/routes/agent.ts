/**
 * Agent Routes
 *
 * API endpoints for LeynAI Agent to register tunnel mappings
 */

import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import Redis from "ioredis";

const router = Router();

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

    // Store tunnels in Redis with 1 hour TTL
    const redisKey = `agent:tunnels:${userId}`;
    const tunnelData = tunnels.reduce((acc, t) => {
      acc[t.port] = t.url;
      return acc;
    }, {} as Record<number, string>);

    await redis.set(redisKey, JSON.stringify(tunnelData), "EX", 3600);

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

    const redisKey = `agent:tunnels:${userId}`;
    await redis.del(redisKey);

    console.log(`[Agent] 🗑️  Cleared tunnel mappings for user ${userId}`);

    return res.status(200).json({
      success: true,
      message: "Tunnel mappings cleared",
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
