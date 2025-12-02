"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";

const navigation = [
  {
    name: "🚀 Getting Started",
    href: "/docs",
  },
  {
    name: "💻 CLI Guide",
    href: "/docs/cli",
  },
  {
    name: "🖥️ Desktop App",
    href: "/docs/desktop",
  },
  {
    name: "⚙️ CI/CD Integration",
    href: "/docs/cicd",
  },
  {
    name: "📚 API Reference",
    href: "/docs/api",
  },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Page Title */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">📖</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  LeynAI Documentation
                </h1>
                <p className="text-sm text-gray-500">
                  Complete guide to using LeynAI
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0">
              <nav className="sticky top-8 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                      flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                      ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-700"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }
                    `}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Quick Links */}
              <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Quick Links
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a
                      href="https://github.com/leynai/leynai-agent"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      GitHub Repository →
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.npmjs.com/package/leynai-agent"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      NPM Package →
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/dashboard"
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      Dashboard →
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Version Info */}
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-xs text-indigo-700">
                  <strong>Version:</strong> 1.0.0
                </p>
                <p className="text-xs text-indigo-600 mt-1">
                  Last updated: Nov 2025
                </p>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
