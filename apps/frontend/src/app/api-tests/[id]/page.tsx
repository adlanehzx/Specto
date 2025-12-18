"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";

function ApiTestDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "runs" | "config">(
    "overview"
  );

  useEffect(() => {
    if (params.id && token) {
      fetchTest();
    }
  }, [params.id, token]);

  const fetchTest = async () => {
    if (!token) return;

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${API_URL}/api/api-tests/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTest(data);
      } else {
        console.error("Test not found:", response.status);
        setTest(null);
      }
    } catch (error) {
      console.error("Error fetching test:", error);
      setTest(null);
    } finally {
      setLoading(false);
    }
  };

  const runTest = async () => {
    if (!token) return;

    setRunning(true);
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      await fetch(`${API_URL}/api/api-tests/${params.id}/run`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchTest();
    } catch (error) {
      console.error("Error running test:", error);
    } finally {
      setRunning(false);
    }
  };

  const deleteTest = async () => {
    if (!confirm("Are you sure you want to delete this test?")) return;
    if (!token) return;

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      await fetch(`${API_URL}/api/api-tests/${params.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      router.push("/api-tests");
    } catch (error) {
      console.error("Error deleting test:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!test) {
    return <div className="text-center py-12">Test not found</div>;
  }

  const successCount =
    test.runs?.filter((r: any) => r.status === "success").length || 0;
  const totalRuns = test.runs?.length || 0;
  const successRate =
    totalRuns > 0 ? Math.round((successCount / totalRuns) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/api-tests" className="text-blue-600 hover:text-blue-700">
          ← Back to API Tests
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{test.name}</h1>
            {test.description && (
              <p className="mt-2 text-gray-600">{test.description}</p>
            )}
            <div className="mt-4 flex items-center space-x-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {test.method}
              </span>
              <span className="text-sm text-gray-500">{test.url}</span>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={runTest}
              disabled={running}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {running ? "Running..." : "▶ Run Test"}
            </button>
            <button
              onClick={deleteTest}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Total Runs</div>
            <div className="text-2xl font-bold text-gray-900">{totalRuns}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Success Rate</div>
            <div className="text-2xl font-bold text-green-600">
              {successRate}%
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Avg Response Time</div>
            <div className="text-2xl font-bold text-blue-600">
              {test.runs?.[0]?.responseTime || "-"}
              {test.runs?.[0]?.responseTime && "ms"}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Last Run</div>
            <div className="text-sm font-medium text-gray-900">
              {test.runs?.[0]
                ? new Date(test.runs[0].createdAt).toLocaleString()
                : "Never"}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {["overview", "runs", "config"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Latest Run */}
          {test.runs?.[0] && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Latest Run</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Status: </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      test.runs[0].status === "success"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {test.runs[0].status}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">
                    Response Status:{" "}
                  </span>
                  <span className="font-mono">
                    {test.runs[0].responseStatus}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Response Time: </span>
                  <span className="font-mono">
                    {test.runs[0].responseTime}ms
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-2">
                    Response Body:
                  </div>
                  <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-xs">
                    {JSON.stringify(test.runs[0].responseBody, null, 2)}
                  </pre>
                </div>

                {/* Assertions */}
                {test.runs[0].assertions?.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-500 mb-2">
                      Assertions:
                    </div>
                    <div className="space-y-2">
                      {test.runs[0].assertions.map((assertion: any) => (
                        <div
                          key={assertion.id}
                          className={`flex items-center p-3 rounded-lg ${
                            assertion.passed ? "bg-green-50" : "bg-red-50"
                          }`}
                        >
                          <span className="text-lg mr-2">
                            {assertion.passed ? "✅" : "❌"}
                          </span>
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {assertion.type}
                              {assertion.field && ` (${assertion.field})`}
                            </div>
                            {!assertion.passed && assertion.errorMessage && (
                              <div className="text-xs text-red-600 mt-1">
                                {assertion.errorMessage}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Flakiness Report */}
          {test.flakinessReport && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Reliability Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Reliability Score</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.round(test.flakinessReport.reliabilityScore)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Flaky?</div>
                  <div
                    className={`text-3xl font-bold ${
                      test.flakinessReport.isFlaky
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {test.flakinessReport.isFlaky ? "Yes" : "No"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "runs" && (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Response Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Response Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Assertions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {test.runs?.map((run: any) => (
                <tr key={run.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(run.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        run.status === "success"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {run.responseStatus || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {run.responseTime ? `${run.responseTime}ms` : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {run.assertions
                      ? `${
                          run.assertions.filter((a: any) => a.passed).length
                        }/${run.assertions.length} passed`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "config" && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Test Configuration</h3>
          <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-sm">
            {JSON.stringify(
              {
                method: test.method,
                url: test.url,
                headers: test.headers,
                body: test.body,
                queryParams: test.queryParams,
                authType: test.authType,
                expectedStatus: test.expectedStatus,
                assertions: test.assertions,
                timeout: test.timeout,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function ApiTestDetailPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ApiTestDetailPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
