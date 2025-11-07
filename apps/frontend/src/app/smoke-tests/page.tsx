"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

interface SmokeTest {
  id: string;
  name: string;
  description?: string;
  baseUrl: string;
  endpoints: Array<{
    url: string;
    method: string;
    expectedStatus: number;
    description?: string;
  }>;
  project?: {
    id: string;
    name: string;
  };
  runs?: Array<{
    id: string;
    status: string;
    startedAt: string;
    completedAt?: string;
    successfulEndpoints: number;
    totalEndpoints: number;
  }>;
  createdAt: string;
}

export default function SmokeTestsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [smokeTests, setSmokeTests] = useState<SmokeTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>(
    []
  );

  useEffect(() => {
    fetchProjects();
    fetchSmokeTests();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchSmokeTests = async (projectId?: string) => {
    try {
      setLoading(true);
      const url = projectId
        ? `http://localhost:4000/api/smoke-tests?projectId=${projectId}`
        : "http://localhost:4000/api/smoke-tests";

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSmokeTests(data);
      }
    } catch (error) {
      console.error("Error fetching smoke tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    fetchSmokeTests(projectId || undefined);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this smoke test?")) return;

    try {
      const response = await fetch(
        `http://localhost:4000/api/smoke-tests/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setSmokeTests(smokeTests.filter((test) => test.id !== id));
      }
    } catch (error) {
      console.error("Error deleting smoke test:", error);
    }
  };

  const handleRun = async (id: string) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/smoke-tests/${id}/run`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ withRetry: true }),
        }
      );

      if (response.ok) {
        // Refresh the test to get updated runs
        fetchSmokeTests(selectedProject || undefined);
      }
    } catch (error) {
      console.error("Error running smoke test:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-100";
      case "failed":
        return "text-red-600 bg-red-100";
      case "running":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smoke Tests</h1>
              <p className="text-gray-600 mt-2">
                Quick validation tests for critical endpoints
              </p>
            </div>
            <button
              onClick={() => router.push("/smoke-tests/new")}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + New Smoke Test
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex gap-4">
              <select
                value={selectedProject}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Projects</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">Loading smoke tests...</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && smokeTests.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No smoke tests
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new smoke test.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => router.push("/smoke-tests/new")}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  + Create Smoke Test
                </button>
              </div>
            </div>
          )}

          {/* Tests list */}
          {!loading && smokeTests.length > 0 && (
            <div className="grid gap-6">
              {smokeTests.map((test) => {
                const latestRun = test.runs?.[0];
                const successRate = latestRun
                  ? Math.round(
                      (latestRun.successfulEndpoints /
                        latestRun.totalEndpoints) *
                        100
                    )
                  : null;

                return (
                  <div
                    key={test.id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {test.name}
                            </h3>
                            {latestRun && (
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                                  latestRun.status
                                )}`}
                              >
                                {latestRun.status}
                              </span>
                            )}
                          </div>

                          {test.description && (
                            <p className="text-gray-600 mt-2">
                              {test.description}
                            </p>
                          )}

                          <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                            <span className="flex items-center gap-2">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                              </svg>
                              {test.baseUrl}
                            </span>

                            <span className="flex items-center gap-2">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                              </svg>
                              {test.endpoints.length} endpoints
                            </span>

                            {test.project && (
                              <span className="flex items-center gap-2">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                  />
                                </svg>
                                {test.project.name}
                              </span>
                            )}

                            {successRate !== null && (
                              <span className="flex items-center gap-2 font-medium">
                                {successRate}% success
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRun(test.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            title="Run test"
                          >
                            ▶ Run
                          </button>
                          <button
                            onClick={() =>
                              router.push(`/smoke-tests/${test.id}`)
                            }
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleDelete(test.id)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
