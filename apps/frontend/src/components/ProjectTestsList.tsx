"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Clock, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { useAuth } from "@/contexts/AuthContext";

interface Test {
  id: string;
  url: string;
  prompt: string;
  createdAt: string;
  lastRunAt?: string | null;
  isScheduled: boolean;
  frequency?: string | null;
  isActive: boolean;
  _count?: {
    results: number;
  };
  lastResult?: {
    status: "pending" | "running" | "success" | "failed";
    createdAt: string;
  } | null;
}

interface ProjectTestsListProps {
  projectId: string;
  canEdit: boolean; // Based on user role
}

export function ProjectTestsList({
  projectId,
  canEdit,
}: ProjectTestsListProps) {
  const router = useRouter();
  const { token } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [apiTests, setApiTests] = useState<any[]>([]);
  const [smokeTests, setSmokeTests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testType, setTestType] = useState<"e2e" | "api" | "smoke">("e2e");

  const fetchTests = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!token) {
        console.warn("No auth token available");
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      // Fetch E2E tests
      const e2eResponse = await fetch(
        `${apiUrl}/api/tests?projectId=${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Fetch API tests
      const apiResponse = await fetch(
        `${apiUrl}/api/api-tests?projectId=${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Fetch Smoke tests
      const smokeResponse = await fetch(
        `${apiUrl}/api/smoke-tests?projectId=${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (e2eResponse.ok) {
        const e2eData = await e2eResponse.json();
        console.log("E2E tests loaded:", e2eData.length, "tests");
        setTests(e2eData);
      } else if (e2eResponse.status === 401) {
        console.error("E2E tests: Authentication failed");
      }

      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log("API tests loaded:", apiData.length, "tests");
        setApiTests(apiData);
      } else if (apiResponse.status === 401) {
        console.error("API tests: Authentication failed");
      }

      if (smokeResponse.ok) {
        const smokeData = await smokeResponse.json();
        console.log("Smoke tests loaded:", smokeData.length, "tests");
        setSmokeTests(smokeData);
      } else if (smokeResponse.status === 401) {
        console.error("Smoke tests: Authentication failed");
      }

      if (!e2eResponse.ok && !apiResponse.ok && !smokeResponse.ok) {
        throw new Error("Erreur lors du chargement des tests");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTests();
    }
  }, [projectId, token]);

  const handleRunTest = async (testId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/api/tests/${testId}/run`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors du lancement du test");
      }

      // Refresh tests after running
      fetchTests();
    } catch (err: any) {
      console.error("Error running test:", err);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce test ?")) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/api/tests/${testId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du test");
      }

      // Refresh tests after deletion
      fetchTests();
    } catch (err: any) {
      console.error("Error deleting test:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 inline mr-1" />
            Succès
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 inline mr-1" />
            Échec
          </Badge>
        );
      case "running":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Play className="w-3 h-3 inline mr-1" />
            En cours
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <Clock className="w-3 h-3 inline mr-1" />
            En attente
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-800 font-medium">{error}</p>
        <Button variant="secondary" onClick={fetchTests} className="mt-4">
          Réessayer
        </Button>
      </div>
    );
  }

  const displayedTests = testType === "e2e" ? tests : [];
  const displayedApiTests = testType === "api" ? apiTests : [];
  const displayedSmokeTests = testType === "smoke" ? smokeTests : [];
  const hasNoTests =
    tests.length === 0 && apiTests.length === 0 && smokeTests.length === 0;

  console.log("ProjectTestsList render:", {
    testType,
    testsLength: tests.length,
    apiTestsLength: apiTests.length,
    displayedTests: displayedTests.length,
    displayedApiTests: displayedApiTests.length,
  });

  if (hasNoTests) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun test dans ce projet
        </h3>
        <p className="text-gray-600 mb-6">
          Créez un test et associez-le à ce projet pour commencer.
        </p>
        <Button variant="primary" onClick={() => router.push("/dashboard")}>
          Créer un test
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sous-navigation pour les types de tests */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setTestType("e2e")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            testType === "e2e"
              ? "bg-indigo-100 text-indigo-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Tests E2E ({tests.length})
        </button>
        <button
          onClick={() => setTestType("smoke")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            testType === "smoke"
              ? "bg-indigo-100 text-indigo-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Tests Smoke ({smokeTests.length})
        </button>
        <button
          onClick={() => setTestType("api")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            testType === "api"
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Tests API ({apiTests.length})
        </button>
      </div>

      {/* Tests E2E */}
      {testType === "e2e" &&
        displayedTests.map((test) => (
          <div
            key={test.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-indigo-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                    {test.prompt}
                  </h3>
                  {test.lastResult && getStatusBadge(test.lastResult.status)}
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                  {test.url}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      Créé le{" "}
                      {new Date(test.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  {test.lastRunAt && (
                    <div className="flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      <span>
                        Dernière exécution:{" "}
                        {new Date(test.lastRunAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  )}
                  {test.isScheduled && test.frequency && (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      Planifié ({test.frequency})
                    </Badge>
                  )}
                  {test._count && test._count.results > 0 && (
                    <span>{test._count.results} résultats</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRunTest(test.id)}
                  className="flex items-center gap-1"
                >
                  <Play className="w-4 h-4" />
                  Lancer
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/tests/${test.id}`)}
                >
                  Voir résultats
                </Button>
                {canEdit && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteTest(test.id)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

      {/* Tests API */}
      {testType === "api" &&
        displayedApiTests.map((test: any) => (
          <div
            key={test.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-indigo-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                    {test.name}
                  </h3>
                  {test.latestRun && getStatusBadge(test.latestRun.status)}
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    {test.method}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                  {test.url}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      Créé le{" "}
                      {new Date(test.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  {test.runsCount > 0 && (
                    <span>{test.runsCount} exécutions</span>
                  )}
                  {test.successRate !== undefined && (
                    <span
                      className={
                        test.successRate >= 80
                          ? "text-green-600"
                          : "text-orange-600"
                      }
                    >
                      {test.successRate}% de réussite
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/api-tests/${test.id}`)}
                >
                  Voir résultats
                </Button>
                {canEdit && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (
                        confirm(
                          "Êtes-vous sûr de vouloir supprimer ce test API ?"
                        )
                      ) {
                        // TODO: Implémenter la suppression des tests API
                      }
                    }}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

      {/* Tests Smoke */}
      {testType === "smoke" &&
        displayedSmokeTests.map((test: any) => (
          <div
            key={test.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-indigo-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                    {test.name}
                  </h3>
                  {test.runs?.[0] && getStatusBadge(test.runs[0].status)}
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                    {(test.endpoints as any[])?.length || 0} endpoints
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 mb-3">Health check test</p>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      Créé le{" "}
                      {new Date(test.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  {test.runs && test.runs.length > 0 && (
                    <>
                      <span>{test.runs.length} exécutions</span>
                      {test.runs[0]?.successfulChecks !== undefined && (
                        <span className="text-green-600">
                          {test.runs[0].successfulChecks}/
                          {test.runs[0].totalEndpoints} checks OK
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/smoke-tests/${test.id}`)}
                >
                  Voir résultats
                </Button>
                {canEdit && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (
                        confirm(
                          "Êtes-vous sûr de vouloir supprimer ce test smoke ?"
                        )
                      ) {
                        // TODO: Implémenter la suppression des tests smoke
                      }
                    }}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
