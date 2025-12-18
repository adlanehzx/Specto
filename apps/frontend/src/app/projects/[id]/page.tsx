"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useProject } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { ProjectInviteModal } from "@/components/ProjectInviteModal";
import { MembersList } from "@/components/MembersList";
import { ProjectTestsList } from "@/components/ProjectTestsList";
import { ProjectSettings } from "@/components/ProjectSettings";
import {
  getUserRole,
  canInvite,
  canEditProject,
  ROLE_LABELS,
  ROLE_COLORS,
} from "@/types/project";
import { Badge } from "@/components/ui/Badge";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, UserPlus, FileCode, Settings, ArrowLeft } from "lucide-react";
import Link from "next/link";

function ProjectDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const { project, isLoading, mutate } = useProject(projectId);
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"tests" | "members" | "settings">(
    (searchParams.get("tab") as "tests" | "members" | "settings") || "tests"
  );
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Synchroniser l'onglet actif avec l'URL
  useEffect(() => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("tab", activeTab);
    router.replace(newUrl.pathname + newUrl.search, { scroll: false });
  }, [activeTab, router]);

  const userRole = user && project ? getUserRole(project, user.id) : null;
  const canInviteMembers = userRole ? canInvite(userRole) : false;
  const canEditTests = userRole ? canEditProject(userRole) : false;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Projet non trouvé
          </h2>
          <p className="text-gray-600 mb-6">
            Ce projet n'existe pas ou vous n'y avez pas accès.
          </p>
          <Link href="/projects">
            <Button variant="primary">Retour aux projets</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const acceptedMembersCount = project.members.filter(
    (m) => m.status === "accepted"
  ).length;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux projets
        </Link>

        {/* Project Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {project.name}
                </h1>
                {userRole && (
                  <Badge className={ROLE_COLORS[userRole]}>
                    {ROLE_LABELS[userRole]}
                  </Badge>
                )}
              </div>
              {project.description && (
                <p className="text-gray-600 mt-2">{project.description}</p>
              )}
              <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>
                    {acceptedMembersCount} membre
                    {acceptedMembersCount > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  <span>
                    {project._count?.tests || 0} test
                    {project._count?.tests !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>

            {canInviteMembers && (
              <Button
                variant="primary"
                onClick={() => setIsInviteModalOpen(true)}
                className="flex items-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Inviter un membre
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab("tests")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "tests"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FileCode className="w-4 h-4 inline mr-2" />
              Tests
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "members"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Membres
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "settings"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Paramètres
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "tests" && (
            <ProjectTestsList projectId={projectId} canEdit={canEditTests} />
          )}

          {activeTab === "members" && (
            <MembersList project={project} onMemberUpdated={mutate} />
          )}

          {activeTab === "settings" && (
            <ProjectSettings project={project} onProjectUpdated={mutate} />
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <ProjectInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        projectId={projectId}
        onInviteSuccess={mutate}
      />
    </DashboardLayout>
  );
}

export default function ProjectDetailPage() {
  return (
    <ProtectedRoute>
      <ProjectDetailPageContent />
    </ProtectedRoute>
  );
}
