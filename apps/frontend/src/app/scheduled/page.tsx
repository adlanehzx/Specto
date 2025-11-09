"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/contexts/TranslationContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Calendar,
  Clock,
  Repeat,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  History,
  PlusCircle,
} from "lucide-react";
import ScheduleTestModal, {
  ScheduleData,
} from "@/components/ScheduleTestModal";

interface ScheduledTest {
  id: string;
  url: string;
  prompt: string;
  isScheduled: boolean;
  frequency: string | null;
  nextRunAt: string | null;
  lastRunAt: string | null;
  isActive: boolean;
  createdAt: string;
  results: Array<{
    id: string;
    status: string;
    createdAt: string;
  }>;
}

interface Stats {
  total: number;
  active: number;
  paused: number;
  byFrequency: Record<string, number>;
}

export default function ScheduledTestsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [tests, setTests] = useState<ScheduledTest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<ScheduledTest | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [upcomingTests, setUpcomingTests] = useState<any[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    fetchData();
    fetchUpcomingTests();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const [testsRes, statsRes] = await Promise.all([
        fetch("http://localhost:4000/api/schedule/tests", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:4000/api/schedule/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!testsRes.ok || !statsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const testsData = await testsRes.json();
      const statsData = await statsRes.json();

      setTests(testsData.tests);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingTests = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        "http://localhost:4000/api/schedule/batch/upcoming",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUpcomingTests(data.upcoming || []);
      }
    } catch (err) {
      console.error("Failed to fetch upcoming tests:", err);
    }
  };

  const handleBatchSchedule = async () => {
    if (selectedIds.size === 0) {
      alert("Please select tests to schedule");
      return;
    }

    const frequency = prompt(
      "Enter frequency (daily, weekly, hourly):",
      "daily"
    );
    if (!frequency) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        "http://localhost:4000/api/schedule/batch/schedule",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            testIds: Array.from(selectedIds),
            frequency,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to batch schedule tests");
      }

      alert("Tests scheduled successfully!");
      setSelectedIds(new Set());
      fetchData();
      fetchUpcomingTests();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to schedule tests");
    }
  };

  const toggleSelection = (testId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(testId)) {
      newSelected.delete(testId);
    } else {
      newSelected.add(testId);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === tests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tests.map((t) => t.id)));
    }
  };

  const handleToggle = async (testId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `http://localhost:4000/api/schedule/test/${testId}/toggle`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive: !isActive }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to toggle test");
      }

      fetchData(); // Refresh data
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to toggle test");
    }
  };

  const handleUnschedule = async (testId: string) => {
    if (!confirm("Are you sure you want to unschedule this test?")) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `http://localhost:4000/api/schedule/test/${testId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to unschedule test");
      }

      fetchData(); // Refresh data
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to unschedule test");
    }
  };

  const handleSchedule = async (testId: string, data: ScheduleData) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `http://localhost:4000/api/schedule/test/${testId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update schedule");
      }

      fetchData(); // Refresh data
    } catch (err) {
      throw err;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeUntil = (nextRun: string | null) => {
    if (!nextRun) return null;
    const now = new Date();
    const next = new Date(nextRun);
    const diff = next.getTime() - now.getTime();

    if (diff < 0) return "Overdue";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `in ${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `in ${hours}h ${minutes}m`;
    return `in ${minutes}m`;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="mt-2 text-gray-600">Loading scheduled tests...</p>
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {t("scheduled.title")}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {t("scheduled.subtitle")}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {selectedIds.size > 0 && (
                  <button
                    onClick={handleBatchSchedule}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm"
                  >
                    <Calendar className="w-5 h-5" />
                    Schedule Selected ({selectedIds.size})
                  </button>
                )}
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-gray-700 transition-colors font-medium shadow-sm"
                >
                  <Calendar className="w-5 h-5" />
                  {showCalendar ? "Hide" : "Show"} Calendar
                </button>
                <button
                  onClick={() => router.push("/history")}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors font-medium shadow-sm"
                >
                  <History className="w-5 h-5" />
                  {t("scheduled.viewHistory")}
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                  <PlusCircle className="w-5 h-5" />
                  {t("scheduled.createSchedule")}
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("scheduled.totalScheduled")}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {stats.total}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("scheduled.active")}
                      </p>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {stats.active}
                      </p>
                    </div>
                    <Play className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("scheduled.paused")}
                      </p>
                      <p className="text-2xl font-bold text-gray-600 dark:text-gray-300 mt-1">
                        {stats.paused}
                      </p>
                    </div>
                    <Pause className="w-8 h-8 text-gray-600" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("scheduled.frequencies")}
                      </p>
                      <div className="mt-1 space-y-1">
                        {Object.entries(stats.byFrequency).map(
                          ([freq, count]) => (
                            <p key={freq} className="text-xs text-gray-600">
                              {freq}: {count}
                            </p>
                          )
                        )}
                      </div>
                    </div>
                    <Repeat className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming Tests Calendar */}
            {showCalendar && upcomingTests.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  Upcoming Test Runs
                </h2>
                <div className="space-y-2">
                  {upcomingTests.slice(0, 10).map((test, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {test.name || test.url || "Test"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {test.frequency}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(test.nextRunAt)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {getTimeUntil(test.nextRunAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Tests List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            tests.length > 0 &&
                            selectedIds.size === tests.length
                          }
                          onChange={selectAll}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("scheduled.test")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("scheduled.status")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("scheduled.frequency")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("scheduled.nextRun")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("scheduled.lastRun")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("scheduled.lastResult")}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("scheduled.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {tests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <Calendar className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                              {t("scheduled.noScheduledYet")}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                              {t("scheduled.getStarted")}
                            </p>

                            {/* Empty State Action Buttons */}
                            <div className="flex gap-3">
                              <button
                                onClick={() => router.push("/history")}
                                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-700 border-2 border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors font-medium shadow-sm"
                              >
                                <History className="w-5 h-5" />
                                {t("scheduled.browseHistory")}
                              </button>
                              <button
                                onClick={() => router.push("/dashboard")}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                              >
                                <PlusCircle className="w-5 h-5" />
                                {t("scheduled.createNewTest")}
                              </button>
                            </div>

                            {/* Help Text */}
                            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg max-w-2xl">
                              <p className="text-sm text-blue-900 dark:text-blue-200 mb-2 font-medium">
                                {t("scheduled.quickTip")}
                              </p>
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                {t("scheduled.tipContent")}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      tests.map((test) => (
                        <tr
                          key={test.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(test.id)}
                              onChange={() => toggleSelection(test.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {test.prompt || "Untitled Test"}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {test.url}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                test.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {test.isActive ? (
                                <>
                                  <Play className="w-3 h-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <Pause className="w-3 h-3 mr-1" />
                                  Paused
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-sm text-gray-900">
                              <Repeat className="w-4 h-4 mr-1 text-purple-600" />
                              {test.frequency || "One-time"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm text-gray-900">
                                {formatDate(test.nextRunAt)}
                              </p>
                              {test.nextRunAt && test.isActive && (
                                <p className="text-xs text-gray-500">
                                  {getTimeUntil(test.nextRunAt)}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900">
                              {formatDate(test.lastRunAt)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            {test.results[0] ? (
                              <span
                                className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                                  test.results[0].status === "success"
                                    ? "bg-green-100 text-green-800"
                                    : test.results[0].status === "failure"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {test.results[0].status}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() =>
                                  handleToggle(test.id, test.isActive)
                                }
                                className="text-gray-600 hover:text-blue-600 transition-colors"
                                title={test.isActive ? "Pause" : "Resume"}
                              >
                                {test.isActive ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => setSelectedTest(test)}
                                className="text-gray-600 hover:text-blue-600 transition-colors"
                                title="Edit schedule"
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleUnschedule(test.id)}
                                className="text-gray-600 hover:text-red-600 transition-colors"
                                title="Remove schedule"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Modal */}
        {selectedTest && (
          <ScheduleTestModal
            testId={selectedTest.id}
            testName={selectedTest.prompt || "Untitled Test"}
            currentSchedule={{
              isScheduled: selectedTest.isScheduled,
              frequency: selectedTest.frequency,
              nextRunAt: selectedTest.nextRunAt,
              isActive: selectedTest.isActive,
            }}
            onClose={() => setSelectedTest(null)}
            onSchedule={(data) => handleSchedule(selectedTest.id, data)}
            onUnschedule={() => handleUnschedule(selectedTest.id)}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
