import prisma from "../db";
import {
  CreateProjectDto,
  InviteMemberDto,
  UpdateMemberDto,
  ProjectRole,
  canInvite,
  canRemoveMember,
} from "../types/project.types";
import { sendInvitationEmail } from "./emailService";

export class ProjectService {
  /**
   * Create a new project
   */
  async createProject(userId: string, data: CreateProjectDto) {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        createdBy: userId,
        members: {
          create: {
            userId,
            role: "owner",
            status: "accepted",
            acceptedAt: new Date(),
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
        _count: {
          select: { tests: true },
        },
      },
    });

    return project;
  }

  /**
   * Get all projects for a user
   */
  async getUserProjects(userId: string) {
    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId,
            status: "accepted",
          },
        },
      },
      include: {
        members: {
          where: { status: "accepted" },
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
        _count: {
          select: { tests: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return projects;
  }

  /**
   * Get single project by ID (with access check)
   */
  async getProjectById(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        members: {
          some: {
            userId,
            status: "accepted",
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
          orderBy: {
            invitedAt: "asc",
          },
        },
        _count: {
          select: { tests: true },
        },
      },
    });

    if (!project) {
      throw new Error("Project not found or access denied");
    }

    return project;
  }

  /**
   * Check user's role in project
   */
  async getUserRole(
    projectId: string,
    userId: string
  ): Promise<ProjectRole | null> {
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
        status: "accepted",
      },
      select: { role: true },
    });

    return member?.role as ProjectRole | null;
  }

  /**
   * Invite a member to project
   */
  async inviteMember(
    projectId: string,
    invitedBy: string,
    data: InviteMemberDto
  ) {
    // Check if inviter has permission
    const inviterRole = await this.getUserRole(projectId, invitedBy);
    if (!inviterRole || !canInvite(inviterRole)) {
      throw new Error("Insufficient permissions to invite members");
    }

    // Get project info
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error("User not found with this email");
    }

    // Check if already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      if (existingMember.status === "pending") {
        throw new Error("User already has a pending invitation");
      }
      throw new Error("User is already a member of this project");
    }

    // Create project member
    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role: data.role,
        invitedBy,
        status: "pending",
      },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    // Send invitation email
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    await sendInvitationEmail({
      to: user.email,
      projectName: project.name,
      role: data.role,
      invitationLink: `${frontendUrl}/projects/${projectId}/accept-invite?token=${member.id}`,
    });
    // Remove any previous invite notifications for this user/project so we don't create duplicates
    try {
      await prisma.notification.deleteMany({
        where: {
          userId: user.id,
          AND: [
            {
              link: {
                contains: `/projects/${projectId}/accept-invite`,
              },
            },
          ],
        },
      });
    } catch (err) {
      // non-fatal: log and continue
      console.error("Error deleting previous invitation notifications:", err);
    }

    // Create in-app notification (include token so the frontend can accept directly)
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "info",
        title: "Project Invitation",
        message: `You've been invited to join "${project.name}" as ${data.role}`,
        // include the member id token so the frontend can call the accept-invite API directly
        link: `/projects/${projectId}/accept-invite?token=${member.id}`,
      },
    });

    return member;
  }

  /**
   * Update member role
   */
  async updateMember(
    projectId: string,
    memberId: string,
    updatedBy: string,
    data: UpdateMemberDto
  ) {
    // Check if updater has permission
    const updaterRole = await this.getUserRole(projectId, updatedBy);
    if (!updaterRole || !canRemoveMember(updaterRole)) {
      throw new Error("Insufficient permissions to modify members");
    }

    const member = await prisma.projectMember.findUnique({
      where: { id: memberId },
      include: {
        user: { select: { id: true, email: true } },
      },
    });

    if (!member || member.projectId !== projectId) {
      throw new Error("Member not found");
    }

    // Prevent owner from being modified
    if (member.role === "owner") {
      throw new Error("Cannot modify project owner");
    }

    // Prevent non-owners from modifying admins
    if (member.role === "admin" && updaterRole !== "owner") {
      throw new Error("Only project owner can modify admin members");
    }

    if (data.role) {
      // Update role
      return prisma.projectMember.update({
        where: { id: memberId },
        data: { role: data.role },
        include: {
          user: {
            select: { id: true, email: true },
          },
        },
      });
    }

    return member;
  }

  /**
   * Remove member from project
   */
  async removeMember(projectId: string, memberId: string, removedBy: string) {
    const updaterRole = await this.getUserRole(projectId, removedBy);
    if (!updaterRole || !canRemoveMember(updaterRole)) {
      throw new Error("Insufficient permissions to remove members");
    }

    const member = await prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.projectId !== projectId) {
      throw new Error("Member not found");
    }

    if (member.role === "owner") {
      throw new Error("Cannot remove project owner");
    }

    if (member.role === "admin" && updaterRole !== "owner") {
      throw new Error("Only project owner can remove admin members");
    }

    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    return { success: true };
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(memberId: string, userId: string) {
    const member = await prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.userId !== userId) {
      throw new Error("Invitation not found");
    }

    if (member.status !== "pending") {
      throw new Error("Invitation already processed");
    }

    // Mark related notifications for this project/member as read
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          link: {
            contains: `/projects/${member.projectId}/accept-invite`,
          },
        },
        data: {
          read: true,
        },
      });
    } catch (err) {
      console.error("Failed to mark invitation notifications as read:", err);
    }

    return prisma.projectMember.update({
      where: { id: memberId },
      data: {
        status: "accepted",
        acceptedAt: new Date(),
      },
    });
  }
}

export const projectService = new ProjectService();
