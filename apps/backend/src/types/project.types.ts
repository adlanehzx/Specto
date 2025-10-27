export type ProjectRole = "owner" | "admin" | "editor" | "viewer";
export type MembershipStatus = "pending" | "accepted" | "rejected";

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface InviteMemberDto {
  email: string;
  role: ProjectRole;
}

export interface UpdateMemberDto {
  role?: ProjectRole;
}

export interface ProjectWithMembers {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  members: {
    id: string;
    userId: string;
    role: ProjectRole;
    status: MembershipStatus;
    user: {
      id: string;
      email: string;
    };
    invitedAt: Date;
    acceptedAt?: Date;
  }[];
  _count?: {
    tests: number;
  };
}

// Permissions helper
type Permission = "invite" | "remove" | "edit" | "view" | "delete_project";

export const PERMISSIONS: Record<ProjectRole, Permission[]> = {
  owner: ["invite", "remove", "edit", "view", "delete_project"],
  admin: ["invite", "remove", "edit", "view"],
  editor: ["edit", "view"],
  viewer: ["view"],
};

export function canInvite(role: ProjectRole): boolean {
  return PERMISSIONS[role].includes("invite");
}

export function canRemoveMember(role: ProjectRole): boolean {
  return PERMISSIONS[role].includes("remove");
}

export function canEditProject(role: ProjectRole): boolean {
  return PERMISSIONS[role].includes("edit");
}

export function canDeleteProject(role: ProjectRole): boolean {
  return PERMISSIONS[role].includes("delete_project");
}

export function canViewProject(role: ProjectRole): boolean {
  return PERMISSIONS[role].includes("view");
}
