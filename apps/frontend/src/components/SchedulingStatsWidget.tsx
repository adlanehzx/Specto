"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, Play, Pause, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SchedulingStats {
  total: number;
  active: number;
  paused: number;
  byFrequency: Record<string, number>;
}

interface UpcomingTest {
  id: string;
  prompt: string;
  nextRunAt: string;
  frequency: string | null;
}

export default function SchedulingStatsWidget() {
  const [stats, setStats] = useState<SchedulingStats | null>(null);
  const [upcomingTests, setUpcomingTests] = useState<UpcomingTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // Refresh every minute
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const [statsRes, testsRes] = await Promise.all([
        fetch("http://localhost:4000/api/schedule/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:4000/api/schedule/tests", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (testsRes.ok) {
        const testsData = await testsRes.json();
        // Filtrer et trier les tests à venir (actifs uniquement)
        const upcoming = (testsData.tests || [])
          .filter((t: any) => t.isActive && t.nextRunAt)
          .sort(
            (a: any, b: any) =>
              new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime()
          )
          .slice(0, 5);
        setUpcomingTests(upcoming);
      }
    } catch (err) {
      console.error("Error fetching scheduling stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeUntil = (nextRun: string) => {
    const now = new Date();
    const next = new Date(nextRun);
    const diff = next.getTime() - now.getTime();

    if (diff < 0) return "Overdue";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Scheduled Tests
          </h3>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-2">No scheduled tests yet</p>
          <Link
            href="/tests"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first scheduled test →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Scheduled Tests
          </h3>
          <Link
            href="/scheduled"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6 border-b">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-xs text-gray-600 mt-1">Total</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Play className="w-4 h-4 text-green-600" />
              <p className="text-2xl font-bold text-green-600">
                {stats.active}
              </p>
            </div>
            <p className="text-xs text-gray-600 mt-1">Active</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Pause className="w-4 h-4 text-gray-600" />
              <p className="text-2xl font-bold text-gray-600">{stats.paused}</p>
            </div>
            <p className="text-xs text-gray-600 mt-1">Paused</p>
          </div>
        </div>

        {/* Frequency Breakdown */}
        {Object.keys(stats.byFrequency).length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-medium text-gray-700 mb-2">
              By Frequency:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(stats.byFrequency).map(([freq, count]) => (
                <div
                  key={freq}
                  className="flex items-center justify-between bg-gray-50 rounded px-3 py-2"
                >
                  <span className="text-xs text-gray-600 capitalize">
                    {freq}
                  </span>
                  <span className="text-xs font-medium text-gray-900">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Executions */}
      <div className="p-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Upcoming Executions
        </h4>
        {upcomingTests.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No upcoming executions
          </p>
        ) : (
          <div className="space-y-2">
            {upcomingTests.map((test) => (
              <div
                key={test.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {test.prompt || "Untitled Test"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {test.frequency ? `${test.frequency}` : "one-time"}
                  </p>
                </div>
                <div className="ml-3 text-right">
                  <p className="text-xs font-medium text-blue-600">
                    {getTimeUntil(test.nextRunAt)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(test.nextRunAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
