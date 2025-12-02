"use client";

import React, { useState } from "react";
import {
  Project,
  ProjectMember,
  ROLE_LABELS,
  ROLE_COLORS,
  canRemoveMember,
  getUserRole,
} from "@/types/project";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProjectsAPI } from "@/services/projects.api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import { MoreVertical, Trash2, UserCog } from "lucide-react";

interface MembersListProps {
  project: Project;
  onMemberUpdated: () => void;
}

export function MembersList({ project, onMemberUpdated }: MembersListProps) {
  const { token, user } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const currentUserRole = user ? getUserRole(project, user.id) : null;
  const canManageMembers = currentUserRole
    ? canRemoveMember(currentUserRole)
    : false;

  const handleRemoveMember = async (member: ProjectMember) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir retirer ${member.user.email} du projet ?`
      )
    ) {
      return;
    }

    setIsUpdating(true);
    try {
      await ProjectsAPI.removeMember(project.id, member.id, token!);
      toast.success(`${member.user.email} a été retiré du projet`);
      onMemberUpdated();
      setOpenDropdown(null);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la suppression du membre");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangeRole = async (
    member: ProjectMember,
    newRole: "admin" | "editor" | "viewer"
  ) => {
    setIsUpdating(true);
    try {
      await ProjectsAPI.updateMemberRole(
        project.id,
        member.id,
        { role: newRole },
        token!
      );
      toast.success(
        `Rôle de ${member.user.email} modifié en ${ROLE_LABELS[newRole]}`
      );
      onMemberUpdated();
      setOpenDropdown(null);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la modification du rôle");
    } finally {
      setIsUpdating(false);
    }
  };

  const acceptedMembers = project.members.filter(
    (m) => m.status === "accepted"
  );
  const pendingMembers = project.members.filter((m) => m.status === "pending");

  return (
    <div className="space-y-6">
      {/* Active Members */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Membres actifs ({acceptedMembers.length})
        </h3>
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
          {acceptedMembers.map((member) => {
            const isOwner = member.role === "owner";
            const isCurrentUser = user?.id === member.userId;
            const canModify = canManageMembers && !isOwner && !isCurrentUser;

            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {member.user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user.email}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-gray-500">
                            (Vous)
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        Membre depuis{" "}
                        {new Date(
                          member.acceptedAt || member.invitedAt
                        ).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge className={ROLE_COLORS[member.role]}>
                    {ROLE_LABELS[member.role]}
                  </Badge>

                  {canModify && (
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setOpenDropdown(
                            openDropdown === member.id ? null : member.id
                          )
                        }
                        disabled={isUpdating}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>

                      {openDropdown === member.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <div className="py-1">
                            <button
                              onClick={() => setOpenDropdown(null)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <UserCog className="w-4 h-4" />
                              Changer le rôle
                            </button>
                            <div className="pl-10 py-1 space-y-1">
                              {(["admin", "editor", "viewer"] as const).map(
                                (role) => (
                                  <button
                                    key={role}
                                    onClick={() =>
                                      handleChangeRole(member, role)
                                    }
                                    disabled={member.role === role}
                                    className={`w-full text-left px-4 py-1 text-sm ${
                                      member.role === role
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                  >
                                    {ROLE_LABELS[role]}
                                  </button>
                                )
                              )}
                            </div>
                            <div className="border-t border-gray-200 mt-1 pt-1">
                              <button
                                onClick={() => handleRemoveMember(member)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Retirer du projet
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingMembers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Invitations en attente ({pendingMembers.length})
          </h3>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
            {pendingMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {member.user.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    Invité le{" "}
                    {new Date(member.invitedAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="warning">En attente</Badge>
                  <Badge className={ROLE_COLORS[member.role]}>
                    {ROLE_LABELS[member.role]}
                  </Badge>

                  {canManageMembers && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member)}
                      disabled={isUpdating}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {project.members.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>Aucun membre dans ce projet</p>
        </div>
      )}
    </div>
  );
}
