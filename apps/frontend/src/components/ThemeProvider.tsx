"use client";

import { useTheme } from "@/hooks/useTheme";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferencesStore } from "@/stores/usePreferences";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token } = useAuth();
  const { setPreferences } = usePreferencesStore();

  // Charger les préférences au démarrage
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user || !token) return;

      try {
        const response = await fetch(
          `${API_URL}/api/users/${user.id}/preferences`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          const data = result.data || result;
          setPreferences(data);
        }
      } catch (error) {
        console.error("Failed to load preferences in ThemeProvider:", error);
      }
    };

    loadPreferences();
  }, [user, token, setPreferences]);

  useTheme(); // Applique automatiquement le thème

  return <>{children}</>;
}
