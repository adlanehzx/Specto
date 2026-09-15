"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Globe,
  Settings,
  LogOut,
  History,
  Bell,
  Folder,
  Code2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationsStore } from "@/stores/useNotifications";
import { useTranslation } from "@/contexts/TranslationContext";

interface MenuItem {
  icon: React.ReactNode;
  labelKey: string;
  href: string;
  badge?: string | number;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { t } = useTranslation();
  const unreadCount = useNotificationsStore((state) => state.unreadCount);

  const menuItems: MenuItem[] = [
    {
      icon: <LayoutDashboard className="w-5 h-5" />,
      labelKey: "navigation.dashboard",
      href: "/dashboard",
    },
    {
      icon: <Folder className="w-5 h-5" />,
      labelKey: "navigation.projects",
      href: "/projects",
    },
    {
      icon: <History className="w-5 h-5" />,
      labelKey: "navigation.history",
      href: "/history",
    },
    {
      icon: <Globe className="w-5 h-5" />,
      labelKey: "E2E Tests",
      href: "/tests",
    },
    {
      icon: <Code2 className="w-5 h-5" />,
      labelKey: "navigation.apiTests",
      href: "/api-tests",
    },
    {
      icon: (
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
      ),
      labelKey: "navigation.smokeTests",
      href: "/smoke-tests",
    },
    {
      icon: (
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
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      labelKey: "navigation.unitTests",
      href: "/unit-tests",
    },
    {
      icon: (
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
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      labelKey: "navigation.performanceTests",
      href: "/performance-tests",
    },
    {
      icon: (
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
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      labelKey: "navigation.securityTests",
      href: "/security-tests",
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      labelKey: "navigation.scheduled",
      href: "/scheduled",
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      labelKey: "navigation.analytics",
      href: "/analytics",
    },
    {
      icon: <Bell className="w-5 h-5" />,
      labelKey: "navigation.notifications",
      href: "/notifications",
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      icon: <Globe className="w-5 h-5" />,
      labelKey: "navigation.tunnels",
      href: "/tunnels",
    },
  ];

  const isActive = (href: string) => {
    return pathname === href;
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-40">
      {/* Logo / Brand */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Specto
          </span>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center justify-between px-3 py-2.5 rounded-lg
                transition-all duration-200 group
                ${
                  active
                    ? "bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <span
                  className={`
                    ${
                      active
                        ? "text-purple-600"
                        : "text-gray-500 group-hover:text-gray-700"
                    }
                  `}
                >
                  {item.icon}
                </span>
                <span className="text-sm">{t(item.labelKey)}</span>
              </div>

              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section - Settings & Logout */}
      <div className="border-t border-gray-200 p-3 space-y-1">
        <Link
          href="/settings"
          className={`
            flex items-center space-x-3 px-3 py-2.5 rounded-lg
            transition-all duration-200
            ${
              isActive("/settings")
                ? "bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 font-semibold"
                : "text-gray-700 hover:bg-gray-50"
            }
          `}
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm">{t("navigation.settings")}</span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">{t("navigation.logout")}</span>
        </button>
      </div>
    </aside>
  );
}
