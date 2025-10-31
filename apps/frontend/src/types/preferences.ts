export interface UserPreferences {
  id: string;
  userId: string;
  language: "en" | "fr";
  timezone: string;
  emailNotifications: boolean;
  slackNotifications: boolean;
  uiNotifications: boolean;
  theme: "light" | "dark" | "auto";
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePreferencesPayload {
  language?: "en" | "fr";
  timezone?: string;
  emailNotifications?: boolean;
  slackNotifications?: boolean;
  uiNotifications?: boolean;
  theme?: "light" | "dark" | "auto";
}
