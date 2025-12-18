/**
 * Project Routes
 *
 * Routes pour la gestion des projets collaboratifs :
 * - POST /api/projects - Créer un projet
 * - GET /api/projects - Liste des projets de l'utilisateur
 * - GET /api/projects/:id - Détails d'un projet
 * - POST /api/projects/:id/invite - Inviter un membre
 * - PATCH /api/projects/:id/members/:memberId - Modifier le rôle d'un membre
 * - DELETE /api/projects/:id/members/:memberId - Retirer un membre
 * - POST /api/projects/accept-invite/:memberId - Accepter une invitation
 */

import { Router, Request, Response } from "express";
import { projectService } from "../services/projectService";
import { authMiddleware } from "../middleware/auth";
import {
  CreateProjectDto,
  InviteMemberDto,
  UpdateMemberDto,
} from "../types/project.types";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/projects
 * Create a new project
 */
router.post("/", async (req: Request, res: Response) => {
  console.log("📝 POST /projects - Create project");

  try {
    const userId = req.user!.id;
    const data: CreateProjectDto = req.body;

    // Validation
    if (!data.name || data.name.trim().length === 0) {
      return res.status(400).json({ error: "Project name is required" });
    }

    if (data.name.length > 100) {
      return res
        .status(400)
        .json({ error: "Project name must be less than 100 characters" });
    }

    const project = await projectService.createProject(userId, data);

    console.log("✅ Project created:", project.id);
    res.status(201).json(project);
  } catch (error: any) {
    console.error("❌ Error creating project:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to create project" });
  }
});

/**
 * GET /api/projects
 * Get all projects for authenticated user
 */
router.get("/", async (req: Request, res: Response) => {
  console.log("📋 GET /projects - List user projects");

  try {
    const userId = req.user!.id;

    const projects = await projectService.getUserProjects(userId);

    console.log(`✅ Found ${projects.length} projects for user ${userId}`);
    res.json(projects);
  } catch (error: any) {
    console.error("❌ Error fetching projects:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to fetch projects" });
  }
});

/**
 * GET /api/projects/:id
 * Get single project with members
 */
router.get("/:id", async (req: Request, res: Response) => {
  console.log("🔍 GET /projects/:id - Get project details");

  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const project = await projectService.getProjectById(id, userId);

    console.log("✅ Project found:", project.id);
    res.json(project);
  } catch (error: any) {
    console.error("❌ Error fetching project:", error);

    if (error.message === "Project not found or access denied") {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: error.message || "Failed to fetch project" });
  }
});

/**
 * PATCH /api/projects/:id
 * Update project details (name, description)
 */
router.patch("/:id", async (req: Request, res: Response) => {
  console.log("✏️ PATCH /projects/:id - Update project");
  console.log("User:", req.user);
  console.log("Body:", req.body);

  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { id } = req.params;
    const { name, description } = req.body;

    const project = await projectService.updateProject(id, userId, {
      name,
      description,
    });

    console.log("✅ Project updated:", project.id);
    res.json(project);
  } catch (error: any) {
    console.error("❌ Error updating project:", error);

    if (error.message === "Project not found or access denied") {
      return res.status(404).json({ error: error.message });
    }

    res
      .status(500)
      .json({ error: error.message || "Failed to update project" });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project (owner only)
 */
router.delete("/:id", async (req: Request, res: Response) => {
  console.log("🗑️ DELETE /projects/:id - Delete project");
  console.log("User:", req.user);

  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { id } = req.params;

    await projectService.deleteProject(id, userId);

    console.log("✅ Project deleted:", id);
    res.json({ message: "Project deleted successfully" });
  } catch (error: any) {
    console.error("❌ Error deleting project:", error);

    if (error.message === "Project not found or access denied") {
      return res.status(404).json({ error: error.message });
    }

    if (error.message === "Only project owner can delete the project") {
      return res.status(403).json({ error: error.message });
    }

    res
      .status(500)
      .json({ error: error.message || "Failed to delete project" });
  }
});

/**
 * POST /api/projects/:id/invite
 * Invite a member to the project
 */
router.post("/:id/invite", async (req: Request, res: Response) => {
  console.log("📧 POST /projects/:id/invite - Invite member");

  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const data: InviteMemberDto = req.body;

    // Validation
    if (!data.email || !data.role) {
      return res.status(400).json({ error: "Email and role are required" });
    }

    const validRoles = ["admin", "editor", "viewer"];
    if (!validRoles.includes(data.role)) {
      return res.status(400).json({
        error: "Invalid role. Must be one of: admin, editor, viewer",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const member = await projectService.inviteMember(id, userId, data);

    console.log("✅ Member invited:", member.id);
    res.status(201).json(member);
  } catch (error: any) {
    console.error("❌ Error inviting member:", error);

    if (
      error.message.includes("permission") ||
      error.message.includes("not found")
    ) {
      return res.status(403).json({ error: error.message });
    }

    if (error.message.includes("already")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: error.message || "Failed to invite member" });
  }
});

/**
 * PATCH /api/projects/:id/members/:memberId
 * Update member role
 */
router.patch("/:id/members/:memberId", async (req: Request, res: Response) => {
  console.log("✏️ PATCH /projects/:id/members/:memberId - Update member");

  try {
    const userId = req.user!.id;
    const { id, memberId } = req.params;
    const data: UpdateMemberDto = req.body;

    // Validation
    if (data.role) {
      const validRoles = ["admin", "editor", "viewer"];
      if (!validRoles.includes(data.role)) {
        return res.status(400).json({
          error: "Invalid role. Must be one of: admin, editor, viewer",
        });
      }
    }

    const member = await projectService.updateMember(
      id,
      memberId,
      userId,
      data
    );

    console.log("✅ Member updated:", memberId);
    res.json(member);
  } catch (error: any) {
    console.error("❌ Error updating member:", error);

    if (
      error.message.includes("permission") ||
      error.message.includes("Cannot")
    ) {
      return res.status(403).json({ error: error.message });
    }

    if (error.message === "Member not found") {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: error.message || "Failed to update member" });
  }
});

/**
 * DELETE /api/projects/:id/members/:memberId
 * Remove member from project
 */
router.delete("/:id/members/:memberId", async (req: Request, res: Response) => {
  console.log("🗑️ DELETE /projects/:id/members/:memberId - Remove member");

  try {
    const userId = req.user!.id;
    const { id, memberId } = req.params;

    await projectService.removeMember(id, memberId, userId);

    console.log("✅ Member removed:", memberId);
    res.status(204).send();
  } catch (error: any) {
    console.error("❌ Error removing member:", error);

    if (
      error.message.includes("permission") ||
      error.message.includes("Cannot")
    ) {
      return res.status(403).json({ error: error.message });
    }

    if (error.message === "Member not found") {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: error.message || "Failed to remove member" });
  }
});

/**
 * POST /api/projects/accept-invite/:memberId
 * Accept a project invitation
 */
router.post("/accept-invite/:memberId", async (req: Request, res: Response) => {
  console.log("✅ POST /projects/accept-invite/:memberId - Accept invitation");

  try {
    const userId = req.user!.id;
    const { memberId } = req.params;

    const member = await projectService.acceptInvitation(memberId, userId);

    console.log("✅ Invitation accepted:", memberId);
    res.json(member);
  } catch (error: any) {
    console.error("❌ Error accepting invitation:", error);
    res
      .status(400)
      .json({ error: error.message || "Failed to accept invitation" });
  }
});

export default router;
