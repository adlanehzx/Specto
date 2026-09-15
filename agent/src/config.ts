/**
 * Configuration Management
 * Stores user credentials and settings persistently
 */

import Conf from "conf";
import chalk from "chalk";

interface AgentConfig {
  authToken?: string;
  backendUrl?: string;
  ports?: number[];
  email?: string;
}

// Create config store
const config = new Conf<AgentConfig>({
  projectName: "specto-agent",
  schema: {
    authToken: {
      type: "string",
    },
    backendUrl: {
      type: "string",
      default: "http://localhost:4000",
    },
    ports: {
      type: "array",
      default: [3000, 8080, 5173],
    },
    email: {
      type: "string",
    },
  },
});

/**
 * Set authentication token
 */
export function setAuthToken(token: string, email?: string): void {
  config.set("authToken", token);
  if (email) {
    config.set("email", email);
  }
  console.log(chalk.green("✓ Authentication token saved"));
}

/**
 * Get authentication token
 */
export function getAuthToken(): string | undefined {
  return config.get("authToken");
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!config.get("authToken");
}

/**
 * Clear authentication (logout)
 */
export function clearAuth(): void {
  config.delete("authToken");
  config.delete("email");
  console.log(chalk.green("✓ Logged out successfully"));
}

/**
 * Set backend URL
 */
export function setBackendUrl(url: string): void {
  config.set("backendUrl", url);
}

/**
 * Get backend URL
 */
export function getBackendUrl(): string {
  return config.get("backendUrl") || "http://localhost:4000";
}

/**
 * Set ports to monitor
 */
export function setPorts(ports: number[]): void {
  config.set("ports", ports);
}

/**
 * Get ports to monitor
 */
export function getPorts(): number[] {
  return config.get("ports") || [3000, 8080, 5173];
}

/**
 * Get user email
 */
export function getUserEmail(): string | undefined {
  return config.get("email");
}

/**
 * Get all config
 */
export function getConfig(): AgentConfig {
  return config.store;
}

/**
 * Clear all config
 */
export function clearConfig(): void {
  config.clear();
}

/**
 * Config interface for external use
 */
export interface Config {
  server: string;
  apiKey: string;
  project?: string;
}

/**
 * Load config for API calls
 */
export function loadConfig(): Config {
  const authToken = getAuthToken();
  const backendUrl = getBackendUrl();

  if (!authToken) {
    throw new Error(
      'Not authenticated. Please run "specto-agent login" first.'
    );
  }

  return {
    server: backendUrl,
    apiKey: authToken,
  };
}

export default config;
