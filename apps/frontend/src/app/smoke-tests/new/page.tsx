"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

interface Project {
  id: string;
  name: string;
}

interface Endpoint {
  url: string;
  method: string;
  expectedStatus: number;
  description: string;
  timeout: number;
}

export default function NewSmokeTestPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [mode, setMode] = useState<"manual" | "ai">("ai");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [projectId, setProjectId] = useState("");
  const [endpoints, setEndpoints] = useState<Endpoint[]>([
    {
      url: "",
      method: "GET",
      expectedStatus: 200,
      description: "",
      timeout: 3000,
    },
  ]);

  // AI fields
  const [aiPrompt, setAiPrompt] = useState("");
  const [generationType, setGenerationType] = useState<"description" | "stack">(
    "description"
  );
  const [stack, setStack] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const addEndpoint = () => {
    setEndpoints([
      ...endpoints,
      {
        url: "",
        method: "GET",
        expectedStatus: 200,
        description: "",
        timeout: 3000,
      },
    ]);
  };

  const removeEndpoint = (index: number) => {
    setEndpoints(endpoints.filter((_, i) => i !== index));
  };

  const updateEndpoint = (index: number, field: keyof Endpoint, value: any) => {
    const updated = [...endpoints];
    updated[index] = { ...updated[index], [field]: value };
    setEndpoints(updated);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:4000/api/smoke-tests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          baseUrl,
          projectId: projectId || null,
          endpoints: endpoints.filter((e) => e.url), // Only include endpoints with URLs
          retryOnFailure: true,
          maxRetries: 3,
          retryDelayMs: 1000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/smoke-tests/${data.id}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating smoke test:", error);
      alert("Failed to create smoke test");
    } finally {
      setLoading(false);
    }
  };

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:4000/api/smoke-tests/generate",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            baseUrl,
            description:
              generationType === "description" ? aiPrompt : undefined,
            stack: generationType === "stack" ? stack : undefined,
            generationType,
            projectId: projectId || null,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        router.push(`/smoke-tests/${data.smokeTest.id}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error generating smoke test:", error);
      alert("Failed to generate smoke test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Create Smoke Test
            </h1>
            <p className="text-gray-600 mt-2">
              Validate critical endpoints with quick health checks
            </p>
          </div>

          {/* Mode selector */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setMode("ai")}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                  mode === "ai"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                🤖 AI Generation
              </button>
              <button
                onClick={() => setMode("manual")}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                  mode === "manual"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                ✍️ Manual Entry
              </button>
            </div>
          </div>

          {/* AI Mode */}
          {mode === "ai" && (
            <form
              onSubmit={handleAISubmit}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base URL *
                  </label>
                  <input
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="https://api.example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project (Optional)
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">No Project</option>
                    {projects?.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generation Type
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="description"
                        checked={generationType === "description"}
                        onChange={(e) =>
                          setGenerationType(e.target.value as any)
                        }
                        className="mr-2"
                      />
                      Description
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="stack"
                        checked={generationType === "stack"}
                        onChange={(e) =>
                          setGenerationType(e.target.value as any)
                        }
                        className="mr-2"
                      />
                      Tech Stack
                    </label>
                  </div>
                </div>

                {generationType === "description" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={6}
                      placeholder="Describe your application and the critical endpoints to test. Example: 'E-commerce API with user authentication, product catalog, shopping cart, and payment processing.'"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      AI will analyze your description and generate appropriate
                      smoke tests
                    </p>
                  </div>
                )}

                {generationType === "stack" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tech Stack *
                    </label>
                    <select
                      value={stack}
                      onChange={(e) => setStack(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
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
                    <p className="text-sm text-gray-500 mt-2">
                      AI will generate smoke tests based on common patterns for
                      this stack
                    </p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => router.push("/smoke-tests")}
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Generating..." : "🤖 Generate with AI"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Manual Mode */}
          {mode === "manual" && (
            <form
              onSubmit={handleManualSubmit}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Production API Health Check"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={3}
                    placeholder="Quick validation of critical endpoints"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base URL *
                  </label>
                  <input
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="https://api.example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project (Optional)
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">No Project</option>
                    {projects?.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Endpoints *
                    </label>
                    <button
                      type="button"
                      onClick={addEndpoint}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                    >
                      + Add Endpoint
                    </button>
                  </div>

                  <div className="space-y-4">
                    {endpoints.map((endpoint, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium text-gray-900">
                            Endpoint {index + 1}
                          </h4>
                          {endpoints.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeEndpoint(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className="block text-sm text-gray-600 mb-1">
                              URL
                            </label>
                            <input
                              type="text"
                              value={endpoint.url}
                              onChange={(e) =>
                                updateEndpoint(index, "url", e.target.value)
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="/api/health or https://api.example.com/health"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Method
                            </label>
                            <select
                              value={endpoint.method}
                              onChange={(e) =>
                                updateEndpoint(index, "method", e.target.value)
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                              <option value="GET">GET</option>
                              <option value="POST">POST</option>
                              <option value="PUT">PUT</option>
                              <option value="DELETE">DELETE</option>
                              <option value="PATCH">PATCH</option>
                              <option value="HEAD">HEAD</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Expected Status
                            </label>
                            <input
                              type="number"
                              value={endpoint.expectedStatus}
                              onChange={(e) =>
                                updateEndpoint(
                                  index,
                                  "expectedStatus",
                                  parseInt(e.target.value)
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              min="100"
                              max="599"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Timeout (ms)
                            </label>
                            <input
                              type="number"
                              value={endpoint.timeout}
                              onChange={(e) =>
                                updateEndpoint(
                                  index,
                                  "timeout",
                                  parseInt(e.target.value)
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              min="1000"
                              step="1000"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={endpoint.description}
                              onChange={(e) =>
                                updateEndpoint(
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="Health check endpoint"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => router.push("/smoke-tests")}
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating..." : "Create Smoke Test"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
