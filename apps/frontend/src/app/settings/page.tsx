"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferencesStore } from "@/stores/usePreferences";
import { useTranslation } from "@/contexts/TranslationContext";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "react-toastify";
import type {
  UserPreferences,
  UpdatePreferencesPayload,
} from "@/types/preferences";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function SettingsPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { preferences, setPreferences } = usePreferencesStore();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Form state
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [timezone, setTimezone] = useState("UTC");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [slackNotifications, setSlackNotifications] = useState(false);
  const [uiNotifications, setUiNotifications] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("auto");

  // Detect user's timezone automatically
  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log("Detected timezone:", detectedTimezone);
    // Only set if still default UTC
    if (timezone === "UTC") {
      setTimezone(detectedTimezone);
    }
  }, []);

  // Load preferences on mount
  useEffect(() => {
    if (!user || !token) {
      router.push("/login");
      return;
    }

    const fetchPreferences = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/users/${user.id}/preferences`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch preferences");
        }

        const result = await response.json();
        const data: UserPreferences = result.data || result;
        setPreferences(data);

        // Update form state
        setLanguage(data.language);
        // Only override detected timezone if user has explicitly set one
        if (data.timezone && data.timezone !== "UTC") {
          setTimezone(data.timezone);
        } else {
          // Use detected timezone if user hasn't set one
          const detectedTimezone =
            Intl.DateTimeFormat().resolvedOptions().timeZone;
          setTimezone(detectedTimezone);
        }
        setEmailNotifications(data.emailNotifications);
        setSlackNotifications(data.slackNotifications);
        setUiNotifications(data.uiNotifications);
        setTheme(data.theme);
      } catch (error) {
        console.error("Failed to load preferences:", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Ne charger qu'une seule fois au mount

  // Auto-save function with debounce
  const autoSave = useCallback(async () => {
    if (!user || !token) return;

    setAutoSaveStatus("saving");

    try {
      const payload: UpdatePreferencesPayload = {
        language,
        timezone,
        emailNotifications,
        slackNotifications,
        uiNotifications,
        theme,
      };

      const response = await fetch(
        `${API_URL}/api/users/${user.id}/preferences`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      const result = await response.json();
      const updatedPreferences: UserPreferences = result.data || result;

      // Update Zustand store with new preferences
      setPreferences(updatedPreferences);

      setAutoSaveStatus("saved");

      // Reset status after 2 seconds
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast.error("Failed to save settings");
      setAutoSaveStatus("idle");
    }
  }, [
    user,
    token,
    language,
    timezone,
    emailNotifications,
    slackNotifications,
    uiNotifications,
    theme,
    setPreferences,
  ]);

  // Trigger auto-save when settings change
  useEffect(() => {
    // Don't auto-save on initial load
    if (loading) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout (debounce for 1 second)
    saveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 1000);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    language,
    timezone,
    emailNotifications,
    slackNotifications,
    uiNotifications,
    theme,
    loading,
    autoSave,
  ]);

  const handleSave = async () => {
    if (!user || !token) return;

    setSaving(true);

    try {
      const payload: UpdatePreferencesPayload = {
        language,
        timezone,
        emailNotifications,
        slackNotifications,
        uiNotifications,
        theme,
      };

      const response = await fetch(
        `${API_URL}/api/users/${user.id}/preferences`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      const result = await response.json();
      const updatedPreferences: UserPreferences = result.data || result;

      // Update Zustand store with new preferences
      setPreferences(updatedPreferences);

      toast.success(t("settings.successMessage"));
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast.error(t("settings.errorMessage"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
          {autoSaveStatus === "saving" && (
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              {t("settings.saving")}
            </span>
          )}
          {autoSaveStatus === "saved" && (
            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {t("settings.saved")}
            </span>
          )}
        </div>

        <div className="space-y-8">
          {/* Profile Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {t("settings.profile.title")}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("settings.profile.email")}
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {t("settings.preferences.title")}
            </h2>
            <div className="space-y-6">
              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("settings.preferences.language.label")}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "en" | "fr")}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">
                    {t("settings.preferences.language.english")}
                  </option>
                  <option value="fr">
                    {t("settings.preferences.language.french")}
                  </option>
                </select>
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("settings.preferences.timezone.label")}
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <optgroup label="🌍 Europe">
                    <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                    <option value="Europe/London">Europe/London (GMT+0)</option>
                    <option value="Europe/Berlin">Europe/Berlin (GMT+1)</option>
                    <option value="Europe/Madrid">Europe/Madrid (GMT+1)</option>
                    <option value="Europe/Rome">Europe/Rome (GMT+1)</option>
                    <option value="Europe/Amsterdam">
                      Europe/Amsterdam (GMT+1)
                    </option>
                    <option value="Europe/Brussels">
                      Europe/Brussels (GMT+1)
                    </option>
                    <option value="Europe/Zurich">Europe/Zurich (GMT+1)</option>
                    <option value="Europe/Moscow">Europe/Moscow (GMT+3)</option>
                  </optgroup>
                  <optgroup label="🌎 Amérique du Nord">
                    <option value="America/New_York">
                      America/New_York (EST)
                    </option>
                    <option value="America/Chicago">
                      America/Chicago (CST)
                    </option>
                    <option value="America/Denver">America/Denver (MST)</option>
                    <option value="America/Los_Angeles">
                      America/Los_Angeles (PST)
                    </option>
                    <option value="America/Toronto">
                      America/Toronto (EST)
                    </option>
                    <option value="America/Vancouver">
                      America/Vancouver (PST)
                    </option>
                    <option value="America/Mexico_City">
                      America/Mexico_City (CST)
                    </option>
                  </optgroup>
                  <optgroup label="🌏 Asie">
                    <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                    <option value="Asia/Shanghai">Asia/Shanghai (GMT+8)</option>
                    <option value="Asia/Hong_Kong">
                      Asia/Hong_Kong (GMT+8)
                    </option>
                    <option value="Asia/Singapore">
                      Asia/Singapore (GMT+8)
                    </option>
                    <option value="Asia/Seoul">Asia/Seoul (GMT+9)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                    <option value="Asia/Kolkata">
                      Asia/Kolkata (GMT+5:30)
                    </option>
                    <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                  </optgroup>
                  <optgroup label="🌍 Afrique">
                    <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
                    <option value="Africa/Johannesburg">
                      Africa/Johannesburg (GMT+2)
                    </option>
                    <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                    <option value="Africa/Nairobi">
                      Africa/Nairobi (GMT+3)
                    </option>
                    <option value="Africa/Casablanca">
                      Africa/Casablanca (GMT+1)
                    </option>
                    <option value="Africa/Algiers">
                      Africa/Algiers (GMT+1)
                    </option>
                    <option value="Africa/Tunis">Africa/Tunis (GMT+1)</option>
                  </optgroup>
                  <optgroup label="🌏 Océanie">
                    <option value="Australia/Sydney">
                      Australia/Sydney (GMT+11)
                    </option>
                    <option value="Australia/Melbourne">
                      Australia/Melbourne (GMT+11)
                    </option>
                    <option value="Australia/Brisbane">
                      Australia/Brisbane (GMT+10)
                    </option>
                    <option value="Australia/Perth">
                      Australia/Perth (GMT+8)
                    </option>
                    <option value="Pacific/Auckland">
                      Pacific/Auckland (GMT+13)
                    </option>
                  </optgroup>
                  <optgroup label="🌎 Amérique du Sud">
                    <option value="America/Sao_Paulo">
                      America/Sao_Paulo (GMT-3)
                    </option>
                    <option value="America/Buenos_Aires">
                      America/Buenos_Aires (GMT-3)
                    </option>
                    <option value="America/Santiago">
                      America/Santiago (GMT-3)
                    </option>
                    <option value="America/Lima">America/Lima (GMT-5)</option>
                    <option value="America/Bogota">
                      America/Bogota (GMT-5)
                    </option>
                  </optgroup>
                  <optgroup label="⚙️ Autres">
                    <option value="UTC">UTC (Universal Time)</option>
                  </optgroup>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {timezone ===
                    Intl.DateTimeFormat().resolvedOptions().timeZone && (
                    <span className="text-green-600 dark:text-green-400">
                      {t("settings.preferences.timezone.autoDetected")}
                    </span>
                  )}
                </p>
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("settings.preferences.theme.label")}
                </label>
                <select
                  value={theme}
                  onChange={(e) => {
                    const newTheme = e.target.value as
                      | "light"
                      | "dark"
                      | "auto";
                    setTheme(newTheme);
                    // Aperçu immédiat (temporaire, sera permanent après Save)
                    const root = window.document.documentElement;
                    root.classList.remove("light", "dark");
                    if (newTheme === "auto") {
                      const prefersDark = window.matchMedia(
                        "(prefers-color-scheme: dark)"
                      ).matches;
                      root.classList.add(prefersDark ? "dark" : "light");
                    } else {
                      root.classList.add(newTheme);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">
                    {t("settings.preferences.theme.light")}
                  </option>
                  <option value="dark">
                    {t("settings.preferences.theme.dark")}
                  </option>
                  <option value="auto">
                    {t("settings.preferences.theme.auto")}
                  </option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {theme === "auto"
                    ? t("settings.preferences.theme.autoHint")
                    : theme === "light"
                    ? t("settings.preferences.theme.lightHint")
                    : t("settings.preferences.theme.darkHint")}
                </p>
              </div>

              {/* Notification Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  {t("settings.preferences.notifications.title")}
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t("settings.preferences.notifications.email")}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={slackNotifications}
                      onChange={(e) => setSlackNotifications(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t("settings.preferences.notifications.slack")}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={uiNotifications}
                      onChange={(e) => setUiNotifications(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t("settings.preferences.notifications.ui")}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? `${t("settings.saving")}` : t("settings.saveButton")}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
