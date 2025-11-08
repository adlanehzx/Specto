"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Play,
  Trash2,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

interface PerformanceTest {
  id: string;
  name: string;
  url: string;
  projectId?: string;
  config: {
    vus: number;
    duration: string;
    thresholds?: any;
  };
  createdAt: string;
  latestRun?: {
    id: string;
    status: string;
    startedAt: string;
    completedAt?: string;
    metrics?: {
      http_req_duration: { avg: number; p95: number; p99: number };
      http_reqs: { rate: number };
      http_req_failed: { rate: number };
      vus: { max: number };
    };
  };
  project?: {
    id: string;
    name: string;
  };
}

export default function PerformanceTestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tests, setTests] = useState<PerformanceTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>(
    []
  );

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchTests();
    fetchProjects();
  }, [user, selectedProject]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedProject && selectedProject !== "all") {
        params.append("projectId", selectedProject);
      }
      const response = await api.get<{ data: PerformanceTest[] }>(
        `/api/performance-tests?${params.toString()}`
      );
      setTests(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch performance tests");
      console.error("Error fetching performance tests:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get<{
        data: Array<{ id: string; name: string }>;
      }>("/api/projects");
      setProjects(response.data);
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this performance test?"))
      return;

    try {
      await api.delete(`/api/performance-tests/${id}`);
      setTests(tests.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete test");
    }
  };

  const handleRun = async (id: string) => {
    try {
      await api.post(`/api/performance-tests/${id}/run`);
      alert("Performance test started! Refresh to see results.");
      fetchTests();
    } catch (err: any) {
      alert(err.message || "Failed to start test");
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status)
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
          Not run
        </span>
      );

    const styles = {
      success: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
      running: "bg-blue-100 text-blue-700",
    };

    return (
      <span
        className={`px-2 py-1 text-xs rounded-full ${
          styles[status as keyof typeof styles] || "bg-gray-100 text-gray-600"
        }`}
      >
        {status === "success"
          ? "✓ Passed"
          : status === "failed"
          ? "✗ Failed"
          : status === "running"
          ? "⟳ Running"
          : status}
      </span>
    );
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
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading performance tests...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                Performance Tests
              </h1>
              <p className="text-gray-600 mt-2">
                Load testing with k6 - Measure response times and throughput
              </p>
            </div>
            <Link
              href="/performance-tests/new"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              New Performance Test
            </Link>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">
                Performance Testing with k6
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Create load tests to measure your application's performance
                under various conditions. Monitor response times, throughput,
                and error rates.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Filter by Project:
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Tests List */}
          {tests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No performance tests yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first performance test to measure your app's speed
                and reliability.
              </p>
              <Link
                href="/performance-tests/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Performance Test
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Config
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Run
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metrics
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tests.map((test) => (
                    <tr
                      key={test.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        router.push(`/performance-tests/${test.id}`)
                      }
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-purple-600" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {test.name}
                            </div>
                            {test.project && (
                              <div className="text-sm text-gray-500">
                                {test.project.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 truncate max-w-xs">
                          {test.url}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <div>{test.config.vus} VUs</div>
                          <div className="text-xs text-gray-500">
                            {test.config.duration}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {test.latestRun ? (
                          <div>
                            {getStatusBadge(test.latestRun.status)}
                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(
                                test.latestRun.startedAt
                              ).toLocaleString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Never run
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {test.latestRun?.metrics ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              P95:{" "}
                              {formatDuration(
                                test.latestRun.metrics.http_req_duration?.p95
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {test.latestRun.metrics.http_reqs?.rate?.toFixed(
                                1
                              )}{" "}
                              req/s
                            </div>
                            {test.latestRun.metrics.http_req_failed && (
                              <div className="text-xs text-red-600">
                                {(
                                  test.latestRun.metrics.http_req_failed.rate *
                                  100
                                ).toFixed(1)}
                                % errors
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No data</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleRun(test.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Run test"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(test.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete test"
                          >
                            <Trash2 className="w-4 h-4" />
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
