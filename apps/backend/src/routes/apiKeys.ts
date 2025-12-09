/**
 * API Keys Routes
 * Gestion des clés API pour CI/CD et intégrations
 */

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import crypto from "crypto";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/api-keys
 * Liste toutes les API keys de l'utilisateur (sans les clés complètes)
 */
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        key: true, // On va masquer dans la réponse
        lastUsed: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    // Masquer les clés (montrer seulement les 8 premiers caractères)
    const maskedKeys = apiKeys.map((key) => ({
      ...key,
      key: `${key.key.substring(0, 12)}...${key.key.substring(key.key.length - 4)}`,
      keyPreview: key.key.substring(0, 12),
    }));

    res.json({
      success: true,
      apiKeys: maskedKeys,
    });
  } catch (error: any) {
    console.error("Error fetching API keys:", error);
    res.status(500).json({
      error: "Failed to fetch API keys",
      message: error.message,
    });
  }
});

/**
 * POST /api/api-keys
 * Créer une nouvelle API key
 */
router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { name, expiresIn } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        error: "Name is required",
      });
    }

    // Générer une clé unique
    const key = `ley_${crypto.randomBytes(32).toString("hex")}`;

    // Calculer la date d'expiration
    let expiresAt: Date | null = null;
    if (expiresIn && expiresIn > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresIn);
    }

    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        key,
        name: name.trim(),
        expiresAt,
      },
    });

    console.log(`[API Keys] ✅ Created new API key for user ${userId}: ${name}`);

    // Retourner la clé COMPLÈTE une seule fois
    res.json({
      success: true,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key, // Clé complète (une seule fois !)
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt,
      },
      warning: "Save this key now. You won't be able to see it again!",
    });
  } catch (error: any) {
    console.error("Error creating API key:", error);
    res.status(500).json({
      error: "Failed to create API key",
      message: error.message,
    });
  }
});

/**
 * DELETE /api/api-keys/:id
 * Supprimer une API key (révocation)
 */
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Vérifier que la clé appartient à l'utilisateur
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!apiKey) {
      return res.status(404).json({
        error: "API key not found",
      });
    }

    await prisma.apiKey.delete({
      where: { id },
    });

    console.log(`[API Keys] 🗑️  Deleted API key ${id} for user ${userId}`);

    res.json({
      success: true,
      message: "API key deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting API key:", error);
    res.status(500).json({
      error: "Failed to delete API key",
      message: error.message,
    });
  }
});

/**
 * PATCH /api/api-keys/:id
 * Mettre à jour le nom d'une API key
 */
router.patch("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        error: "Name is required",
      });
    }

    // Vérifier que la clé appartient à l'utilisateur
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!apiKey) {
      return res.status(404).json({
        error: "API key not found",
      });
    }

    const updatedKey = await prisma.apiKey.update({
      where: { id },
      data: { name: name.trim() },
    });

    res.json({
      success: true,
      apiKey: {
        id: updatedKey.id,
        name: updatedKey.name,
        createdAt: updatedKey.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error updating API key:", error);
    res.status(500).json({
      error: "Failed to update API key",
      message: error.message,
    });
  }
});

export default router;
