"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/services/api";
import { useTranslation } from "@/contexts/TranslationContext";

interface Project {
  id: string;
  name: string;
}

export default function NewSecurityTestPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetUrl: "",
    projectId: "",
    scanType: "full",
    checkSqlInjection: true,
    checkXss: true,
    checkCsrf: true,
    checkAuthBypass: true,
    checkSensitiveData: true,
    checkSecurityHeaders: true,
    checkSslTls: true,
    checkDirectoryTraversal: true,
    authType: "none",
    authConfig: {},
    aiPrompt: "",
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await api.get<{ data: Project[] }>("/projects");
      setProjects(response.data);
      if (response.data.length > 0) {
        setFormData((prev) => ({ ...prev, projectId: response.data[0].id }));
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.targetUrl || !formData.projectId) {
      alert(t("Veuillez remplir tous les champs requis"));
      return;
    }

    try {
      setLoading(true);
      const response = await api.post<{ data: any }>(
        "/security-tests",
        formData
      );
      router.push(`/security-tests/${response.data.id}`);
    } catch (error) {
      console.error("Failed to create security test:", error);
      alert(t("Échec de la création du test de sécurité"));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t("Nouveau Test de Sécurité")}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {t("Créer un scan de sécurité OWASP pour votre application")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {t("Informations de Base")}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("Nom du Test")} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                    placeholder="Ex: Scan de Sécurité API Production"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("Description")}
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                    placeholder="Décrivez ce que ce test doit vérifier..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("URL Cible")} *
                  </label>
                  <input
                    type="url"
                    name="targetUrl"
                    value={formData.targetUrl}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                    placeholder="https://api.example.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {t("L'URL de l'application à scanner")}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("Projet")} *
                  </label>
                  <select
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  >
                    <option value="">{t("Sélectionnez un projet")}</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("Type de Scan")}
                  </label>
                  <select
                    name="scanType"
                    value={formData.scanType}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  >
                    <option value="quick">{t("Rapide (10-15 min)")}</option>
                    <option value="full">{t("Complet (30-45 min)")}</option>
                    <option value="custom">{t("Personnalisé")}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Security Checks */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {t("Vérifications de Sécurité (OWASP)")}
              </h2>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="checkSqlInjection"
                    checked={formData.checkSqlInjection}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {t("Injection SQL (CWE-89)")}
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="checkXss"
                    checked={formData.checkXss}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {t("Cross-Site Scripting (XSS) (CWE-79)")}
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="checkCsrf"
                    checked={formData.checkCsrf}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {t("CSRF (CWE-352)")}
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="checkAuthBypass"
                    checked={formData.checkAuthBypass}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {t("Contournement d'Authentification (CWE-287)")}
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="checkSensitiveData"
                    checked={formData.checkSensitiveData}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {t("Exposition de Données Sensibles (CWE-200)")}
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="checkSecurityHeaders"
                    checked={formData.checkSecurityHeaders}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {t("En-têtes de Sécurité (CSP, HSTS, etc.)")}
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="checkSslTls"
                    checked={formData.checkSslTls}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {t("Configuration SSL/TLS (CWE-326)")}
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="checkDirectoryTraversal"
                    checked={formData.checkDirectoryTraversal}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {t("Traversée de Répertoire (CWE-22)")}
                  </span>
                </label>
              </div>
            </div>

            {/* Authentication */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {t("Authentification")}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("Type d'Authentification")}
                  </label>
                  <select
                    name="authType"
                    value={formData.authType}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  >
                    <option value="none">{t("Aucune")}</option>
                    <option value="basic">{t("Basic Auth")}</option>
                    <option value="bearer">{t("Bearer Token")}</option>
                    <option value="cookie">{t("Cookie")}</option>
                  </select>
                </div>

                {formData.authType !== "none" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("Configuration d'Authentification")}
                    </label>
                    <textarea
                      name="authConfig"
                      value={JSON.stringify(formData.authConfig, null, 2)}
                      onChange={(e) => {
                        try {
                          const config = JSON.parse(e.target.value);
                          setFormData((prev) => ({
                            ...prev,
                            authConfig: config,
                          }));
                        } catch {
                          // Ignore invalid JSON during typing
                        }
                      }}
                      rows={4}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 font-mono text-sm"
                      placeholder={
                        formData.authType === "basic"
                          ? '{"username": "user", "password": "pass"}'
                          : formData.authType === "bearer"
                          ? '{"token": "your-token"}'
                          : '{"cookies": "session=abc123"}'
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            {/* AI Enhancement */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {t("Amélioration IA (Optionnel)")}
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("Instructions pour l'IA")}
                </label>
                <textarea
                  name="aiPrompt"
                  value={formData.aiPrompt}
                  onChange={handleChange}
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Ex: Concentrez-vous sur les endpoints d'API REST. Testez également les fichiers uploadés pour les vulnérabilités..."
                />
                <p className="mt-2 text-xs text-gray-500">
                  {t(
                    "L'IA utilisera ces instructions pour personnaliser les tests de sécurité"
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push("/security-tests")}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {t("Annuler")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? t("Création...") : t("Créer le Test")}
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
