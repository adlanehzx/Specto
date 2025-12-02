/**
 * HealingAttempts Component
 *
 * Affiche l'historique des tentatives de correction automatique (auto-healing)
 * pour un test donné, avec les détails des changements et le statut.
 */

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Code,
  Sparkles,
  TrendingUp,
} from "lucide-react";

// Types pour les tentatives de healing
export interface HealingAttempt {
  id: string;
  errorType: string;
  errorMessage: string;
  originalCode: string;
  healedCode?: string;
  changes?: Array<{
    type: string;
    before?: string;
    after?: string;
    line?: number;
    code?: string;
    reason: string;
  }>;
  status: "pending" | "success" | "failed" | "manual-review";
  confidence?: number;
  healedAt?: string;
  createdAt: string;
}

interface HealingAttemptsProps {
  attempts: HealingAttempt[];
}

// Labels français pour les types d'erreurs
const ERROR_TYPE_LABELS: Record<string, string> = {
  selector: "Sélecteur invalide",
  timeout: "Timeout",
  assertion: "Assertion échouée",
  navigation: "Navigation inattendue",
  visibility: "Élément non visible",
  "race-condition": "Race condition",
  unknown: "Erreur inconnue",
};

// Couleurs par statut
const STATUS_COLORS = {
  success: {
    border: "border-green-500",
    bg: "bg-green-50",
    text: "text-green-700",
    icon: "text-green-600",
  },
  failed: {
    border: "border-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
    icon: "text-red-600",
  },
  pending: {
    border: "border-yellow-500",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    icon: "text-yellow-600",
  },
  "manual-review": {
    border: "border-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: "text-blue-600",
  },
};

// Composant pour une tentative de healing
const HealingAttemptCard: React.FC<{ attempt: HealingAttempt }> = ({
  attempt,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const colors = STATUS_COLORS[attempt.status] || STATUS_COLORS.failed;

  // Icône selon le statut
  const StatusIcon =
    attempt.status === "success"
      ? CheckCircle2
      : attempt.status === "failed"
      ? XCircle
      : attempt.status === "pending"
      ? Loader2
      : AlertCircle;

  // Titre selon le statut
  const statusTitle =
    attempt.status === "success"
      ? "✅ Corrigé automatiquement"
      : attempt.status === "failed"
      ? "❌ Correction échouée"
      : attempt.status === "pending"
      ? "⏳ Correction en cours..."
      : "📋 Révision manuelle requise";

  return (
    <div
      className={`border-l-4 ${colors.border} ${colors.bg} rounded-lg p-4 mb-4`}
    >
      {/* En-tête */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon
            className={`w-5 h-5 ${colors.icon} ${
              attempt.status === "pending" ? "animate-spin" : ""
            }`}
          />
          <span className="font-semibold text-gray-900">{statusTitle}</span>
        </div>

        {/* Confiance */}
        {attempt.confidence !== undefined && (
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <span className="text-xs bg-gray-100 px-2 py-1 rounded font-medium">
              Confiance: {(attempt.confidence * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Informations de base */}
      <div className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <span className="font-medium text-gray-700 min-w-[100px]">
            Type d'erreur:
          </span>
          <span className={colors.text}>
            {ERROR_TYPE_LABELS[attempt.errorType] || attempt.errorType}
          </span>
        </div>

        <div className="flex items-start gap-2">
          <span className="font-medium text-gray-700 min-w-[100px]">
            Message:
          </span>
          <span className="text-gray-600 text-xs break-all">
            {attempt.errorMessage.substring(0, 150)}
            {attempt.errorMessage.length > 150 && "..."}
          </span>
        </div>

        {attempt.healedAt && (
          <div className="flex items-start gap-2">
            <span className="font-medium text-gray-700 min-w-[100px]">
              Corrigé le:
            </span>
            <span className="text-gray-600 text-xs">
              {new Date(attempt.healedAt).toLocaleString("fr-FR")}
            </span>
          </div>
        )}
      </div>

      {/* Changements appliqués */}
      {attempt.changes && attempt.changes.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 mb-2"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <span>{attempt.changes.length} changement(s) appliqué(s)</span>
          </button>

          {isExpanded && (
            <ul className="space-y-2 ml-6">
              {attempt.changes.map((change, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs">
                  <Sparkles className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-700">
                      {change.type}:
                    </span>
                    <span className="text-gray-600 ml-1">{change.reason}</span>

                    {/* Avant/Après */}
                    {change.before && change.after && (
                      <div className="mt-1 space-y-1">
                        <div className="bg-red-100 text-red-800 p-1 rounded font-mono text-[10px]">
                          - {change.before}
                        </div>
                        <div className="bg-green-100 text-green-800 p-1 rounded font-mono text-[10px]">
                          + {change.after}
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Boutons d'action */}
      {attempt.status === "success" && attempt.healedCode && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setShowDiff(!showDiff)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            <Code className="w-3 h-3" />
            {showDiff ? "Masquer le code" : "Voir le code corrigé"}
          </button>
        </div>
      )}

      {/* Diff de code */}
      {showDiff && attempt.healedCode && (
        <div className="mt-4 space-y-2">
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">
              Code original :
            </p>
            <pre className="bg-gray-100 p-3 rounded text-[10px] overflow-x-auto max-h-40 overflow-y-auto">
              <code>{attempt.originalCode}</code>
            </pre>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">
              Code corrigé :
            </p>
            <pre className="bg-green-100 p-3 rounded text-[10px] overflow-x-auto max-h-40 overflow-y-auto">
              <code>{attempt.healedCode}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant principal
export const HealingAttempts: React.FC<HealingAttemptsProps> = ({
  attempts,
}) => {
  if (!attempts || attempts.length === 0) {
    return null;
  }

  // Stats
  const successCount = attempts.filter((a) => a.status === "success").length;
  const failedCount = attempts.filter((a) => a.status === "failed").length;
  const pendingCount = attempts.filter((a) => a.status === "pending").length;
  const successRate =
    attempts.length > 0 ? (successCount / attempts.length) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Auto-Healing 🔧</h2>
        </div>

        {/* Badge NEW si au moins une tentative réussie */}
        {successCount > 0 && (
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
            {successCount} correction{successCount > 1 ? "s" : ""} réussie
            {successCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Tentatives</p>
          <p className="text-2xl font-bold text-gray-900">{attempts.length}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Succès</p>
          <p className="text-2xl font-bold text-green-600">{successCount}</p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Échecs</p>
          <p className="text-2xl font-bold text-red-600">{failedCount}</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Taux de succès</p>
          <p className="text-2xl font-bold text-blue-600">
            {successRate.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Liste des tentatives */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Historique des corrections
        </h3>

        {attempts.map((attempt) => (
          <HealingAttemptCard key={attempt.id} attempt={attempt} />
        ))}
      </div>

      {/* Recommandations */}
      {successCount > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <p className="text-sm text-gray-700">
            <strong>💡 Recommandation :</strong> Le code du test a été corrigé
            automatiquement. Vérifiez les changements ci-dessus et considérez
            utiliser des sélecteurs plus stables (comme{" "}
            <code className="bg-purple-100 px-1 py-0.5 rounded text-xs">
              data-testid
            </code>
            ) pour éviter les futurs échecs.
          </p>
        </div>
      )}

      {failedCount === attempts.length && attempts.length > 0 && (
        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-700">
            <strong>⚠️ Attention :</strong> L'auto-healing n'a pas pu corriger
            automatiquement ce test. Une révision manuelle est nécessaire.
            Consultez les messages d'erreur ci-dessus pour identifier la cause
            du problème.
          </p>
        </div>
      )}
    </div>
  );
};

export default HealingAttempts;
