/**
 * Service de génération de code de test
 *
 * Ce service orchestre la génération de code de test en utilisant
 * le service LLM (llm.ts) qui gère la logique de génération.
 */

import {
  generateTestCode as generateWithLLM,
  validateGeneratedCode as validateCode,
  extractCodeMetadata as extractMetadata,
  estimateTestDuration,
} from "./llm";
import { validatePrompt, type PromptValidationResult } from "./promptValidator";
import {
  isLocalUrl,
  resolveUrl,
  type CloudflareTunnelConfig,
  extractPortFromUrl,
} from "../tunnel/cloudflare";
import { getAgentTunnelUrl } from "../routes/agent";

export interface GenerateTestCodeParams {
  prompt: string;
  url: string;
  userId: string; // Add userId to check agent tunnels
  tunnelConfig?: Partial<CloudflareTunnelConfig>;
}

export interface GenerateTestCodeResult {
  code: string;
  framework: "playwright" | "puppeteer";
  estimatedDuration?: number;
  promptValidation?: PromptValidationResult;
  tunnelUrl?: string; // URL publique du tunnel si URL locale
  originalUrl?: string; // URL locale originale
}

/**
 * Génère du code de test basé sur le prompt et l'URL
 *
 * @param params - Paramètres de génération (prompt, url)
 * @returns Code de test généré avec métadonnées
 */
export async function generateTestCode(
  params: GenerateTestCodeParams
): Promise<GenerateTestCodeResult> {
  const { prompt, url, userId, tunnelConfig } = params;

  try {
    // 1. Valider le prompt AVANT de générer
    console.log(`[TestGenerator] Validating prompt...`);
    const validation = await validatePrompt(prompt);

    console.log(
      `[TestGenerator] Prompt score: ${validation.score}/100 (${
        validation.valid ? "valid" : "invalid"
      })`
    );

    // 2. Rejeter directement si le prompt est invalide (Option A)
    if (!validation.valid) {
      console.warn(
        `[TestGenerator] Prompt validation failed: ${validation.reason}`
      );

      throw new Error(
        `Prompt invalide (score: ${validation.score}/100).\n` +
          `Raison: ${validation.reason}\n` +
          `Suggestion: ${
            validation.suggestion ||
            "Soyez plus précis sur l'action et l'élément à tester."
          }`
      );
    }

    const finalPrompt = prompt;

    // 3. Résoudre l'URL - check agent tunnels first, then fallback to cloudflared
    console.log(`[TestGenerator] Resolving URL: ${url}`);

    let finalUrl = url;
    let tunnelUrl: string | undefined;
    let originalUrl: string | undefined;
    let tunnelSource: "agent" | "cloudflared" | "none" = "none";

    // Check if URL is local
    if (isLocalUrl(url)) {
      const port = extractPortFromUrl(url);

      if (port) {
        // First, try to get tunnel from agent
        console.log(
          `[TestGenerator] Checking agent tunnel for port ${port}...`
        );
        const agentTunnel = await getAgentTunnelUrl(userId, port);

        if (agentTunnel) {
          console.log(`[TestGenerator] ✅ Using agent tunnel: ${agentTunnel}`);
          finalUrl = agentTunnel;
          tunnelUrl = agentTunnel;
          originalUrl = url;
          tunnelSource = "agent";
        } else {
          // Fallback to cloudflared
          console.log(
            `[TestGenerator] No agent tunnel found, creating cloudflared tunnel...`
          );
          const resolvedUrl = await resolveUrl(url, tunnelConfig);

          if (resolvedUrl.tunnelCreated) {
            console.log(
              `[TestGenerator] ✅ Cloudflared tunnel created: ${resolvedUrl.url}`
            );
            finalUrl = resolvedUrl.url;
            tunnelUrl = resolvedUrl.url;
            originalUrl = url;
            tunnelSource = "cloudflared";
          }
        }
      } else {
        throw new Error(
          `Cannot create tunnel: port not specified in URL ${url}. Please use format: http://localhost:PORT`
        );
      }
    } else {
      console.log(`[TestGenerator] Public URL used directly: ${url}`);
    }

    console.log(
      `[TestGenerator] Final URL: ${finalUrl} (source: ${tunnelSource})`
    );

    // 4. Générer le code avec le prompt validé et l'URL résolue
    console.log(`[TestGenerator] Generating test code for ${finalUrl}...`);
    const code = await generateWithLLM(finalPrompt, finalUrl);

    // 5. Valider le code généré
    if (!validateCode(code)) {
      throw new Error("Generated code is invalid");
    }

    // 6. Estimer la durée d'exécution
    const estimatedDuration = estimateTestDuration(code);

    console.log(
      `[TestGenerator] Test code generated successfully (${code.length} chars)`
    );

    return {
      code,
      framework: "playwright",
      estimatedDuration,
      promptValidation: validation,
      tunnelUrl,
      originalUrl,
    };
  } catch (error) {
    console.error("[TestGenerator] Error in generateTestCode:", error);
    throw error;
  }
}

/**
 * Valide que le code généré est syntaxiquement correct
 *
 * @param code - Code à valider
 * @returns true si valide, false sinon
 */
export function validateGeneratedCode(code: string): boolean {
  return validateCode(code);
}

/**
 * Extrait les métadonnées du code généré
 *
 * @param code - Code de test
 * @returns Métadonnées extraites
 */
export function extractCodeMetadata(code: string) {
  return extractMetadata(code);
}
