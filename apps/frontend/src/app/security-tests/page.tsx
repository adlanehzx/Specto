"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/services/api";
import { useTranslation } from "@/contexts/TranslationContext";

interface SecurityTest {
  id: string;
  name: string;
  description?: string;
  targetUrl: string;
  scanType: string;
  status: string;
  lastRunAt?: string;
  lastRun?: {
    riskScore?: number;
    vulnerabilitiesFound: number;
    criticalCount: number;
    highCount: number;
    status: string;
  };
  project: {
    id: string;
    name: string;
  };
}

interface Project {
  id: string;
  name: string;
}

export default function SecurityTestsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [tests, setTests] = useState<SecurityTest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
    loadTests();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadTests(selectedProject);
    } else {
      loadTests();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const response = await api.get<{ data: Project[] }>("/projects");
      setProjects(response.data);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  const loadTests = async (projectId?: string) => {
    try {
      setLoading(true);
      const url = projectId
        ? `/security-tests?projectId=${projectId}`
        : "/security-tests";
      const response = await api.get<{ data: SecurityTest[] }>(url);
      setTests(response.data);
    } catch (error) {
      console.error("Failed to load security tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunTest = async (testId: string) => {
    try {
      await api.post(`/security-tests/${testId}/run`, {});
      alert(t("Test de sécurité démarré avec succès"));
      // Reload after a short delay to see the running status
      setTimeout(() => loadTests(selectedProject || undefined), 1000);
    } catch (error) {
      console.error("Failed to run test:", error);
      alert(t("Échec du démarrage du test"));
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm(t("Êtes-vous sûr de vouloir supprimer ce test ?"))) {
      return;
    }

    try {
      await api.delete(`/security-tests/${testId}`);
      loadTests(selectedProject || undefined);
    } catch (error) {
      console.error("Failed to delete test:", error);
      alert(t("Échec de la suppression du test"));
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-blue-100 text-blue-800",
      info: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          colors[severity] || colors.info
        }`}
      >
        {severity.toUpperCase()}
      </span>
    );
  };

  const getRiskScoreBadge = (score?: number) => {
    if (score === undefined) return <span className="text-gray-400">N/A</span>;

    let color = "bg-green-100 text-green-800";
    if (score >= 80) color = "bg-red-100 text-red-800";
    else if (score >= 50) color = "bg-orange-100 text-orange-800";
    else if (score >= 30) color = "bg-yellow-100 text-yellow-800";

    return (
      <span className={`px-2 py-1 rounded text-sm font-medium ${color}`}>
        {score}/100
      </span>
    );
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t("Tests de Sécurité")}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {t("Scans de sécurité OWASP pour vos applications")}
              </p>
            </div>
            <button
              onClick={() => router.push("/security-tests/new")}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              {t("Nouveau Test de Sécurité")}
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("Projet")}
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">{t("Tous les projets")}</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tests Table */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600">{t("Chargement...")}</p>
            </div>
          ) : tests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">
                {t("Aucun test de sécurité trouvé")}
              </p>
              <button
                onClick={() => router.push("/security-tests/new")}
                className="mt-4 text-indigo-600 hover:text-indigo-700"
              >
                {t("Créer votre premier test de sécurité")}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("Nom")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("URL Cible")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("Type de Scan")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("Score de Risque")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("Vulnérabilités")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("Statut")}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {t("Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tests.map((test) => (
                    <tr
                      key={test.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/security-tests/${test.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {test.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {test.project.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {test.targetUrl}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                          {test.scanType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getRiskScoreBadge(test.lastRun?.riskScore)}
                      </td>
                      <td className="px-6 py-4">
                        {test.lastRun ? (
                          <div className="flex gap-2">
                            {test.lastRun.criticalCount > 0 && (
                              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                                {test.lastRun.criticalCount} Critical
                              </span>
                            )}
                            {test.lastRun.highCount > 0 && (
                              <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                                {test.lastRun.highCount} High
                              </span>
                            )}
                            {test.lastRun.vulnerabilitiesFound === 0 && (
                              <span className="text-sm text-green-600">
                                ✓ Aucune
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            {t("Pas encore exécuté")}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            test.status === "running"
                              ? "bg-blue-100 text-blue-800"
                              : test.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : test.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {test.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRunTest(test.id);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          disabled={test.status === "running"}
                        >
                          {t("Exécuter")}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTest(test.id);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          {t("Supprimer")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
