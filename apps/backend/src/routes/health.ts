/**
 * Health check endpoint for backend
 * Used by Docker healthcheck and monitoring
 */

import express, { Request, Response } from "express";
import { prisma } from "../db";
import redis from "../services/notificationPublisher";

const router = express.Router();

router.get("/health", async (req: Request, res: Response) => {
  try {
    // Check database connectivity
    let databaseHealthy = false;
    try {
      // lightweight query
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const dbCheck = await prisma.$queryRaw`SELECT 1`;
      databaseHealthy = true;
    } catch (dbErr) {
      console.error("Health check: database error", dbErr);
      databaseHealthy = false;
    }

    // Check Redis connectivity (if configured)
    let redisHealthy = false;
    try {
      // ioredis exposes .ping()
      const pong = await redis.ping();
      redisHealthy = pong === "PONG" || !!pong;
    } catch (rErr) {
      console.error("Health check: redis error", rErr);
      redisHealthy = false;
    }

    const overallHealthy = databaseHealthy; // core dependency

    res.status(overallHealthy ? 200 : 503).json({
      status: overallHealthy ? "ok" : "error",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      services: {
        api: "healthy",
        database: databaseHealthy ? "healthy" : "unhealthy",
        redis: redisHealthy ? "healthy" : "unhealthy",
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: "Service unavailable",
    });
  }
});

export default router;
