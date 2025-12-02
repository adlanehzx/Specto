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

    const result = await prisma.tunnel.updateMany({
      where: {
        status: "active",
        createdAt: {
          lt: twentyFourHoursAgo,
        },
      },
      data: {
        status: "closed",
        closedAt: new Date(),
      },
    });

    console.log(`[TunnelManager] ✅ Cleaned up ${result.count} stale tunnels`);

    return result.count;
  } catch (error) {
    console.error("[TunnelManager] Error cleaning stale tunnels:", error);
    throw error;
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
