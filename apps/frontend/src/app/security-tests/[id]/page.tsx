"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
  project: {
    name: string;
  };
  runs: SecurityTestRun[];
}

interface SecurityTestRun {
  id: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  totalChecks: number;
  vulnerabilitiesFound: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  riskScore?: number;
  vulnerabilities: Vulnerability[];
}

interface Vulnerability {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  url?: string;
  parameter?: string;
  method?: string;
  evidence?: string;
  cwe?: string;
  owasp?: string;
  remediation?: string;
  status: string;
  createdAt: string;
}

export default function SecurityTestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const testId = params?.id as string;

  const [test, setTest] = useState<SecurityTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "vulnerabilities" | "history"
  >("overview");

  useEffect(() => {
    if (testId) {
      loadTest();
      const interval = setInterval(loadTest, 5000); // Refresh every 5s
      return () => clearInterval(interval);
    }
  }, [testId]);

  const loadTest = async () => {
    try {
      const response = await api.get<{ data: SecurityTest }>(
        `/security-tests/${testId}`
      );
      setTest(response.data);
    } catch (error) {
      console.error("Failed to load security test:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunTest = async () => {
    try {
      await api.post(`/security-tests/${testId}/run`, {});
      alert(t("Test de sécurité démarré"));
      setTimeout(loadTest, 1000);
    } catch (error) {
      console.error("Failed to run test:", error);
      alert(t("Échec du démarrage du test"));
    }
  };

  const handleUpdateVulnerabilityStatus = async (
    vulnId: string,
    status: string
  ) => {
    try {
      await api.patch(`/security-tests/vulnerabilities/${vulnId}/status`, {
        status,
      });
      loadTest();
    } catch (error) {
      console.error("Failed to update vulnerability status:", error);
    }
  };

  const getSeverityColor = (severity: string): string => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-blue-100 text-blue-800",
      info: "bg-gray-100 text-gray-800",
    };
    return colors[severity] || colors.info;
  };

  const getRiskLevel = (score?: number): { text: string; color: string } => {
    if (score === undefined) return { text: "N/A", color: "text-gray-500" };
    if (score >= 80) return { text: "Critical", color: "text-red-600" };
    if (score >= 50) return { text: "High", color: "text-orange-600" };
    if (score >= 30) return { text: "Medium", color: "text-yellow-600" };
    return { text: "Low", color: "text-green-600" };
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!test) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <p className="text-gray-500">{t("Test non trouvé")}</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const latestRun = test.runs[0];
  const riskLevel = getRiskLevel(latestRun?.riskScore);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{test.name}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {test.project.name} • {test.targetUrl}
              </p>
              {test.description && (
                <p className="mt-2 text-sm text-gray-600">{test.description}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRunTest}
                disabled={test.status === "running"}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {test.status === "running"
                  ? t("En cours...")
                  : t("Lancer le Scan")}
              </button>
              <button
                onClick={() => router.push("/security-tests")}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
              >
                {t("Retour")}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {latestRun && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("Score de Risque")}
                    </p>
                    <p className={`text-3xl font-bold ${riskLevel.color}`}>
                      {latestRun.riskScore || 0}/100
                    </p>
                    <p className={`text-sm ${riskLevel.color}`}>
                      {riskLevel.text}
                    </p>
                  </div>
                  <div className="text-4xl">⚠️</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("Vulnérabilités")}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {latestRun.vulnerabilitiesFound}
                    </p>
                    <p className="text-sm text-gray-500">
                      {latestRun.totalChecks} {t("vérifications")}
                    </p>
                  </div>
                  <div className="text-4xl">🔍</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("Critiques")}
                    </p>
                    <p className="text-3xl font-bold text-red-600">
                      {latestRun.criticalCount}
                    </p>
                    <p className="text-sm text-orange-600">
                      {latestRun.highCount} {t("élevées")}
                    </p>
                  </div>
                  <div className="text-4xl">🚨</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("Statut")}
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        latestRun.status === "completed"
                          ? "text-green-600"
                          : latestRun.status === "running"
                          ? "text-blue-600"
                          : "text-red-600"
                      }`}
                    >
                      {latestRun.status}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(latestRun.startedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-4xl">
                    {latestRun.status === "completed" ? "✅" : "⏳"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {t("Vue d'ensemble")}
              </button>
              <button
                onClick={() => setActiveTab("vulnerabilities")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "vulnerabilities"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {t("Vulnérabilités")} ({latestRun?.vulnerabilitiesFound || 0})
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "history"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {t("Historique")} ({test.runs.length})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && latestRun && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t("Résumé du Dernier Scan")}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {t("Type de Scan")}
                    </p>
                    <p className="mt-1 text-sm text-gray-900">
                      {test.scanType.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {t("Durée")}
                    </p>
                    <p className="mt-1 text-sm text-gray-900">
                      {latestRun.completedAt
                        ? `${Math.round(
                            (new Date(latestRun.completedAt).getTime() -
                              new Date(latestRun.startedAt).getTime()) /
                              1000 /
                              60
                          )} min`
                        : t("En cours...")}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    {t("Distribution des Vulnérabilités")}
                  </p>
                  <div className="flex gap-2">
                    {latestRun.criticalCount > 0 && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        {latestRun.criticalCount} Critical
                      </span>
                    )}
                    {latestRun.highCount > 0 && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                        {latestRun.highCount} High
                      </span>
                    )}
                    {latestRun.mediumCount > 0 && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        {latestRun.mediumCount} Medium
                      </span>
                    )}
                    {latestRun.lowCount > 0 && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {latestRun.lowCount} Low
                      </span>
                    )}
                    {latestRun.vulnerabilitiesFound === 0 && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        ✓ {t("Aucune vulnérabilité détectée")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "vulnerabilities" && latestRun && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {latestRun.vulnerabilities.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {t("Aucune vulnérabilité détectée")} ✅
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {latestRun.vulnerabilities.map((vuln) => (
                    <div key={vuln.id} className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
                                vuln.severity
                              )}`}
                            >
                              {vuln.severity.toUpperCase()}
                            </span>
                            {vuln.cwe && (
                              <span className="text-xs text-gray-500">
                                {vuln.cwe}
                              </span>
                            )}
                            {vuln.owasp && (
                              <span className="text-xs text-gray-500">
                                {vuln.owasp}
                              </span>
                            )}
                          </div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {vuln.title}
                          </h4>
                        </div>
                        <select
                          value={vuln.status}
                          onChange={(e) =>
                            handleUpdateVulnerabilityStatus(
                              vuln.id,
                              e.target.value
                            )
                          }
                          className="ml-4 border border-gray-300 rounded-md px-3 py-1 text-sm"
                        >
                          <option value="open">{t("Ouvert")}</option>
                          <option value="acknowledged">{t("Reconnu")}</option>
                          <option value="fixed">{t("Corrigé")}</option>
                          <option value="false_positive">
                            {t("Faux Positif")}
                          </option>
                        </select>
                      </div>

                      <p className="text-sm text-gray-700 mb-3">
                        {vuln.description}
                      </p>

                      {vuln.url && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-500">
                            {t("URL: ")}
                          </span>
                          <span className="text-xs text-gray-700">
                            {vuln.url}
                          </span>
                        </div>
                      )}

                      {vuln.parameter && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-500">
                            {t("Paramètre: ")}
                          </span>
                          <span className="text-xs text-gray-700">
                            {vuln.parameter}
                          </span>
                        </div>
                      )}

                      {vuln.evidence && (
                        <details className="mt-3">
                          <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-indigo-600">
                            {t("Preuve")}
                          </summary>
                          <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                            {vuln.evidence}
                          </pre>
                        </details>
                      )}

                      {vuln.remediation && (
                        <details className="mt-3">
                          <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-indigo-600">
                            {t("Remédiation")}
                          </summary>
                          <div className="mt-2 p-3 bg-blue-50 rounded text-sm text-gray-700">
                            {vuln.remediation}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("Date")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("Durée")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("Score")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("Vulnérabilités")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t("Statut")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {test.runs.map((run) => (
                    <tr key={run.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(run.startedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {run.completedAt
                          ? `${Math.round(
                              (new Date(run.completedAt).getTime() -
                                new Date(run.startedAt).getTime()) /
                                1000 /
                                60
                            )} min`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${
                            getRiskLevel(run.riskScore).color
                          }`}
                        >
                          {run.riskScore || 0}/100
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1">
                          {run.criticalCount > 0 && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                              {run.criticalCount}C
                            </span>
                          )}
                          {run.highCount > 0 && (
                            <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded">
                              {run.highCount}H
                            </span>
                          )}
                          {run.vulnerabilitiesFound === 0 && (
                            <span className="text-xs text-green-600">✓</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            run.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : run.status === "running"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {run.status}
                        </span>
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
