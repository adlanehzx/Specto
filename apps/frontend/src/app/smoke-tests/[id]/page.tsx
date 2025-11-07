"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

interface Endpoint {
  url: string;
  method: string;
  expectedStatus: number;
  description?: string;
  timeout?: number;
}

interface EndpointResult {
  url: string;
  status: number;
  responseTime: number;
  success: boolean;
  error?: string;
}

interface SmokeTestRun {
  id: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  results?: EndpointResult[];
  totalEndpoints: number;
  successfulChecks: number;
  failedChecks: number;
  avgResponseTime?: number;
  slowestEndpoint?: string;
  fastestEndpoint?: string;
  failedEndpoints?: any[];
  error?: string;
}

interface SmokeTest {
  id: string;
  name: string;
  description?: string;
  endpoints: Endpoint[];
  project?: {
    id: string;
    name: string;
  };
  maxRetries: number;
  retryDelay: number;
  createdAt: string;
  runs: SmokeTestRun[];
}

export default function SmokeTestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();
  const [smokeTest, setSmokeTest] = useState<SmokeTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchSmokeTest();
    }
  }, [params.id]);

  const fetchSmokeTest = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:4000/api/smoke-tests/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSmokeTest(data);
      }
    } catch (error) {
      console.error("Error fetching smoke test:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    try {
      setRunning(true);
      const response = await fetch(
        `http://localhost:4000/api/smoke-tests/${params.id}/run`,
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
        // Refresh data after run
        setTimeout(() => {
          fetchSmokeTest();
          setRunning(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error running smoke test:", error);
      setRunning(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this smoke test?")) return;

    try {
      const response = await fetch(
        `http://localhost:4000/api/smoke-tests/${params.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        router.push("/smoke-tests");
      }
    } catch (error) {
      console.error("Error deleting smoke test:", error);
    }
  };

  const handleOptimize = async () => {
    if (
      !confirm(
        "Optimize this smoke test with AI? This will analyze and improve endpoints."
      )
    )
      return;

    try {
      setOptimizing(true);
      const response = await fetch(
        `http://localhost:4000/api/smoke-tests/${params.id}/optimize`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert(
          `Optimization complete! ${
            data.improvements || "Test optimized successfully"
          }`
        );
        fetchSmokeTest();
      } else {
        alert("Optimization failed. Please try again.");
      }
    } catch (error) {
      console.error("Error optimizing smoke test:", error);
      alert("Error during optimization");
    } finally {
      setOptimizing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "running":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!smokeTest) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">
              Smoke test not found
            </h2>
            <button
              onClick={() => router.push("/smoke-tests")}
              className="mt-4 text-indigo-600 hover:text-indigo-700"
            >
              ← Back to smoke tests
            </button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const latestRun = smokeTest.runs[0];
  const successRate = latestRun
    ? Math.round((latestRun.successfulChecks / latestRun.totalEndpoints) * 100)
    : null;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/smoke-tests")}
              className="text-indigo-600 hover:text-indigo-700 mb-4 flex items-center gap-2"
            >
              ← Back to smoke tests
            </button>

            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {smokeTest.name}
                </h1>
                {smokeTest.description && (
                  <p className="text-gray-600 mt-2">{smokeTest.description}</p>
                )}
                {smokeTest.project && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
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
                    {smokeTest.project.name}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRun}
                  disabled={running}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {running ? "⏳ Running..." : "▶ Run Test"}
                </button>
                <button
                  onClick={handleOptimize}
                  disabled={optimizing}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {optimizing ? "⚙️ Optimizing..." : "✨ Optimize with AI"}
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>

          {/* Metrics Cards */}
          {latestRun && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span
                      className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        latestRun.status
                      )}`}
                    >
                      {latestRun.status}
                    </span>
                  </div>
                  <svg
                    className={`w-12 h-12 ${
                      latestRun.status === "success"
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={
                        latestRun.status === "success"
                          ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          : "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      }
                    />
                  </svg>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {successRate}%
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {latestRun.successfulChecks}/{latestRun.totalEndpoints} passed
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatDuration(latestRun.avgResponseTime)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Average</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <p className="text-sm text-gray-600">Total Duration</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatDuration(latestRun.duration)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Complete test run</p>
              </div>
            </div>
          )}

          {/* Configured Endpoints */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Configured Endpoints ({smokeTest.endpoints.length})
            </h2>
            <div className="space-y-3">
              {smokeTest.endpoints.map((endpoint, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          endpoint.method === "GET"
                            ? "bg-blue-100 text-blue-800"
                            : endpoint.method === "POST"
                            ? "bg-green-100 text-green-800"
                            : endpoint.method === "PUT"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {endpoint.method}
                      </span>
                      <code className="text-sm text-gray-700">
                        {endpoint.url}
                      </code>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Expected: {endpoint.expectedStatus}</span>
                      <span>Timeout: {endpoint.timeout || 3000}ms</span>
                    </div>
                  </div>
                  {endpoint.description && (
                    <p className="text-sm text-gray-500 mt-2">
                      {endpoint.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Latest Run Results */}
          {latestRun && latestRun.results && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Latest Run Results
              </h2>
              <div className="space-y-3">
                {(latestRun.results as EndpointResult[]).map(
                  (result, index) => (
                    <div
                      key={index}
                      className={`border-l-4 ${
                        result.success ? "border-green-500" : "border-red-500"
                      } bg-gray-50 rounded-r-lg p-4`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {result.success ? (
                            <svg
                              className="w-6 h-6 text-green-500"
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
                          ) : (
                            <svg
                              className="w-6 h-6 text-red-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                          <code className="text-sm font-medium text-gray-900">
                            {result.url}
                          </code>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <span
                            className={`font-medium ${
                              result.success ? "text-green-700" : "text-red-700"
                            }`}
                          >
                            Status: {result.status}
                          </span>
                          <span className="text-gray-600">
                            {formatDuration(result.responseTime)}
                          </span>
                        </div>
                      </div>
                      {result.error && (
                        <p className="text-sm text-red-600 mt-2 ml-9">
                          {result.error}
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>

              {/* Performance Summary */}
              {latestRun.slowestEndpoint && latestRun.fastestEndpoint && (
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-900">
                      Slowest Endpoint
                    </p>
                    <code className="text-xs text-red-700 mt-1 block">
                      {latestRun.slowestEndpoint}
                    </code>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-900">
                      Fastest Endpoint
                    </p>
                    <code className="text-xs text-green-700 mt-1 block">
                      {latestRun.fastestEndpoint}
                    </code>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Run History */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Run History ({smokeTest.runs.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Success Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Response
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {smokeTest.runs.map((run) => (
                    <tr key={run.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            run.status
                          )}`}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(run.startedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(run.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Math.round(
                          (run.successfulChecks / run.totalEndpoints) * 100
                        )}
                        %
                        <span className="text-gray-500 ml-2">
                          ({run.successfulChecks}/{run.totalEndpoints})
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(run.avgResponseTime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-gray-50 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Configuration
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Max Retries:</span>
                <span className="ml-2 text-gray-900 font-medium">
                  {smokeTest.maxRetries}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Retry Delay:</span>
                <span className="ml-2 text-gray-900 font-medium">
                  {smokeTest.retryDelay}ms
                </span>
              </div>
              <div>
                <span className="text-gray-600">Created:</span>
                <span className="ml-2 text-gray-900 font-medium">
                  {new Date(smokeTest.createdAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Total Endpoints:</span>
                <span className="ml-2 text-gray-900 font-medium">
                  {smokeTest.endpoints.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
