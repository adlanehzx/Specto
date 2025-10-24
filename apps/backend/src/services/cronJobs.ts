/**
 * Cron Jobs Service
 *
 * Ce service gère toutes les tâches planifiées de l'application :
 * 1. Nettoyage des tunnels inactifs (toutes les heures)
 * 2. Exécution des tests planifiés (toutes les minutes)
 */

import * as cron from "node-cron";
import * as tunnelManager from "./tunnelManager";
import { testScheduler } from "./testScheduler";

class CronJobsService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Démarre tous les cron jobs
   */
  public startAll(): void {
    console.log("🕐 Starting cron jobs...");

    // Nettoyage des tunnels toutes les heures
    this.startTunnelCleanup();

    // Exécution des tests planifiés toutes les minutes
    this.startScheduledTests();

    console.log("✅ All cron jobs started successfully");
  }

  /**
   * Arrête tous les cron jobs
   */
  public stopAll(): void {
    console.log("🛑 Stopping all cron jobs...");
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`  ✓ Stopped: ${name}`);
    });
    this.jobs.clear();
    console.log("✅ All cron jobs stopped");
  }

  /**
   * Nettoyage des tunnels inactifs
   * Exécution : Toutes les heures (à la minute 0)
   */
  private startTunnelCleanup(): void {
    const jobName = "tunnel-cleanup";

    // Cron expression: '0 * * * *' = toutes les heures à la minute 0
    // Pour les tests, on peut utiliser '*/5 * * * *' = toutes les 5 minutes
    const job = cron.schedule("0 * * * *", async () => {
      console.log("\n🧹 [CRON] Starting tunnel cleanup...");
      const startTime = Date.now();

      try {
        const closedCount = await tunnelManager.cleanupStaleTunnels();
        const duration = Date.now() - startTime;

        console.log(`✅ [CRON] Tunnel cleanup completed in ${duration}ms`);
        console.log(`   📊 Closed ${closedCount} stale tunnel(s)`);
      } catch (error) {
        console.error("❌ [CRON] Tunnel cleanup failed:", error);
      }
    });

    this.jobs.set(jobName, job);
    console.log(`  ✓ Started: ${jobName} (every hour at minute 0)`);
  }

  /**
   * Exécution des tests planifiés
   * Exécution : Toutes les minutes
   */
  private startScheduledTests(): void {
    const jobName = "scheduled-tests";

    // Cron expression: '* * * * *' = toutes les minutes
    const job = cron.schedule("* * * * *", async () => {
      console.log("\n📅 [CRON] Checking scheduled tests...");
      const startTime = Date.now();

      try {
        const result = await testScheduler.executeScheduledTests();
        const duration = Date.now() - startTime;

        if (result.executedCount > 0) {
          console.log(
            `✅ [CRON] Scheduled tests check completed in ${duration}ms`
          );
          console.log(`   📊 Executed ${result.executedCount} test(s)`);
          console.log(`   ⏭️  Skipped ${result.skippedCount} test(s)`);

          if (result.errors.length > 0) {
            console.error(`   ⚠️  Errors: ${result.errors.length}`);
            result.errors.forEach((error: any, index: number) => {
              console.error(
                `      ${index + 1}. ${error.testId}: ${error.error}`
              );
            });
          }
        } else {
          // Pas de log si aucun test à exécuter (pour éviter le spam)
        }
      } catch (error) {
        console.error("❌ [CRON] Scheduled tests execution failed:", error);
      }
    });

    this.jobs.set(jobName, job);
    console.log(`  ✓ Started: ${jobName} (every minute)`);
  }

  /**
   * Obtenir le statut de tous les cron jobs
   */
  public getStatus(): { name: string; running: boolean }[] {
    return Array.from(this.jobs.entries()).map(([name, job]) => ({
      name,
      running: true, // node-cron ne fournit pas de méthode pour vérifier l'état
    }));
  }

  /**
   * Exécuter manuellement le nettoyage des tunnels (pour les tests)
   */
  public async runTunnelCleanupNow(): Promise<void> {
    console.log("🧹 Running tunnel cleanup manually...");
    const closedCount = await tunnelManager.cleanupStaleTunnels();
    console.log(`✅ Cleaned up ${closedCount} tunnel(s)`);
  }

  /**
   * Exécuter manuellement les tests planifiés (pour les tests)
   */
  public async runScheduledTestsNow(): Promise<void> {
    console.log("📅 Running scheduled tests manually...");
    const result = await testScheduler.executeScheduledTests();
    console.log(`✅ Executed ${result.executedCount} test(s)`);
  }
}

// Export singleton
export const cronJobsService = new CronJobsService();
