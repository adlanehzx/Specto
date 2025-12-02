"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface ExecutionHistory {
  date: string;
  success: number;
  failure: number;
  error: number;
  total: number;
}

interface ScheduleHistoryProps {
  testId?: string; // Si fourni, affiche l'historique d'un test spécifique
  limit?: number;
}

export default function ScheduleHistory({
  testId,
  limit = 30,
}: ScheduleHistoryProps) {
  const [history, setHistory] = useState<ExecutionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExecutions: 0,
    successRate: 0,
    avgDuration: 0,
    trend: 0, // Positive = amélioration, negative = dégradation
  });

  useEffect(() => {
    fetchHistory();
  }, [testId]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      // Récupérer les résultats des tests planifiés
      const endpoint = testId
        ? `http://localhost:4000/api/tests/${testId}/results`
        : `http://localhost:4000/api/results`;

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch history");

      const data = await response.json();

      // Grouper les résultats par jour
      const groupedByDay = groupResultsByDay(data.results || data);
      setHistory(groupedByDay);

      // Calculer les statistiques
      calculateStats(data.results || data);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  const groupResultsByDay = (results: any[]): ExecutionHistory[] => {
    const grouped = new Map<string, ExecutionHistory>();

    results.forEach((result) => {
      const date = new Date(result.createdAt).toISOString().split("T")[0];

      if (!grouped.has(date)) {
        grouped.set(date, { date, success: 0, failure: 0, error: 0, total: 0 });
      }

      const day = grouped.get(date)!;
      day.total++;

      if (result.status === "success") day.success++;
      else if (result.status === "failure") day.failure++;
      else if (result.status === "error") day.error++;
    });

    return Array.from(grouped.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  };

  const calculateStats = (results: any[]) => {
    if (results.length === 0) return;

    const total = results.length;
    const successful = results.filter((r) => r.status === "success").length;
    const successRate = (successful / total) * 100;

    // Calcul de la durée moyenne
    const durations = results.filter((r) => r.duration).map((r) => r.duration);
    const avgDuration =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

    // Calcul du trend (comparaison 7 derniers jours vs 7 jours précédents)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentResults = results.filter(
      (r) => new Date(r.createdAt) >= sevenDaysAgo
    );
    const previousResults = results.filter(
      (r) =>
        new Date(r.createdAt) >= fourteenDaysAgo &&
        new Date(r.createdAt) < sevenDaysAgo
    );

    const recentSuccess = recentResults.filter(
      (r) => r.status === "success"
    ).length;
    const previousSuccess = previousResults.filter(
      (r) => r.status === "success"
    ).length;

    const recentRate =
      recentResults.length > 0
        ? (recentSuccess / recentResults.length) * 100
        : 0;
    const previousRate =
      previousResults.length > 0
        ? (previousSuccess / previousResults.length) * 100
        : 0;

    const trend = recentRate - previousRate;

    setStats({
      totalExecutions: total,
      successRate,
      avgDuration: Math.round(avgDuration),
      trend,
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getSuccessRate = (day: ExecutionHistory) => {
    if (day.total === 0) return 0;
    return Math.round((day.success / day.total) * 100);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Stats Header */}
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Execution History
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">
              Total Executions
            </p>
            <p className="text-2xl font-bold text-blue-900 mt-1">
              {stats.totalExecutions}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Success Rate</p>
            <p className="text-2xl font-bold text-green-900 mt-1">
              {stats.successRate.toFixed(1)}%
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">Avg Duration</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">
              {(stats.avgDuration / 1000).toFixed(1)}s
            </p>
          </div>
          <div
            className={`rounded-lg p-4 ${
              stats.trend >= 0 ? "bg-green-50" : "bg-red-50"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                stats.trend >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              7-Day Trend
            </p>
            <div className="flex items-center mt-1">
              {stats.trend >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600 mr-2" />
              )}
              <p
                className={`text-2xl font-bold ${
                  stats.trend >= 0 ? "text-green-900" : "text-red-900"
                }`}
              >
                {stats.trend >= 0 ? "+" : ""}
                {stats.trend.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6">
        {history.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No execution history yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((day) => (
              <div
                key={day.date}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-shrink-0 w-24">
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(day.date)}
                  </p>
                  <p className="text-xs text-gray-500">{day.total} runs</p>
                </div>

                {/* Progress Bar */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden flex">
                      {day.success > 0 && (
                        <div
                          className="bg-green-500 flex items-center justify-center text-xs font-medium text-white"
                          style={{
                            width: `${(day.success / day.total) * 100}%`,
                          }}
                        >
                          {day.success > 0 && day.success}
                        </div>
                      )}
                      {day.failure > 0 && (
                        <div
                          className="bg-yellow-500 flex items-center justify-center text-xs font-medium text-white"
                          style={{
                            width: `${(day.failure / day.total) * 100}%`,
                          }}
                        >
                          {day.failure > 0 && day.failure}
                        </div>
                      )}
                      {day.error > 0 && (
                        <div
                          className="bg-red-500 flex items-center justify-center text-xs font-medium text-white"
                          style={{ width: `${(day.error / day.total) * 100}%` }}
                        >
                          {day.error > 0 && day.error}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-12 text-right">
                      {getSuccessRate(day)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      {day.success} success
                    </span>
                    {day.failure > 0 && (
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-yellow-600" />
                        {day.failure} failed
                      </span>
                    )}
                    {day.error > 0 && (
                      <span className="flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-red-600" />
                        {day.error} errors
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
