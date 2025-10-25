/**
 * Notifications Routes
 * CRUD operations for user notifications
 */

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import { z } from "zod";
import { publishNotification } from "../services/notificationPublisher";

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createNotificationSchema = z.object({
  userId: z.string().optional(), // Optional, will use authenticated user if not provided
  type: z.enum(["info", "success", "warning", "error"]),
  title: z.string().optional(),
  message: z.string().min(1),
  link: z.string().optional(),
});

/**
 * GET /api/notifications
 * Get user notifications (paginated)
 */
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === "true";

    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(unreadOnly && { read: false }),
    };

    const [notifications, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        total,
        unread,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch notifications",
      message: error.message,
    });
  }
});

/**
 * POST /api/notifications
 * Create a new notification
 */
router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const validatedData = createNotificationSchema.parse(req.body);
    const userId = validatedData.userId || req.userId!;

    const notification = await prisma.notification.create({
      data: {
        userId,
        type: validatedData.type,
        title: validatedData.title,
        message: validatedData.message,
        link: validatedData.link,
      },
    });

    // Publish to Redis for real-time updates
    await publishNotification(notification);

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
    }

    console.error("Error creating notification:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create notification",
      message: error.message,
    });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 */
router.patch("/:id/read", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Verify ownership
    const existing = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    res.json({
      success: true,
      data: notification,
    });
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark notification as read",
      message: error.message,
    });
  }
});

/**
 * PATCH /api/notifications/mark-all-read
 * Mark all user notifications as read
 */
router.patch(
  "/mark-all-read",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;

      const result = await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });

      res.json({
        success: true,
        data: {
          count: result.count,
          message: `${result.count} notification(s) marked as read`,
        },
      });
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({
        success: false,
        error: "Failed to mark all notifications as read",
        message: error.message,
      });
    }
  }
);

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Verify ownership
    const existing = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: {
        message: "Notification deleted successfully",
      },
    });
  } catch (error: any) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete notification",
      message: error.message,
    });
  }
});

export default router;
