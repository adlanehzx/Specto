/**
 * User Preferences Routes
 * Manage user settings and preferences
 */

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

// Validation schema
const updatePreferencesSchema = z.object({
  language: z.enum(["en", "fr"]).optional(),
  timezone: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  slackNotifications: z.boolean().optional(),
  uiNotifications: z.boolean().optional(),
  theme: z.enum(["light", "dark", "auto"]).optional(),
});

/**
 * GET /api/users/:id/preferences
 * Get user preferences (create default if not exists)
 */
router.get(
  "/:id/preferences",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      // Verify user can only access own preferences
      if (id !== userId) {
        return res.status(403).json({
          success: false,
          error: "Forbidden: Cannot access other user's preferences",
        });
      }

      // Get or create preferences
      let preferences = await prisma.userPreferences.findUnique({
        where: { userId },
      });

      if (!preferences) {
        // Create default preferences
        preferences = await prisma.userPreferences.create({
          data: { userId },
        });
      }

      // Map database field names to frontend field names
      const responseData = {
        id: preferences.id,
        userId: preferences.userId,
        language: preferences.language,
        timezone: preferences.timezone,
        emailNotifications: preferences.emailEnabled,
        slackNotifications: preferences.slackEnabled,
        uiNotifications: preferences.uiEnabled,
        theme: preferences.theme,
        createdAt: preferences.createdAt,
        updatedAt: preferences.updatedAt,
      };

      res.json({
        success: true,
        data: responseData,
      });
    } catch (error: any) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user preferences",
        message: error.message,
      });
    }
  }
);

/**
 * PATCH /api/users/:id/preferences
 * Update user preferences
 */
router.patch(
  "/:id/preferences",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      // Verify user can only update own preferences
      if (id !== userId) {
        return res.status(403).json({
          success: false,
          error: "Forbidden: Cannot update other user's preferences",
        });
      }

      const validatedData = updatePreferencesSchema.parse(req.body);

      // Map frontend field names to database field names
      const dbData: any = {};
      if (validatedData.language !== undefined)
        dbData.language = validatedData.language;
      if (validatedData.timezone !== undefined)
        dbData.timezone = validatedData.timezone;
      if (validatedData.emailNotifications !== undefined)
        dbData.emailEnabled = validatedData.emailNotifications;
      if (validatedData.slackNotifications !== undefined)
        dbData.slackEnabled = validatedData.slackNotifications;
      if (validatedData.uiNotifications !== undefined)
        dbData.uiEnabled = validatedData.uiNotifications;
      if (validatedData.theme !== undefined) dbData.theme = validatedData.theme;

      // Get or create preferences first
      let preferences = await prisma.userPreferences.findUnique({
        where: { userId },
      });

      if (!preferences) {
        // Create with provided data
        preferences = await prisma.userPreferences.create({
          data: {
            userId,
            ...dbData,
          },
        });
      } else {
        // Update existing
        preferences = await prisma.userPreferences.update({
          where: { userId },
          data: dbData,
        });
      }

      // Map database field names to frontend field names
      const responseData = {
        id: preferences.id,
        userId: preferences.userId,
        language: preferences.language,
        timezone: preferences.timezone,
        emailNotifications: preferences.emailEnabled,
        slackNotifications: preferences.slackEnabled,
        uiNotifications: preferences.uiEnabled,
        theme: preferences.theme,
        createdAt: preferences.createdAt,
        updatedAt: preferences.updatedAt,
      };

      res.json({
        success: true,
        data: responseData,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          details: error.errors,
        });
      }

      console.error("Error updating user preferences:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update user preferences",
        message: error.message,
      });
    }
  }
);

export default router;
