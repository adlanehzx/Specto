import axios, { AxiosInstance } from "axios";
import chalk from "chalk";
import ora, { Ora } from "ora";
import { exec } from "child_process";
import { promisify } from "util";
import * as tunnel from "./tunnel.js";

const execAsync = promisify(exec);

/**
 * Configuration for LeynAI Agent
 */
export interface AgentConfig {
  /** Backend API URL */
  backendUrl: string;
  /** User authentication token */
  authToken: string;
  /** Ports to monitor and create tunnels for */
  ports: number[];
  /** Heartbeat interval in ms (default: 30s) */
  heartbeatInterval?: number;
}

/**
 * Tunnel mapping: port → public URL
 */
interface TunnelMapping {
  port: number;
  url: string;
  status: "active" | "failed";
}

/**
 * LeynAI Agent
 *
 * Automatically detects local servers, creates ngrok tunnels,
 * and registers them with LeynAI backend for remote testing.
 */
export class LeynAIAgent {
  private config: AgentConfig;
  private api: AxiosInstance;
  private tunnels: Map<number, string> = new Map();
  private heartbeatTimer?: NodeJS.Timeout;
  private isRunning = false;

  constructor(config: AgentConfig) {
    this.config = {
      heartbeatInterval: 30000,
      ...config,
    };

    // Initialize API client with auth header
    this.api = axios.create({
      baseURL: this.config.backendUrl,
      headers: {
        Authorization: `Bearer ${this.config.authToken}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });
  }

  /**
   * Start the agent
   */
  async start(): Promise<void> {
    console.log(chalk.cyan("🚀 Starting LeynAI Agent...\n"));

    // 0. Check if cloudflared is installed
    const isInstalled = await tunnel.checkCloudflaredInstalled();
    if (!isInstalled) {
      tunnel.printInstallInstructions();
      throw new Error(
        "cloudflared binary not found. Please install it to use LeynAI Agent."
      );
    }

    // 1. Authenticate with backend
    await this.authenticate();

    // 2. Detect running servers on specified ports
    const activePorts = await this.detectActivePorts();

    if (activePorts.length === 0) {
      console.log(
        chalk.yellow("⚠️  No active servers detected on monitored ports")
      );
      console.log(chalk.gray("   Agent will continue monitoring...\n"));
    }

    // 3. Create tunnels for active ports
    for (const port of activePorts) {
      await this.createTunnel(port);
    }

    // 4. Register tunnels with backend
    if (this.tunnels.size > 0) {
      await this.registerTunnels();
    }

    // 5. Start heartbeat
    this.startHeartbeat();

    this.isRunning = true;
    console.log(chalk.green("\n✅ LeynAI Agent is running!"));
    console.log(chalk.gray("   Press Ctrl+C to stop\n"));
  }

  /**
   * Stop the agent and cleanup
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;

    // Stop heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    // Notify backend to cleanup tunnels
    try {
      await this.api.delete("/api/agent/tunnels");
      console.log(chalk.gray("   ✓ Backend tunnels cleaned up"));
    } catch (error) {
      console.error(chalk.yellow("   ⚠ Failed to cleanup backend tunnels"));
    }

    // Close all tunnels locally
    console.log(chalk.cyan("🔌 Closing tunnels..."));
    for (const [port, url] of this.tunnels.entries()) {
      try {
        tunnel.closeTunnel(port);
        console.log(chalk.gray(`   ✓ Closed tunnel on port ${port}`));
      } catch (error) {
        console.error(chalk.red(`   ✗ Error closing tunnel on port ${port}`));
      }
    }

    tunnel.closeAllTunnels();
    this.tunnels.clear();

    console.log(chalk.green("✅ Agent stopped successfully"));
  }

  /**
   * Authenticate with LeynAI backend
   */
  private async authenticate(): Promise<void> {
    const spinner = ora("Authenticating with backend...").start();

    try {
      const response = await this.api.get("/health");

      if (response.status === 200) {
        spinner.succeed("Authentication successful");
      } else {
        spinner.fail("Authentication failed");
        throw new Error("Invalid authentication token");
      }
    } catch (error: any) {
      spinner.fail("Backend connection failed");

      if (error.code === "ECONNREFUSED") {
        console.error(
          chalk.red(
            `\n❌ Cannot connect to backend at ${this.config.backendUrl}`
          )
        );
        console.log(
          chalk.yellow("💡 Make sure the LeynAI backend is running\n")
        );
      } else if (error.response?.status === 401) {
        console.error(chalk.red("\n❌ Invalid authentication token"));
        console.log(chalk.yellow("💡 Check your AUTH_TOKEN in .env file\n"));
      } else {
        console.error(chalk.red("\n❌ Error:"), error.message);
      }

      throw error;
    }
  }

  /**
   * Detect which ports are actively listening
   */
  private async detectActivePorts(): Promise<number[]> {
    const spinner = ora("Detecting active servers...").start();
    const activePorts: number[] = [];

    for (const port of this.config.ports) {
      try {
        // Try to connect to localhost:port
        const response = await axios.get(`http://localhost:${port}`, {
          timeout: 2000,
          validateStatus: () => true, // Accept any status code
        });

        activePorts.push(port);
        spinner.text = `Found server on port ${port}`;
      } catch (error: any) {
        // Port not active or server not responding
        if (error.code !== "ECONNREFUSED") {
          // Server exists but returned error - still count it
          activePorts.push(port);
        }
      }
    }

    if (activePorts.length > 0) {
      spinner.succeed(
        `Found ${activePorts.length} active server(s): ${activePorts.join(
          ", "
        )}`
      );
    } else {
      spinner.warn("No active servers detected");
    }

    return activePorts;
  }

  /**
   * Create cloudflared tunnel for a specific port
   */
  private async createTunnel(port: number): Promise<void> {
    const spinner = ora(`Creating tunnel for port ${port}...`).start();

    try {
      // Create tunnel using cloudflared
      const url = await tunnel.createTunnel(port, 30000);

      this.tunnels.set(port, url);
      spinner.succeed(`Tunnel created: ${chalk.cyan(url)} → localhost:${port}`);
    } catch (error: any) {
      spinner.fail(`Failed to create tunnel for port ${port}`);
      console.error(chalk.red(`   Error: ${error.message}`));

      if (
        error.message.includes("not found") ||
        error.message.includes("not installed")
      ) {
        console.log(
          chalk.yellow(
            "   💡 Make sure cloudflared is installed and in your PATH"
          )
        );
        tunnel.printInstallInstructions();
      }
    }
  }

  /**
   * Register active tunnels with LeynAI backend
   */
  private async registerTunnels(): Promise<void> {
    const spinner = ora("Registering tunnels with backend...").start();

    try {
      const tunnelMappings: TunnelMapping[] = Array.from(
        this.tunnels.entries()
      ).map(([port, url]) => ({
        port,
        url,
        status: "active" as const,
      }));

      await this.api.post("/api/agent/register", {
        tunnels: tunnelMappings,
      });

      spinner.succeed("Tunnels registered with backend");

      console.log(chalk.cyan("\n📋 Active Tunnels:"));
      for (const { port, url } of tunnelMappings) {
        console.log(chalk.gray(`   • Port ${port}: ${chalk.cyan(url)}`));
      }
    } catch (error: any) {
      spinner.fail("Failed to register tunnels");

      if (error.response?.status === 401) {
        console.error(chalk.red("   ❌ Authentication failed"));
      } else if (error.response?.status === 404) {
        console.error(chalk.red("   ❌ Agent registration endpoint not found"));
        console.log(
          chalk.yellow("   💡 Make sure backend has agent routes enabled")
        );
      } else {
        console.error(chalk.red(`   Error: ${error.message}`));
      }

      throw error;
    }
  }

  /**
   * Start heartbeat to keep tunnels registered
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      try {
        // Re-detect active ports
        const activePorts = await this.detectActivePorts();

        // Create tunnels for new ports
        for (const port of activePorts) {
          if (!this.tunnels.has(port)) {
            await this.createTunnel(port);
          }
        }

        // Close tunnels for inactive ports
        for (const port of this.tunnels.keys()) {
          if (!activePorts.includes(port)) {
            const url = this.tunnels.get(port)!;
            tunnel.closeTunnel(port);
            this.tunnels.delete(port);
            console.log(
              chalk.gray(`🔌 Closed tunnel for inactive port ${port}`)
            );
          }
        }

        // Re-register if tunnels changed
        if (this.tunnels.size > 0) {
          await this.registerTunnels();
        }
      } catch (error: any) {
        console.error(chalk.red("❌ Heartbeat error:"), error.message);
      }
    }, this.config.heartbeatInterval);
  }
}
