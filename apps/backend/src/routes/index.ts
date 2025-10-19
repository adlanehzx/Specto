/**
 * API Routes Index
 *
 * Centralise toutes les routes de l'API
 */

import { Router } from "express";
import authRoutes from "./auth";
import testRoutes from "./tests";
import tunnelRoutes from "./tunnels";
import agentRoutes from "./agent";
import analyticsRoutes from "./analytics";
import scheduleRoutes from "./schedule";
import notificationRoutes from "./notifications";
import userPreferencesRoutes from "./userPreferences";
import projectRoutes from "./projects";
import apiTestRoutes from "./apiTests";
import cliRoutes from "./cli";
import smokeTestRoutes from "./smokeTests";
import unitTestRoutes from "./unitTests";
import performanceTestRoutes from "./performanceTests";
import securityTestRoutes from "./securityTests";

const router = Router();

console.log("🔧 Routes module loaded");
console.log("Auth routes:", typeof authRoutes);
console.log("Test routes:", typeof testRoutes);
console.log("Tunnel routes:", typeof tunnelRoutes);
console.log("Agent routes:", typeof agentRoutes);
console.log("Analytics routes:", typeof analyticsRoutes);
console.log("Schedule routes:", typeof scheduleRoutes);
console.log("Notification routes:", typeof notificationRoutes);
console.log("User Preferences routes:", typeof userPreferencesRoutes);
console.log("Project routes:", typeof projectRoutes);
console.log("API Test routes:", typeof apiTestRoutes);
console.log("CLI routes:", typeof cliRoutes);
console.log("Smoke Test routes:", typeof smokeTestRoutes);
console.log("Unit Test routes:", typeof unitTestRoutes);
console.log("Performance Test routes:", typeof performanceTestRoutes);
console.log("Security Test routes:", typeof securityTestRoutes);

// Routes d'authentification (publiques)
router.use("/auth", authRoutes);

// Routes des tests (protégées)
router.use("/tests", testRoutes);

// Routes des tunnels (protégées)
router.use("/tunnels", tunnelRoutes);

// Routes de l'agent (protégées)
router.use("/agent", agentRoutes);

// Routes analytics (protégées)
router.use("/analytics", analyticsRoutes);

// Routes de planification (protégées)
router.use("/schedule", scheduleRoutes);

// Routes des notifications (protégées)
router.use("/notifications", notificationRoutes);

// Routes des préférences utilisateur (protégées)
router.use("/users", userPreferencesRoutes);

// Routes des projets (protégées)
router.use("/projects", projectRoutes);

// Routes des tests API (protégées)
router.use("/api-tests", apiTestRoutes);

// Routes des tests smoke (protégées)
router.use("/smoke-tests", smokeTestRoutes);

// Routes des tests unitaires (protégées)
router.use("/unit-tests", unitTestRoutes);

// Routes des tests de performance (protégées)
router.use("/performance-tests", performanceTestRoutes);

// Routes des tests de sécurité (protégées)
router.use("/security-tests", securityTestRoutes);

// Routes CLI pour CI/CD (protégées)
router.use("/cli", cliRoutes);

export default router;
