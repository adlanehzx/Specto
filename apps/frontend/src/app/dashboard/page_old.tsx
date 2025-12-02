"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { useTranslation } from "@/contexts/TranslationContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Globe,
  Code2,
  Loader2,
  FlaskConical,
  Gauge,
  Shield,
  Lightbulb,
} from "lucide-react";

type TestType = "e2e" | "api" | "smoke" | "unit" | "performance" | "security";

export default function UnifiedDashboardPage() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { projects } = useProjects();
  const router = useRouter();

  // Common state
  const [testType, setTestType] = useState<TestType>("e2e");
  const [projectId, setProjectId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recommendedTests, setRecommendedTests] = useState<any[]>([]);

  // E2E specific state
  const [e2eUrl, setE2eUrl] = useState("");
  const [e2ePrompt, setE2ePrompt] = useState("");

  // API specific state
  const [apiName, setApiName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [apiMethod, setApiMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">(
    "GET"
  );
  const [apiPrompt, setApiPrompt] = useState("");

  // Smoke specific state
  const [smokeBaseUrl, setSmokeBaseUrl] = useState("");
  const [smokePrompt, setSmokePrompt] = useState("");
  const [smokeGenerationType, setSmokeGenerationType] = useState<
    "description" | "stack"
  >("description");
  const [smokeStack, setSmokeStack] = useState("");

  // Unit test specific state
  const [unitUrl, setUnitUrl] = useState("");
  const [unitPrompt, setUnitPrompt] = useState("");

  // Performance test specific state
  const [perfUrl, setPerfUrl] = useState("");
  const [perfPrompt, setPerfPrompt] = useState("");

  // Security test specific state
  const [secUrl, setSecUrl] = useState("");
  const [secPrompt, setSecPrompt] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetchRecommendedTests();
  }, [token]);

  const fetchRecommendedTests = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/tests/recommended`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendedTests(data.recommendations || []);
      }
    } catch (err) {
      console.error("Failed to fetch recommended tests:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (testType === "e2e") {
        await handleE2ESubmit();
      } else if (testType === "api") {
        await handleAPISubmit();
      } else if (testType === "smoke") {
        await handleSmokeSubmit();
      } else if (testType === "unit") {
        router.push("/unit-tests/new");
        return;
      } else if (testType === "performance") {
        router.push("/performance-tests/new");
        return;
      } else if (testType === "security") {
        router.push("/security-tests/new");
        return;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleE2ESubmit = async () => {
    const response = await fetch(`${API_URL}/api/tests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: e2eUrl,
        prompt: e2ePrompt,
        projectId: projectId || undefined,
        executeImmediately: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create E2E test");
    }

    setSuccess("E2E Test created successfully! 🎉");
    resetE2EForm();

    setTimeout(() => {
      router.push("/history");
    }, 1500);
  };

  const handleAPISubmit = async () => {
    const response = await fetch(`${API_URL}/api/api-tests/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: apiName,
        url: apiUrl,
        method: apiMethod,
        description: apiPrompt,
        projectId: projectId || undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create API test");
    }

    setSuccess("API Test created successfully! 🎉");
    resetAPIForm();

    setTimeout(() => {
      router.push("/api-tests");
    }, 1500);
  };

  const handleSmokeSubmit = async () => {
    const response = await fetch(`${API_URL}/api/smoke-tests/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        baseUrl: smokeBaseUrl,
        description:
          smokeGenerationType === "description" ? smokePrompt : undefined,
        stack: smokeGenerationType === "stack" ? smokeStack : undefined,
        generationType: smokeGenerationType,
        projectId: projectId || undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create Smoke test");
    }

    setSuccess("Smoke Test created successfully! 🎉");
    resetSmokeForm();

    setTimeout(() => {
      router.push("/smoke-tests");
    }, 1500);
  };

  const resetE2EForm = () => {
    setE2eUrl("");
    setE2ePrompt("");
    setProjectId("");
  };

  const resetAPIForm = () => {
    setApiName("");
    setApiUrl("");
    setApiMethod("GET");
    setApiPrompt("");
    setProjectId("");
  };

  const resetSmokeForm = () => {
    setSmokeBaseUrl("");
    setSmokePrompt("");
    setSmokeGenerationType("description");
    setSmokeStack("");
    setProjectId("");
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t("dashboard.title") || "Create Test"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Choose a test type and let AI generate your tests
            </p>
          </div>

          {/* Recommended Tests Widget */}
          {recommendedTests.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  AI Recommended Tests
                </h3>
              </div>
              <div className="space-y-3">
                {recommendedTests.slice(0, 3).map((rec, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-100 dark:border-purple-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {rec.title || "Recommended Test"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {rec.rationale ||
                            rec.description ||
                            "AI suggests this test to improve coverage"}
                        </p>
                        {rec.priority && (
                          <span
                            className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mt-2 ${
                              rec.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : rec.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {rec.priority} priority
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (rec.testType) setTestType(rec.testType);
                          if (rec.url) {
                            if (rec.testType === "e2e") setE2eUrl(rec.url);
                            if (rec.testType === "api") setApiUrl(rec.url);
                          }
                        }}
                        className="ml-4 px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Type Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTestType("e2e")}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium transition-all ${
                  testType === "e2e"
                    ? "bg-purple-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <Globe className="w-5 h-5" />
                <span>E2E Tests</span>
                {testType === "e2e" && (
                  <span className="ml-2 px-2 py-0.5 bg-purple-500 text-xs rounded-full">
                    Active
                  </span>
                )}
              </button>

              <button
                onClick={() => setTestType("api")}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium transition-all ${
                  testType === "api"
                    ? "bg-blue-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <Code2 className="w-5 h-5" />
                <span>API Tests</span>
                {testType === "api" && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-500 text-xs rounded-full">
                    Active
                  </span>
                )}
              </button>

              <button
                onClick={() => setTestType("smoke")}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium transition-all ${
                  testType === "smoke"
                    ? "bg-green-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Smoke Tests</span>
                {testType === "smoke" && (
                  <span className="ml-2 px-2 py-0.5 bg-green-500 text-xs rounded-full">
                    Active
                  </span>
                )}
              </button>

              <button
                onClick={() => setTestType("unit")}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium transition-all ${
                  testType === "unit"
                    ? "bg-orange-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <FlaskConical className="w-5 h-5" />
                <span>Unit Tests</span>
                {testType === "unit" && (
                  <span className="ml-2 px-2 py-0.5 bg-orange-500 text-xs rounded-full">
                    Active
                  </span>
                )}
              </button>

              <button
                onClick={() => setTestType("performance")}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium transition-all ${
                  testType === "performance"
                    ? "bg-amber-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <Gauge className="w-5 h-5" />
                <span>Performance Tests</span>
                {testType === "performance" && (
                  <span className="ml-2 px-2 py-0.5 bg-amber-500 text-xs rounded-full">
                    Active
                  </span>
                )}
              </button>

              <button
                onClick={() => setTestType("security")}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium transition-all ${
                  testType === "security"
                    ? "bg-red-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <Shield className="w-5 h-5" />
                <span>Security Tests</span>
                {testType === "security" && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-xs rounded-full">
                    Active
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Create Test Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {testType === "e2e"
                  ? "Create E2E Test"
                  : testType === "api"
                  ? "Create API Test"
                  : testType === "smoke"
                  ? "Create Smoke Test"
                  : testType === "unit"
                  ? "Create Unit Test"
                  : testType === "performance"
                  ? "Create Performance Test"
                  : "Create Security Test"}
              </h2>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("dashboard.project")} (Optional)
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">No project</option>
                  {projects?.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* E2E Form Fields */}
              {testType === "e2e" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("dashboard.url")} *
                    </label>
                    <input
                      type="url"
                      value={e2eUrl}
                      onChange={(e) => setE2eUrl(e.target.value)}
                      placeholder="https://example.com"
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("dashboard.prompt")} *
                    </label>
                    <textarea
                      value={e2ePrompt}
                      onChange={(e) => setE2ePrompt(e.target.value)}
                      placeholder="Describe what you want to test... (e.g., 'Login with valid credentials')"
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    />
                  </div>
                </>
              )}

              {/* API Form Fields */}
              {testType === "api" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Test Name *
                    </label>
                    <input
                      type="text"
                      value={apiName}
                      onChange={(e) => setApiName(e.target.value)}
                      placeholder="My API Test"
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Method *
                      </label>
                      <select
                        value={apiMethod}
                        onChange={(e) => setApiMethod(e.target.value as any)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        API Endpoint *
                      </label>
                      <input
                        type="url"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        placeholder="https://api.example.com/users"
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description (AI will generate assertions) *
                    </label>
                    <textarea
                      value={apiPrompt}
                      onChange={(e) => setApiPrompt(e.target.value)}
                      placeholder="Describe what you expect... (e.g., 'Should return 200 with user data')"
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    />
                  </div>
                </>
              )}

              {/* Smoke Form Fields */}
              {testType === "smoke" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Base URL *
                    </label>
                    <input
                      type="url"
                      value={smokeBaseUrl}
                      onChange={(e) => setSmokeBaseUrl(e.target.value)}
                      placeholder="https://api.example.com"
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Generation Type
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="description"
                          checked={smokeGenerationType === "description"}
                          onChange={(e) =>
                            setSmokeGenerationType(e.target.value as any)
                          }
                          className="mr-2"
                        />
                        Description
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="stack"
                          checked={smokeGenerationType === "stack"}
                          onChange={(e) =>
                            setSmokeGenerationType(e.target.value as any)
                          }
                          className="mr-2"
                        />
                        Tech Stack
                      </label>
                    </div>
                  </div>

                  {smokeGenerationType === "description" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description *
                      </label>
                      <textarea
                        value={smokePrompt}
                        onChange={(e) => setSmokePrompt(e.target.value)}
                        placeholder="Describe your application and critical endpoints... (e.g., 'E-commerce API with authentication, products, and payments')"
                        required
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                      />
                    </div>
                  )}

                  {smokeGenerationType === "stack" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tech Stack *
                      </label>
                      <select
                        value={smokeStack}
                        onChange={(e) => setSmokeStack(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select stack...</option>
                        <option value="Next.js">Next.js</option>
                        <option value="Express.js">Express.js</option>
                        <option value="Django">Django</option>
                        <option value="Flask">Flask</option>
                        <option value="Ruby on Rails">Ruby on Rails</option>
                        <option value="Spring Boot">Spring Boot</option>
                        <option value="Laravel">Laravel</option>
                        <option value="ASP.NET Core">ASP.NET Core</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-lg font-medium text-white transition-all ${
                  testType === "e2e"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : testType === "api"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                } ${
                  loading ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating{" "}
                    {testType === "e2e"
                      ? "E2E"
                      : testType === "api"
                      ? "API"
                      : "Smoke"}{" "}
                    test...
                  </span>
                ) : (
                  <span>
                    Create{" "}
                    {testType === "e2e"
                      ? "E2E"
                      : testType === "api"
                      ? "API"
                      : "Smoke"}{" "}
                    Test
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Quick Tips */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
              💡 Tips:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              {testType === "e2e" ? (
                <>
                  <li>
                    • Describe user actions clearly (e.g., "Click login button")
                  </li>
                  <li>
                    • Include expected outcomes (e.g., "Should see dashboard")
                  </li>
                  <li>• Use localhost URLs if testing local apps with agent</li>
                </>
              ) : testType === "api" ? (
                <>
                  <li>
                    • AI will generate assertions based on your description
                  </li>
                  <li>
                    • Specify expected status codes and response structure
                  </li>
                  <li>• Include authentication details if needed</li>
                </>
              ) : (
                <>
                  <li>• Smoke tests validate critical endpoints quickly</li>
                  <li>
                    • AI generates health checks based on your app description
                  </li>
                  <li>• Perfect for CI/CD pipelines and monitoring</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
