/**
 * Tunnel Manager Service
 *
 * Gère le cycle de vie des tunnels Cloudflare:
 * - Création et réutilisation de tunnels actifs
 * - Fermeture de tunnels
 * - Nettoyage des tunnels obsolètes
 */

import { PrismaClient } from "@prisma/client";
import { getAgentTunnelUrl } from "../routes/agent";

const prisma = new PrismaClient();

export interface GetOrCreateTunnelParams {
  userId: string;
  port: number;
  agentId?: string;
}

export interface TunnelInfo {
  id: string;
  url: string;
  port: number;
  status: string;
  agentId: string | null;
  createdAt: Date;
  closedAt: Date | null;
  isNew: boolean; // Indique si c'est un nouveau tunnel ou réutilisé
}

/**
 * Récupère un tunnel actif existant ou en crée un nouveau
 *
 * @param params - userId, port, agentId optionnel
 * @returns TunnelInfo avec isNew flag
 */
export async function getOrCreateTunnel(
  params: GetOrCreateTunnelParams
): Promise<TunnelInfo> {
  const { userId, port, agentId } = params;

  try {
    // 1. Chercher un tunnel actif existant pour ce port
    console.log(
      `[TunnelManager] Checking for active tunnel on port ${port}...`
    );

    const existingTunnel = await prisma.tunnel.findFirst({
      where: {
        userId,
        port,
        status: "active",
      },
      orderBy: {
        createdAt: "desc", // Plus récent en premier
      },
    });

    // 2. Si tunnel actif trouvé → réutiliser
    if (existingTunnel) {
      console.log(
        `[TunnelManager] ✅ Reusing active tunnel: ${existingTunnel.url}`
      );

      return {
        ...existingTunnel,
        isNew: false,
      };
    }

    // 3. Sinon, créer un nouveau tunnel via l'agent
    console.log(
      `[TunnelManager] No active tunnel found, creating new tunnel...`
    );

    const tunnelUrl = await getAgentTunnelUrl(userId, port);

    if (!tunnelUrl) {
      throw new Error(
        `Failed to create tunnel for port ${port}. Make sure an agent is running with this port exposed.`
      );
    }

    // 4. Sauvegarder le nouveau tunnel dans la DB
    const newTunnel = await prisma.tunnel.create({
      data: {
        userId,
        url: tunnelUrl,
        port,
        status: "active",
        agentId: agentId || null,
      },
    });

    console.log(`[TunnelManager] ✅ New tunnel created: ${tunnelUrl}`);

    return {
      ...newTunnel,
      isNew: true,
    };
  } catch (error) {
    console.error("[TunnelManager] Error in getOrCreateTunnel:", error);
    throw error;
  }
}

/**
 * Ferme un tunnel et met à jour son statut
 *
 * @param tunnelId - ID du tunnel à fermer
 */
export async function closeTunnel(tunnelId: string): Promise<void> {
  try {
    console.log(`[TunnelManager] Closing tunnel ${tunnelId}...`);

    await prisma.tunnel.update({
      where: { id: tunnelId },
      data: {
        status: "closed",
        closedAt: new Date(),
      },
    });

    console.log(`[TunnelManager] ✅ Tunnel ${tunnelId} closed`);

    // TODO: Notifier l'agent de fermer le tunnel Cloudflare
    // await notifyAgentToCloseTunnel(tunnel.agentId, tunnel.port);
  } catch (error) {
    console.error("[TunnelManager] Error closing tunnel:", error);
    throw error;
  }
}

/**
 * Ferme tous les tunnels d'un utilisateur
 *
 * @param userId - ID de l'utilisateur
 */
export async function closeAllUserTunnels(userId: string): Promise<number> {
  try {
    console.log(`[TunnelManager] Closing all tunnels for user ${userId}...`);

    const result = await prisma.tunnel.updateMany({
      where: {
        userId,
        status: "active",
      },
      data: {
        status: "closed",
        closedAt: new Date(),
      },
    });

    console.log(
      `[TunnelManager] ✅ Closed ${result.count} tunnels for user ${userId}`
    );

    return result.count;
  } catch (error) {
    console.error("[TunnelManager] Error closing user tunnels:", error);
    throw error;
  }
}

/**
 * Nettoie les tunnels actifs obsolètes (> 24h)
 *
 * Utile pour les tunnels qui n'ont pas été fermés proprement
 */
export async function cleanupStaleTunnels(): Promise<number> {
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    console.log(
      `[TunnelManager] Cleaning up stale tunnels (created before ${twentyFourHoursAgo.toISOString()})...`
    );

    // 1. Fermer les tunnels actifs depuis plus de 24h (manuels)
    const result = await prisma.tunnel.updateMany({
      where: {
        status: "active",
        agentId: null, // Uniquement les tunnels manuels
        createdAt: {
          lt: twentyFourHoursAgo,
        },
      },
      data: {
        status: "closed",
        closedAt: new Date(),
      },
    });

    console.log(
      `[TunnelManager] ✅ Cleaned up ${result.count} stale manual tunnels`
    );

    // 2. Nettoyer aussi les tunnels d'agent expirés (voir cleanupExpiredAgentTunnels)
    const agentTunnelsClosed = await cleanupExpiredAgentTunnels();

    return result.count + agentTunnelsClosed;
  } catch (error) {
    console.error("[TunnelManager] Error cleaning stale tunnels:", error);
    throw error;
  }
}

/**
 * Ferme les tunnels d'agent qui n'ont plus de heartbeat dans Redis
 * (Redis TTL expiré = agent déconnecté)
 */
export async function cleanupExpiredAgentTunnels(): Promise<number> {
  try {
    // Récupérer tous les tunnels d'agent actifs
    const agentTunnels = await prisma.tunnel.findMany({
      where: {
        status: "active",
        agentId: "leynai-agent",
      },
      select: {
        id: true,
        userId: true,
        port: true,
      },
    });

    if (agentTunnels.length === 0) {
      return 0;
    }

    console.log(
      `[TunnelManager] Checking ${agentTunnels.length} active agent tunnels...`
    );

    // Vérifier lesquels n'ont plus de heartbeat dans Redis
    const Redis = require("ioredis");
    const redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      password: process.env.REDIS_PASSWORD || undefined,
    });

    const expiredTunnelIds: string[] = [];

    for (const tunnel of agentTunnels) {
      const redisKey = `agent:tunnels:${tunnel.userId}`;
      const tunnelData = await redis.get(redisKey);

      if (!tunnelData) {
        // Pas de heartbeat Redis = agent déconnecté
        expiredTunnelIds.push(tunnel.id);
      } else {
        // Vérifier si ce port spécifique est encore dans Redis
        const activeTunnels = JSON.parse(tunnelData);
        if (!activeTunnels[tunnel.port]) {
          expiredTunnelIds.push(tunnel.id);
        }
      }
    }

    redis.disconnect();

    if (expiredTunnelIds.length === 0) {
      console.log("[TunnelManager] No expired agent tunnels found");
      return 0;
    }

    // Fermer les tunnels expirés
    const result = await prisma.tunnel.updateMany({
      where: {
        id: { in: expiredTunnelIds },
        status: "active",
      },
      data: {
        status: "closed",
        closedAt: new Date(),
      },
    });

    console.log(
      `[TunnelManager] ✅ Closed ${result.count} expired agent tunnels`
    );

    return result.count;
  } catch (error) {
    console.error(
      "[TunnelManager] Error cleaning expired agent tunnels:",
      error
    );
    return 0; // Ne pas faire crasher le cron
  }
}

/**
 * Récupère tous les tunnels actifs d'un utilisateur
 *
 * @param userId - ID de l'utilisateur
 */
export async function getActiveTunnels(userId: string) {
  return prisma.tunnel.findMany({
    where: {
      userId,
      status: "active",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Récupère l'historique des tunnels d'un utilisateur
 *
 * @param userId - ID de l'utilisateur
 * @param limit - Nombre maximum de résultats
 */
export async function getTunnelHistory(userId: string, limit = 50) {
  return prisma.tunnel.findMany({
    where: { userId },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}
