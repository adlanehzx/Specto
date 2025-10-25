/**
 * Cloudflare Tunnel Module
 *
 * Permet d'ouvrir un tunnel Cloudflare vers un serveur local
 * pour rendre un site accessible publiquement (tests distants, CI/CD)
 *
 * Prérequis : binaire `cloudflared` installé localement
 * Installation : https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
 */

import { spawn, ChildProcess } from "child_process";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Configuration du tunnel Cloudflare
 */
export interface CloudflareTunnelConfig {
  /** Port du serveur local à exposer */
  port: number;
  /** Timeout pour obtenir l'URL publique (ms) */
  timeout?: number;
  /** Activer les logs détaillés */
  verbose?: boolean;
}

/**
 * Instance active du tunnel
 */
interface TunnelInstance {
  /** Process cloudflared en cours */
  process: ChildProcess;
  /** URL publique du tunnel */
  url: string;
  /** Port local exposé */
  port: number;
}

// Stockage des tunnels actifs
const activeTunnels = new Map<number, TunnelInstance>();

/**
 * Résout l'hôte localhost pour Docker
 * Dans Docker, localhost fait référence au conteneur, pas à l'hôte
 * On utilise host.docker.internal pour accéder à l'hôte depuis le conteneur
 *
 * @param host - L'hôte à résoudre (localhost, 127.0.0.1, etc.)
 * @returns L'hôte adapté pour l'environnement (host.docker.internal dans Docker)
 */
function resolveLocalhostForDocker(host: string): string {
  // Détection simple : si on est dans Docker, utiliser host.docker.internal
  // On peut détecter Docker via la présence de /.dockerenv ou hostname
  const isDocker =
    process.env.DOCKER === "true" || require("fs").existsSync("/.dockerenv");

  if (isDocker && (host === "localhost" || host === "127.0.0.1")) {
    console.log(
      `[CloudflareTunnel] 🐳 Docker detected, using host.docker.internal instead of ${host}`
    );
    return "host.docker.internal";
  }

  return host;
}

/**
 * Vérifie si cloudflared est installé
 *
 * @returns true si cloudflared est disponible
 */
export async function checkCloudflareBinary(): Promise<boolean> {
  try {
    await execAsync("cloudflared --version");
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Affiche les instructions d'installation de cloudflared
 */
export function printInstallationInstructions(): void {
  console.error(`
╔═══════════════════════════════════════════════════════════════════╗
║                   CLOUDFLARED NON INSTALLÉ                        ║
╚═══════════════════════════════════════════════════════════════════╝

Le binaire 'cloudflared' est requis pour créer des tunnels Cloudflare.

📦 INSTALLATION :

  Windows (via Chocolatey) :
    > choco install cloudflared

  Windows (manuel) :
    Télécharger : https://github.com/cloudflare/cloudflared/releases
    Ajouter le binaire au PATH

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
 * Crée un tunnel Cloudflare vers un serveur local
 *
 * @param config - Configuration du tunnel
 * @returns URL publique du tunnel (ex: https://something.trycloudflare.com)
 *
 * @example
 * ```typescript
 * const publicUrl = await createCloudflareTunnel({ port: 3000 });
 * console.log(`Site accessible sur : ${publicUrl}`);
 * // → Site accessible sur : https://abc-def-ghi.trycloudflare.com
 * ```
 */
export async function createCloudflareTunnel(
  config: CloudflareTunnelConfig
): Promise<string> {
  const { port, timeout = 30000, verbose = false } = config;

  // 1. Vérifier que cloudflared est installé
  console.log(`[CloudflareTunnel] Checking cloudflared binary...`);

  const isInstalled = await checkCloudflareBinary();
  if (!isInstalled) {
    printInstallationInstructions();
    throw new Error(
      "cloudflared binary not found. Please install it to use Cloudflare tunnels."
    );
  }

  console.log(`[CloudflareTunnel] ✓ cloudflared binary found`);

  // 2. Vérifier qu'un tunnel n'existe pas déjà pour ce port
  if (activeTunnels.has(port)) {
    const existing = activeTunnels.get(port)!;
    console.log(
      `[CloudflareTunnel] ⚠️  Tunnel already active on port ${port}: ${existing.url}`
    );
    return existing.url;
  }

  // 3. Lancer cloudflared
  const resolvedHost = resolveLocalhostForDocker("localhost");
  console.log(
    `[CloudflareTunnel] Starting tunnel for ${resolvedHost}:${port}...`
  );

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      tunnelProcess.kill();
      reject(
        new Error(
          `Timeout: Could not get public URL after ${timeout}ms. Check if ${resolvedHost}:${port} is running.`
        )
      );
    }, timeout);

    // Lancer le process cloudflared
    // Pour Quick Tunnel (trycloudflare.com), on ne doit PAS chercher de certificat
    // Astuce : ajouter les options pour éviter toute lecture de config
    const tunnelProcess = spawn(
      "cloudflared",
      [
        "tunnel",
        "--url",
        `http://${resolvedHost}:${port}`,
        "--no-autoupdate",
        "--metrics",
        "localhost:0", // Désactiver les métriques (évite les erreurs de bind)
      ],
      {
        env: {
          ...process.env,
          NO_AUTO_UPDATE: "true",
          TUNNEL_ORIGIN_CERT: "", // Éviter la recherche de certificat
        },
      }
    );

    let publicUrl: string | null = null;

    // Capturer stdout pour extraire l'URL publique
    tunnelProcess.stdout?.on("data", (data: Buffer) => {
      const output = data.toString();

      if (verbose) {
        console.log(`[CloudflareTunnel] ${output.trim()}`);
      }

      // Extraire l'URL publique (format: https://something.trycloudflare.com)
      const urlMatch = output.match(
        /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/
      );

      if (urlMatch && !publicUrl) {
        publicUrl = urlMatch[0];
        clearTimeout(timeoutId);

        // Stocker le tunnel actif
        activeTunnels.set(port, {
          process: tunnelProcess,
          url: publicUrl,
          port,
        });

        console.log(`[CloudflareTunnel] ✅ Tunnel created successfully!`);
        console.log(`[CloudflareTunnel] 🌐 Public URL: ${publicUrl}`);
        console.log(`[CloudflareTunnel] 🔗 Local: http://localhost:${port}`);

        resolve(publicUrl);
      }
    });

    // Capturer stderr pour les erreurs
    tunnelProcess.stderr?.on("data", (data: Buffer) => {
      const error = data.toString();

      if (verbose) {
        console.error(`[CloudflareTunnel] stderr: ${error.trim()}`);
      }

      // Ignorer les warnings cloudflared (ils utilisent stderr pour les logs normaux)
      if (error.includes("ERR") || error.includes("error")) {
        console.error(`[CloudflareTunnel] ❌ Error: ${error.trim()}`);
      }
    });

    // Gérer la fermeture du process
    tunnelProcess.on("close", (code) => {
      clearTimeout(timeoutId);
      activeTunnels.delete(port);

      if (code !== 0 && !publicUrl) {
        console.error(`[CloudflareTunnel] ❌ Process exited with code ${code}`);
        reject(
          new Error(
            `cloudflared process exited with code ${code}. Is localhost:${port} running?`
          )
        );
      } else {
        console.log(`[CloudflareTunnel] 🛑 Tunnel closed (port ${port})`);
      }
    });

    // Gérer les erreurs de spawn
    tunnelProcess.on("error", (error) => {
      clearTimeout(timeoutId);
      console.error(`[CloudflareTunnel] ❌ Spawn error:`, error);
      reject(error);
    });
  });
}

/**
 * Ferme un tunnel Cloudflare actif
 *
 * @param port - Port du tunnel à fermer
 * @returns true si le tunnel a été fermé, false s'il n'existait pas
 *
 * @example
 * ```typescript
 * closeCloudflareTunnel(3000);
 * ```
 */
export function closeCloudflareTunnel(port: number): boolean {
  const tunnel = activeTunnels.get(port);

  if (!tunnel) {
    console.warn(
      `[CloudflareTunnel] ⚠️  No active tunnel found for port ${port}`
    );
    return false;
  }

  console.log(`[CloudflareTunnel] Closing tunnel on port ${port}...`);

  try {
    tunnel.process.kill("SIGTERM");
    activeTunnels.delete(port);
    console.log(`[CloudflareTunnel] ✅ Tunnel closed successfully`);
    return true;
  } catch (error) {
    console.error(`[CloudflareTunnel] ❌ Error closing tunnel:`, error);
    return false;
  }
}

/**
 * Ferme tous les tunnels actifs
 *
 * @example
 * ```typescript
 * closeAllCloudflareTunnels();
 * ```
 */
export function closeAllCloudflareTunnels(): void {
  console.log(
    `[CloudflareTunnel] Closing all active tunnels (${activeTunnels.size})...`
  );

  for (const [port, tunnel] of activeTunnels.entries()) {
    try {
      tunnel.process.kill("SIGTERM");
      console.log(`[CloudflareTunnel] ✓ Closed tunnel on port ${port}`);
    } catch (error) {
      console.error(
        `[CloudflareTunnel] ❌ Error closing tunnel on port ${port}:`,
        error
      );
    }
  }

  activeTunnels.clear();
  console.log(`[CloudflareTunnel] ✅ All tunnels closed`);
}

/**
 * Obtient l'URL publique d'un tunnel actif
 *
 * @param port - Port du tunnel
 * @returns URL publique ou null si le tunnel n'existe pas
 */
export function getTunnelUrl(port: number): string | null {
  const tunnel = activeTunnels.get(port);
  return tunnel?.url || null;
}

/**
 * Liste tous les tunnels actifs
 *
 * @returns Map des tunnels actifs (port → URL)
 */
export function listActiveTunnels(): Map<number, string> {
  const tunnels = new Map<number, string>();

  for (const [port, tunnel] of activeTunnels.entries()) {
    tunnels.set(port, tunnel.url);
  }

  return tunnels;
}

/**
 * Vérifie si un tunnel est actif pour un port donné
 *
 * @param port - Port à vérifier
 * @returns true si un tunnel est actif
 */
export function isTunnelActive(port: number): boolean {
  return activeTunnels.has(port);
}

// Fermer tous les tunnels à l'arrêt du process
process.on("SIGINT", () => {
  console.log(`\n[CloudflareTunnel] Received SIGINT, closing tunnels...`);
  closeAllCloudflareTunnels();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log(`\n[CloudflareTunnel] Received SIGTERM, closing tunnels...`);
  closeAllCloudflareTunnels();
  process.exit(0);
});

process.on("exit", () => {
  closeAllCloudflareTunnels();
});

/**
 * Fonction helper pour créer un tunnel avec retry
 * Utile si le serveur local met du temps à démarrer
 *
 * @param config - Configuration du tunnel
 * @param maxRetries - Nombre max de tentatives
 * @param retryDelay - Délai entre tentatives (ms)
 * @returns URL publique du tunnel
 */
export async function createCloudflareTunnelWithRetry(
  config: CloudflareTunnelConfig,
  maxRetries = 3,
  retryDelay = 5000
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[CloudflareTunnel] Attempt ${attempt}/${maxRetries} to create tunnel...`
      );

      const url = await createCloudflareTunnel(config);
      return url;
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `[CloudflareTunnel] ⚠️  Attempt ${attempt}/${maxRetries} failed: ${lastError.message}`
      );

      if (attempt < maxRetries) {
        console.log(`[CloudflareTunnel] Retrying in ${retryDelay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw new Error(
    `Failed to create Cloudflare tunnel after ${maxRetries} attempts. Last error: ${lastError?.message}`
  );
}

/**
 * Détecte si une URL est locale (localhost, 127.0.0.1, 0.0.0.0)
 *
 * @param url - URL à vérifier
 * @returns true si l'URL est locale
 *
 * @example
 * ```typescript
 * isLocalUrl('http://localhost:3000') // true
 * isLocalUrl('http://127.0.0.1:8080') // true
 * isLocalUrl('http://0.0.0.0:5000') // true
 * isLocalUrl('https://example.com') // false
 * ```
 */
export function isLocalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Liste des hostnames considérés comme locaux
    const localHostnames = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "::1", // IPv6 localhost
      "[::1]", // IPv6 localhost avec brackets
    ];

    return localHostnames.includes(hostname);
  } catch (error) {
    // Si l'URL n'est pas valide, retourner false
    console.warn(`[CloudflareTunnel] Invalid URL: ${url}`);
    return false;
  }
}

/**
 * Extrait le port d'une URL
 *
 * @param url - URL dont extraire le port
 * @returns Port ou null si non spécifié
 *
 * @example
 * ```typescript
 * extractPortFromUrl('http://localhost:3000') // 3000
 * extractPortFromUrl('https://example.com:8080') // 8080
 * extractPortFromUrl('http://localhost') // null (port par défaut)
 * ```
 */
export function extractPortFromUrl(url: string): number | null {
  try {
    const urlObj = new URL(url);

    // Si le port est explicitement spécifié
    if (urlObj.port) {
      return parseInt(urlObj.port, 10);
    }

    // Sinon, retourner null (ports par défaut HTTP/HTTPS)
    return null;
  } catch (error) {
    console.warn(`[CloudflareTunnel] Invalid URL: ${url}`);
    return null;
  }
}

/**
 * Résout une URL locale en créant un tunnel Cloudflare si nécessaire
 *
 * @param url - URL originale (locale ou publique)
 * @param config - Configuration optionnelle du tunnel
 * @returns Objet avec URL finale et info si tunnel créé
 *
 * @example
 * ```typescript
 * // URL publique → retournée telle quelle
 * await resolveUrl('https://example.com')
 * // → { url: 'https://example.com', tunnelCreated: false }
 *
 * // URL locale → tunnel créé
 * await resolveUrl('http://localhost:3000')
 * // → { url: 'https://abc-def.trycloudflare.com', tunnelCreated: true, port: 3000 }
 * ```
 */
export async function resolveUrl(
  url: string,
  config?: Partial<CloudflareTunnelConfig>
): Promise<{
  url: string;
  tunnelCreated: boolean;
  port?: number;
  originalUrl?: string;
}> {
  // Si l'URL n'est pas locale, la retourner telle quelle
  if (!isLocalUrl(url)) {
    console.log(`[CloudflareTunnel] URL is public, no tunnel needed: ${url}`);
    return {
      url,
      tunnelCreated: false,
    };
  }

  // Extraire le port de l'URL locale
  const port = extractPortFromUrl(url);

  if (!port) {
    throw new Error(
      `Cannot create tunnel: port not specified in URL ${url}. Please use format: http://localhost:PORT`
    );
  }

  console.log(`[CloudflareTunnel] Local URL detected: ${url}`);
  console.log(`[CloudflareTunnel] Creating tunnel for port ${port}...`);

  // Créer le tunnel
  const publicUrl = await createCloudflareTunnel({
    port,
    ...config,
  });

  return {
    url: publicUrl,
    tunnelCreated: true,
    port,
    originalUrl: url,
  };
}
