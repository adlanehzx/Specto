"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/TranslationContext";
import {
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Loader2,
  Globe,
  Code2,
  FlaskConical,
  Gauge,
  Shield,
  Lightbulb,
  Plus,
  ArrowRight,
} from "lucide-react";

interface DashboardStats {
  totalTests: number;
  testsRun: number;
  successRate: number;
  avgDuration: number;
  byType: {
    e2e: number;
    api: number;
    smoke: number;
    unit: number;
    performance: number;
    security: number;
  };
}

interface RecentTest {
  id: string;
  type: string;
  name: string;
  url?: string;
  status: string;
  createdAt: string;
}

interface RecommendedTest {
  title: string;
  description: string;
  rationale: string;
  testType: string;
  priority: "high" | "medium" | "low";
  url?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { t } = useTranslation();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTests, setRecentTests] = useState<RecentTest[]>([]);
  const [recommendedTests, setRecommendedTests] = useState<RecommendedTest[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    if (!token) return;

    try {
      const [statsRes, recentRes, recommendedRes] = await Promise.all([
        fetch(`${API_URL}/api/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/tests?limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/tests/recommended`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.analytics?.overview || null);
      }

      if (recentRes.ok) {
        const data = await recentRes.json();
        setRecentTests(data.tests || []);
      }

      if (recommendedRes.ok) {
        const data = await recommendedRes.json();
        setRecommendedTests(data.recommendations || []);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "E2E Test",
      description: "Browser automation tests",
      icon: <Globe className="w-6 h-6" />,
      color: "purple",
      href: "/tests/new",
    },
    {
      title: "API Test",
      description: "REST API endpoint tests",
      icon: <Code2 className="w-6 h-6" />,
      color: "blue",
      href: "/api-tests/new",
    },
    {
      title: "Smoke Test",
      description: "Quick health checks",
      icon: <CheckCircle className="w-6 h-6" />,
      color: "green",
      href: "/smoke-tests/new",
    },
    {
      title: "Unit Test",
      description: "Function-level tests",
      icon: <FlaskConical className="w-6 h-6" />,
      color: "orange",
      href: "/unit-tests/new",
    },
    {
      title: "Performance Test",
      description: "Load & stress testing",
      icon: <Gauge className="w-6 h-6" />,
      color: "pink",
      href: "/performance-tests/new",
    },
    {
      title: "Security Test",
      description: "OWASP vulnerability scans",
      icon: <Shield className="w-6 h-6" />,
      color: "red",
      href: "/security-tests/new",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, any> = {
      purple: {
        bg: "bg-purple-50 dark:bg-purple-900/20",
        text: "text-purple-600 dark:text-purple-400",
        border: "border-purple-200 dark:border-purple-800",
        hover: "hover:bg-purple-100 dark:hover:bg-purple-900/30",
      },
      blue: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-800",
        hover: "hover:bg-blue-100 dark:hover:bg-blue-900/30",
      },
      green: {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-600 dark:text-green-400",
        border: "border-green-200 dark:border-green-800",
        hover: "hover:bg-green-100 dark:hover:bg-green-900/30",
      },
      orange: {
        bg: "bg-orange-50 dark:bg-orange-900/20",
        text: "text-orange-600 dark:text-orange-400",
        border: "border-orange-200 dark:border-orange-800",
        hover: "hover:bg-orange-100 dark:hover:bg-orange-900/30",
      },
      pink: {
        bg: "bg-pink-50 dark:bg-pink-900/20",
        text: "text-pink-600 dark:text-pink-400",
        border: "border-pink-200 dark:border-pink-800",
        hover: "hover:bg-pink-100 dark:hover:bg-pink-900/30",
      },
      red: {
        bg: "bg-red-50 dark:bg-red-900/20",
        text: "text-red-600 dark:text-red-400",
        border: "border-red-200 dark:border-red-800",
        hover: "hover:bg-red-100 dark:hover:bg-red-900/30",
      },
    };
    return colors[color] || colors.purple;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Loading dashboard...
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
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to LeynAI 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Your AI-powered testing platform
              </p>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Total Tests
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.totalTests}
                      </p>
                    </div>
                    <div className="bg-purple-100 dark:bg-purple-900/50 rounded-full p-3">
                      <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Success Rate
                      </p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {stats.successRate}%
                      </p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/50 rounded-full p-3">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Tests Run
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.testsRun}
                      </p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900/50 rounded-full p-3">
                      <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Avg Duration
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {(stats.avgDuration / 1000).toFixed(1)}s
                      </p>
                    </div>
                    <div className="bg-orange-100 dark:bg-orange-900/50 rounded-full p-3">
                      <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Recommended Tests */}
            {recommendedTests.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    AI Recommended Tests
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recommendedTests.slice(0, 3).map((rec, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-100 dark:border-purple-800"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {rec.title || "Recommended Test"}
                        </h4>
                        {rec.priority && (
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              rec.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : rec.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {rec.priority}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {rec.rationale || rec.description}
                      </p>
                      <button
                        onClick={() =>
                          router.push(`/${rec.testType}-tests/new`)
                        }
                        className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                      >
                        Create Test
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New Test
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map((action) => {
                  const colors = getColorClasses(action.color);
                  return (
                    <button
                      key={action.href}
                      onClick={() => router.push(action.href)}
                      className={`${colors.bg} ${colors.border} border rounded-lg p-6 text-left transition-all ${colors.hover}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`${colors.text}`}>{action.icon}</div>
                        <div className="flex-1">
                          <h3 className={`font-semibold mb-1 ${colors.text}`}>
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Tests */}
            {recentTests.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Tests
                  </h2>
                  <button
                    onClick={() => router.push("/history")}
                    className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {recentTests.slice(0, 10).map((test) => (
                        <tr
                          key={test.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => router.push(`/tests/${test.id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">
                              {test.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white truncate max-w-md">
                              {test.name || test.url}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                test.status === "success" ||
                                test.status === "passed"
                                  ? "bg-green-100 text-green-800"
                                  : test.status === "failure" ||
                                    test.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : test.status === "running"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {test.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {new Date(test.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
