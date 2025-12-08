/**
 * CLI Command Implementations
 * Handles user commands for the LeynAI agent
 */

import axios from "axios";
import chalk from "chalk";
import ora from "ora";
import { spawn, ChildProcess } from "child_process";
import * as fs from "fs";
import * as fse from "fs-extra";
import * as path from "path";
import * as os from "os";
import {
  setAuthToken,
  getAuthToken,
  clearAuth,
  isAuthenticated,
  getBackendUrl,
  setBackendUrl,
  getPorts,
  setPorts,
  getUserEmail,
  loadConfig,
} from "./config.js";
import {
  analyzeProject,
  scoreFunctionsWithAI,
  type ScoredFunction,
} from "./analyzer.js";

interface LoginOptions {
  email?: string;
  password?: string;
  token?: string;
  backend?: string;
}

interface StartOptions {
  daemon?: boolean;
  ports?: string;
  backend?: string;
}

/**
 * Login command - Authenticate with LeynAI backend
 */
export async function login(options: LoginOptions): Promise<void> {
  try {
    const backendUrl = options.backend || getBackendUrl();
    setBackendUrl(backendUrl);

    let token: string;

    // Direct token login
    if (options.token) {
      token = options.token;
      console.log(chalk.blue("ℹ Using provided authentication token"));
    }
    // Email/password login
    else if (options.email && options.password) {
      const spinner = ora("Authenticating...").start();

      try {
        const response = await axios.post(`${backendUrl}/api/auth/login`, {
          email: options.email,
          password: options.password,
        });

        token = response.data.token;
        spinner.succeed("Authentication successful");
      } catch (error: any) {
        spinner.fail("Authentication failed");
        if (error.response) {
          throw new Error(
            `Login failed: ${
              error.response.data.error || error.response.statusText
            }`
          );
        }
        throw error;
      }
    }
    // Prompt for credentials
    else {
      throw new Error(
        "Please provide either --email and --password, or --token"
      );
    }

    // Validate token with backend
    const spinner = ora("Validating token...").start();
    try {
      await axios.get(`${backendUrl}/api/agent/tunnels`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      spinner.succeed("Token validated");
    } catch (error: any) {
      spinner.fail("Token validation failed");
      throw new Error("Invalid token or backend unreachable");
    }

    // Save credentials
    setAuthToken(token, options.email);

    console.log(chalk.green("\n✓ Successfully logged in!"));
    console.log(chalk.gray(`Backend: ${backendUrl}`));
    if (options.email) {
      console.log(chalk.gray(`Email: ${options.email}`));
    }
    console.log(chalk.yellow('\nRun "leynai-agent start" to begin monitoring'));
  } catch (error: any) {
    console.error(chalk.red("✗ Login failed:"), error.message);
    throw error;
  }
}

/**
 * Start command - Start the LeynAI agent
 */
export async function start(options: StartOptions): Promise<void> {
  try {
    // Check authentication
    if (!isAuthenticated()) {
      throw new Error(
        'Not authenticated. Please run "leynai-agent login" first'
      );
    }

    const backendUrl = options.backend || getBackendUrl();
    if (options.backend) {
      setBackendUrl(backendUrl);
    }

    // Parse ports
    let ports = getPorts();
    if (options.ports) {
      ports = options.ports.split(",").map((p) => parseInt(p.trim()));
      setPorts(ports);
    }

    console.log(chalk.blue("\n🚀 Starting LeynAI Agent\n"));
    console.log(chalk.gray(`Backend: ${backendUrl}`));
    console.log(chalk.gray(`Monitoring ports: ${ports.join(", ")}`));
    console.log(chalk.gray(`Email: ${getUserEmail() || "N/A"}\n`));

    // Daemon mode - run in background
    if (options.daemon) {
      await startDaemon(backendUrl, ports);
    }
    // Foreground mode - run directly
    else {
      await startForeground(backendUrl, ports);
    }
  } catch (error: any) {
    console.error(chalk.red("✗ Failed to start agent:"), error.message);
    throw error;
  }
}

/**
 * Start agent in foreground mode
 */
async function startForeground(
  backendUrl: string,
  ports: number[]
): Promise<void> {
  const token = getAuthToken()!;

  // Dynamic import to avoid circular dependency
  const { LeynAIAgent } = await import("./agent.js");

  const agent = new LeynAIAgent({
    authToken: token,
    backendUrl,
    ports,
  });

  console.log(chalk.yellow("Starting agent... (Press Ctrl+C to stop)\n"));

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log(chalk.yellow("\n\nStopping agent..."));
    await agent.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log(chalk.yellow("\n\nStopping agent..."));
    await agent.stop();
    process.exit(0);
  });

  await agent.start();
}

/**
 * Start agent in daemon mode (background process)
 */
async function startDaemon(backendUrl: string, ports: number[]): Promise<void> {
  const pidFile = getPidFilePath();

  // Check if already running
  if (fs.existsSync(pidFile)) {
    const pid = parseInt(fs.readFileSync(pidFile, "utf-8"));
    if (isProcessRunning(pid)) {
      throw new Error(`Agent already running (PID: ${pid})`);
    }
  }

  console.log(chalk.yellow("Starting agent in daemon mode...\n"));

  // Create daemon process
  // Pass both the canonical env names (AUTH_TOKEN, BACKEND_URL, PORTS)
  // and the legacy LEYNAI_* names for backward compatibility.
  const child = spawn(process.execPath, [path.join(__dirname, "index.js")], {
    detached: true,
    stdio: "ignore",
    env: {
      ...process.env,
      // canonical names expected by src/index.ts
      AUTH_TOKEN: getAuthToken()!,
      BACKEND_URL: backendUrl,
      PORTS: ports.join(","),
      // legacy names (kept to avoid breaking older installs)
      LEYNAI_AUTH_TOKEN: getAuthToken()!,
      LEYNAI_BACKEND_URL: backendUrl,
      LEYNAI_PORTS: ports.join(","),
    },
  });

  child.unref();

  // Save PID
  fs.writeFileSync(pidFile, child.pid!.toString());

  console.log(chalk.green(`✓ Agent started in background (PID: ${child.pid})`));
  console.log(chalk.gray('Run "leynai-agent status" to check status'));
  console.log(chalk.gray('Run "leynai-agent stop" to stop the agent'));
}

/**
 * Stop command - Stop the running agent
 */
export async function stop(): Promise<void> {
  try {
    // Check authentication
    if (!isAuthenticated()) {
      throw new Error(
        'Not authenticated. Please run "leynai-agent login" first'
      );
    }

    const pidFile = getPidFilePath();

    if (!fs.existsSync(pidFile)) {
      console.log(chalk.yellow("⚠ No running agent found"));
      return;
    }

    const pid = parseInt(fs.readFileSync(pidFile, "utf-8"));

    if (!isProcessRunning(pid)) {
      console.log(chalk.yellow("⚠ Agent process not running"));
      fs.unlinkSync(pidFile);
      return;
    }

    console.log(chalk.yellow(`Stopping agent (PID: ${pid})...`));

    // Kill the process
    process.kill(pid, "SIGTERM");

    // Wait for process to die
    await new Promise((resolve) => setTimeout(resolve, 2000));

    fs.unlinkSync(pidFile);
    console.log(chalk.green("✓ Agent stopped"));
  } catch (error: any) {
    console.error(chalk.red("✗ Failed to stop agent:"), error.message);
    throw error;
  }
}

/**
 * Status command - Show agent status
 */
export async function status(): Promise<void> {
  try {
    const pidFile = getPidFilePath();

    console.log(chalk.blue("\n📊 LeynAI Agent Status\n"));

    // Check authentication
    if (!isAuthenticated()) {
      console.log(chalk.yellow("Authentication: Not logged in"));
      console.log(chalk.gray('Run "leynai-agent login" to authenticate\n'));
      return;
    }

    console.log(chalk.green("Authentication: ✓ Logged in"));
    console.log(chalk.gray(`Email: ${getUserEmail() || "N/A"}`));
    console.log(chalk.gray(`Backend: ${getBackendUrl()}`));

    // Check if daemon is running
    if (fs.existsSync(pidFile)) {
      const pid = parseInt(fs.readFileSync(pidFile, "utf-8"));
      if (isProcessRunning(pid)) {
        console.log(chalk.green(`Agent Status: ✓ Running (PID: ${pid})`));
      } else {
        console.log(chalk.yellow("Agent Status: ⚠ Stopped (stale PID file)"));
        fs.unlinkSync(pidFile);
      }
    } else {
      console.log(chalk.yellow("Agent Status: ⚠ Not running"));
    }

    // Check active tunnels from backend
    const token = getAuthToken()!;
    const backendUrl = getBackendUrl();

    const spinner = ora("Checking active tunnels...").start();
    try {
      const response = await axios.get(`${backendUrl}/api/agent/tunnels`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const tunnels = response.data.tunnels;
      spinner.stop();

      if (tunnels && Object.keys(tunnels).length > 0) {
        console.log(chalk.green("\nActive Tunnels:"));
        Object.entries(tunnels).forEach(([port, url]) => {
          console.log(chalk.gray(`  Port ${port}: ${url}`));
        });
      } else {
        console.log(chalk.gray("\nNo active tunnels"));
      }
    } catch (error) {
      spinner.fail("Failed to fetch tunnels from backend");
    }

    // Show monitored ports
    console.log(chalk.gray(`\nMonitored Ports: ${getPorts().join(", ")}`));
    console.log();
  } catch (error: any) {
    console.error(chalk.red("✗ Failed to get status:"), error.message);
    throw error;
  }
}

/**
 * Logout command - Clear authentication
 */
export async function logout(): Promise<void> {
  try {
    // Check if agent is running and stop it
    const pidFile = getPidFilePath();
    if (fs.existsSync(pidFile)) {
      const pid = parseInt(fs.readFileSync(pidFile, "utf-8"));
      if (isProcessRunning(pid)) {
        console.log(chalk.yellow("Stopping running agent..."));
        await stop();
      }
    }

    clearAuth();
    console.log(chalk.green("\n✓ Successfully logged out"));
  } catch (error: any) {
    console.error(chalk.red("✗ Logout failed:"), error.message);
    throw error;
  }
}

/**
 * Helper: Get PID file path
 */
function getPidFilePath(): string {
  return path.join(os.tmpdir(), "leynai-agent.pid");
}

/**
 * Helper: Check if process is running
 */
function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Test command - Run tests from leynai.json (CI/CD integration)
 */
export async function test(options: {
  config?: string;
  env?: string;
  only?: "e2e" | "api" | "unit" | "smoke" | "performance" | "security";
  output?: "console" | "json";
}): Promise<void> {
  try {
    // Check authentication
    if (!isAuthenticated()) {
      throw new Error(
        'Not authenticated. Please run "leynai-agent login" first'
      );
    }

    const { loadConfig } = await import("./configLoader.js");

    // Load configuration
    const configPath = options.config || "leynai.json";
    console.log(chalk.blue(`\n📋 Loading configuration from ${configPath}...`));

    const config = loadConfig(configPath);
    console.log(chalk.green(`✓ Configuration loaded\n`));

    // Display test plan
    const environment = options.env || "default";
    console.log(chalk.gray(`Server: ${config.server}`));
    console.log(chalk.gray(`Project: ${config.project}`));
    console.log(chalk.gray(`Environment: ${environment}\n`));

    // Prepare test execution request
    let testsToRun = config.tests || {};

    // Filter by type if --only specified
    if (options.only) {
      const testType = options.only;
      testsToRun = { [testType]: testsToRun[testType] };
    }

    // Calculate total tests
    const totalTests = Object.values(testsToRun).reduce(
      (sum: number, tests: any) => sum + (tests?.length || 0),
      0
    );
    console.log(chalk.cyan(`🚀 Running ${totalTests} tests...\n`));

    // Start spinner
    const spinner = ora("Executing tests...").start();

    try {
      // Call backend API
      const response = await axios.post(
        `${config.server}/api/cli/run-tests`,
        {
          projectId: config.project,
          environment,
          tests: testsToRun,
          options: config.options,
        },
        {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: (config.options?.timeout || 30000) + 5000,
        }
      );

      spinner.stop();

      const { summary, results, runId } = response.data;

      // Output results
      if (options.output === "json") {
        console.log(JSON.stringify(response.data, null, 2));
      } else {
        displayTestResults(summary, results);
      }

      console.log(chalk.gray(`\nRun ID: ${runId}\n`));

      // Exit with appropriate code
      if (summary.failed > 0) {
        process.exit(1);
      }
    } catch (error: any) {
      spinner.fail("Test execution failed");

      if (error.response) {
        console.error(
          chalk.red("\n✗ API Error:"),
          error.response.data.error || error.response.statusText
        );
      } else if (error.request) {
        console.error(chalk.red("\n✗ Network Error: Could not reach backend"));
        console.error(chalk.gray(`  Make sure ${config.server} is accessible`));
      } else {
        console.error(chalk.red("\n✗ Error:"), error.message);
      }

      process.exit(1);
    }
  } catch (error: any) {
    console.error(chalk.red("✗ Failed to run tests:"), error.message);
    process.exit(1);
  }
}

/**
 * Init command - Generate leynai.json configuration file
 */
export async function init(options: { force?: boolean }): Promise<void> {
  try {
    const configPath = "leynai.json";

    // Check if file already exists
    if (fs.existsSync(configPath) && !options.force) {
      throw new Error(
        `${configPath} already exists. Use --force to overwrite.`
      );
    }

    console.log(chalk.blue("\n📝 Generating leynai.json configuration...\n"));

    const { generateDefaultConfig, saveConfig } = await import(
      "./configLoader.js"
    );

    // Generate default configuration
    const config = generateDefaultConfig();

    // Save to file
    saveConfig(config, configPath);

    console.log(chalk.green(`✓ Created ${configPath}\n`));
    console.log(chalk.yellow("📋 Next steps:\n"));
    console.log(chalk.white("1. Set your LEYNAI_API_KEY environment variable"));
    console.log(chalk.white("2. Update the project ID in leynai.json"));
    console.log(chalk.white("3. Configure your environments and tests"));
    console.log(chalk.white("4. Run: leynai test\n"));

    console.log(chalk.gray("📚 Documentation: https://docs.leynai.com/cli\n"));
  } catch (error: any) {
    console.error(chalk.red("✗ Failed to initialize:"), error.message);
    process.exit(1);
  }
}

/**
 * Validate command - Validate leynai.json configuration
 */
export async function validate(options: { config?: string }): Promise<void> {
  try {
    const configPath = options.config || "leynai.json";
    console.log(chalk.blue(`\n🔍 Validating ${configPath}...\n`));

    const { loadConfig, validateConfig } = await import("./configLoader.js");

    // Load configuration
    const config = loadConfig(configPath);

    // Validate configuration
    const errors = validateConfig(config);

    if (errors.length > 0) {
      console.log(chalk.red("✗ Configuration validation failed:\n"));
      errors.forEach((error) => {
        console.log(chalk.red(`  - ${error}`));
      });
      console.log();
      process.exit(1);
    }

    console.log(chalk.green("✓ Configuration is valid\n"));

    // Display summary
    console.log(chalk.gray("Configuration Summary:"));
    console.log(chalk.gray(`  Server: ${config.server}`));
    console.log(chalk.gray(`  Project: ${config.project}`));

    if (config.environments) {
      console.log(
        chalk.gray(
          `  Environments: ${Object.keys(config.environments).join(", ")}`
        )
      );
    }

    if (config.tests) {
      const e2eCount = config.tests.e2e?.length || 0;
      const apiCount = config.tests.api?.length || 0;
      console.log(chalk.gray(`  Tests: ${e2eCount} E2E, ${apiCount} API`));
    }

    console.log();
  } catch (error: any) {
    console.error(chalk.red("✗ Validation failed:"), error.message);
    process.exit(1);
  }
}

/**
 * Helper: Display test results in console
 */
function displayTestResults(summary: any, results: any[]): void {
  console.log(
    chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
  );
  console.log(chalk.bold("Test Results:\n"));

  // Display individual test results
  results.forEach((result) => {
    const icon =
      result.status === "passed" ? "✓" : result.status === "failed" ? "✗" : "○";
    const color =
      result.status === "passed"
        ? chalk.green
        : result.status === "failed"
        ? chalk.red
        : chalk.gray;

    console.log(color(`  ${icon} ${result.testName} (${result.type})`));

    if (result.error) {
      console.log(chalk.red(`    Error: ${result.error}`));
    }

    console.log(chalk.gray(`    Duration: ${result.duration}ms`));
  });

  // Display summary
  console.log(
    chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
  );
  console.log(chalk.bold("Summary:\n"));
  console.log(chalk.white(`  Total:   ${summary.total}`));
  console.log(chalk.green(`  Passed:  ${summary.passed}`));
  console.log(chalk.red(`  Failed:  ${summary.failed}`));
  console.log(chalk.gray(`  Skipped: ${summary.skipped}`));
  console.log(
    chalk.gray(`  Duration: ${(summary.duration / 1000).toFixed(2)}s`)
  );
  console.log();

  // Pass/fail indication
  if (summary.failed === 0) {
    console.log(chalk.green.bold("✓ All tests passed!\n"));
  } else {
    console.log(chalk.red.bold(`✗ ${summary.failed} test(s) failed\n`));
  }
}

interface AnalyzeOptions {
  threshold?: number;
  generate?: boolean;
  ai?: boolean;
}

/**
 * Analyze command - Scan project and identify critical functions to test
 */
export async function analyze(options: AnalyzeOptions): Promise<void> {
  try {
    // Check authentication
    if (!isAuthenticated()) {
      throw new Error(
        'Not authenticated. Please run "leynai-agent login" first'
      );
    }

    const projectPath = process.cwd();
    const threshold = options.threshold || 70;
    const shouldGenerate = options.generate !== false; // Default true
    const useAI = options.ai !== false; // Default true

    console.log(
      chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    );
    console.log(chalk.bold("LeynAI Project Analysis\n"));
    console.log(chalk.gray(`Project: ${projectPath}`));
    console.log(chalk.gray(`Threshold: ${threshold}`));
    console.log();

    // 1. Analyser le projet
    const spinner = ora("Scanning project...").start();
    let scoredFunctions = await analyzeProject(projectPath);
    spinner.succeed(`Found ${scoredFunctions.length} exported functions`);

    // 2. Affinage avec l'IA (optionnel)
    if (useAI && scoredFunctions.length > 0) {
      try {
        const config = loadConfig();
        const spinner2 = ora("Analyzing with AI...").start();
        scoredFunctions = await scoreFunctionsWithAI(scoredFunctions, config);
        spinner2.succeed("AI analysis complete");
      } catch (error) {
        console.log(
          chalk.yellow("⚠️  AI analysis skipped (using static analysis only)")
        );
      }
    }

    // 3. Filtrer par seuil
    const importantFunctions = scoredFunctions.filter(
      (f) => f.importance >= threshold
    );

    if (importantFunctions.length === 0) {
      console.log(
        chalk.yellow(`\n⚠️  No functions found with importance >= ${threshold}`)
      );
      console.log(
        chalk.gray("Try lowering the threshold with --threshold <number>\n")
      );
      return;
    }

    // 4. Afficher les résultats
    console.log(
      chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    );
    console.log(
      chalk.bold(
        `📋 Critical functions to test (${importantFunctions.length}):\n`
      )
    );

    importantFunctions.slice(0, 20).forEach((func) => {
      const icon =
        func.importance >= 90 ? "🔴" : func.importance >= 80 ? "🟠" : "🟡";
      const relativePath = path.relative(projectPath, func.filePath);

      console.log(
        `${icon} ${chalk.bold(func.name)} ${chalk.gray(`(${relativePath})`)}`
      );
      console.log(chalk.gray(`   Score: ${func.importance}/100`));
      console.log(chalk.gray(`   Reason: ${func.reason}`));
      console.log();
    });

    if (importantFunctions.length > 20) {
      console.log(
        chalk.gray(`... and ${importantFunctions.length - 20} more functions\n`)
      );
    }

    // 5. Générer les tests automatiquement
    if (shouldGenerate) {
      console.log(
        chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
      );
      console.log(chalk.bold("⚡ Generating tests...\n"));

      await generateTestsForFunctions(importantFunctions, projectPath);

      console.log(chalk.green.bold("\n✅ All tests generated!"));
      console.log(chalk.gray("\n💾 Test IDs saved to leynai.json"));
      console.log(
        chalk.cyan("\n🚀 Run tests with: ") +
          chalk.white("leynai-agent test --only=unit\n")
      );
    } else {
      console.log(
        chalk.gray(
          "\n💡 Run with --generate to create test files automatically\n"
        )
      );
    }
  } catch (error) {
    console.error(chalk.red("\n✗ Analysis failed:"), (error as Error).message);
    process.exit(1);
  }
}

/**
 * Generate tests for a list of functions
 */
async function generateTestsForFunctions(
  functions: ScoredFunction[],
  projectPath: string
): Promise<void> {
  const config = loadConfig();
  const generatedTests: string[] = [];

  for (const func of functions) {
    try {
      const spinner = ora(`Generating tests for ${func.name}...`).start();

      // Lire le contexte du fichier (imports, types)
      const fileContent = await fse.readFile(func.filePath, "utf-8");
      const context = extractFileContext(fileContent);

      // Envoyer au backend pour génération
      const response = await axios.post(
        `${config.server}/api/unit-tests/generate-for-function`,
        {
          functionName: func.name,
          functionCode: func.code,
          filePath: func.filePath,
          importance: func.importance,
          context,
          isAsync: func.isAsync,
          parameters: func.parameters,
        },
        {
          headers: { Authorization: `Bearer ${config.apiKey}` },
        }
      );

      const { testId, generatedTests: testCode } = response.data;

      // Créer le fichier de test
      const testFilePath = func.filePath.replace(/\.(ts|js)$/, ".test.$1");
      const relativePath = path.relative(projectPath, testFilePath);

      // Si le fichier existe, fusionner les tests
      let finalTestCode = testCode;
      if (await fse.pathExists(testFilePath)) {
        const existingTests = await fse.readFile(testFilePath, "utf-8");
        finalTestCode = mergeTests(existingTests, testCode, func.name);
      }

      await fse.writeFile(testFilePath, finalTestCode);

      generatedTests.push(testId);
      spinner.succeed(`${func.name} → ${relativePath}`);
    } catch (error) {
      console.error(
        chalk.red(`  ✗ Failed to generate tests for ${func.name}:`),
        (error as Error).message
      );
    }
  }

  // Sauvegarder les IDs dans leynai.json
  if (generatedTests.length > 0) {
    await saveTestIdsToConfig(generatedTests, projectPath);
  }
}

/**
 * Extract context from file (imports, types)
 */
function extractFileContext(fileContent: string): string {
  const lines = fileContent.split("\n");
  const imports = lines
    .filter((line) => line.trim().startsWith("import "))
    .join("\n");
  const types = lines
    .filter(
      (line) =>
        line.trim().startsWith("type ") || line.trim().startsWith("interface ")
    )
    .join("\n");

  return `${imports}\n\n${types}`;
}

/**
 * Merge new tests with existing tests
 */
function mergeTests(
  existingTests: string,
  newTests: string,
  functionName: string
): string {
  // Si les tests pour cette fonction existent déjà, ne pas les écraser
  if (
    existingTests.includes(`describe('${functionName}'`) ||
    existingTests.includes(`describe("${functionName}"`)
  ) {
    console.log(
      chalk.yellow(`  ⚠️  Tests for ${functionName} already exist, skipping...`)
    );
    return existingTests;
  }

  // Ajouter les nouveaux tests à la fin
  return `${existingTests}\n\n${newTests}`;
}

/**
 * Save test IDs to leynai.json
 */
async function saveTestIdsToConfig(
  testIds: string[],
  projectPath: string
): Promise<void> {
  const configPath = path.join(projectPath, "leynai.json");

  let leynaiConfig: any = {};

  if (await fse.pathExists(configPath)) {
    const content = await fse.readFile(configPath, "utf-8");
    leynaiConfig = JSON.parse(content);
  }

  if (!leynaiConfig.tests) {
    leynaiConfig.tests = {};
  }

  if (!leynaiConfig.tests.unit) {
    leynaiConfig.tests.unit = [];
  }

  // Ajouter les nouveaux IDs (éviter les doublons)
  testIds.forEach((id) => {
    if (!leynaiConfig.tests.unit.includes(id)) {
      leynaiConfig.tests.unit.push(id);
    }
  });

  await fse.writeFile(configPath, JSON.stringify(leynaiConfig, null, 2));
}
