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
 * Vérifie le token JWT et ajoute userId et userEmail à req
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Non authentifié - Token manquant",
      });
    }

    const token = authHeader.substring(7); // Enlever "Bearer "

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

    next();
  } catch (error: any) {
    console.error("Authentication error:", error);

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

    res.status(500).json({
      error: "Erreur d'authentification",
      message: error.message,
    });
  }
};

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
