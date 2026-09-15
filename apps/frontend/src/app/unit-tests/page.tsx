"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

interface UnitTest {
  id: string;
  name: string;
  functionName: string;
  sourceFile: string;
  importance: number;
  framework: string;
  createdAt: string;
  project?: {
    id: string;
    name: string;
  };
  lastRun?: {
    status: string;
    passedTests: number;
    totalTests: number;
    coverage?: number;
    completedAt: string;
  };
}

export default function UnitTestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [unitTests, setUnitTests] = useState<UnitTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    projectId: "",
    importance: "",
  });

  useEffect(() => {
    fetchUnitTests();
  }, [filter]);

  const fetchUnitTests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.projectId) params.append("projectId", filter.projectId);
      if (filter.importance) params.append("importance", filter.importance);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/unit-tests?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUnitTests(data.unitTests || []);
      }
    } catch (error) {
      console.error("Error fetching unit tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUnitTest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this unit test?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/unit-tests/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        setUnitTests(unitTests.filter((test) => test.id !== id));
      }
    } catch (error) {
      console.error("Error deleting unit test:", error);
    }
  };

  const getImportanceBadge = (importance: number) => {
    if (importance >= 90) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded bg-red-500 text-white">
          🔴 Critical ({importance})
        </span>
      );
    } else if (importance >= 70) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded bg-orange-500 text-white">
          🟠 Important ({importance})
        </span>
      );
    } else if (importance >= 50) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-500 text-white">
          🟡 Useful ({importance})
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-500 text-white">
          🟢 Low ({importance})
        </span>
      );
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status)
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-500 text-white">
          Not run
        </span>
      );
    if (status === "passed")
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded bg-green-500 text-white">
          Passed
        </span>
      );
    if (status === "failed")
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded bg-red-500 text-white">
          Failed
        </span>
      );
    return (
      <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-500 text-white">
        Running
      </span>
    );
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Unit Tests</h1>
              <p className="text-gray-600 mt-1">
                Tests generated automatically by analyzing your codebase
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-blue-600 mt-0.5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-900">
                  How it works
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Unit tests are generated by running{" "}
                  <code className="bg-blue-100 px-1 rounded">
                    specto-agent analyze
                  </code>{" "}
                  in your project. The agent analyzes your code, identifies
                  critical functions, and generates tests automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Importance
                </label>
                <select
                  value={filter.importance}
                  onChange={(e) =>
                    setFilter({ ...filter, importance: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All</option>
                  <option value="90">Critical (90+)</option>
                  <option value="70">Important (70+)</option>
                  <option value="50">Useful (50+)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tests List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading unit tests...</p>
            </div>
          ) : unitTests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No unit tests yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Run{" "}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  specto-agent analyze
                </code>{" "}
                in your project to generate tests.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Function
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Importance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Run
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Results
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {unitTests.map((test) => (
                    <tr key={test.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {test.functionName}
                            </div>
                            {test.project && (
                              <div className="text-xs text-gray-500">
                                {test.project.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 font-mono">
                          {test.sourceFile}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getImportanceBadge(test.importance)}
                      </td>
                      <td className="px-6 py-4">
                        {test.lastRun ? (
                          <div>
                            {getStatusBadge(test.lastRun.status)}
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(
                                test.lastRun.completedAt
                              ).toLocaleString()}
                            </div>
                          </div>
                        ) : (
                          getStatusBadge(undefined)
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {test.lastRun ? (
                          <div className="text-sm">
                            <div className="text-gray-900">
                              {test.lastRun.passedTests}/
                              {test.lastRun.totalTests} passed
                            </div>
                            {test.lastRun.coverage !== undefined && (
                              <div className="text-gray-600">
                                Coverage: {test.lastRun.coverage.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              router.push(`/unit-tests/${test.id}`)
                            }
                            className="text-purple-600 hover:text-purple-900 text-sm font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => deleteUnitTest(test.id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
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
