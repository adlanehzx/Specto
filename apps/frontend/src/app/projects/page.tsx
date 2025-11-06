"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjects } from "@/hooks/useProjects";
import { useTranslation } from "@/contexts/TranslationContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ProjectsAPI } from "@/services/projects.api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import { Plus, Folder, Users, FileCode } from "lucide-react";
import { CreateProjectDto } from "@/types/project";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";

function ProjectsPageContent() {
  const router = useRouter();
  const { t } = useTranslation();
  const { projects, isLoading, mutate } = useProjects();
  const { token } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!projectName.trim()) {
      setError("Le nom du projet est requis");
      return;
    }

    setIsSubmitting(true);

    try {
      const data: CreateProjectDto = {
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
      };

      const newProject = await ProjectsAPI.createProject(data, token!);

      toast.success("Projet créé avec succès !");
      mutate(); // Revalider la liste des projets
      setIsCreateModalOpen(false);
      setProjectName("");
      setProjectDescription("");

      // Rediriger vers le nouveau projet
      router.push(`/projects/${newProject.id}`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création du projet");
      toast.error(err.message || "Erreur lors de la création du projet");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setProjectName("");
    setProjectDescription("");
    setError("");
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t("projects.title")}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Gérez vos projets et collaborez avec votre équipe
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t("projects.createProject")}
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && projects && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Folder className="w-6 h-6 text-white" />
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">
                  {project.name}
                </h3>

                {project.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>
                        {
                          project.members.filter((m) => m.status === "accepted")
                            .length
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileCode className="w-4 h-4" />
                      <span>
                        {project._count?.tests || 0} {t("projects.tests")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && projects && projects.length === 0 && (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t("projects.noProjects")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t("projects.createFirst")}
            </p>
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              {t("projects.createProject")}
            </Button>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        title={t("projects.createProject")}
      >
        <form onSubmit={handleCreateProject} className="p-6 space-y-4">
          <Input
            label={t("projects.projectName")}
            placeholder="Mon projet"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            error={error}
            required
            maxLength={100}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("projects.projectDescription")}
            </label>
            <textarea
              placeholder="Description de votre projet..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
              disabled={isSubmitting}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Création..." : "Créer le projet"}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default function ProjectsPage() {
  return (
    <ProtectedRoute>
      <ProjectsPageContent />
    </ProtectedRoute>
  );
}
