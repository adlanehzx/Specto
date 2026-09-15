"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  RocketIcon,
  Zap,
  Shield,
  Code2,
  Play,
  CheckCircle2,
  LogOut,
  LayoutDashboard,
  User,
  ArrowRight,
  Sparkles,
  Target,
  TrendingUp,
  Globe,
  FlaskConical,
  Gauge,
  GitBranch,
} from "lucide-react";

export default function LandingPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                <RocketIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Specto
              </span>
            </Link>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {user.email}
                    </span>
                  </div>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all font-medium"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 opacity-50" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-400 dark:bg-blue-600 rounded-full blur-3xl opacity-10" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-400 dark:bg-purple-600 rounded-full blur-3xl opacity-10" />

        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Testing Platform
            </div>

            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Test Smarter,
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Ship Faster
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              Generate, run, and heal E2E tests with AI. From simple prompts to
              production-ready test suites in minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href={user ? "/dashboard" : "/register"}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all font-semibold text-lg flex items-center gap-2"
              >
                {user ? "Go to Dashboard" : "Start Testing Free"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#features"
                className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl hover:shadow-lg transition-all font-semibold text-lg border-2 border-gray-200 dark:border-gray-700"
              >
                Learn More
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
              <div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  10K+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Tests Generated
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  99.9%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Uptime
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  50%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Faster Testing
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              All Your Tests,
              <span className="text-blue-600 dark:text-blue-400">
                {" "}
                One Platform
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              From E2E to security tests, we have got you covered
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                E2E Tests
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Test entire user flows with AI-generated Playwright scripts
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500">
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FlaskConical className="w-7 h-7 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Unit Tests
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Analyze functions and generate comprehensive unit test coverage
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-amber-500 dark:hover:border-amber-500">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Gauge className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Performance Tests
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Load test with k6 and get detailed performance metrics
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-500">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Security Scans
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                OWASP Top 10 vulnerability scanning with detailed reports
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Code2 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                API Tests
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Validate REST APIs with automated contract testing
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Smoke Tests
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Quick sanity checks for critical application flows
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 dark:bg-black text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                <RocketIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Specto</span>
            </div>

            <div className="flex gap-8 text-sm text-gray-400">
              <Link href="#" className="hover:text-white transition">
                Documentation
              </Link>
              <Link href="#" className="hover:text-white transition">
                GitHub
              </Link>
              <Link href="#" className="hover:text-white transition">
                Support
              </Link>
            </div>

            <p className="text-sm text-gray-500">
              © 2025 Specto. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
