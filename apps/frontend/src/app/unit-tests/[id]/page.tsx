"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

interface UnitTest {
  id: string;
  name: string;
  functionName: string;
  sourceFile: string;
  sourceCode: string;
  generatedCode: string;
  importance: number;
  framework: string;
  createdAt: string;
  project?: {
    id: string;
    name: string;
  };
  runs: Array<{
    id: string;
    status: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    coverage?: number;
    duration: number;
    startedAt: string;
    completedAt?: string;
    error?: string;
  }>;
  stats: {
    totalRuns: number;
    passedRuns: number;
    failedRuns: number;
    successRate: number;
    avgCoverage: number;
  };
}

export default function UnitTestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params?.id as string;
  const [unitTest, setUnitTest] = useState<UnitTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "source" | "tests" | "history"
  >("overview");

  useEffect(() => {
    if (testId) {
      fetchUnitTest();
    }
  }, [testId]);

  const fetchUnitTest = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/unit-tests/${testId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUnitTest(data);
      }
    } catch (error) {
      console.error("Error fetching unit test:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (
      !confirm(
        "Do you want to optimize this unit test with AI? This will improve test coverage and quality."
      )
    )
      return;

    try {
      setOptimizing(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/unit-tests/${testId}/optimize`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        alert(
          "Unit test optimization started! Results will be available soon."
        );
        await fetchUnitTest();
      } else {
        alert("Failed to optimize unit test");
      }
    } catch (error) {
      console.error("Error optimizing unit test:", error);
      alert("Error optimizing unit test");
    } finally {
      setOptimizing(false);
    }
  };

  const deleteUnitTest = async () => {
    if (!confirm("Are you sure you want to delete this unit test?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/unit-tests/${testId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        router.push("/unit-tests");
      }
    } catch (error) {
      console.error("Error deleting unit test:", error);
    }
  };

  const getImportanceBadge = (importance: number) => {
    if (importance >= 90) {
      return (
        <span className="px-3 py-1 text-sm font-semibold rounded bg-red-500 text-white">
          🔴 Critical ({importance}/100)
        </span>
      );
    } else if (importance >= 70) {
      return (
        <span className="px-3 py-1 text-sm font-semibold rounded bg-orange-500 text-white">
          🟠 Important ({importance}/100)
        </span>
      );
    } else if (importance >= 50) {
      return (
        <span className="px-3 py-1 text-sm font-semibold rounded bg-yellow-500 text-white">
          🟡 Useful ({importance}/100)
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 text-sm font-semibold rounded bg-gray-500 text-white">
          🟢 Low Priority ({importance}/100)
        </span>
      );
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "passed")
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded bg-green-500 text-white">
          ✓ Passed
        </span>
      );
    if (status === "failed")
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded bg-red-500 text-white">
          ✗ Failed
        </span>
      );
    return (
      <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-500 text-white">
        ⟳ Running
      </span>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading unit test...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!unitTest) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <p className="text-gray-600">Unit test not found</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const latestRun = unitTest.runs[0];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <button
                onClick={() => router.push("/unit-tests")}
                className="text-purple-600 hover:text-purple-800 text-sm font-medium mb-2 flex items-center"
              >
                ← Back to Unit Tests
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                {unitTest.functionName}
              </h1>
              <p className="text-gray-600 mt-1 font-mono text-sm">
                {unitTest.sourceFile}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {getImportanceBadge(unitTest.importance)}
              <button
                onClick={handleOptimize}
                disabled={optimizing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {optimizing ? "⚙️ Optimizing..." : "✨ Optimize with AI"}
              </button>
              <button
                onClick={deleteUnitTest}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-600">
                Success Rate
              </div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {unitTest.stats.successRate}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {unitTest.stats.passedRuns}/{unitTest.stats.totalRuns} passed
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-600">
                Avg Coverage
              </div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {unitTest.stats.avgCoverage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">Code coverage</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-600">
                Latest Status
              </div>
              <div className="mt-2">
                {latestRun ? (
                  <>
                    {getStatusBadge(latestRun.status)}
                    <div className="text-sm text-gray-500 mt-1">
                      {latestRun.passedTests}/{latestRun.totalTests} tests
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-500">Not run yet</div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-600">Framework</div>
              <div className="text-3xl font-bold text-gray-900 mt-2 capitalize">
                {unitTest.framework}
              </div>
              <div className="text-sm text-gray-500 mt-1">Test framework</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "overview", label: "Overview" },
                { id: "source", label: "Source Code" },
                { id: "tests", label: "Generated Tests" },
                { id: "history", label: "Run History" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-purple-500 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === "overview" && (
              <div className="space-y-6">
                {latestRun && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Latest Run Results
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Total Tests</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {latestRun.totalTests}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Passed</div>
                        <div className="text-2xl font-bold text-green-600">
                          {latestRun.passedTests}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Failed</div>
                        <div className="text-2xl font-bold text-red-600">
                          {latestRun.failedTests}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Duration</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {latestRun.duration}ms
                        </div>
                      </div>
                    </div>
                    {latestRun.error && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                        <div className="text-sm font-medium text-red-900">
                          Error:
                        </div>
                        <pre className="text-sm text-red-700 mt-1 whitespace-pre-wrap">
                          {latestRun.error}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Configuration
                  </h2>
                  <dl className="grid grid-cols-1 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-600">
                        Function Name
                      </dt>
                      <dd className="text-sm text-gray-900 mt-1 font-mono">
                        {unitTest.functionName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">
                        Source File
                      </dt>
                      <dd className="text-sm text-gray-900 mt-1 font-mono">
                        {unitTest.sourceFile}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">
                        Importance Score
                      </dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {unitTest.importance}/100
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">
                        Created At
                      </dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {new Date(unitTest.createdAt).toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {activeTab === "source" && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Original Source Code
                </h2>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{unitTest.sourceCode}</code>
                </pre>
              </div>
            )}

            {activeTab === "tests" && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Generated Test Code
                </h2>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{unitTest.generatedCode}</code>
                </pre>
              </div>
            )}

            {activeTab === "history" && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tests
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Coverage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Started
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {unitTest.runs.map((run) => (
                      <tr key={run.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          {getStatusBadge(run.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {run.passedTests}/{run.totalTests}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {run.coverage !== undefined
                            ? `${run.coverage.toFixed(1)}%`
                            : "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {run.duration}ms
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(run.startedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
