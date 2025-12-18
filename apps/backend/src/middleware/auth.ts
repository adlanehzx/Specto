/**
 * Authentication Middleware
 *
 * Middleware pour vérifier que l'utilisateur est authentifié
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Étendre le type Request pour inclure userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

/**
 * Middleware d'authentification
 * Supporte JWT tokens ET API keys
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    console.log(
      "[Auth] Path:",
      req.path,
      "Authorization header:",
      authHeader ? "Present" : "Missing"
    );

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("[Auth] Unauthorized - No valid auth header");
      console.log("[Auth] Full auth header:", authHeader);
      return res.status(401).json({
        error: "Non authentifié - Token manquant",
      });
    }

    const token = authHeader.substring(7); // Enlever "Bearer "
    console.log(
      "[Auth] Token extracted, length:",
      token.length,
      "starts with:",
      token.substring(0, 10)
    );

    // Vérifier si c'est une API key (commence par "ley_")
    if (token.startsWith("ley_")) {
      console.log("[Auth] API Key detected");
      return await authenticateWithApiKey(token, req, res, next);
    }

    // Sinon, c'est un JWT token
    console.log("[Auth] JWT detected, verifying...");
    return authenticateWithJWT(token, req, res, next);
  } catch (error: any) {
    console.error("Authentication error:", error);
    res.status(500).json({
      error: "Erreur d'authentification",
      message: error.message,
    });
  }
};

/**
 * Authentification avec JWT
 */
function authenticateWithJWT(
  token: string,
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };

    // Ajouter les infos de l'utilisateur à la requête
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
    };

    console.log("[Auth] JWT verified successfully for user:", decoded.userId);
    next();
  } catch (error: any) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Token invalide",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expiré - Veuillez vous reconnecter",
      });
    }

    throw error;
  }
}

/**
 * Authentification avec API Key
 */
async function authenticateWithApiKey(
  apiKey: string,
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    // Chercher la clé dans la DB
    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: true },
    });

    if (!key) {
      return res.status(401).json({
        error: "API key invalide",
      });
    }

    // Vérifier si la clé est expirée
    if (key.expiresAt && key.expiresAt < new Date()) {
      return res.status(401).json({
        error: "API key expirée",
      });
    }

    // Mettre à jour lastUsed (async, sans bloquer)
    prisma.apiKey
      .update({
        where: { id: key.id },
        data: { lastUsed: new Date() },
      })
      .catch((err) => console.error("Error updating API key lastUsed:", err));

    // Ajouter les infos de l'utilisateur à la requête
    req.userId = key.userId;
    req.userEmail = key.user.email;
    req.user = {
      id: key.userId,
      email: key.user.email,
    };

    await prisma.$disconnect();
    next();
  } catch (error: any) {
    console.error("API key authentication error:", error);
    return res.status(500).json({
      error: "Erreur lors de la vérification de l'API key",
      message: error.message,
    });
  }
}

/**
 * Middleware d'authentification optionnelle
 * Ajoute userId si le token est présent, mais ne bloque pas si absent
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // Continuer sans authentification
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };

    req.userId = decoded.userId;
    req.userEmail = decoded.email;

    next();
  } catch (error) {
    // En cas d'erreur, on continue sans authentification
    next();
  }
};

// Alias pour compatibilité
export const authMiddleware = authenticate;
