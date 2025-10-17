/**
 * Authentication Routes
 *
 * Routes pour l'authentification des utilisateurs :
 * - POST /api/auth/register - Créer un compte
 * - POST /api/auth/login - Se connecter
 * - GET /api/auth/me - Obtenir l'utilisateur connecté
 */

import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import passport from "../passport";

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d"; // Token valide 7 jours

/**
 * POST /api/auth/register
 * Créer un nouveau compte utilisateur
 */
router.post("/register", async (req: Request, res: Response) => {
  console.log("📝 POST /register received");
  console.log("Body:", req.body);

  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: "Email et mot de passe requis",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Le mot de passe doit contenir au moins 6 caractères",
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Cet email est déjà utilisé",
      });
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    // Générer le token JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error: any) {
    console.error("Error in register:", error);
    res.status(500).json({
      error: "Erreur lors de la création du compte",
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/login
 * Connecter un utilisateur existant
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: "Email et mot de passe requis",
      });
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: "Email ou mot de passe incorrect",
      });
    }

    // Vérifier le mot de passe
    let isPasswordValid = false;
    if (user.passwordHash) {
      isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    } else {
      // No password set (e.g., user created via OAuth) -> invalid login with password
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Email ou mot de passe incorrect",
      });
    }

    // Générer le token JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error: any) {
    console.error("Error in login:", error);
    res.status(500).json({
      error: "Erreur lors de la connexion",
      message: error.message,
    });
  }
});

/**
 * GET /api/auth/me
 * Obtenir l'utilisateur connecté (nécessite le token JWT)
 */
router.get("/me", async (req: Request, res: Response) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Token manquant ou invalide",
      });
    }

    const token = authHeader.substring(7); // Enlever "Bearer "

    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "Utilisateur non trouvé",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error("Error in /me:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Token invalide",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expiré",
      });
    }

    res.status(500).json({
      error: "Erreur lors de la récupération de l'utilisateur",
      message: error.message,
    });
  }
});

export default router;

/**
 * OAuth routes (Google, GitHub, Slack)
 * Mounted under /api/auth by routes index
 */

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login`,
  }),
  async (req: Request, res: Response) => {
    try {
      const profile: any = req.user;
      const email = profile?.emails?.[0]?.value;
      const providerId = profile?.id;
      const displayName = profile?.displayName || email?.split("@")[0];
      const picture = profile?.photos?.[0]?.value;

      const prisma = new PrismaClient();

      // Find or create user
      let user = null;
      if (providerId) {
        user = await prisma.user.findFirst({ where: { googleId: providerId } });
      }
      if (!user && email) {
        user = await prisma.user.findUnique({ where: { email } });
      }
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: email || `user+google_${providerId}@example.com`,
            googleId: providerId,
            provider: "google",
            providerId: providerId,
            displayName,
            picture,
          },
        });
      } else {
        // update user with provider info if missing
        await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: user.googleId || providerId,
            provider: user.provider || "google",
            providerId: user.providerId || providerId,
            displayName: user.displayName || displayName,
            picture: user.picture || picture,
          },
        });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Redirect to frontend with token
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (err) {
      console.error("Google OAuth callback error:", err);
      res.redirect(`${FRONTEND_URL}/login`);
    }
  }
);

// GitHub
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login`,
  }),
  async (req: Request, res: Response) => {
    try {
      const profile: any = req.user;
      const providerId = profile?.id?.toString();
      const email =
        profile?.emails?.[0]?.value ||
        profile?.username + "@users.noreply.github.com";
      const displayName = profile?.displayName || profile?.username;
      const picture = profile?.photos?.[0]?.value;

      const prisma = new PrismaClient();

      let user = null;
      if (providerId) {
        user = await prisma.user.findFirst({ where: { githubId: providerId } });
      }
      if (!user && email) {
        user = await prisma.user.findUnique({ where: { email } });
      }
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: email,
            githubId: providerId,
            provider: "github",
            providerId: providerId,
            displayName,
            picture,
          },
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            githubId: user.githubId || providerId,
            provider: user.provider || "github",
            providerId: user.providerId || providerId,
            displayName: user.displayName || displayName,
            picture: user.picture || picture,
          },
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (err) {
      console.error("GitHub OAuth callback error:", err);
      res.redirect(`${FRONTEND_URL}/login`);
    }
  }
);

// Slack
router.get("/slack", passport.authenticate("slack"));

router.get(
  "/slack/callback",
  passport.authenticate("slack", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login`,
  }),
  async (req: Request, res: Response) => {
    try {
      const profile: any = req.user;
      // Slack may provide different shapes
      const providerId = profile?.user?.id || profile?.id;
      const email = profile?.user?.email || profile?.email;
      const displayName =
        profile?.user?.name || profile?.displayName || email?.split("@")[0];
      const picture = profile?.user?.image_192 || profile?.user?.image_72;

      const prisma = new PrismaClient();

      let user = null;
      if (providerId) {
        user = await prisma.user.findFirst({ where: { slackId: providerId } });
      }
      if (!user && email) {
        user = await prisma.user.findUnique({ where: { email } });
      }
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: email || `user+slack_${providerId}@example.com`,
            slackId: providerId,
            provider: "slack",
            providerId: providerId,
            displayName,
            picture,
          },
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            slackId: user.slackId || providerId,
            provider: user.provider || "slack",
            providerId: user.providerId || providerId,
            displayName: user.displayName || displayName,
            picture: user.picture || picture,
          },
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (err) {
      console.error("Slack OAuth callback error:", err);
      res.redirect(`${FRONTEND_URL}/login`);
    }
  }
);
