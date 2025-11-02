"use client";

import { useEffect } from "react";
import { usePreferencesStore } from "@/stores/usePreferences";

export function useTheme() {
  const { preferences } = usePreferencesStore();
  const theme = preferences?.theme || "light"; // Fallback à "light" au lieu de "auto"

  useEffect(() => {
    const applyTheme = () => {
      const root = window.document.documentElement;

      // Supprimer les anciennes classes
      root.classList.remove("light", "dark");

      if (theme === "auto") {
        // Détecter la préférence système
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        const appliedTheme = prefersDark ? "dark" : "light";
        root.classList.add(appliedTheme);
        console.log(`[Theme] Auto mode detected: ${appliedTheme}`);
      } else {
        // Appliquer le thème choisi
        root.classList.add(theme);
        console.log(`[Theme] Applied theme: ${theme}`);
      }
    };

    applyTheme();

    // Écouter les changements de préférence système en mode auto
    if (theme === "auto") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        console.log("[Theme] System preference changed");
        applyTheme();
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  return { theme };
}
