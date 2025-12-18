export type ProjectRole = "owner" | "admin" | "editor" | "viewer";
export type MembershipStatus = "pending" | "accepted" | "rejected";

export interface User {
  id: string;
  email: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: ProjectRole;
  status: MembershipStatus;
  invitedAt: string;
  acceptedAt?: string;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: ProjectMember[];
  _count?: {
    tests: number;
  };
}

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface InviteMemberDto {
  email: string;
  role: Exclude<ProjectRole, "owner">;
}

export interface UpdateMemberDto {
  role?: Exclude<ProjectRole, "owner">;
}

// Helper functions
export function canInvite(role: ProjectRole): boolean {
  return role === "owner" || role === "admin";
}

export function canRemoveMember(role: ProjectRole): boolean {
  return role === "owner" || role === "admin";
}

export function canEditProject(role: ProjectRole): boolean {
  return role === "owner" || role === "admin" || role === "editor";
}

export function canDeleteProject(role: ProjectRole): boolean {
  return role === "owner";
}

export function getUserRole(
  project: Project,
  userId: string
): ProjectRole | null {
  const member = project.members.find(
    (m) => m.userId === userId && m.status === "accepted"
  );
  return member ? member.role : null;
}

export const ROLE_LABELS: Record<ProjectRole, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  editor: "Éditeur",
  viewer: "Lecteur",
};

export const ROLE_COLORS: Record<ProjectRole, string> = {
  owner: "bg-purple-100 text-purple-800 border-purple-200",
  admin: "bg-blue-100 text-blue-800 border-blue-200",
  editor: "bg-green-100 text-green-800 border-green-200",
  viewer: "bg-gray-100 text-gray-800 border-gray-200",
};
