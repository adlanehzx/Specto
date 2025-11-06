"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { RocketIcon, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <RocketIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              LeynAI
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t("auth.login.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t("auth.login.subtitle")}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* OAuth Buttons */}
          <div className="mb-6 flex flex-col gap-3">
            <a
              href={`${
                process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
              }/api/auth/github`}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.292 9.386 7.86 10.9.574.106.782-.25.782-.556 0-.274-.01-1-.016-1.96-3.197.694-3.874-1.374-3.874-1.374-.522-1.326-1.276-1.68-1.276-1.68-1.044-.714.08-.7.08-.7 1.154.08 1.762 1.186 1.762 1.186 1.026 1.756 2.694 1.25 3.352.956.104-.746.402-1.25.73-1.538-2.553-.29-5.238-1.277-5.238-5.684 0-1.255.45-2.28 1.184-3.086-.12-.29-.513-1.456.112-3.035 0 0 .966-.31 3.166 1.178.92-.256 1.9-.384 2.878-.388.976.004 1.957.132 2.88.388 2.198-1.488 3.164-1.178 3.164-1.178.628 1.58.236 2.746.116 3.036.737.806 1.18 1.83 1.18 3.085 0 4.418-2.69 5.39-5.253 5.676.414.357.782 1.06.782 2.14 0 1.546-.014 2.796-.014 3.176 0 .31.204.67.788.556C20.71 21.383 24 17.08 24 12 24 5.65 18.35.5 12 .5z" />
              </svg>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t("auth.login.continueWithGitHub")}
              </span>
            </a>

            <a
              href={`${
                process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
              }/api/auth/google`}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M21.805 10.023h-9.58v3.953h5.526c-.238 1.34-1.617 3.927-5.526 3.927-3.322 0-6.023-2.748-6.023-6.13s2.701-6.13 6.023-6.13c1.892 0 3.159.806 3.883 1.502l2.639-2.538C18.162 3.08 15.72 2 12.226 2 6.227 2 1.22 6.983 1.22 12.99s5.007 10.99 11.006 10.99c6.337 0 10.548-4.444 10.548-10.727 0-.643-.07-1.14-.17-1.23z" />
              </svg>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t("auth.login.continueWithGoogle")}
              </span>
            </a>

            <a
              href={`${
                process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
              }/api/auth/slack`}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M5.5 3.5c0-1.105-.897-2-2-2S1.5 2.395 1.5 3.5 2.397 5.5 3.5 5.5h2.0V3.5zM16.5 3.5c0-1.105-.897-2-2-2s-2 .895-2 2 0 2 .0 2h2.0V3.5zM5.5 14.5c0 1.105.897 2 2 2s2-.895 2-2-0-2-2-2h-2v2zM16.5 14.5c0 1.105.897 2 2 2s2-.895 2-2-0-2-2-2h-2v2z" />
              </svg>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t("auth.login.continueWithSlack")}
              </span>
            </a>

            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t("auth.login.or")}
              </div>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t("auth.login.email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition"
                placeholder="vous@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t("auth.login.password")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("auth.login.submit")}...
                </>
              ) : (
                t("auth.login.submit")
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {t("auth.login.noAccount")}{" "}
              <Link
                href="/register"
                className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition"
              >
                {t("auth.login.signUp")}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition text-sm"
          >
            ← {t("auth.login.backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
