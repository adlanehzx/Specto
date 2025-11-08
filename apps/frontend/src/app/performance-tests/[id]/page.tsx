"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  Play,
  Clock,
  Users,
  Zap,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

interface PerformanceTest {
  id: string;
  name: string;
  url: string;
  config: {
    vus: number;
    duration: string;
    rampUpTime?: string;
    thresholds?: any;
  };
  script?: string;
  createdAt: string;
  project?: {
    id: string;
    name: string;
  };
}

interface PerformanceTestRun {
  id: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  metrics?: {
    http_req_duration: {
      avg: number;
      min: number;
      max: number;
      p95: number;
      p99: number;
    };
    http_reqs: { count: number; rate: number };
    http_req_failed: { rate: number };
    vus: { max: number; value: number };
    data_received: { count: number };
    data_sent: { count: number };
  };
  error?: string;
}

export default function PerformanceTestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const testId = params.id as string;

  const [test, setTest] = useState<PerformanceTest | null>(null);
  const [runs, setRuns] = useState<PerformanceTestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "script" | "history">(
    "overview"
  );
  const [running, setRunning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchTest();
    fetchRuns();
  }, [user, testId]);

  const fetchTest = async () => {
    try {
      const response = await api.get<{ data: PerformanceTest }>(
        `/api/performance-tests/${testId}`
      );
      setTest(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch test");
    } finally {
      setLoading(false);
    }
  };

  const fetchRuns = async () => {
    try {
      const response = await api.get<{ data: PerformanceTestRun[] }>(
        `/api/performance-tests/${testId}/runs`
      );
      setRuns(response.data);
    } catch (err) {
      console.error("Error fetching runs:", err);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    try {
      await api.post(`/api/performance-tests/${testId}/run`);
      alert("Performance test started! Results will appear shortly.");
      setTimeout(() => {
        fetchRuns();
        setRunning(false);
      }, 2000);
    } catch (err: any) {
      alert(err.message || "Failed to start test");
      setRunning(false);
    }
  };

  const handleAnalyze = async () => {
    if (
      !confirm(
        "Do you want to analyze this performance test with AI? This will provide insights on bottlenecks and optimization recommendations."
      )
    )
      return;

    try {
      setAnalyzing(true);
      const response = await api.post(
        `/api/performance-tests/${testId}/analyze`
      );
      alert(
        "Performance test analysis started! Insights will be available soon."
      );
      await fetchRuns();
    } catch (err: any) {
      alert(err.message || "Failed to analyze test");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this performance test?"))
      return;

    try {
      await api.delete(`/api/performance-tests/${testId}`);
      router.push("/performance-tests");
    } catch (err: any) {
      alert(err.message || "Failed to delete test");
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const latestRun = runs[0];
  const successRate = latestRun?.metrics?.http_req_failed
    ? ((1 - latestRun.metrics.http_req_failed.rate) * 100).toFixed(1)
    : "N/A";

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading performance test...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error || !test) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error || "Test not found"}
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
          <div>
            <Link
              href="/performance-tests"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Performance Tests
            </Link>

            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                  {test.name}
                </h1>
                <p className="text-gray-600 mt-2">{test.url}</p>
                {test.project && (
                  <p className="text-sm text-gray-500 mt-1">
                    Project: {test.project.name}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRun}
                  disabled={running}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  {running ? "Running..." : "Run Test"}
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  <TrendingUp className="w-4 h-4" />
                  {analyzing ? "⚙️ Analyzing..." : "📊 Analyze Results"}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {latestRun && latestRun.metrics && (
            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-medium text-gray-600">
                    Avg Response
                  </h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(latestRun.metrics.http_req_duration.avg)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  P95: {formatDuration(latestRun.metrics.http_req_duration.p95)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-medium text-gray-600">
                    Throughput
                  </h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {latestRun.metrics.http_reqs.rate.toFixed(1)} req/s
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Total: {latestRun.metrics.http_reqs.count} requests
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-medium text-gray-600">
                    Virtual Users
                  </h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {latestRun.metrics.vus.max} VUs
                </p>
                <p className="text-sm text-gray-500 mt-1">Max concurrent</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <h3 className="text-sm font-medium text-gray-600">
                    Success Rate
                  </h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {successRate}%
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {(latestRun.metrics.http_req_failed.rate * 100).toFixed(1)}%
                  errors
                </p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "overview"
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("script")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "script"
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  k6 Script
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "history"
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Run History ({runs.length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "overview" && latestRun && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Latest Run Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Status</p>
                        <p className="font-medium text-gray-900">
                          {latestRun.status}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Duration</p>
                        <p className="font-medium text-gray-900">
                          {formatDuration(latestRun.duration)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">
                          Data Received
                        </p>
                        <p className="font-medium text-gray-900">
                          {formatBytes(latestRun.metrics?.data_received?.count)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Data Sent</p>
                        <p className="font-medium text-gray-900">
                          {formatBytes(latestRun.metrics?.data_sent?.count)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Configuration
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Virtual Users:</span>
                        <span className="font-medium text-gray-900">
                          {test.config.vus}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium text-gray-900">
                          {test.config.duration}
                        </span>
                      </div>
                      {test.config.rampUpTime && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ramp-Up Time:</span>
                          <span className="font-medium text-gray-900">
                            {test.config.rampUpTime}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "script" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    k6 Script
                  </h3>
                  <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                    <code>{test.script || "// No script available"}</code>
                  </pre>
                </div>
              )}

              {activeTab === "history" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Run History
                  </h3>
                  {runs.length === 0 ? (
                    <p className="text-gray-500">No runs yet</p>
                  ) : (
                    <div className="space-y-4">
                      {runs.map((run) => (
                        <div
                          key={run.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <span
                                className={`inline-block px-2 py-1 text-xs rounded-full ${
                                  run.status === "success"
                                    ? "bg-green-100 text-green-700"
                                    : run.status === "failed"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {run.status}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(run.startedAt).toLocaleString()}
                            </span>
                          </div>

                          {run.metrics && (
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Avg Response</p>
                                <p className="font-medium">
                                  {formatDuration(
                                    run.metrics.http_req_duration.avg
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Throughput</p>
                                <p className="font-medium">
                                  {run.metrics.http_reqs.rate.toFixed(1)} req/s
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Total Requests</p>
                                <p className="font-medium">
                                  {run.metrics.http_reqs.count}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Error Rate</p>
                                <p className="font-medium">
                                  {(
                                    run.metrics.http_req_failed.rate * 100
                                  ).toFixed(1)}
                                  %
                                </p>
                              </div>
                            </div>
                          )}

                          {run.error && (
                            <div className="mt-3 bg-red-50 border border-red-200 rounded p-3">
                              <p className="text-sm text-red-700">
                                {run.error}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
