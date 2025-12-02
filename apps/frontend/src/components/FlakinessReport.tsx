"use client";

import React, { useEffect, useState } from "react";

interface ErrorPattern {
  type: string;
  count: number;
  percentage: number;
  examples: string[];
}

interface Recommendation {
  type: string;
  priority: "low" | "medium" | "high";
  message: string;
  reason: string;
}

interface FlakinessReportData {
  id: string;
  testId: string;
  totalRuns: number;
  successCount: number;
  failureCount: number;
  reliabilityScore: number;
  flakinessRate: number;
  isFlaky: boolean;
  severity: "low" | "medium" | "high" | "critical";
  errorPatterns: Record<string, ErrorPattern>;
  avgDuration: number;
  durationVariance: number;
  lastFlipAt: string | null;
  flipCount: number;
  recommendations: Recommendation[];
  firstDetectedAt: string | null;
  lastAnalyzedAt: string;
}

interface FlakinessReportProps {
  testId: string;
}

// Badge de sévérité avec couleurs
const SeverityBadge = ({ severity }: { severity: string }) => {
  const colors = {
    low: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    critical: "bg-red-100 text-red-800 border-red-200",
  };

  const icons = {
    low: "✓",
    medium: "⚠",
    high: "⚠⚠",
    critical: "🔴",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
        colors[severity as keyof typeof colors]
      }`}
    >
      <span className="mr-1">{icons[severity as keyof typeof icons]}</span>
      {severity.toUpperCase()}
    </span>
  );
};

// Score circulaire (comme une jauge)
const ReliabilityGauge = ({ score }: { score: number }) => {
  const circumference = 2 * Math.PI * 45; // Rayon de 45
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Couleur basée sur le score
  let color = "#22c55e"; // Vert (bon)
  if (score < 80) color = "#eab308"; // Jaune (moyen)
  if (score < 60) color = "#f97316"; // Orange (mauvais)
  if (score < 40) color = "#ef4444"; // Rouge (critique)

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90 w-32 h-32">
        {/* Cercle de fond */}
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="#e5e7eb"
          strokeWidth="8"
          fill="none"
        />
        {/* Cercle de progression */}
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold" style={{ color }}>
          {Math.round(score)}
        </span>
        <span className="text-xs text-gray-500">Reliability</span>
      </div>
    </div>
  );
};

// Icône pour le type d'erreur
const ErrorTypeIcon = ({ type }: { type: string }) => {
  const icons: Record<string, string> = {
    selector: "🎯",
    timeout: "⏱️",
    assertion: "✗",
    navigation: "🔗",
    visibility: "👁️",
    "race-condition": "⚡",
    unknown: "❓",
  };

  return <span className="text-2xl">{icons[type] || "❓"}</span>;
};

// Icône de priorité
const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors = {
    low: "bg-blue-100 text-blue-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
        colors[priority as keyof typeof colors]
      }`}
    >
      {priority.toUpperCase()}
    </span>
  );
};

export default function FlakinessReport({ testId }: FlakinessReportProps) {
  const [report, setReport] = useState<FlakinessReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [testId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:4000/api/tests/${testId}/flakiness`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("Rapport non disponible (minimum 5 exécutions requises)");
        } else {
          setError("Erreur lors du chargement du rapport");
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setReport(data.report);
    } catch (err: any) {
      console.error("Flakiness report error:", err);
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">
          ℹ️ {error || "Aucun rapport de flakiness disponible"}
        </p>
        <p className="text-yellow-600 text-xs mt-1">
          Le test doit être exécuté au moins 5 fois pour générer un rapport.
        </p>
      </div>
    );
  }

  const errorPatternsArray = Object.values(report.errorPatterns || {});
  const hasPatterns = errorPatternsArray.length > 0;

  return (
    <div className="space-y-6">
      {/* En-tête avec statut flaky */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Flakiness Report
            </h2>
            {report.isFlaky && (
              <p className="text-orange-600 text-sm font-medium">
                ⚠️ Ce test est instable (flaky)
              </p>
            )}
            {!report.isFlaky && (
              <p className="text-green-600 text-sm font-medium">
                ✓ Ce test est stable
              </p>
            )}
          </div>
          <SeverityBadge severity={report.severity} />
        </div>

        {/* Dernière analyse */}
        <p className="text-xs text-gray-500 mt-3">
          Dernière analyse:{" "}
          {new Date(report.lastAnalyzedAt).toLocaleString("fr-FR")}
        </p>
        {report.firstDetectedAt && (
          <p className="text-xs text-orange-500 mt-1">
            Instabilité détectée:{" "}
            {new Date(report.firstDetectedAt).toLocaleString("fr-FR")}
          </p>
        )}
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Jauge de fiabilité */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Fiabilité
          </h3>
          <div className="flex flex-col items-center">
            <ReliabilityGauge score={report.reliabilityScore} />
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                {report.successCount} / {report.totalRuns} exécutions réussies
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Taux d'échec: {report.flakinessRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Statistiques
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total exécutions</span>
              <span className="text-lg font-semibold text-gray-900">
                {report.totalRuns}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Durée moyenne</span>
              <span className="text-lg font-semibold text-gray-900">
                {report.avgDuration}ms
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Variance durée</span>
              <span className="text-lg font-semibold text-gray-900">
                ±{report.durationVariance.toFixed(0)}ms
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Alternances (flips)</span>
              <span className="text-lg font-semibold text-gray-900">
                {report.flipCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Patterns d'erreurs */}
      {hasPatterns && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Patterns d'Erreurs Détectés
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {errorPatternsArray.map((pattern) => (
              <div
                key={pattern.type}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <ErrorTypeIcon type={pattern.type} />
                    <span className="font-medium text-gray-900 capitalize">
                      {pattern.type.replace("-", " ")}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-orange-600">
                    {pattern.percentage.toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {pattern.count} occurrence{pattern.count > 1 ? "s" : ""}
                </p>
                {pattern.examples.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Exemple:</p>
                    <code className="text-xs bg-gray-50 text-gray-700 p-2 rounded block overflow-x-auto">
                      {pattern.examples[0].substring(0, 100)}...
                    </code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommandations */}
      {report.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            💡 Recommandations
          </h3>
          <div className="space-y-3">
            {report.recommendations.map((rec, index) => (
              <div
                key={index}
                className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{rec.message}</h4>
                  <PriorityBadge priority={rec.priority} />
                </div>
                <p className="text-sm text-gray-600">{rec.reason}</p>
                <p className="text-xs text-gray-500 mt-2">Type: {rec.type}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message si pas de recommandations */}
      {report.recommendations.length === 0 && !report.isFlaky && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">
            ✓ Aucune recommandation - Le test semble stable
          </p>
        </div>
      )}
    </div>
  );
}
