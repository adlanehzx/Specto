"use client";

import React from "react";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export interface AssertionResult {
  id?: string;
  type: string;
  selector: string | null;
  attribute?: string | null;
  expectedValue: string;
  actualValue: string | null;
  passed: boolean;
  errorMessage: string | null;
}

interface AssertionResultsProps {
  assertions: AssertionResult[];
}

const ASSERTION_TYPE_LABELS: Record<string, string> = {
  text: "Text Content",
  "element-visible": "Element Visible",
  attribute: "Attribute Value",
  url: "URL",
  count: "Element Count",
  "input-value": "Input Value",
};

export function AssertionResults({ assertions }: AssertionResultsProps) {
  if (!assertions || assertions.length === 0) {
    return null;
  }

  const passedCount = assertions.filter((a) => a.passed).length;
  const totalCount = assertions.length;
  const allPassed = passedCount === totalCount;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Résultats des Assertions</h2>
        <div
          className={`px-4 py-2 rounded-lg font-semibold ${
            allPassed
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {passedCount}/{totalCount} réussies
        </div>
      </div>

      <div className="space-y-4">
        {assertions.map((assertion, index) => (
          <div
            key={assertion.id || index}
            className={`border-l-4 rounded-lg p-4 ${
              assertion.passed
                ? "border-green-500 bg-green-50"
                : "border-red-500 bg-red-50"
            }`}
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 mt-0.5">
                {assertion.passed ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`font-semibold text-lg ${
                      assertion.passed ? "text-green-900" : "text-red-900"
                    }`}
                  >
                    {ASSERTION_TYPE_LABELS[assertion.type] || assertion.type}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      assertion.passed
                        ? "bg-green-200 text-green-800"
                        : "bg-red-200 text-red-800"
                    }`}
                  >
                    {assertion.passed ? "PASSED" : "FAILED"}
                  </span>
                </div>

                {/* Selector Info */}
                {assertion.selector && (
                  <div className="mb-2">
                    <span
                      className={`text-sm ${
                        assertion.passed ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      Sélecteur:
                    </span>{" "}
                    <code
                      className={`text-sm px-2 py-1 rounded font-mono ${
                        assertion.passed
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {assertion.selector}
                    </code>
                  </div>
                )}

                {/* Attribute Info */}
                {assertion.attribute && (
                  <div className="mb-2">
                    <span
                      className={`text-sm ${
                        assertion.passed ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      Attribut:
                    </span>{" "}
                    <code
                      className={`text-sm px-2 py-1 rounded font-mono ${
                        assertion.passed
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {assertion.attribute}
                    </code>
                  </div>
                )}

                {/* Expected vs Actual */}
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <p
                      className={`text-xs font-semibold mb-1 ${
                        assertion.passed ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      Attendu:
                    </p>
                    <div
                      className={`p-2 rounded text-sm font-mono break-words ${
                        assertion.passed
                          ? "bg-white border border-green-200"
                          : "bg-white border border-red-200"
                      }`}
                    >
                      {assertion.expectedValue}
                    </div>
                  </div>
                  <div>
                    <p
                      className={`text-xs font-semibold mb-1 ${
                        assertion.passed ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      Trouvé:
                    </p>
                    <div
                      className={`p-2 rounded text-sm font-mono break-words ${
                        assertion.passed
                          ? "bg-white border border-green-200"
                          : "bg-white border border-red-200"
                      }`}
                    >
                      {assertion.actualValue || (
                        <span className="text-gray-400 italic">null</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {!assertion.passed && assertion.errorMessage && (
                  <div className="mt-3 flex items-start gap-2 p-3 bg-red-100 border border-red-300 rounded">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">
                      {assertion.errorMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {!allPassed && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>⚠️ Attention:</strong> {totalCount - passedCount} assertion
            {totalCount - passedCount > 1 ? "s ont" : " a"} échoué. Vérifiez que
            votre application fonctionne correctement ou ajustez vos assertions.
          </p>
        </div>
      )}

      {allPassed && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>✅ Parfait!</strong> Toutes les assertions sont validées.
            Votre application fonctionne comme prévu.
          </p>
        </div>
      )}
    </div>
  );
}
