"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/TranslationContext";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Calendar,
  Timer,
  Eye,
  Trash2,
  Globe,
  Code2,
  FlaskConical,
  Gauge,
  Shield,
} from "lucide-react";

interface UnifiedTest {
  id: string;
  name: string;
  type: "e2e" | "api" | "smoke" | "unit" | "performance" | "security";
  status: "passed" | "failed" | "pending" | "running" | "success" | "failure";
  createdAt: string;
  lastRun?: string;
  duration?: number;
  details?: string;
}

export default function UnifiedHistoryPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { t } = useTranslation();
  const [allTests, setAllTests] = useState<UnifiedTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "passed" | "failed">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetchAllTests();
  }, [token]);

  const fetchAllTests = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all test types in parallel
      const [e2eRes, apiRes, smokeRes, unitRes, perfRes, secRes] =
        await Promise.all([
          fetch(`${API_URL}/api/tests`, { headers }).catch(() => null),
          fetch(`${API_URL}/api/api-tests`, { headers }).catch(() => null),
          fetch(`${API_URL}/api/smoke-tests`, { headers }).catch(() => null),
          fetch(`${API_URL}/api/unit-tests`, { headers }).catch(() => null),
          fetch(`${API_URL}/api/performance-tests`, { headers }).catch(
            () => null
          ),
          fetch(`${API_URL}/api/security-tests`, { headers }).catch(() => null),
        ]);

      const e2eTests = e2eRes?.ok ? await e2eRes.json() : [];
      const apiTests = apiRes?.ok ? await apiRes.json() : [];
      const smokeTests = smokeRes?.ok ? await smokeRes.json() : [];
      const unitTests = unitRes?.ok ? await unitRes.json() : [];
      const perfTests = perfRes?.ok ? await perfRes.json() : [];
      const secTests = secRes?.ok ? await secRes.json() : [];

      // Normalize all tests to UnifiedTest format
      const unified: UnifiedTest[] = [
        ...e2eTests.map((t: any) => ({
          id: t.id,
          name: t.prompt || "E2E Test",
          type: "e2e" as const,
          status: t.results?.[0]?.status || "pending",
          createdAt: t.createdAt,
          lastRun: t.results?.[0]?.createdAt,
          duration: t.results?.[0]?.duration,
          details: t.url,
        })),
        ...apiTests.map((t: any) => ({
          id: t.id,
          name: t.name || "API Test",
          type: "api" as const,
          status: t.runs?.[0]?.status || "pending",
          createdAt: t.createdAt,
          lastRun: t.runs?.[0]?.createdAt,
          duration: t.runs?.[0]?.duration,
          details: `${t.method} ${t.url}`,
        })),
        ...smokeTests.map((t: any) => ({
          id: t.id,
          name: t.name || "Smoke Test",
          type: "smoke" as const,
          status: t.runs?.[0]?.status || "pending",
          createdAt: t.createdAt,
          lastRun: t.runs?.[0]?.createdAt,
          duration: t.runs?.[0]?.duration,
          details: t.baseUrl,
        })),
        ...unitTests.map((t: any) => ({
          id: t.id,
          name: t.name || "Unit Test",
          type: "unit" as const,
          status: t.runs?.[0]?.status || "pending",
          createdAt: t.createdAt,
          lastRun: t.runs?.[0]?.createdAt,
          duration: t.runs?.[0]?.duration,
          details: t.filePath,
        })),
        ...perfTests.map((t: any) => ({
          id: t.id,
          name: t.name || "Performance Test",
          type: "performance" as const,
          status: t.runs?.[0]?.status || "pending",
          createdAt: t.createdAt,
          lastRun: t.runs?.[0]?.createdAt,
          duration: t.runs?.[0]?.duration,
          details: t.url,
        })),
        ...secTests.map((t: any) => ({
          id: t.id,
          name: t.name || "Security Test",
          type: "security" as const,
          status: t.runs?.[0]?.status || "pending",
          createdAt: t.createdAt,
          lastRun: t.runs?.[0]?.createdAt,
          duration: t.runs?.[0]?.duration,
          details: t.targetUrl,
        })),
      ];

      // Sort by creation date (most recent first)
      unified.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setAllTests(unified);
    } catch (err) {
      console.error("Error fetching tests:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "e2e":
        return <Globe className="w-4 h-4" />;
      case "api":
        return <Code2 className="w-4 h-4" />;
      case "smoke":
        return <CheckCircle2 className="w-4 h-4" />;
      case "unit":
        return <FlaskConical className="w-4 h-4" />;
      case "performance":
        return <Gauge className="w-4 h-4" />;
      case "security":
        return <Shield className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      e2e: { label: "E2E", color: "bg-purple-100 text-purple-700" },
      api: { label: "API", color: "bg-blue-100 text-blue-700" },
      smoke: { label: "Smoke", color: "bg-green-100 text-green-700" },
      unit: { label: "Unit", color: "bg-orange-100 text-orange-700" },
      performance: {
        label: "Performance",
        color: "bg-amber-100 text-amber-700",
      },
      security: { label: "Security", color: "bg-red-100 text-red-700" },
    };
    return badges[type as keyof typeof badges] || badges.e2e;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
      case "success":
        return {
          label: "Passed",
          color: "text-green-700",
          bgColor: "bg-green-100",
          icon: <CheckCircle2 className="w-4 h-4" />,
        };
      case "failed":
      case "failure":
        return {
          label: "Failed",
          color: "text-red-700",
          bgColor: "bg-red-100",
          icon: <XCircle className="w-4 h-4" />,
        };
      case "running":
        return {
          label: "Running",
          color: "text-blue-700",
          bgColor: "bg-blue-100",
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
        };
      default:
        return {
          label: "Pending",
          color: "text-gray-700",
          bgColor: "bg-gray-100",
          icon: <Clock className="w-4 h-4" />,
        };
    }
  };

  const filteredTests = allTests.filter((test) => {
    if (filter !== "all" && test.status !== filter) return false;
    if (typeFilter !== "all" && test.type !== typeFilter) return false;
    return true;
  });

  const stats = {
    total: allTests.length,
    passed: allTests.filter(
      (t) => t.status === "passed" || t.status === "success"
    ).length,
    failed: allTests.filter(
      (t) => t.status === "failed" || t.status === "failure"
    ).length,
    pending: allTests.filter((t) => t.status === "pending").length,
  };

  const typeStats = {
    e2e: allTests.filter((t) => t.type === "e2e").length,
    api: allTests.filter((t) => t.type === "api").length,
    smoke: allTests.filter((t) => t.type === "smoke").length,
    unit: allTests.filter((t) => t.type === "unit").length,
    performance: allTests.filter((t) => t.type === "performance").length,
    security: allTests.filter((t) => t.type === "security").length,
  };

  const handleViewTest = (test: UnifiedTest) => {
    const routes = {
      e2e: `/tests/${test.id}`,
      api: `/api-tests/${test.id}`,
      smoke: `/smoke-tests/${test.id}`,
      unit: `/unit-tests/${test.id}`,
      performance: `/performance-tests/${test.id}`,
      security: `/security-tests/${test.id}`,
    };
    router.push(routes[test.type]);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t("history.title")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View all your tests across all types
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Tests
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Passed</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.passed}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pending
              </p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                {stats.pending}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <Clock className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Status:
          </span>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === "all"
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter("passed")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === "passed"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Passed ({stats.passed})
            </button>
            <button
              onClick={() => setFilter("failed")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === "failed"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Failed ({stats.failed})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Type:
          </span>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                typeFilter === "all"
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              All ({allTests.length})
            </button>
            <button
              onClick={() => setTypeFilter("e2e")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                typeFilter === "e2e"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              E2E ({typeStats.e2e})
            </button>
            <button
              onClick={() => setTypeFilter("api")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                typeFilter === "api"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              API ({typeStats.api})
            </button>
            <button
              onClick={() => setTypeFilter("smoke")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                typeFilter === "smoke"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Smoke ({typeStats.smoke})
            </button>
            <button
              onClick={() => setTypeFilter("unit")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                typeFilter === "unit"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Unit ({typeStats.unit})
            </button>
            <button
              onClick={() => setTypeFilter("performance")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                typeFilter === "performance"
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Performance ({typeStats.performance})
            </button>
            <button
              onClick={() => setTypeFilter("security")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                typeFilter === "security"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Security ({typeStats.security})
            </button>
          </div>
        </div>
      </div>

      {/* Tests List */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading tests...</p>
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No tests found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {filter === "all" && typeFilter === "all"
              ? "You haven't created any tests yet."
              : "No tests match your filters."}
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Create Your First Test
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTests.map((test) => {
            const badge = getStatusBadge(test.status);
            const typeBadge = getTypeBadge(test.type);

            return (
              <div
                key={test.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${typeBadge.color}`}
                      >
                        {getTypeIcon(test.type)}
                        {typeBadge.label}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {test.name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${badge.bgColor} ${badge.color}`}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {test.details}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Created:{" "}
                          {new Date(test.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {test.lastRun && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            Last run:{" "}
                            {new Date(test.lastRun).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {test.duration && (
                        <div className="flex items-center gap-1">
                          <Timer className="w-4 h-4" />
                          <span>{test.duration}ms</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleViewTest(test)}
                      className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">View</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
