/**
 * Test Scheduler Service
 *
 * Gère l'exécution des tests planifiés :
 * - Tests récurrents (hourly, daily, weekly, monthly)
 * - Tests ponctuels à une date/heure précise
 * - Mise à jour automatique de la prochaine exécution
 */

import { PrismaClient } from "@prisma/client";
import { addTestToQueue } from "../queue";

const prisma = new PrismaClient();

export interface ScheduleTestParams {
  testId: string;
  frequency?: "hourly" | "daily" | "weekly" | "monthly" | null;
  nextRunAt?: Date;
}

export interface ExecutionResult {
  executedCount: number;
  skippedCount: number;
  errors: Array<{ testId: string; error: string }>;
}

/**
 * Planifie un test pour exécution récurrente ou ponctuelle
 */
export async function scheduleTest(params: ScheduleTestParams): Promise<void> {
  const { testId, frequency, nextRunAt } = params;

  const updateData: any = {
    isScheduled: true,
    frequency: frequency || null,
  };

  // Si nextRunAt n'est pas fourni, calculer selon la fréquence
  if (nextRunAt) {
    updateData.nextRunAt = nextRunAt;
  } else if (frequency) {
    updateData.nextRunAt = calculateNextRun(new Date(), frequency);
  } else {
    throw new Error("Either frequency or nextRunAt must be provided");
  }

  await prisma.test.update({
    where: { id: testId },
    data: updateData,
  });

  console.log(`📅 Test ${testId} scheduled for ${updateData.nextRunAt}`);
}

/**
 * Désactive la planification d'un test
 */
export async function unscheduleTest(testId: string): Promise<void> {
  await prisma.test.update({
    where: { id: testId },
    data: {
      isScheduled: false,
      isActive: false,
      nextRunAt: null,
    },
  });

  console.log(`🔕 Test ${testId} unscheduled`);
}

/**
 * Active ou désactive un test planifié (sans le supprimer)
 */
export async function toggleScheduledTest(
  testId: string,
  isActive: boolean
): Promise<void> {
  await prisma.test.update({
    where: { id: testId },
    data: { isActive },
  });

  console.log(
    `${isActive ? "✅" : "⏸️"} Test ${testId} ${
      isActive ? "activated" : "paused"
    }`
  );
}

/**
 * Exécute tous les tests planifiés dont l'heure est arrivée
 */
export async function executeScheduledTests(): Promise<ExecutionResult> {
  const now = new Date();
  const result: ExecutionResult = {
    executedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  try {
    // Récupérer tous les tests planifiés prêts à être exécutés
    const testsToRun = await prisma.test.findMany({
      where: {
        isScheduled: true,
        isActive: true,
        nextRunAt: {
          lte: now, // Prochaine exécution <= maintenant
        },
      },
      include: {
        user: true,
      },
    });

    if (testsToRun.length === 0) {
      return result;
    }

    console.log(`\n📅 Found ${testsToRun.length} test(s) to execute`);

    // Exécuter chaque test
    for (const test of testsToRun) {
      try {
        // Préparer les données pour la queue
        const jobData = {
          testId: test.id,
          url: test.url,
          prompt: test.prompt,
          userId: test.userId,
          keepTunnelOpen: test.keepTunnelOpen,
        };

        // Ajouter le test à la queue d'exécution
        await addTestToQueue(jobData);

        // Mettre à jour lastRunAt et calculer nextRunAt si récurrent
        const updateData: any = {
          lastRunAt: now,
        };

        if (test.frequency) {
          // Test récurrent : calculer la prochaine exécution
          updateData.nextRunAt = calculateNextRun(
            now,
            test.frequency as "hourly" | "daily" | "weekly" | "monthly"
          );
          console.log(
            `   ✅ ${test.id} executed, next run: ${updateData.nextRunAt}`
          );
        } else {
          // Test ponctuel : désactiver après exécution
          updateData.isScheduled = false;
          updateData.isActive = false;
          updateData.nextRunAt = null;
          console.log(
            `   ✅ ${test.id} executed (one-time test, now disabled)`
          );
        }

        await prisma.test.update({
          where: { id: test.id },
          data: updateData,
        });

        result.executedCount++;
      } catch (error) {
        result.errors.push({
          testId: test.id,
          error: error instanceof Error ? error.message : String(error),
        });
        console.error(`   ❌ Failed to execute test ${test.id}:`, error);
      }
    }
  } catch (error) {
    console.error("❌ Error in executeScheduledTests:", error);
    throw error;
  }

  return result;
}

/**
 * Récupère tous les tests planifiés d'un utilisateur
 */
export async function getScheduledTests(userId: string) {
  return prisma.test.findMany({
    where: {
      userId,
      isScheduled: true,
    },
    include: {
      tunnel: true,
      results: {
        orderBy: { createdAt: "desc" },
        take: 1, // Dernier résultat
      },
    },
    orderBy: {
      nextRunAt: "asc",
    },
  });
}

/**
 * Calcule la prochaine date d'exécution selon la fréquence
 */
function calculateNextRun(
  from: Date,
  frequency: "hourly" | "daily" | "weekly" | "monthly"
): Date {
  const next = new Date(from);

  switch (frequency) {
    case "hourly":
      next.setHours(next.getHours() + 1);
      break;
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }

  return next;
}

/**
 * Récupère les statistiques de planification
 */
export async function getSchedulingStats(userId: string) {
  const [total, active, paused, byFrequency] = await Promise.all([
    // Total tests planifiés
    prisma.test.count({
      where: { userId, isScheduled: true },
    }),
    // Tests actifs
    prisma.test.count({
      where: { userId, isScheduled: true, isActive: true },
    }),
    // Tests en pause
    prisma.test.count({
      where: { userId, isScheduled: true, isActive: false },
    }),
    // Par fréquence
    prisma.test.groupBy({
      by: ["frequency"],
      where: { userId, isScheduled: true, isActive: true },
      _count: true,
    }),
  ]);

  return {
    total,
    active,
    paused,
    byFrequency: byFrequency.reduce((acc, item) => {
      acc[item.frequency || "one-time"] = item._count;
      return acc;
    }, {} as Record<string, number>),
  };
}

// Export singleton pour le cron job
export const testScheduler = {
  scheduleTest,
  unscheduleTest,
  toggleScheduledTest,
  executeScheduledTests,
  getScheduledTests,
  getSchedulingStats,
};
