"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/TranslationContext";
import {
  Plus,
  Globe,
  Loader2,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface E2ETest {
  id: string;
  url: string;
  prompt: string;
  status: string;
  createdAt: string;
  project?: {
    id: string;
    name: string;
  };
  results?: Array<{
    status: string;
    duration: number;
  }>;
}

export default function E2ETestsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { t } = useTranslation();

  const [tests, setTests] = useState<E2ETest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "success" | "failed" | "pending"
  >("all");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetchTests();
  }, [token]);

  const fetchTests = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/tests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTests(data.tests || []);
      }
    } catch (err) {
      console.error("Failed to fetch E2E tests:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
      case "passed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "failed":
      case "failure":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "running":
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const classes =
      {
        success: "bg-green-100 text-green-800",
        passed: "bg-green-100 text-green-800",
        failed: "bg-red-100 text-red-800",
        failure: "bg-red-100 text-red-800",
        running: "bg-blue-100 text-blue-800",
        pending: "bg-gray-100 text-gray-800",
      }[status] || "bg-gray-100 text-gray-800";

    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${classes}`}
      >
        {status}
      </span>
    );
  };

  const filteredTests = tests.filter((test) => {
    if (filter === "all") return true;
    if (filter === "success")
      return test.status === "success" || test.status === "passed";
    if (filter === "failed")
      return test.status === "failed" || test.status === "failure";
    if (filter === "pending") return test.status === "pending";
    return true;
  });

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Loading E2E tests...
              </p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                  <Globe className="w-8 h-8 text-purple-600" />
                  E2E Tests
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Browser automation and end-to-end testing
                </p>
              </div>
              <button
                onClick={() => router.push("/tests/new")}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm"
              >
                <Plus className="w-5 h-5" />
                New E2E Test
              </button>
            </div>

            {/* Filters */}
            <div className="mb-6 flex items-center gap-3">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "all"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({tests.length})
              </button>
              <button
                onClick={() => setFilter("success")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Passed (
                {
                  tests.filter(
                    (t) => t.status === "success" || t.status === "passed"
                  ).length
                }
                )
              </button>
              <button
                onClick={() => setFilter("failed")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "failed"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Failed (
                {
                  tests.filter(
                    (t) => t.status === "failed" || t.status === "failure"
                  ).length
                }
                )
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "pending"
                    ? "bg-gray-100 text-gray-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Pending ({tests.filter((t) => t.status === "pending").length})
              </button>
            </div>

            {/* Tests Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {filteredTests.length === 0 ? (
                <div className="text-center py-12">
                  <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No E2E tests yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Create your first end-to-end test to get started
                  </p>
                  <button
                    onClick={() => router.push("/tests/new")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Create E2E Test
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          URL
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Prompt
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Project
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredTests.map((test) => (
                        <tr
                          key={test.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => router.push(`/tests/${test.id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(test.status)}
                              {getStatusBadge(test.status)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-md">
                              {test.url}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                              {test.prompt}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {test.project ? (
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {test.project.name}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {new Date(test.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/tests/${test.id}`);
                              }}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Stats */}
            {tests.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Success Rate
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {tests.length > 0
                          ? Math.round(
                              (tests.filter(
                                (t) =>
                                  t.status === "success" ||
                                  t.status === "passed"
                              ).length /
                                tests.length) *
                                100
                            )
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total Tests
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {tests.length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Avg Duration
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {tests.length > 0 &&
                        tests[0].results &&
                        tests[0].results.length > 0
                          ? `${(tests[0].results[0].duration / 1000).toFixed(
                              1
                            )}s`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
