"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { AssertionResults } from "@/components/AssertionResults";
import FlakinessReport from "@/components/FlakinessReport";
import {
  ArrowLeft,
  Globe,
  FileText,
  Code2,
  BarChart3,
  Camera,
  ScrollText,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  Calendar,
  Timer,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import type { Test } from "@/types";

interface TestDetailPageProps {
  params: {
    id: string;
  };
}

export default function TestDetailPage({ params }: TestDetailPageProps) {
  const router = useRouter();
  const { id } = params;
  const { token } = useAuth();

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rerunning, setRerunning] = useState(false);
  const [rerunMessage, setRerunMessage] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    if (token) {
      loadTest();
    }
  }, [id, token]);

  const loadTest = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/tests/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Test non trouvé");
      }

      const data = await response.json();
      setTest(data);
    } catch (error: any) {
      console.error("Error loading test:", error);
      setError(error.message || "Impossible de charger le test");
    } finally {
      setLoading(false);
    }
  };

  const handleRerun = async () => {
    if (!test || !token) return;

    setRerunning(true);
    setRerunMessage(null);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/tests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: test.url,
          prompt: test.prompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Impossible de relancer le test");
      }

      setRerunMessage(`Test relancé avec succès! ID: ${data.testId}`);

      setTimeout(() => {
        router.push(`/tests/${data.testId}`);
      }, 2000);
    } catch (error: any) {
      console.error("Error rerunning test:", error);
      setError(error.message || "Erreur lors du relancement du test");
    } finally {
      setRerunning(false);
    }
  };

  const latestResult = test?.results?.[0];
  const status = latestResult?.status || "pending";
  const badge = getStatusBadge(status);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {loading && (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-16 w-16 text-purple-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium">
                Chargement du test...
              </p>
            </div>
          </div>
        )}

        {error && !test && !loading && (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-md w-full">
              <div className="text-center mb-6">
                <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Erreur
                </h1>
                <p className="text-red-600 font-medium">{error}</p>
              </div>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
              >
                Retour au dashboard
              </button>
            </div>
          </div>
        )}

        {!loading && !error && test && (
          <div className="p-8">
            <div className="max-w-6xl mx-auto">
              <button
                onClick={() => router.push("/history")}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-6"
              >
                <ArrowLeft className="h-5 w-5" />
                Retour à l'historique
              </button>

              <header className="mb-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-4xl font-black text-gray-800 mb-2">
                      Détails du test
                    </h1>
                    <code className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                      {test.id}
                    </code>
                  </div>
                  <span
                    className={`px-5 py-2.5 text-sm font-bold rounded-xl flex items-center gap-2 ${badge.bgColor} ${badge.color}`}
                  >
                    {badge.icon}
                    {badge.label}
                  </span>
                </div>
              </header>

              {rerunMessage && (
                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                  <p className="text-green-800">{rerunMessage}</p>
                </div>
              )}

              <div className="grid gap-6">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h2 className="text-2xl font-bold mb-6">
                    Informations du test
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-500">
                        URL
                      </label>
                      <p className="text-lg">{test.url}</p>
                    </div>

                    {/* Afficher l'info du tunnel si présent */}
                    {test.tunnelUrl && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Globe className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <label className="text-sm font-semibold text-blue-900 block mb-1">
                              Tunnel Cloudflare
                            </label>
                            <p className="text-sm text-blue-700 mb-2">
                              Un tunnel a été créé pour cette URL locale
                            </p>
                            <div className="space-y-2">
                              <div>
                                <span className="text-xs text-blue-600">
                                  URL publique :
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <code className="text-sm bg-white px-3 py-1 rounded border border-blue-200 font-mono flex-1 truncate">
                                    {test.tunnelUrl}
                                  </code>
                                  <a
                                    href={test.tunnelUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700"
                                    title="Ouvrir dans un nouvel onglet"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </div>
                              </div>
                              {test.keepTunnelOpen && (
                                <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2">
                                  <p className="text-xs text-amber-700">
                                    ⚠️ Ce tunnel a été configuré pour rester
                                    ouvert. Pensez à le fermer manuellement dans
                                    la{" "}
                                    <button
                                      onClick={() => router.push("/tunnels")}
                                      className="underline hover:text-amber-900 font-medium"
                                    >
                                      page de gestion des tunnels
                                    </button>
                                    .
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-semibold text-gray-500">
                        Description
                      </label>
                      <p className="text-lg">{test.prompt}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500">
                        Créé le
                      </label>
                      <p>{new Date(test.createdAt).toLocaleString("fr-FR")}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleRerun}
                    disabled={rerunning}
                    className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {rerunning ? "Relancement..." : "Relancer le test"}
                  </button>
                </div>

                {test.code && (
                  <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold mb-6">Code généré</h2>
                    <pre className="bg-gray-900 text-gray-100 p-6 rounded-xl overflow-x-auto text-sm whitespace-pre-wrap break-words max-w-full">
                      {test.code}
                    </pre>
                  </div>
                )}

                {latestResult && (
                  <>
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                      <h2 className="text-2xl font-bold mb-6">Résultat</h2>
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-sm font-semibold text-gray-500">
                              Statut
                            </label>
                            <p className="text-lg">{latestResult.status}</p>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-gray-500">
                              Durée
                            </label>
                            <p className="text-lg">
                              {latestResult.duration} ms
                            </p>
                          </div>
                        </div>

                        {/* Badge de retry */}
                        {latestResult.retryCount !== undefined && (
                          <div className="border-t pt-6">
                            <label className="text-sm font-semibold text-gray-500 block mb-3">
                              Informations de retry
                            </label>
                            <div className="flex items-center gap-3">
                              {latestResult.retryCount === 0 ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg border border-green-200">
                                  <CheckCircle2 className="w-5 h-5" />
                                  <span className="font-semibold">
                                    🎯 Réussi au premier essai
                                  </span>
                                </div>
                              ) : latestResult.status === "passed" ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg border border-orange-200">
                                  <RefreshCw className="w-5 h-5" />
                                  <span className="font-semibold">
                                    🔄 Réussi après {latestResult.retryCount}{" "}
                                    {latestResult.retryCount > 1
                                      ? "retries"
                                      : "retry"}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg border border-red-200">
                                  <XCircle className="w-5 h-5" />
                                  <span className="font-semibold">
                                    🚫 Échoué après{" "}
                                    {latestResult.retryCount + 1}{" "}
                                    {latestResult.retryCount > 0
                                      ? "essais"
                                      : "essai"}
                                  </span>
                                </div>
                              )}

                              {/* Stats additionnelles */}
                              {latestResult.retryCount > 0 && (
                                <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                  <span className="font-semibold">
                                    Configuration:
                                  </span>{" "}
                                  Max {test.maxRetries || 3} retries, Délai{" "}
                                  {test.retryDelay || 1000}ms
                                </div>
                              )}
                            </div>

                            {/* Indicateur de flakiness */}
                            {latestResult.retryCount > 0 && (
                              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-sm text-amber-700">
                                  ⚠️ Ce test a nécessité des retries. Cela peut
                                  indiquer un test flaky (instable). Considérez
                                  d'investiguer la cause des échecs
                                  intermittents.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assertions Results */}
                    {latestResult.assertions &&
                      latestResult.assertions.length > 0 && (
                        <AssertionResults
                          assertions={latestResult.assertions}
                        />
                      )}

                    {/* Flakiness Report */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                      <h2 className="text-2xl font-bold mb-6">
                        Analyse de Stabilité (Flakiness)
                      </h2>
                      <FlakinessReport testId={test.id} />
                    </div>

                    {latestResult.screenshotUrl && (
                      <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold mb-6">Screenshot</h2>
                        <div className="max-w-3xl mx-auto">
                          <img
                            src={latestResult.screenshotUrl}
                            alt="Screenshot"
                            className="w-full h-auto rounded-xl border border-gray-200 shadow-lg"
                          />
                        </div>
                      </div>
                    )}

                    {latestResult.logs && (
                      <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold mb-6">Logs</h2>
                        <div className="bg-gray-900 rounded-xl p-6 max-h-96 overflow-y-auto">
                          <pre className="text-gray-100 text-sm whitespace-pre-wrap break-words max-w-full">
                            {latestResult.logs}
                          </pre>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case "passed":
      return {
        label: "Réussi",
        color: "text-green-700",
        bgColor: "bg-green-100",
        icon: <CheckCircle2 className="h-5 w-5" />,
      };
    case "failed":
      return {
        label: "Échoué",
        color: "text-red-700",
        bgColor: "bg-red-100",
        icon: <XCircle className="h-5 w-5" />,
      };
    case "running":
      return {
        label: "En cours",
        color: "text-blue-700",
        bgColor: "bg-blue-100",
        icon: <Loader2 className="h-5 w-5 animate-spin" />,
      };
    default:
      return {
        label: "En attente",
        color: "text-gray-700",
        bgColor: "bg-gray-100",
        icon: <Clock className="h-5 w-5" />,
      };
  }
}
