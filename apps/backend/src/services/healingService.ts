/**
 * Auto-Healing Service
 *
 * Service pour détecter et corriger automatiquement les tests échoués
 * en utilisant l'IA pour identifier les causes et générer un code corrigé.
 */

import { PrismaClient } from "@prisma/client";
import { generateTestCode } from "./llm";
import { runTestFromCode } from "../runner/playrunner";

const prisma = new PrismaClient();

// Types pour le contexte d'échec
export interface HealingContext {
  testId: string;
  resultId: string;
  errorMessage: string;
  errorStack: string;
  originalCode: string;
  logs: string;
  screenshotUrl: string | null;
  domSnapshot?: string;
  url: string;
}

// Types pour la réponse du LLM
interface HealingSolution {
  diagnosis: string;
  errorType: string;
  confidence: number;
  fixedCode: string;
  changes: Array<{
    type: string;
    before?: string;
    after?: string;
    line?: number;
    code?: string;
    reason: string;
  }>;
  explanation: string;
  recommendations: string[];
}

// Types pour le résultat de l'auto-healing
export interface HealingResult {
  success: boolean;
  healingAttemptId: string;
  changes?: Array<any>;
  explanation?: string;
  reason?: string;
}

/**
 * Détecte le type d'erreur à partir du message d'erreur
 */
function detectErrorType(errorMessage: string): string {
  const errorPatterns = [
    { pattern: /waiting for (selector|locator|element)/i, type: "selector" },
    { pattern: /timeout|timed out/i, type: "timeout" },
    {
      pattern: /expect|assertion|toBe|toContain|toHaveText/i,
      type: "assertion",
    },
    { pattern: /navigation|navigat/i, type: "navigation" },
    { pattern: /(not )?visible|hidden|display/i, type: "visibility" },
    { pattern: /detached|stale/i, type: "race-condition" },
  ];

  for (const { pattern, type } of errorPatterns) {
    if (pattern.test(errorMessage)) {
      return type;
    }
  }

  return "unknown";
}

/**
 * Extrait le numéro de ligne où le test a échoué
 */
function extractFailedLine(stack: string): number | null {
  // Patterns courants dans les stack traces
  const patterns = [
    /:(\d+):\d+/, // file.ts:123:45
    /line (\d+)/i, // at line 123
    /\[(\d+),\d+\]/, // [123, 45]
  ];

  for (const pattern of patterns) {
    const match = stack.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

/**
 * Construit le prompt pour le LLM
 */
function buildHealingPrompt(context: HealingContext): string {
  return `Tu es un expert en tests Playwright et en debugging. Ta mission est de corriger automatiquement un test qui a échoué.

## CONTEXTE DU TEST

**URL testée** : ${context.url}

**Code du test** :
\`\`\`typescript
${context.originalCode}
\`\`\`

**Message d'erreur** :
\`\`\`
${context.errorMessage}
\`\`\`

**Stack trace** :
\`\`\`
${context.errorStack}
\`\`\`

**Logs d'exécution** :
\`\`\`
${context.logs}
\`\`\`

${
  context.screenshotUrl
    ? `**Screenshot disponible** : ${context.screenshotUrl}`
    : ""
}

${
  context.domSnapshot
    ? `**DOM Snapshot** :\n\`\`\`html\n${context.domSnapshot.substring(
        0,
        2000
      )}...\n\`\`\`\n`
    : ""
}

## TA MISSION

1. **Identifier la cause précise** de l'échec du test
2. **Proposer un code Playwright corrigé** qui résout le problème
3. **Expliquer les changements** apportés de manière détaillée
4. **Rendre le test plus robuste** pour éviter les échecs futurs

## CONTRAINTES ET BEST PRACTICES

- ✅ Utiliser les best practices Playwright (locators modernes, waitFor explicites)
- ✅ Préférer les sélecteurs stables : data-testid > role > text > CSS
- ✅ Ajouter des waitFor explicites si nécessaire (waitForLoadState, waitForSelector)
- ✅ Gérer les race conditions avec des attentes appropriées
- ✅ Rendre le test idempotent et résilient
- ✅ Augmenter les timeouts si nécessaire (mais justifier pourquoi)
- ❌ Ne pas changer la logique métier du test
- ❌ Ne pas supprimer des assertions importantes
- ❌ Ne pas utiliser de sleep() ou waitForTimeout() arbitraires

## FORMAT DE RÉPONSE

Réponds **UNIQUEMENT** avec un objet JSON valide (pas de texte avant ou après) au format suivant :

{
  "diagnosis": "Description précise du problème identifié",
  "errorType": "selector|timeout|assertion|navigation|visibility|race-condition",
  "confidence": 0.95,
  "fixedCode": "// Code Playwright corrigé complet\\nimport { test, expect } from '@playwright/test';\\n\\ntest('...', async ({ page }) => {\\n  // Code corrigé\\n});",
  "changes": [
    {
      "type": "selector-update|wait-added|timeout-increased|assertion-improved|navigation-fixed",
      "before": "ancien code",
      "after": "nouveau code",
      "line": 15,
      "reason": "Explication du changement"
    }
  ],
  "explanation": "Explication détaillée de TOUS les changements et pourquoi ils résolvent le problème",
  "recommendations": [
    "Recommandation 1 pour améliorer la stabilité",
    "Recommandation 2 pour éviter les futurs problèmes"
  ]
}

**IMPORTANT** : Le champ \`fixedCode\` doit contenir le code Playwright **complet et prêt à exécuter**, avec tous les imports nécessaires.`;
}

/**
 * Tente de corriger automatiquement un test échoué
 *
 * @param context Contexte de l'échec du test
 * @returns Résultat de la tentative de correction
 */
export async function attemptAutoHealing(
  context: HealingContext
): Promise<HealingResult> {
  console.log(`🔧 [Auto-Healing] Starting for test ${context.testId}...`);

  try {
    // 1. Créer un HealingAttempt en BDD
    const healingAttempt = await prisma.healingAttempt.create({
      data: {
        testId: context.testId,
        resultId: context.resultId,
        errorType: detectErrorType(context.errorMessage),
        errorMessage: context.errorMessage,
        originalCode: context.originalCode,
        failedLine: extractFailedLine(context.errorStack),
        status: "pending",
      },
    });

    console.log(
      `📝 [Auto-Healing] Created healing attempt: ${healingAttempt.id}`
    );
    console.log(
      `🔍 [Auto-Healing] Detected error type: ${healingAttempt.errorType}`
    );

    // 2. Construire le prompt pour le LLM
    const prompt = buildHealingPrompt(context);

    console.log(`🤖 [Auto-Healing] Asking LLM for solution...`);

    // 3. Appeler le LLM pour obtenir une solution
    const llmResponse = await generateTestCode(prompt, context.url);

    console.log(`✅ [Auto-Healing] LLM response received`);

    // 4. Parser la réponse du LLM
    let healingSolution: HealingSolution;
    try {
      // Le LLM retourne une string JSON qu'on doit parser
      healingSolution = JSON.parse(llmResponse);
    } catch (parseError) {
      console.error(
        `❌ [Auto-Healing] Failed to parse LLM response:`,
        parseError
      );

      // Mise à jour avec échec de parsing
      await prisma.healingAttempt.update({
        where: { id: healingAttempt.id },
        data: {
          status: "failed",
          llmPrompt: prompt,
          llmResponse: llmResponse,
        },
      });

      return {
        success: false,
        healingAttemptId: healingAttempt.id,
        reason: "Failed to parse LLM response",
      };
    }

    console.log(
      `🔍 [Auto-Healing] Solution diagnosis: ${healingSolution.diagnosis}`
    );
    console.log(
      `📊 [Auto-Healing] Confidence: ${(
        healingSolution.confidence * 100
      ).toFixed(0)}%`
    );
    console.log(
      `🔧 [Auto-Healing] Changes: ${healingSolution.changes.length} modifications`
    );

    // 5. Valider le code corrigé en l'exécutant
    console.log(`🧪 [Auto-Healing] Testing healed code...`);

    let validationResult;
    try {
      validationResult = await runTestFromCode(healingSolution.fixedCode, {
        headless: true,
        timeout: 60000, // Timeout plus long pour validation
      });
    } catch (runError: any) {
      console.error(`❌ [Auto-Healing] Validation execution failed:`, runError);

      // Mise à jour avec échec d'exécution
      await prisma.healingAttempt.update({
        where: { id: healingAttempt.id },
        data: {
          healedCode: healingSolution.fixedCode,
          changes: healingSolution.changes as any,
          llmPrompt: prompt,
          llmResponse: JSON.stringify(healingSolution),
          status: "failed",
          confidence: healingSolution.confidence,
        },
      });

      return {
        success: false,
        healingAttemptId: healingAttempt.id,
        reason: `Validation execution failed: ${runError.message}`,
      };
    }

    // 6. Vérifier si le test corrigé passe
    const success = validationResult.status === "passed";

    console.log(
      `${success ? "✅" : "❌"} [Auto-Healing] Validation result: ${
        validationResult.status
      }`
    );

    // 7. Mettre à jour le HealingAttempt avec le résultat
    await prisma.healingAttempt.update({
      where: { id: healingAttempt.id },
      data: {
        healedCode: healingSolution.fixedCode,
        changes: healingSolution.changes as any,
        llmPrompt: prompt,
        llmResponse: JSON.stringify(healingSolution),
        status: success ? "success" : "failed",
        confidence: healingSolution.confidence,
        healedAt: success ? new Date() : null,
      },
    });

    // 8. Si succès, mettre à jour le code du test
    if (success) {
      await prisma.test.update({
        where: { id: context.testId },
        data: {
          code: healingSolution.fixedCode,
        },
      });

      console.log(`✅ [Auto-Healing] Test code updated successfully!`);
      console.log(
        `📝 [Auto-Healing] Explanation: ${healingSolution.explanation}`
      );

      return {
        success: true,
        healingAttemptId: healingAttempt.id,
        changes: healingSolution.changes,
        explanation: healingSolution.explanation,
      };
    } else {
      console.log(
        `❌ [Auto-Healing] Healed code still fails. Manual review needed.`
      );
      console.log(
        `📝 [Auto-Healing] Validation status: ${validationResult.status}`
      );

      return {
        success: false,
        healingAttemptId: healingAttempt.id,
        reason: `Validation failed: ${validationResult.status}`,
      };
    }
  } catch (error: any) {
    console.error(`❌ [Auto-Healing] Unexpected error:`, error);

    return {
      success: false,
      healingAttemptId: "",
      reason: `Unexpected error: ${error.message}`,
    };
  }
}

/**
 * Récupère l'historique des tentatives de healing pour un test
 */
export async function getHealingHistory(testId: string) {
  return await prisma.healingAttempt.findMany({
    where: { testId },
    orderBy: { createdAt: "desc" },
    include: {
      result: {
        select: {
          status: true,
          createdAt: true,
        },
      },
    },
  });
}

/**
 * Récupère les statistiques d'auto-healing pour un utilisateur
 */
export async function getHealingStats(userId: string) {
  const tests = await prisma.test.findMany({
    where: { userId },
    select: { id: true },
  });

  const testIds = tests.map((t) => t.id);

  const totalAttempts = await prisma.healingAttempt.count({
    where: { testId: { in: testIds } },
  });

  const successfulAttempts = await prisma.healingAttempt.count({
    where: {
      testId: { in: testIds },
      status: "success",
    },
  });

  const failedAttempts = await prisma.healingAttempt.count({
    where: {
      testId: { in: testIds },
      status: "failed",
    },
  });

  const averageConfidence = await prisma.healingAttempt.aggregate({
    where: {
      testId: { in: testIds },
      confidence: { not: null },
    },
    _avg: {
      confidence: true,
    },
  });

  return {
    totalAttempts,
    successfulAttempts,
    failedAttempts,
    successRate:
      totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0,
    averageConfidence: averageConfidence._avg.confidence || 0,
  };
}
