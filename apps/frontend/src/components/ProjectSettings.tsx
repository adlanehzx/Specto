"use client";

import React, { useState } from "react";
import { Project } from "@/types/project";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { Copy, Trash2, Save, AlertTriangle } from "lucide-react";

interface ProjectSettingsProps {
  project: Project;
  onProjectUpdated: () => void;
}

export function ProjectSettings({
  project,
  onProjectUpdated,
}: ProjectSettingsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || "",
  });

  const handleCopySlug = async () => {
    await navigator.clipboard.writeText(project.slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update project");
      }

      onProjectUpdated();
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating project:", error);
      alert(`Erreur lors de la mise à jour du projet: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete project");
      }

      router.push("/projects");
    } catch (error: any) {
      console.error("Error deleting project:", error);
      alert(`Erreur lors de la suppression du projet: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Slug */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Identifiant du projet
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Utilisez ce slug dans votre fichier{" "}
          <code className="bg-gray-100 px-2 py-1 rounded">specto.json</code>{" "}
          pour lier votre projet.
        </p>
        <div className="flex items-center gap-3">
          <code className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-lg font-mono text-sm">
            {project.slug}
          </code>
          <Button
            onClick={handleCopySlug}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            {copied ? "Copié !" : "Copier"}
          </Button>
        </div>
      </div>

      {/* Project Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Informations du projet
          </h3>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="secondary"
              size="sm"
            >
              Modifier
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du projet
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{project.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            {isEditing ? (
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">
                {project.description || "Aucune description"}
              </p>
            )}
          </div>

          {isEditing && (
            <div className="flex items-center gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: project.name,
                    description: project.description || "",
                  });
                }}
                variant="ghost"
              >
                Annuler
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Zone dangereuse
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          La suppression du projet est irréversible. Tous les tests, résultats
          et données associés seront perdus.
        </p>

        {!showDeleteConfirm ? (
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            variant="danger"
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer le projet
          </Button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
            <p className="text-sm text-red-800 font-medium">
              Êtes-vous sûr de vouloir supprimer "{project.name}" ?
            </p>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                variant="danger"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? "Suppression..." : "Oui, supprimer"}
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="ghost"
              >
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
