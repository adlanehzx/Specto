import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import apiRoutes from "./routes";
import { createTestWorker } from "./queue";
import { cronJobsService } from "./services/cronJobs";
import passport from "./passport";

dotenv.config();

console.log("🚀 Starting server...");
console.log("API Routes type:", typeof apiRoutes);

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors()); // Activer CORS pour le frontend
app.use(express.json());

// Initialize passport for OAuth routes
app.use(passport.initialize());

// Logger toutes les requêtes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Route health check (racine)
app.get("/health", (req: Request, res: Response) => {
  res.json({ ok: true });
});

// Route de test POST
app.post("/test-post", (req: Request, res: Response) => {
  console.log("✅ TEST POST received");
  res.json({ message: "POST works!", body: req.body });
});

// API Routes
app.use("/api", apiRoutes);

// Démarrage du BullMQ Worker 🔄
const worker = createTestWorker();
console.log("🔄 BullMQ worker started - Processing tests automatically");

// Démarrage des cron jobs 🕐
cronJobsService.startAll();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n🛑 SIGTERM received, shutting down gracefully...");
  cronJobsService.stopAll();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n🛑 SIGINT received, shutting down gracefully...");
  cronJobsService.stopAll();
  process.exit(0);
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 API Routes: http://localhost:${PORT}/api`);
  console.log(`🎭 Playwright Runner: Ready`);
});

export default app;
