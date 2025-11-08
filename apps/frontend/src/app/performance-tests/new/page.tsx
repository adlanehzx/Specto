"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Sparkles } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function NewPerformanceTestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>(
    []
  );

  const [formData, setFormData] = useState({
    name: "",
    url: "",
    projectId: "",
    vus: 10,
    duration: "30s",
    rampUpTime: "10s",
    useAI: true,
    prompt: "",
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    try {
      const response = await api.get<{
        data: Array<{ id: string; name: string }>;
      }>("/api/projects");
      setProjects(response.data);
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        url: formData.url,
        projectId: formData.projectId || undefined,
        vus: formData.vus,
        duration: formData.duration,
        rampUpTime: formData.rampUpTime,
        prompt: formData.useAI ? formData.prompt : undefined,
      };

      const response = await api.post<{ data: { id: string } }>(
        "/api/performance-tests",
        payload
      );
      router.push(`/performance-tests/${response.data.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create performance test");
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }));
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <Link
              href="/performance-tests"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Performance Tests
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              New Performance Test
            </h1>
            <p className="text-gray-600 mt-2">
              Create a load test to measure your application's performance
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-sm p-6 space-y-6"
          >
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Test Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Homepage Load Test"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                required
                placeholder="https://example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                The URL to test (must be publicly accessible)
              </p>
            </div>

            {/* Project */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project (Optional)
              </label>
              <select
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Load Configuration */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Load Configuration
              </h3>

              <div className="grid grid-cols-3 gap-4">
                {/* Virtual Users */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Virtual Users (VUs)
                  </label>
                  <input
                    type="number"
                    name="vus"
                    value={formData.vus}
                    onChange={handleChange}
                    min="1"
                    max="1000"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Concurrent users</p>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    required
                    placeholder="30s"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    e.g., 30s, 2m, 1h
                  </p>
                </div>

                {/* Ramp Up */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ramp-Up Time
                  </label>
                  <input
                    type="text"
                    name="rampUpTime"
                    value={formData.rampUpTime}
                    onChange={handleChange}
                    required
                    placeholder="10s"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Gradual increase</p>
                </div>
              </div>
            </div>

            {/* AI Generation */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="useAI"
                  checked={formData.useAI}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      useAI: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label
                  htmlFor="useAI"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Use AI to enhance test script
                </label>
              </div>

              {formData.useAI && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Scenario (Optional)
                  </label>
                  <textarea
                    name="prompt"
                    value={formData.prompt}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe what you want to test, e.g., 'Test the login flow with multiple users' or 'Stress test the API with concurrent requests'"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    AI will generate custom k6 script based on your scenario.
                    Leave empty for basic GET request test.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Link
                href="/performance-tests"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Performance Test"}
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
