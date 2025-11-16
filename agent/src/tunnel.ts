/**
 * Cloudflared Tunnel for Agent
 *
 * Lightweight wrapper around cloudflared binary for Quick Tunnels
 * Runs on user's machine (Windows/Mac/Linux)
 */

import { spawn, ChildProcess } from "child_process";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Active tunnel instance
 */
interface TunnelInstance {
  process: ChildProcess;
  url: string;
  port: number;
}

// Map of active tunnels: port → TunnelInstance
const activeTunnels = new Map<number, TunnelInstance>();

/**
 * Check if cloudflared is installed
 */
export async function checkCloudflaredInstalled(): Promise<boolean> {
  try {
    await execAsync("cloudflared --version");
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Print installation instructions for cloudflared
 */
export function printInstallInstructions(): void {
  console.error(`
╔═══════════════════════════════════════════════════════════════════╗
║              CLOUDFLARED NON INSTALLÉ                             ║
╚═══════════════════════════════════════════════════════════════════╝

LeynAI Agent utilise cloudflared pour créer des tunnels sécurisés.

📦 INSTALLATION :

  Windows (PowerShell - Admin) :
    > winget install cloudflare.cloudflared

  Windows (Chocolatey) :
    > choco install cloudflared

  Windows (Manuel) :
    1. Télécharger : https://github.com/cloudflare/cloudflared/releases
    2. Extraire cloudflared.exe
    3. Ajouter au PATH ou placer dans C:\\Windows\\System32\\

  macOS :
    > brew install cloudflared

  Linux :
    > wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
    > sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
    > sudo chmod +x /usr/local/bin/cloudflared

📚 Documentation :
  https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

═══════════════════════════════════════════════════════════════════
  `);
}

/**
 * Create a cloudflared Quick Tunnel for a specific port
 *
 * @param port - Local port to expose
 * @param timeout - Timeout in ms (default: 30000)
 * @returns Public URL (e.g., https://abc-def.trycloudflare.com)
 */
export async function createTunnel(
  port: number,
  timeout: number = 30000
): Promise<string> {
  // Check if tunnel already exists
  if (activeTunnels.has(port)) {
    return activeTunnels.get(port)!.url;
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      tunnelProcess.kill();
      reject(
        new Error(`Timeout creating tunnel for port ${port} after ${timeout}ms`)
      );
    }, timeout);

    // Spawn cloudflared process
    const tunnelProcess = spawn(
      "cloudflared",
      ["tunnel", "--url", `http://localhost:${port}`, "--no-autoupdate"],
      {
        env: {
          ...process.env,
          NO_AUTO_UPDATE: "true",
        },
      }
    );

    let publicUrl: string | null = null;

    // Capture stdout to extract public URL
    tunnelProcess.stdout?.on("data", (data: Buffer) => {
      const output = data.toString();

      // Extract public URL (format: https://something.trycloudflare.com)
      const urlMatch = output.match(
        /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/
      );

      if (urlMatch && !publicUrl) {
        publicUrl = urlMatch[0];
        clearTimeout(timeoutId);

        // Store tunnel instance
        activeTunnels.set(port, {
          process: tunnelProcess,
          url: publicUrl,
          port,
        });

        resolve(publicUrl);
      }
    });

    // Capture stderr (cloudflared uses stderr for logs)
    tunnelProcess.stderr?.on("data", (data: Buffer) => {
      const error = data.toString();

      // Check for actual errors (not just logs)
      if (error.toLowerCase().includes("error") && !publicUrl) {
        console.error(`[Cloudflared] ${error.trim()}`);
      }
    });

    // Handle process exit
    tunnelProcess.on("close", (code) => {
      clearTimeout(timeoutId);
      activeTunnels.delete(port);

      if (code !== 0 && !publicUrl) {
        reject(
          new Error(
            `cloudflared exited with code ${code}. Is localhost:${port} running?`
          )
        );
      }
    });

    // Handle spawn errors
    tunnelProcess.on("error", (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });
  });
}

/**
 * Close a specific tunnel
 *
 * @param port - Port of the tunnel to close
 * @returns true if tunnel was closed, false if not found
 */
export function closeTunnel(port: number): boolean {
  const tunnel = activeTunnels.get(port);

  if (!tunnel) {
    return false;
  }

  try {
    tunnel.process.kill("SIGTERM");
    activeTunnels.delete(port);
    return true;
  } catch (error) {
    console.error(`Error closing tunnel on port ${port}:`, error);
    return false;
  }
}

/**
 * Close all active tunnels
 */
export function closeAllTunnels(): void {
  for (const [port, tunnel] of activeTunnels.entries()) {
    try {
      tunnel.process.kill("SIGTERM");
    } catch (error) {
      console.error(`Error closing tunnel on port ${port}:`, error);
    }
  }

  activeTunnels.clear();
}

/**
 * Get the URL of an active tunnel
 *
 * @param port - Port of the tunnel
 * @returns URL or null if tunnel not found
 */
export function getTunnelUrl(port: number): string | null {
  return activeTunnels.get(port)?.url || null;
}

/**
 * Get all active tunnels
 *
 * @returns Map of port → URL
 */
export function getActiveTunnels(): Map<number, string> {
  const tunnels = new Map<number, string>();

  for (const [port, tunnel] of activeTunnels.entries()) {
    tunnels.set(port, tunnel.url);
  }

  return tunnels;
}

/**
 * Check if a tunnel is active for a specific port
 *
 * @param port - Port to check
 * @returns true if tunnel is active
 */
export function isTunnelActive(port: number): boolean {
  return activeTunnels.has(port);
}

// Cleanup on process exit
process.on("SIGINT", () => {
  closeAllTunnels();
  process.exit(0);
});

process.on("SIGTERM", () => {
  closeAllTunnels();
  process.exit(0);
});

process.on("exit", () => {
  closeAllTunnels();
});
