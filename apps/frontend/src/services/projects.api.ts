/**
 * API service for Projects
 */

import {
  Project,
  CreateProjectDto,
  InviteMemberDto,
  UpdateMemberDto,
  ProjectMember,
} from "@/types/project";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export class ProjectsAPI {
  /**
   * Get auth headers with JWT token
   */
  private static getHeaders(token: string | null): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Get all projects for authenticated user
   */
  static async getProjects(token: string): Promise<Project[]> {
    const response = await fetch(`${API_URL}/api/projects`, {
      headers: this.getHeaders(token),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch projects");
    }

    return response.json();
  }

  /**
   * Get single project by ID
   */
  static async getProject(projectId: string, token: string): Promise<Project> {
    const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
      headers: this.getHeaders(token),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Project not found or access denied");
      }
      throw new Error("Failed to fetch project");
    }

    return response.json();
  }

  /**
   * Create a new project
   */
  static async createProject(
    data: CreateProjectDto,
    token: string
  ): Promise<Project> {
    const response = await fetch(`${API_URL}/api/projects`, {
      method: "POST",
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create project");
    }

    return response.json();
  }

  /**
   * Invite a member to project
   */
  static async inviteMember(
    projectId: string,
    data: InviteMemberDto,
    token: string
  ): Promise<ProjectMember> {
    const response = await fetch(
      `${API_URL}/api/projects/${projectId}/invite`,
      {
        method: "POST",
        headers: this.getHeaders(token),
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to invite member");
    }

    return response.json();
  }

  /**
   * Update member role
   */
  static async updateMemberRole(
    projectId: string,
    memberId: string,
    data: UpdateMemberDto,
    token: string
  ): Promise<ProjectMember> {
    const response = await fetch(
      `${API_URL}/api/projects/${projectId}/members/${memberId}`,
      {
        method: "PATCH",
        headers: this.getHeaders(token),
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update member");
    }

    return response.json();
  }

  /**
   * Remove member from project
   */
  static async removeMember(
    projectId: string,
    memberId: string,
    token: string
  ): Promise<void> {
    const response = await fetch(
      `${API_URL}/api/projects/${projectId}/members/${memberId}`,
      {
        method: "DELETE",
        headers: this.getHeaders(token),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to remove member");
    }
  }

  /**
   * Accept project invitation
   */
  static async acceptInvitation(
    memberId: string,
    token: string
  ): Promise<ProjectMember> {
    const response = await fetch(
      `${API_URL}/api/projects/accept-invite/${memberId}`,
      {
        method: "POST",
        headers: this.getHeaders(token),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to accept invitation");
    }

    return response.json();
  }
}
