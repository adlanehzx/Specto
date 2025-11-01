import { create } from "zustand";
import { UserPreferences } from "@/types/preferences";

interface PreferencesState {
  preferences: UserPreferences | null;
  setPreferences: (preferences: UserPreferences) => void;
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
  clearPreferences: () => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  preferences: null,

  setPreferences: (preferences) => set({ preferences }),

  updatePreference: (key, value) =>
    set((state) => ({
      preferences: state.preferences
        ? { ...state.preferences, [key]: value }
        : null,
    })),

  clearPreferences: () => set({ preferences: null }),
}));
