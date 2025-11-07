"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";

const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
];
const AUTH_TYPES = ["none", "bearer", "basic", "api-key", "oauth2"];

function NewApiTestPageContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"manual" | "ai">("manual");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    prompt: "",
    method: "GET",
    url: "",
    headers: '{\n  "Content-Type": "application/json"\n}',
    body: "{}",
    queryParams: "{}",
    authType: "none",
    authConfig: "{}",
    expectedStatus: "200",
    assertions: "[]",
    timeout: "30000",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateJSON = (field: string, value: string) => {
    try {
      JSON.parse(value);
      setErrors((prev) => ({ ...prev, [field]: "" }));
      return true;
    } catch (error) {
      setErrors((prev) => ({ ...prev, [field]: "Invalid JSON format" }));
      return false;
    }
  };

  const generateFromAI = async () => {
    if (!formData.prompt.trim()) {
      setErrors({ prompt: "Please enter a description" });
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/api-tests/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          prompt: formData.prompt,
          apiEndpoint: formData.url || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const config = data.config;

        setFormData((prev) => ({
          ...prev,
          name: config.name || prev.name,
          description: config.description || prev.description,
          method: config.method || prev.method,
          url: config.url || prev.url,
          headers: JSON.stringify(config.headers || {}, null, 2),
          body: JSON.stringify(config.body || {}, null, 2),
          queryParams: JSON.stringify(config.queryParams || {}, null, 2),
          authType: config.authType || prev.authType,
          authConfig: JSON.stringify(config.authConfig || {}, null, 2),
          expectedStatus: String(config.expectedStatus || 200),
          assertions: JSON.stringify(config.assertions || [], null, 2),
          timeout: String(config.timeout || 30000),
        }));

        setActiveTab("manual");
        alert("Test configuration generated! Review and save.");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to generate test");
      }
    } catch (error) {
      console.error("Error generating test:", error);
      alert("Failed to generate test");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      setErrors({ name: "Name is required" });
      return;
    }
    if (!formData.url.trim()) {
      setErrors({ url: "URL is required" });
      return;
    }

    // Validate JSON fields
    const jsonFields = [
      "headers",
      "body",
      "queryParams",
      "authConfig",
      "assertions",
    ];
    let hasError = false;
    for (const field of jsonFields) {
      if (
        !validateJSON(field, formData[field as keyof typeof formData] as string)
      ) {
        hasError = true;
      }
    }
    if (hasError) return;

    setLoading(true);
    try {
      const response = await fetch("/api/api-tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          prompt: formData.prompt,
          method: formData.method,
          url: formData.url,
          headers: JSON.parse(formData.headers),
          body: formData.body ? JSON.parse(formData.body) : null,
          queryParams: JSON.parse(formData.queryParams),
          authType: formData.authType,
          authConfig: JSON.parse(formData.authConfig),
          expectedStatus: parseInt(formData.expectedStatus, 10),
          assertions: JSON.parse(formData.assertions),
          timeout: parseInt(formData.timeout, 10),
        }),
      });

      if (response.ok) {
        const test = await response.json();
        router.push(`/api-tests/${test.id}`);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create test");
      }
    } catch (error) {
      console.error("Error creating test:", error);
      alert("Failed to create test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/api-tests" className="text-blue-600 hover:text-blue-700">
          ← Back to API Tests
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">
          Create New API Test
        </h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("manual")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "manual"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Manual Configuration
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "ai"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            AI Generation
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === "ai" ? (
          // AI Generation Tab
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">
              Generate from Description
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe your API test in natural language
              </label>
              <textarea
                value={formData.prompt}
                onChange={(e) => handleChange("prompt", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 h-32"
                placeholder="Example: Test the GitHub API to get user information. Make a GET request to https://api.github.com/users/octocat and verify that the response contains login, name, and public_repos fields."
              />
              {errors.prompt && (
                <p className="mt-1 text-sm text-red-600">{errors.prompt}</p>
              )}
            </div>
            <button
              type="button"
              onClick={generateFromAI}
              disabled={generating}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {generating ? "Generating..." : "✨ Generate Test"}
            </button>
          </div>
        ) : (
          // Manual Configuration Tab
          <>
            <div className="bg-white shadow-sm rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-medium mb-4">Basic Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="e.g., Get User Profile"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows={2}
                  placeholder="What does this test validate?"
                />
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-medium mb-4">HTTP Configuration</h3>

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Method *
                  </label>
                  <select
                    value={formData.method}
                    onChange={(e) => handleChange("method", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  >
                    {HTTP_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL *
                  </label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => handleChange("url", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="https://api.example.com/endpoint"
                  />
                  {errors.url && (
                    <p className="mt-1 text-sm text-red-600">{errors.url}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Headers (JSON)
                </label>
                <textarea
                  value={formData.headers}
                  onChange={(e) => handleChange("headers", e.target.value)}
                  onBlur={() => validateJSON("headers", formData.headers)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm"
                  rows={4}
                />
                {errors.headers && (
                  <p className="mt-1 text-sm text-red-600">{errors.headers}</p>
                )}
              </div>

              {["POST", "PUT", "PATCH"].includes(formData.method) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Request Body (JSON)
                  </label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => handleChange("body", e.target.value)}
                    onBlur={() => validateJSON("body", formData.body)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm"
                    rows={6}
                  />
                  {errors.body && (
                    <p className="mt-1 text-sm text-red-600">{errors.body}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Query Parameters (JSON)
                </label>
                <textarea
                  value={formData.queryParams}
                  onChange={(e) => handleChange("queryParams", e.target.value)}
                  onBlur={() =>
                    validateJSON("queryParams", formData.queryParams)
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm"
                  rows={3}
                  placeholder='{"page": "1", "limit": "10"}'
                />
                {errors.queryParams && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.queryParams}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-medium mb-4">Authentication</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auth Type
                </label>
                <select
                  value={formData.authType}
                  onChange={(e) => handleChange("authType", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  {AUTH_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {formData.authType !== "none" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auth Configuration (JSON)
                  </label>
                  <textarea
                    value={formData.authConfig}
                    onChange={(e) => handleChange("authConfig", e.target.value)}
                    onBlur={() =>
                      validateJSON("authConfig", formData.authConfig)
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm"
                    rows={4}
                    placeholder={
                      formData.authType === "bearer"
                        ? '{"token": "your-token-here"}'
                        : formData.authType === "basic"
                        ? '{"username": "user", "password": "pass"}'
                        : formData.authType === "api-key"
                        ? '{"key": "X-API-Key", "value": "your-key"}'
                        : "{}"
                    }
                  />
                  {errors.authConfig && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.authConfig}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-medium mb-4">
                Assertions & Validation
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Status Code
                </label>
                <input
                  type="number"
                  value={formData.expectedStatus}
                  onChange={(e) =>
                    handleChange("expectedStatus", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assertions (JSON Array)
                </label>
                <textarea
                  value={formData.assertions}
                  onChange={(e) => handleChange("assertions", e.target.value)}
                  onBlur={() => validateJSON("assertions", formData.assertions)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm"
                  rows={8}
                  placeholder={`[
  {
    "type": "body-path",
    "field": "data.user.email",
    "operator": "exists",
    "expectedValue": ""
  }
]`}
                />
                {errors.assertions && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.assertions}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => handleChange("timeout", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </div>
          </>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/api-tests"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Creating..." : "Create Test"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewApiTestPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <NewApiTestPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
