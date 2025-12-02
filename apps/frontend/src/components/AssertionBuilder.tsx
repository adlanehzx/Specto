"use client";

import React, { useState } from "react";
import { Plus, Trash2, Info } from "lucide-react";

export interface AssertionConfig {
  type:
    | "text"
    | "element-visible"
    | "attribute"
    | "url"
    | "count"
    | "input-value";
  selector?: string;
  attribute?: string;
  expectedValue: string;
}

interface AssertionBuilderProps {
  assertions: AssertionConfig[];
  onChange: (assertions: AssertionConfig[]) => void;
}

const ASSERTION_TYPES = [
  {
    value: "text",
    label: "Text Content",
    description: "Vérifie le texte d'un élément",
    example: 'Sélecteur: h1 | Valeur: "Bienvenue"',
    needsSelector: true,
    needsAttribute: false,
    needsExpectedValue: true,
  },
  {
    value: "element-visible",
    label: "Element Visible",
    description: "Vérifie qu'un élément est visible",
    example: "Sélecteur: button.submit",
    needsSelector: true,
    needsAttribute: false,
    needsExpectedValue: false,
  },
  {
    value: "attribute",
    label: "Attribute Value",
    description: "Vérifie la valeur d'un attribut HTML",
    example: 'Sélecteur: a.logo | Attribut: href | Valeur: "/home"',
    needsSelector: true,
    needsAttribute: true,
    needsExpectedValue: true,
  },
  {
    value: "url",
    label: "URL",
    description: "Vérifie que l'URL contient un texte",
    example: 'Valeur: "/dashboard"',
    needsSelector: false,
    needsAttribute: false,
    needsExpectedValue: true,
  },
  {
    value: "count",
    label: "Element Count",
    description: "Compte le nombre d'éléments",
    example: 'Sélecteur: .product-card | Valeur: "10"',
    needsSelector: true,
    needsAttribute: false,
    needsExpectedValue: true,
  },
  {
    value: "input-value",
    label: "Input Value",
    description: "Vérifie la valeur d'un champ",
    example: 'Sélecteur: input#email | Valeur: "test@example.com"',
    needsSelector: true,
    needsAttribute: false,
    needsExpectedValue: true,
  },
];

export function AssertionBuilder({
  assertions,
  onChange,
}: AssertionBuilderProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const addAssertion = () => {
    const newAssertion: AssertionConfig = {
      type: "text",
      selector: "",
      expectedValue: "",
    };
    onChange([...assertions, newAssertion]);
    setExpandedIndex(assertions.length);
  };

  const removeAssertion = (index: number) => {
    const updated = assertions.filter((_, i) => i !== index);
    onChange(updated);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const updateAssertion = (
    index: number,
    field: keyof AssertionConfig,
    value: any
  ) => {
    const updated = [...assertions];
    updated[index] = { ...updated[index], [field]: value };

    // Reset fields when changing type
    if (field === "type") {
      const typeConfig = ASSERTION_TYPES.find((t) => t.value === value);
      if (!typeConfig?.needsSelector) {
        updated[index].selector = undefined;
      }
      if (!typeConfig?.needsAttribute) {
        updated[index].attribute = undefined;
      }
      if (!typeConfig?.needsExpectedValue) {
        updated[index].expectedValue = "";
      }
    }

    onChange(updated);
  };

  const getTypeConfig = (type: string) => {
    return ASSERTION_TYPES.find((t) => t.value === type) || ASSERTION_TYPES[0];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">
            Assertions à vérifier
          </label>
          <p className="text-xs text-gray-500">
            Les assertions valident le contenu de la page après l'exécution du
            test
          </p>
        </div>
        <button
          type="button"
          onClick={addAssertion}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Ajouter une assertion
        </button>
      </div>

      {assertions.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">
            Aucune assertion configurée
          </p>
          <p className="text-sm text-gray-500">
            Ajoutez des assertions pour vérifier automatiquement le contenu de
            la page
          </p>
        </div>
      )}

      <div className="space-y-3">
        {assertions.map((assertion, index) => {
          const typeConfig = getTypeConfig(assertion.type);
          const isExpanded = expandedIndex === index;

          return (
            <div
              key={index}
              className={`border rounded-xl transition-all ${
                isExpanded ? "border-blue-500 shadow-md" : "border-gray-200"
              }`}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {typeConfig.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {typeConfig.description}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAssertion(index);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
                  {/* Type Selection */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Type d'assertion
                    </label>
                    <select
                      value={assertion.type}
                      onChange={(e) =>
                        updateAssertion(index, "type", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ASSERTION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Exemple: {typeConfig.example}
                    </p>
                  </div>

                  {/* Selector Input */}
                  {typeConfig.needsSelector && (
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
                        Sélecteur CSS
                      </label>
                      <input
                        type="text"
                        value={assertion.selector || ""}
                        onChange={(e) =>
                          updateAssertion(index, "selector", e.target.value)
                        }
                        placeholder="Ex: h1.title, button.submit, input#email"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Utilisez un sélecteur CSS pour cibler l'élément
                      </p>
                    </div>
                  )}

                  {/* Attribute Input */}
                  {typeConfig.needsAttribute && (
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
                        Nom de l'attribut
                      </label>
                      <input
                        type="text"
                        value={assertion.attribute || ""}
                        onChange={(e) =>
                          updateAssertion(index, "attribute", e.target.value)
                        }
                        placeholder="Ex: href, src, class, data-id"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                    </div>
                  )}

                  {/* Expected Value Input */}
                  {typeConfig.needsExpectedValue && (
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
                        Valeur attendue
                      </label>
                      <input
                        type="text"
                        value={assertion.expectedValue}
                        onChange={(e) =>
                          updateAssertion(
                            index,
                            "expectedValue",
                            e.target.value
                          )
                        }
                        placeholder={
                          assertion.type === "count"
                            ? "Ex: 10"
                            : assertion.type === "url"
                            ? "Ex: /dashboard"
                            : "Ex: Bienvenue sur notre site"
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* Preview */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-1">
                      Aperçu:
                    </p>
                    <code className="text-xs text-gray-700 block">
                      {assertion.type === "url" && (
                        <>URL doit contenir: "{assertion.expectedValue}"</>
                      )}
                      {assertion.type === "element-visible" && (
                        <>L'élément "{assertion.selector}" doit être visible</>
                      )}
                      {assertion.type === "text" && (
                        <>
                          "{assertion.selector}" doit contenir "
                          {assertion.expectedValue}"
                        </>
                      )}
                      {assertion.type === "attribute" && (
                        <>
                          "{assertion.selector}" attribut "{assertion.attribute}
                          " = "{assertion.expectedValue}"
                        </>
                      )}
                      {assertion.type === "count" && (
                        <>
                          "{assertion.selector}" doit avoir{" "}
                          {assertion.expectedValue} éléments
                        </>
                      )}
                      {assertion.type === "input-value" && (
                        <>
                          "{assertion.selector}" doit avoir la valeur "
                          {assertion.expectedValue}"
                        </>
                      )}
                    </code>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {assertions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>{assertions.length}</strong> assertion
            {assertions.length > 1 ? "s" : ""} configurée
            {assertions.length > 1 ? "s" : ""}. Le test échouera si au moins une
            assertion n'est pas validée.
          </p>
        </div>
      )}
    </div>
  );
}
