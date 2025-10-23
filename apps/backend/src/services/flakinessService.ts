/**
 * Flakiness Detection Service
 *
 * Service pour détecter automatiquement les tests instables (flaky)
 * et générer des recommandations pour les stabiliser.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Types
interface FlakinessMetrics {
  totalRuns: number;
  successCount: number;
  failureCount: number;
  reliabilityScore: number;
  flakinessRate: number;
  isFlaky: boolean;
  severity: "low" | "medium" | "high" | "critical";
}

interface ErrorPattern {
  type: string;
  count: number;
  percentage: number;
  examples: string[];
}

interface Recommendation {
  type: string;
  priority: "low" | "medium" | "high";
  message: string;
  reason: string;
}

interface FlipAnalysis {
  count: number;
  lastFlipAt: Date | null;
}

/**
 * Analyser le flakiness d'un test après chaque exécution
 */
export async function analyzeFlakinessAfterRun(
  testId: string,
  resultId: string
) {
  console.log(`🔍 [Flakiness] Analyzing test ${testId}...`);

  try {
    // 1. Récupérer tous les résultats du test (limité aux 50 derniers)
    const results = await prisma.result.findMany({
      where: { testId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        status: true,
        logs: true,
        duration: true,
        createdAt: true,
      },
    });

    const totalRuns = results.length;

    // Pas assez de données pour analyser (minimum 5 exécutions)
    if (totalRuns < 5) {
      console.log(
        `  ℹ️  Not enough runs (${totalRuns}/5 minimum) - skipping analysis`
      );
      return null;
    }

    console.log(`  📊 Analyzing ${totalRuns} runs...`);

    // 2. Calculer les métriques de base
    const metrics = calculateMetrics(results);

    console.log(
      `  📈 Reliability: ${metrics.reliabilityScore.toFixed(1)}% (${
        metrics.successCount
      }/${totalRuns} passed)`
    );
    console.log(
      `  ${metrics.isFlaky ? "⚠️  FLAKY DETECTED" : "✅ Stable"} - Severity: ${
        metrics.severity
      }`
    );

    // 3. Analyser les patterns d'erreurs
    const errorPatterns = analyzeErrorPatterns(results);
    const patternCount = Object.keys(errorPatterns).length;

    if (patternCount > 0) {
      console.log(`  🔍 Error patterns found: ${patternCount}`);
      Object.entries(errorPatterns).forEach(([type, pattern]) => {
        console.log(
          `    • ${type}: ${
            pattern.count
          } occurrences (${pattern.percentage.toFixed(0)}%)`
        );
      });
    }

    // 4. Détecter les alternances (flips)
    const flipAnalysis = analyzeFlips(results);

    if (flipAnalysis.count > 0) {
      console.log(`  🔄 Flips detected: ${flipAnalysis.count} alternances`);
    }

    // 5. Calculer les métriques de durée
    const avgDuration = calculateAvgDuration(results);
    const durationVariance = calculateDurationVariance(results);

    console.log(
      `  ⏱️  Duration: avg ${avgDuration}ms, variance ±${durationVariance.toFixed(
        0
      )}ms`
    );

    // 6. Générer des recommandations
    const recommendations = generateRecommendations(
      metrics,
      errorPatterns,
      flipAnalysis
    );

    if (recommendations.length > 0) {
      console.log(`  💡 Recommendations: ${recommendations.length}`);
      recommendations.forEach((rec) => {
        console.log(`    • [${rec.priority}] ${rec.message}`);
      });
    }

    // 7. Vérifier si le test était déjà flaky
    const wasFlaky = await wasAlreadyFlaky(testId);
    const isNewFlaky = metrics.isFlaky && !wasFlaky;

    // 8. Créer ou mettre à jour le rapport
    const report = await prisma.flakinessReport.upsert({
      where: { testId },
      create: {
        testId,
        totalRuns,
        successCount: metrics.successCount,
        failureCount: metrics.failureCount,
        reliabilityScore: metrics.reliabilityScore,
        flakinessRate: metrics.flakinessRate,
        isFlaky: metrics.isFlaky,
        severity: metrics.severity,
        errorPatterns: errorPatterns as any,
        failureReasons: {} as any,
        avgDuration,
        durationVariance,
        lastFlipAt: flipAnalysis.lastFlipAt,
        flipCount: flipAnalysis.count,
        recommendations: recommendations as any,
        firstDetectedAt: metrics.isFlaky ? new Date() : null,
        lastAnalyzedAt: new Date(),
      },
      update: {
        totalRuns,
        successCount: metrics.successCount,
        failureCount: metrics.failureCount,
        reliabilityScore: metrics.reliabilityScore,
        flakinessRate: metrics.flakinessRate,
        isFlaky: metrics.isFlaky,
        severity: metrics.severity,
        errorPatterns: errorPatterns as any,
        avgDuration,
        durationVariance,
        lastFlipAt: flipAnalysis.lastFlipAt,
        flipCount: flipAnalysis.count,
        recommendations: recommendations as any,
        // Ne mettre à jour firstDetectedAt que si c'est nouveau
        firstDetectedAt: isNewFlaky ? new Date() : undefined,
        lastAnalyzedAt: new Date(),
      },
    });

    // 9. Notifier si nouveau test flaky détecté
    if (isNewFlaky) {
      console.log(`  🚨 NEW FLAKY TEST DETECTED!`);
      console.log(`    Test ID: ${testId}`);
      console.log(`    Reliability: ${metrics.reliabilityScore.toFixed(0)}%`);
      console.log(`    Severity: ${metrics.severity}`);
      // TODO: Envoyer notification (email, Slack, webhook, etc.)
    }

    console.log(`  ✅ Flakiness analysis completed`);

    return report;
  } catch (error: any) {
    console.error(`❌ [Flakiness] Analysis failed:`, error.message);
    return null;
  }
}

/**
 * Calculer les métriques de base
 */
function calculateMetrics(results: any[]): FlakinessMetrics {
  const totalRuns = results.length;
  const successCount = results.filter((r: any) => r.status === "passed").length;
  const failureCount = totalRuns - successCount;

  const reliabilityScore = totalRuns > 0 ? (successCount / totalRuns) * 100 : 0;
  const flakinessRate = totalRuns > 0 ? (failureCount / totalRuns) * 100 : 0;

  // Un test est flaky si son taux d'échec est entre 20% et 80%
  // (ni toujours stable, ni toujours cassé)
  const isFlaky = flakinessRate > 20 && flakinessRate < 80;

  // Déterminer la sévérité basée sur le score de fiabilité
  let severity: "low" | "medium" | "high" | "critical";
  if (reliabilityScore >= 95) {
    severity = "low"; // Très fiable
  } else if (reliabilityScore >= 80) {
    severity = "low"; // Fiable
  } else if (reliabilityScore >= 60) {
    severity = "medium"; // Instable
  } else if (reliabilityScore >= 40) {
    severity = "high"; // Très instable
  } else {
    severity = "critical"; // Critique
  }

  return {
    totalRuns,
    successCount,
    failureCount,
    reliabilityScore,
    flakinessRate,
    isFlaky,
    severity,
  };
}

/**
 * Analyser les patterns d'erreurs à partir des logs
 */
function analyzeErrorPatterns(results: any[]): Record<string, ErrorPattern> {
  const patterns: Record<string, ErrorPattern> = {};

  const failedResults = results.filter(
    (r: any) => r.status === "failed" || r.status === "error"
  );

  const totalFailures = failedResults.length;

  if (totalFailures === 0) {
    return patterns;
  }

  // Analyser chaque échec
  failedResults.forEach((result: any) => {
    const logs = result.logs || "";

    let errorType = "unknown";
    let errorMessage = logs.substring(0, 150).replace(/\n/g, " ");

    // Détecter le type d'erreur via patterns dans les logs
    if (
      logs.includes("waiting for selector") ||
      logs.includes("Element not found")
    ) {
      errorType = "selector";
    } else if (
      logs.includes("Timeout") ||
      logs.includes("timeout") ||
      logs.includes("timed out")
    ) {
      errorType = "timeout";
    } else if (
      logs.includes("expect") ||
      logs.includes("assertion") ||
      logs.includes("Expected")
    ) {
      errorType = "assertion";
    } else if (logs.includes("navigation") || logs.includes("navigate")) {
      errorType = "navigation";
    } else if (
      logs.includes("not visible") ||
      logs.includes("hidden") ||
      logs.includes("visibility")
    ) {
      errorType = "visibility";
    } else if (logs.includes("race") || logs.includes("detached")) {
      errorType = "race-condition";
    }

    // Initialiser le pattern s'il n'existe pas
    if (!patterns[errorType]) {
      patterns[errorType] = {
        type: errorType,
        count: 0,
        percentage: 0,
        examples: [],
      };
    }

    // Incrémenter le compteur
    patterns[errorType].count++;

    // Ajouter l'exemple si on en a moins de 3
    if (patterns[errorType].examples.length < 3 && errorMessage.trim()) {
      patterns[errorType].examples.push(errorMessage);
    }
  });

  // Calculer les pourcentages
  Object.values(patterns).forEach((pattern) => {
    pattern.percentage = (pattern.count / totalFailures) * 100;
  });

  return patterns;
}

/**
 * Analyser les alternances (flips) succès/échec
 */
function analyzeFlips(results: any[]): FlipAnalysis {
  let flipCount = 0;
  let lastFlipAt: Date | null = null;

  // Parcourir les résultats en ordre chronologique inversé
  for (let i = 1; i < results.length; i++) {
    const current = results[i];
    const previous = results[i - 1];

    const currentPassed = current.status === "passed";
    const previousPassed = previous.status === "passed";

    // Alternance détectée (succès → échec ou échec → succès)
    if (currentPassed !== previousPassed) {
      flipCount++;

      // Garder la date de la première alternance trouvée (plus récente)
      if (!lastFlipAt) {
        lastFlipAt = new Date(current.createdAt);
      }
    }
  }

  return { count: flipCount, lastFlipAt };
}

/**
 * Calculer la durée moyenne d'exécution
 */
function calculateAvgDuration(results: any[]): number {
  const durations = results
    .map((r: any) => r.duration || 0)
    .filter((d: number) => d > 0);

  if (durations.length === 0) {
    return 0;
  }

  const sum = durations.reduce((acc: number, d: number) => acc + d, 0);
  return Math.round(sum / durations.length);
}

/**
 * Calculer la variance (écart-type) de durée
 */
function calculateDurationVariance(results: any[]): number {
  const durations = results
    .map((r: any) => r.duration || 0)
    .filter((d: number) => d > 0);

  if (durations.length < 2) {
    return 0;
  }

  const avg = calculateAvgDuration(results);
  const squaredDiffs = durations.map((d: number) => Math.pow(d - avg, 2));
  const variance =
    squaredDiffs.reduce((acc: number, d: number) => acc + d, 0) /
    durations.length;

  // Retourner l'écart-type (racine carrée de la variance)
  return Math.sqrt(variance);
}

/**
 * Générer des recommandations pour stabiliser le test
 */
function generateRecommendations(
  metrics: FlakinessMetrics,
  errorPatterns: Record<string, ErrorPattern>,
  flipAnalysis: FlipAnalysis
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Recommandation 1: Si beaucoup de timeouts
  const timeoutPattern = errorPatterns["timeout"];
  if (timeoutPattern && timeoutPattern.percentage > 30) {
    recommendations.push({
      type: "increase-timeout",
      priority: "high",
      message: "Augmenter les timeouts du test (30s → 60s)",
      reason: `${timeoutPattern.percentage.toFixed(
        0
      )}% des échecs sont dus à des timeouts`,
    });
  }

  // Recommandation 2: Si beaucoup de sélecteurs invalides
  const selectorPattern = errorPatterns["selector"];
  if (selectorPattern && selectorPattern.percentage > 30) {
    recommendations.push({
      type: "stabilize-selector",
      priority: "high",
      message: "Utiliser des sélecteurs plus stables (data-testid)",
      reason: `${selectorPattern.percentage.toFixed(
        0
      )}% des échecs sont dus à des sélecteurs`,
    });
  }

  // Recommandation 3: Si beaucoup d'alternances (race conditions)
  if (flipAnalysis.count > 5) {
    recommendations.push({
      type: "add-wait",
      priority: "medium",
      message: "Ajouter des waitFor explicites (waitForLoadState)",
      reason: `${flipAnalysis.count} alternances détectées - possibles race conditions`,
    });
  }

  // Recommandation 4: Si problèmes de visibilité
  const visibilityPattern = errorPatterns["visibility"];
  if (visibilityPattern && visibilityPattern.percentage > 20) {
    recommendations.push({
      type: "check-visibility",
      priority: "medium",
      message: "Ajouter des vérifications de visibilité (waitFor visible)",
      reason: `${visibilityPattern.percentage.toFixed(
        0
      )}% des échecs sont dus à la visibilité`,
    });
  }

  // Recommandation 5: Si assertions échouent souvent
  const assertionPattern = errorPatterns["assertion"];
  if (assertionPattern && assertionPattern.percentage > 25) {
    recommendations.push({
      type: "review-assertions",
      priority: "medium",
      message: "Revoir les assertions (utiliser toContain au lieu de toBe)",
      reason: `${assertionPattern.percentage.toFixed(
        0
      )}% des échecs sont des assertions`,
    });
  }

  // Recommandation 6: Si très instable (critique)
  if (metrics.severity === "critical") {
    recommendations.push({
      type: "rewrite-test",
      priority: "high",
      message: "Envisager de réécrire le test complètement",
      reason: `Fiabilité critique (${metrics.reliabilityScore.toFixed(
        0
      )}% de succès)`,
    });
  }

  // Recommandation 7: Si test flaky mais pas critique
  if (metrics.isFlaky && metrics.severity !== "critical") {
    recommendations.push({
      type: "enable-auto-healing",
      priority: "low",
      message: "Activer l'auto-healing pour correction automatique",
      reason: "Le test est flaky mais pourrait être auto-corrigé",
    });
  }

  return recommendations;
}

/**
 * Vérifier si le test était déjà marqué flaky
 */
async function wasAlreadyFlaky(testId: string): Promise<boolean> {
  const report = await prisma.flakinessReport.findUnique({
    where: { testId },
    select: { isFlaky: true, firstDetectedAt: true },
  });

  return report?.isFlaky === true && report.firstDetectedAt !== null;
}

/**
 * Récupérer les tests flaky d'un utilisateur
 */
export async function getFlakyTests(userId: string) {
  const tests = await prisma.test.findMany({
    where: {
      userId,
      flakinessReport: {
        isFlaky: true,
      },
    },
    include: {
      flakinessReport: true,
      results: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: {
      flakinessReport: {
        severity: "desc",
      },
    },
  });

  return tests;
}

/**
 * Récupérer les statistiques globales de flakiness
 */
export async function getFlakinessStats(userId: string) {
  // Récupérer tous les tests de l'utilisateur
  const allTests = await prisma.test.findMany({
    where: { userId },
    select: { id: true },
  });

  const testIds = allTests.map((t) => t.id);
  const totalTests = testIds.length;

  if (totalTests === 0) {
    return {
      totalTests: 0,
      flakyCount: 0,
      criticalCount: 0,
      flakyPercentage: 0,
      avgReliability: 0,
    };
  }

  // Compter les tests flaky
  const flakyCount = await prisma.flakinessReport.count({
    where: {
      testId: { in: testIds },
      isFlaky: true,
    },
  });

  // Compter les tests critiques
  const criticalCount = await prisma.flakinessReport.count({
    where: {
      testId: { in: testIds },
      severity: "critical",
    },
  });

  // Calculer la fiabilité moyenne
  const avgReliabilityResult = await prisma.flakinessReport.aggregate({
    where: {
      testId: { in: testIds },
    },
    _avg: {
      reliabilityScore: true,
    },
  });

  return {
    totalTests,
    flakyCount,
    criticalCount,
    flakyPercentage: (flakyCount / totalTests) * 100,
    avgReliability: avgReliabilityResult._avg.reliabilityScore || 0,
  };
}

/**
 * Récupérer le rapport de flakiness d'un test spécifique
 */
export async function getFlakinessReport(testId: string) {
  return await prisma.flakinessReport.findUnique({
    where: { testId },
    include: {
      test: {
        select: {
          id: true,
          url: true,
          prompt: true,
          createdAt: true,
        },
      },
    },
  });
}
