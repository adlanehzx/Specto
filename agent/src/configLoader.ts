/**
 * Configuration Loader for leynai.json
 * Loads and validates test configuration for CI/CD integration
 */

import * as fs from "fs";
import * as path from "path";

/**
 * LeynAI configuration schema
 */
export interface LeynAIConfig {
  /** Backend server URL */
  server: string;
  /** API key for authentication (can use ${ENV_VAR} syntax) */
  apiKey: string;
  /** Project ID or name */
  project: string;
  /** Environment configurations */
  environments?: {
    [name: string]: {
      baseUrl?: string;
      variables?: Record<string, string>;
    };
  };
  /** Tests to run */
  tests?: {
    e2e?: string[];
    api?: string[];
    unit?: string[];
    smoke?: string[];
    performance?: string[];
    security?: string[];
  };
  /** Execution options */
  options?: {
    parallel?: number;
    timeout?: number;
    retries?: number;
    bail?: boolean;
  };
}

/**
 * Load configuration from file
 */
export function loadConfig(configPath: string = "leynai.json"): LeynAIConfig {
  // Resolve absolute path
  const absolutePath = path.isAbsolute(configPath)
    ? configPath
    : path.join(process.cwd(), configPath);

  // Check if file exists
  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      `Configuration file not found: ${absolutePath}\n` +
        `Run 'leynai init' to create a configuration file.`
    );
  }

  // Read and parse JSON
  let config: LeynAIConfig;
  try {
    const content = fs.readFileSync(absolutePath, "utf-8");
    config = JSON.parse(content);
  } catch (error: any) {
    throw new Error(
      `Failed to parse configuration file: ${error.message}\n` +
        `Make sure ${configPath} contains valid JSON.`
    );
  }

  // Validate required fields
  if (!config.server) {
    throw new Error("Configuration missing required field: server");
  }
  if (!config.apiKey) {
    throw new Error("Configuration missing required field: apiKey");
  }
  if (!config.project) {
    throw new Error("Configuration missing required field: project");
  }

  // Expand environment variables in apiKey
  config.apiKey = expandEnvVars(config.apiKey);

  // Expand environment variables in environment configurations
  if (config.environments) {
    for (const [envName, envConfig] of Object.entries(config.environments)) {
      if (envConfig.baseUrl) {
        envConfig.baseUrl = expandEnvVars(envConfig.baseUrl);
      }
      if (envConfig.variables) {
        for (const [key, value] of Object.entries(envConfig.variables)) {
          envConfig.variables[key] = expandEnvVars(value);
        }
      }
    }
  }

  return config;
}

/**
 * Expand environment variables in string
 * Supports ${VAR_NAME} syntax
 */
function expandEnvVars(str: string): string {
  return str.replace(/\$\{([^}]+)\}/g, (match, varName) => {
    const value = process.env[varName];
    if (value === undefined) {
      throw new Error(
        `Environment variable not found: ${varName}\n` +
          `Make sure to set ${varName} before running tests.`
      );
    }
    return value;
  });
}

/**
 * Validate configuration
 */
export function validateConfig(config: LeynAIConfig): string[] {
  const errors: string[] = [];

  // Validate server URL
  try {
    new URL(config.server);
  } catch {
    errors.push("Invalid server URL");
  }

  // Validate apiKey is not empty after expansion
  if (!config.apiKey || config.apiKey.trim() === "") {
    errors.push("apiKey cannot be empty");
  }

  // Validate project ID
  if (!config.project || config.project.trim() === "") {
    errors.push("project cannot be empty");
  }

  // Validate test arrays
  if (config.tests) {
    if (config.tests.e2e && !Array.isArray(config.tests.e2e)) {
      errors.push("tests.e2e must be an array");
    }
    if (config.tests.api && !Array.isArray(config.tests.api)) {
      errors.push("tests.api must be an array");
    }
  }

  // Validate options
  if (config.options) {
    if (config.options.parallel && config.options.parallel < 1) {
      errors.push("options.parallel must be >= 1");
    }
    if (config.options.timeout && config.options.timeout < 0) {
      errors.push("options.timeout must be >= 0");
    }
    if (config.options.retries && config.options.retries < 0) {
      errors.push("options.retries must be >= 0");
    }
  }

  return errors;
}

/**
 * Generate default configuration
 */
export function generateDefaultConfig(): LeynAIConfig {
  return {
    server: "https://api.leynai.com",
    apiKey: "${LEYNAI_API_KEY}",
    project: "my-project-id",
    environments: {
      staging: {
        baseUrl: "https://staging.example.com",
        variables: {
          API_URL: "https://api.staging.example.com",
        },
      },
      production: {
        baseUrl: "https://example.com",
        variables: {
          API_URL: "https://api.example.com",
        },
      },
    },
    tests: {
      e2e: ["login-test", "checkout-test"],
      api: ["health-check", "create-user"],
    },
    options: {
      parallel: 3,
      timeout: 30000,
      retries: 2,
      bail: false,
    },
  };
}

/**
 * Save configuration to file
 */
export function saveConfig(
  config: LeynAIConfig,
  configPath: string = "leynai.json"
): void {
  const absolutePath = path.isAbsolute(configPath)
    ? configPath
    : path.join(process.cwd(), configPath);

  fs.writeFileSync(absolutePath, JSON.stringify(config, null, 2), "utf-8");
}
