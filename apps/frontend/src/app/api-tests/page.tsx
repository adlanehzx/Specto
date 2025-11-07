"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";

interface ApiTest {
  id: string;
  name: string;
  description?: string;
  method: string;
  url: string;
  latestRun?: {
    status: string;
    responseStatus?: number;
    responseTime?: number;
    createdAt: string;
  };
  successRate: number;
  runsCount: number;
  createdAt: string;
}

function ApiTestsPageContent() {
  const router = useRouter();
  const [apiTests, setApiTests] = useState<ApiTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "passing" | "failing">("all");

  useEffect(() => {
    fetchApiTests();
  }, []);

  const fetchApiTests = async () => {
    try {
      const response = await fetch("/api/api-tests", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApiTests(data);
      }
    } catch (error) {
      console.error("Error fetching API tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = apiTests.filter((test) => {
    if (filter === "passing") return test.successRate >= 80;
    if (filter === "failing") return test.successRate < 80;
    return true;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failure":
        return "bg-red-100 text-red-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-100 text-blue-800";
      case "POST":
        return "bg-green-100 text-green-800";
      case "PUT":
        return "bg-yellow-100 text-yellow-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "PATCH":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Tests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Test and monitor your APIs automatically
          </p>
        </div>
        <Link
          href="/api-tests/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New API Test
        </Link>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All ({apiTests.length})
        </button>
        <button
          onClick={() => setFilter("passing")}
          className={`px-4 py-2 rounded-lg ${
            filter === "passing"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Passing ({apiTests.filter((t) => t.successRate >= 80).length})
        </button>
        <button
          onClick={() => setFilter("failing")}
          className={`px-4 py-2 rounded-lg ${
            filter === "failing"
              ? "bg-red-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Failing ({apiTests.filter((t) => t.successRate < 80).length})
        </button>
      </div>

      {/* Tests List */}
      {filteredTests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
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
            No API tests
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new API test.
          </p>
          <div className="mt-6">
            <Link
              href="/api-tests/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              + New API Test
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Endpoint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTests.map((test) => (
                <tr
                  key={test.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/api-tests/${test.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {test.name}
                    </div>
                    {test.description && (
                      <div className="text-sm text-gray-500">
                        {test.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getMethodColor(
                        test.method
                      )}`}
                    >
                      {test.method}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 truncate max-w-xs">
                      {test.url}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {test.latestRun ? (
                      <div>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            test.latestRun.status
                          )}`}
                        >
                          {test.latestRun.status}
                        </span>
                        {test.latestRun.responseTime && (
                          <div className="text-xs text-gray-500 mt-1">
                            {test.latestRun.responseTime}ms
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Never run</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {test.successRate}%
                      </div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            test.successRate >= 80
                              ? "bg-green-600"
                              : test.successRate >= 50
                              ? "bg-yellow-600"
                              : "bg-red-600"
                          }`}
                          style={{ width: `${test.successRate}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {test.runsCount} runs
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Run test
                        fetch(`/api/api-tests/${test.id}/run`, {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${localStorage.getItem(
                              "token"
                            )}`,
                          },
                        }).then(() => fetchApiTests());
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Run
                    </button>
                    <Link
                      href={`/api-tests/${test.id}`}
                      className="text-gray-600 hover:text-gray-900"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ApiTestsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ApiTestsPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
