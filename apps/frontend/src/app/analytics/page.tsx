"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/TranslationContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Loader2,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalTests: number;
    testsRun: number;
    successRate: number;
    avgDuration: number;
  };
  statusBreakdown: {
    success: number;
    failure: number;
    error: number;
    pending: number;
  };
  timeline: Array<{ date: string; count: number }>;
  recentTests: Array<{
    id: string;
    url: string;
    prompt: string;
    status: string;
    duration: number | null;
    createdAt: string;
  }>;
}

interface PerformanceData {
  date: string;
  avgDuration: number;
}

const COLORS = {
  success: "#10b981", // green-500
  failure: "#ef4444", // red-500
  error: "#f59e0b", // amber-500
  pending: "#6b7280", // gray-500
  passed: "#10b981", // green-500 (alias for success)
  failed: "#ef4444", // red-500
};

export default function AnalyticsPage() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [performance, setPerformance] = useState<PerformanceData[]>([]);
  const [flakyTests, setFlakyTests] = useState<any[]>([]);
  const [coverage, setCoverage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetchAnalytics();
    fetchPerformance();
    fetchFlakyTests();
    fetchCoverage();
  }, [token]);

  const fetchAnalytics = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/analytics/performance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPerformance(data.performance);
      }
    } catch (err) {
      console.error("Failed to fetch performance data:", err);
    }
  };

  const fetchFlakyTests = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/tests/flaky/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFlakyTests(data.flakyTests || []);
      }
    } catch (err) {
      console.error("Failed to fetch flaky tests:", err);
    }
  };

  const fetchCoverage = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/tests/coverage`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCoverage(data.coverage || []);
      }
    } catch (err) {
      console.error("Failed to fetch coverage data:", err);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {t("analytics.loadingAnalytics")}
              </p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error || !analytics) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {error || t("analytics.noDataAvailable")}
              </p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Prepare pie chart data
  const pieData = [
    { name: "Success", value: analytics.statusBreakdown.success },
    { name: "Failure", value: analytics.statusBreakdown.failure },
    { name: "Error", value: analytics.statusBreakdown.error },
    { name: "Pending", value: analytics.statusBreakdown.pending },
  ].filter((item) => item.value > 0);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Title */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Activity className="w-8 h-8 text-indigo-600" />
                {t("navigation.analytics")}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {t("analytics.subtitle")}
              </p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Tests */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {t("analytics.totalTests")}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {analytics.overview.totalTests}
                    </p>
                  </div>
                  <div className="bg-indigo-100 dark:bg-indigo-900/50 rounded-full p-3">
                    <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
              </div>

              {/* Success Rate */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {t("analytics.successRate")}
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {analytics.overview.successRate}%
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/50 rounded-full p-3">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>

              {/* Tests Run */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {t("analytics.testsRun")}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {analytics.overview.testsRun}
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/50 rounded-full p-3">
                    <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              {/* Avg Duration */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {t("analytics.avgDuration")}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {(analytics.overview.avgDuration / 1000).toFixed(1)}s
                    </p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/50 rounded-full p-3">
                    <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Timeline Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t("analytics.testsTimeline")}
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => {
                        const date = new Date(value as string);
                        return date.toLocaleDateString();
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name={t("analytics.testsCreated")}
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ fill: "#6366f1", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Status Breakdown Pie Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t("analytics.statusBreakdown")}
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            COLORS[
                              entry.name.toLowerCase() as keyof typeof COLORS
                            ]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Chart */}
            {performance.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t("analytics.avgTestDuration")}
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis
                      label={{
                        value: "Duration (ms)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      labelFormatter={(value) => {
                        const date = new Date(value as string);
                        return date.toLocaleDateString();
                      }}
                      formatter={(value: number) => [
                        `${value}ms`,
                        "Avg Duration",
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="avgDuration"
                      name="Average Duration"
                      fill="#8b5cf6"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Charts Row 2 - Flaky Tests & Coverage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Flaky Tests Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-orange-500" />
                  Flaky Tests
                </h2>
                {flakyTests.length > 0 ? (
                  <div className="space-y-3">
                    {flakyTests.slice(0, 5).map((test, index) => (
                      <div
                        key={index}
                        className="p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {test.name || test.url || "Unnamed Test"}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Fail Rate: {test.failRate || 0}% | Last Failed:{" "}
                              {test.lastFailure
                                ? new Date(
                                    test.lastFailure
                                  ).toLocaleDateString()
                                : "N/A"}
                            </p>
                          </div>
                          <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">
                            Flaky
                          </span>
                        </div>
                        {test.recommendation && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            💡 {test.recommendation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No flaky tests detected. Great job! 🎉
                  </p>
                )}
              </div>

              {/* Coverage Graph */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Test Coverage
                </h2>
                {coverage.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={coverage}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        labelFormatter={(value) => {
                          const date = new Date(value as string);
                          return date.toLocaleDateString();
                        }}
                        formatter={(value: number) => [`${value}%`, "Coverage"]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="coverage"
                        name="Coverage %"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No coverage data available yet.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Tests Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t("analytics.recentTests")}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("analytics.url")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("analytics.prompt")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("analytics.status")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("analytics.duration")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("analytics.created")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {analytics.recentTests.map((test) => (
                      <tr key={test.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="max-w-xs truncate">{test.url}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          <div className="max-w-xs truncate">{test.prompt}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              test.status === "success" ||
                              test.status === "passed"
                                ? "bg-green-100 text-green-800"
                                : test.status === "failure" ||
                                  test.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : test.status === "error"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {test.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {test.duration
                            ? `${(test.duration / 1000).toFixed(2)}s`
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {new Date(test.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
