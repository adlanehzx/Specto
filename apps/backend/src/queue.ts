import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";
import { prisma } from "./db";
import { runTestFromCode } from "./runner/playrunner";
import { generateTestCode } from "./services/testGenerator";
import { uploadScreenshot } from "./services/storageService";
import { attemptAutoHealing } from "./services/healingService";
import { analyzeFlakinessAfterRun } from "./services/flakinessService";
import { publishNotification } from "./services/notificationPublisher";
import {
  closeCloudflareTunnel,
  isLocalUrl,
  extractPortFromUrl,
} from "./tunnel/cloudflare";
import { closeTunnel } from "./services/tunnelManager";

// Configuration Redis
const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
const redisPassword = process.env.REDIS_PASSWORD;

const redisConnection = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  maxRetriesPerRequest: null,
});

// Créer la queue pour les tests
export const testQueue = new Queue("test-generation", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      count: 100, // Garde les 100 derniers jobs complétés
    },
    removeOnFail: {
      count: 50, // Garde les 50 derniers jobs échoués
    },
  },
});

// Interface pour les données du job
export interface TestJobData {
  testId: string;
  url: string;
  prompt: string;
  userId: string;
  keepTunnelOpen?: boolean; // Garder le tunnel ouvert après le test
  currentRetry?: number; // Retry actuel
  originalResultId?: string; // ID du résultat initial si c'est un retry
}

/**
 * Calculer le délai exponentiel pour le retry
 */
function calculateRetryDelay(
  retryDelay: number,
  attemptNumber: number
): number {
  // Délai exponentiel: delay * 2^attemptNumber
  // Exemple: 1000ms, 2000ms, 4000ms, 8000ms, etc.
  return retryDelay * Math.pow(2, attemptNumber);
}

/**
 * Helper pour attendre un certain délai
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Worker pour traiter les jobs
export const createTestWorker = () => {
  const worker = new Worker<TestJobData>(
    "test-generation",
    async (job: Job<TestJobData>) => {
      const {
        testId,
        url,
        prompt,
        userId,
        keepTunnelOpen = false,
        currentRetry = 0,
        originalResultId = null,
      } = job.data;

      console.log(`🔄 Processing test job ${job.id} (Retry ${currentRetry})`);
      console.log(`  Test ID: ${testId}`);
      console.log(`  URL: ${url}`);
      console.log(`  User ID: ${userId}`);
      console.log(`  Keep tunnel open: ${keepTunnelOpen}`);

      let tunnelPort: number | null = null;
      let tunnelUrl: string | null = null;

      try {
        // 1. Récupérer le test depuis la DB avec son tunnel
        let test = await prisma.test.findUnique({
          where: { id: testId },
          include: { tunnel: true },
        });

        if (!test) {
          throw new Error(`Test ${testId} not found in database`);
        }

        // 2. Générer le code si absent
        if (!test.code || test.code.trim() === "") {
          console.log(`🤖 Generating test code with AI...`);

          try {
            const generatedTest = await generateTestCode({
              prompt: test.prompt,
              url: test.url,
              userId: test.userId, // Pass userId for agent tunnel lookup
            });

            console.log(
              `  Generated code: ${generatedTest.code.length} characters`
            );

            // Stocker les infos du tunnel si créé
            if (generatedTest.tunnelUrl) {
              tunnelUrl = generatedTest.tunnelUrl;
              tunnelPort = extractPortFromUrl(generatedTest.originalUrl || url);

              console.log(`🌐 Tunnel created: ${tunnelUrl}`);
              console.log(`  Original URL: ${generatedTest.originalUrl}`);
            }

            // Mettre à jour le test avec le code généré
            test = await prisma.test.update({
              where: { id: testId },
              data: {
                code: generatedTest.code,
              },
              include: { tunnel: true },
            });

            console.log(`✅ Code generated and saved to database`);
          } catch (genError: any) {
            console.error(`❌ Code generation failed:`, genError.message);
            throw new Error(`Failed to generate code: ${genError.message}`);
          }
        } else {
          console.log(`  Using existing code: ${test.code.length} characters`);

          // Récupérer l'URL du tunnel si elle existe déjà
          if (test.tunnel && test.tunnel.status === "active") {
            tunnelUrl = test.tunnel.url;
            tunnelPort = test.tunnel.port;
            console.log(`🌐 Using existing tunnel: ${tunnelUrl}`);
          }
        }

        // 3. Exécuter le test avec Playwright Runner 🎭
        console.log(`🎭 Executing Playwright test...`);

        // Récupérer les assertions depuis le test
        const assertions = (test.assertions as any) || [];
        console.log(`  Assertions to execute: ${assertions.length}`);

        const result = await runTestFromCode(test.code, {
          headless: true,
          timeout: 30000,
          cleanup: false, // NE PAS nettoyer tout de suite - on a besoin des screenshots !
          assertions: assertions, // Passer les assertions au runner
        });

        console.log(`  Status: ${result.status}`);
        console.log(`  Duration: ${result.duration}ms`);
        console.log(`  Screenshots: ${result.screenshotPaths.length}`);
        if (result.assertions) {
          console.log(
            `  Assertions passed: ${
              result.assertions.filter((a) => a.passed).length
            }/${result.assertions.length}`
          );
        }

        // 4. Upload screenshots vers MinIO
        let screenshotUrl: string | null = null;
        const tempDir = result.screenshotPaths[0]
          ? result.screenshotPaths[0].split("/test-results")[0]
          : null;

        if (result.screenshotPaths.length > 0) {
          console.log(
            `📸 Found ${result.screenshotPaths.length} screenshot(s)`
          );

          try {
            // Générer un nom unique pour le screenshot
            const timestamp = Date.now();
            const fileName = `test-${testId}-${timestamp}.png`;

            // Upload le premier screenshot vers MinIO
            screenshotUrl = await uploadScreenshot(
              result.screenshotPaths[0],
              fileName
            );

            console.log(`✅ Screenshot uploaded to MinIO: ${screenshotUrl}`);
          } catch (uploadError: any) {
            console.error(`❌ Screenshot upload failed:`, uploadError.message);
            // Continue même si l'upload échoue
            screenshotUrl = null;
          }
        }

        // Nettoyer le dossier temporaire APRÈS l'upload
        if (tempDir) {
          try {
            const fs = await import("fs/promises");
            await fs.rm(tempDir, { recursive: true, force: true });
            console.log(`🗑️  Cleaned up temp directory: ${tempDir}`);
          } catch (cleanupError: any) {
            console.warn(
              `⚠️  Could not clean temp directory:`,
              cleanupError.message
            );
          }
        }

        // 5. Sauvegarder le résultat dans la DB
        console.log(`💾 Saving result to database...`);

        const dbResult = await prisma.result.create({
          data: {
            testId,
            status: result.status,
            logs: result.logs,
            screenshotUrl,
            duration: result.duration,
            retryCount: currentRetry,
            isRetry: currentRetry > 0,
            originalResultId: originalResultId || undefined,
          },
        });

        // 5.1. Sauvegarder les résultats d'assertions si présents
        if (result.assertions && result.assertions.length > 0) {
          console.log(
            `💾 Saving ${result.assertions.length} assertion results...`
          );

          for (const assertion of result.assertions) {
            await prisma.assertion.create({
              data: {
                resultId: dbResult.id,
                type: assertion.type,
                selector: assertion.selector,
                attribute: assertion.attribute || null,
                expectedValue: assertion.expectedValue,
                actualValue: assertion.actualValue,
                passed: assertion.passed,
                errorMessage: assertion.errorMessage,
              },
            });
          }

          const passedCount = result.assertions.filter((a) => a.passed).length;
          console.log(
            `✅ Saved ${passedCount}/${result.assertions.length} passing assertions`
          );
        }

        // 5.2. Analyser le flakiness après chaque exécution
        try {
          await analyzeFlakinessAfterRun(testId, dbResult.id);
        } catch (flakinessError: any) {
          // Ne pas faire échouer le test si l'analyse de flakiness échoue
          console.warn(
            `⚠️  Flakiness analysis failed (non-blocking):`,
            flakinessError.message
          );
        }

        // 6. Vérifier si on doit retry en cas d'échec
        if (result.status === "failed" || result.status === "error") {
          const testConfig = await prisma.test.findUnique({
            where: { id: testId },
            select: {
              maxRetries: true,
              retryDelay: true,
              autoHealingEnabled: true,
            },
          });

          if (testConfig && currentRetry < testConfig.maxRetries) {
            const nextRetry = currentRetry + 1;
            const retryDelayMs = calculateRetryDelay(
              testConfig.retryDelay,
              currentRetry
            );

            console.log(
              `🔄 Test failed, scheduling retry ${nextRetry}/${testConfig.maxRetries}`
            );
            console.log(`  Waiting ${retryDelayMs}ms before retry...`);

            // Attendre le délai exponentiel
            await delay(retryDelayMs);

            // Ajouter un nouveau job pour le retry
            await addTestToQueue({
              testId,
              url,
              prompt,
              userId,
              keepTunnelOpen,
              currentRetry: nextRetry,
              originalResultId: originalResultId || dbResult.id,
            });

            console.log(`✅ Retry ${nextRetry} scheduled for test ${testId}`);
          } else {
            console.log(
              `❌ Test failed after ${currentRetry} retries - no more retries`
            );

            // 6.1. Si auto-healing est activé et c'est le dernier retry, tenter de corriger
            if (
              testConfig &&
              testConfig.autoHealingEnabled &&
              currentRetry >= testConfig.maxRetries
            ) {
              console.log(`🔧 Auto-healing enabled, attempting to fix test...`);

              try {
                const healingResult = await attemptAutoHealing({
                  testId,
                  resultId: dbResult.id,
                  errorMessage:
                    result.errorMessage || result.logs || "Unknown error",
                  errorStack: result.errorStack || result.logs || "",
                  originalCode: test.code,
                  logs: result.logs || "",
                  screenshotUrl,
                  url: test.url,
                });

                if (healingResult.success) {
                  console.log(`✅ Auto-healing successful!`);
                  console.log(
                    `  Healing attempt ID: ${healingResult.healingAttemptId}`
                  );
                  console.log(
                    `  Changes made: ${healingResult.changes?.length || 0}`
                  );
                  console.log(`  Explanation: ${healingResult.explanation}`);
                  // Notify the test owner that auto-healing was applied
                  try {
                    const notif = await prisma.notification.create({
                      data: {
                        userId: test.userId,
                        type: "success",
                        title: "Auto-healing appliquée",
                        message:
                          `La correction automatique a été appliquée au test '${
                            (test as any).title || testId
                          }`.slice(0, 250),
                        link: `/tests/${testId}`,
                      },
                    });

                    // Publish for real-time updates
                    try {
                      await publishNotification(notif);
                    } catch (pubErr) {
                      console.warn(
                        "⚠️ Failed to publish notification via Redis:",
                        pubErr
                      );
                    }
                  } catch (notifErr) {
                    console.error(
                      "❌ Failed to create notification for healing:",
                      notifErr
                    );
                  }

                  // Optionally re-run the test after healing if enabled via env
                  const autoRerun =
                    (process.env.AUTO_RERUN_AFTER_HEALING || "false") ===
                    "true";

                  if (autoRerun) {
                    try {
                      console.log(
                        "🔁 AUTO RERUN: scheduling a rerun of the healed test"
                      );

                      await addTestToQueue({
                        testId,
                        url: test.url,
                        prompt: test.prompt,
                        userId: test.userId,
                        keepTunnelOpen: false,
                      });

                      // Notify user that rerun was scheduled
                      try {
                        const rnotif = await prisma.notification.create({
                          data: {
                            userId: test.userId,
                            type: "info",
                            title: "Ré-exécution planifiée",
                            message: `Un nouvel essai du test '${
                              (test as any).title || testId
                            }' a été planifié après auto-healing.`,
                            link: `/tests/${testId}`,
                          },
                        });
                        await publishNotification(rnotif);
                      } catch (rpubErr) {
                        console.warn(
                          "⚠️ Failed to publish rerun notification:",
                          rpubErr
                        );
                      }
                    } catch (rerunErr) {
                      console.error(
                        "❌ Failed to schedule rerun after healing:",
                        rerunErr
                      );
                    }
                  }
                } else {
                  console.log(
                    `❌ Auto-healing failed: ${healingResult.reason}`
                  );
                  console.log(
                    `  Healing attempt ID: ${healingResult.healingAttemptId}`
                  );
                  console.log(`  Manual review required`);
                }
              } catch (healingError: any) {
                console.error(
                  `❌ Auto-healing encountered an error:`,
                  healingError.message
                );
              }
            }
          }
        }

        console.log(`✅ Test job ${job.id} completed`);
        console.log(`  Result ID: ${dbResult.id}`);
        console.log(`  Final Status: ${result.status}`);

        // 6. Fermer le tunnel si nécessaire (keepTunnelOpen = false)
        if (test.tunnelId && !keepTunnelOpen) {
          console.log(`🛑 Closing tunnel ${test.tunnelId}...`);
          try {
            await closeTunnel(test.tunnelId);
            console.log(`✅ Tunnel closed successfully`);
          } catch (tunnelError: any) {
            console.warn(`⚠️  Failed to close tunnel:`, tunnelError.message);
          }
        } else if (test.tunnel && keepTunnelOpen) {
          console.log(
            `🌐 Tunnel kept open (port ${test.tunnel.port}): ${test.tunnel.url}`
          );
        }

        await job.updateProgress(100);

        return {
          success: true,
          testId,
          resultId: dbResult.id,
          status: result.status,
          duration: result.duration,
          screenshotUrl,
          tunnelUrl: test.tunnel?.url,
          tunnelKeptOpen: keepTunnelOpen && !!test.tunnel,
        };
      } catch (error: any) {
        console.error(`❌ Test job ${job.id} failed:`, error.message);

        // Fermer le tunnel en cas d'erreur
        if (tunnelPort && !keepTunnelOpen) {
          console.log(`🛑 Closing tunnel due to error...`);
          closeCloudflareTunnel(tunnelPort);
        }

        // Sauvegarder l'erreur dans la DB
        try {
          const errorResult = await prisma.result.create({
            data: {
              testId,
              status: "error",
              logs: `Error: ${error.message}\n\n${error.stack || ""}`,
              duration: 0,
              retryCount: currentRetry,
              isRetry: currentRetry > 0,
              originalResultId: originalResultId || undefined,
            },
          });

          // Vérifier si on doit retry
          const testConfig = await prisma.test.findUnique({
            where: { id: testId },
            select: { maxRetries: true, retryDelay: true },
          });

          if (testConfig && currentRetry < testConfig.maxRetries) {
            const nextRetry = currentRetry + 1;
            const retryDelayMs = calculateRetryDelay(
              testConfig.retryDelay,
              currentRetry
            );

            console.log(
              `🔄 Error occurred, scheduling retry ${nextRetry}/${testConfig.maxRetries}`
            );
            console.log(`  Waiting ${retryDelayMs}ms before retry...`);

            // Attendre le délai exponentiel
            await delay(retryDelayMs);

            // Ajouter un nouveau job pour le retry
            await addTestToQueue({
              testId,
              url,
              prompt,
              userId,
              keepTunnelOpen,
              currentRetry: nextRetry,
              originalResultId: originalResultId || errorResult.id,
            });

            console.log(`✅ Retry ${nextRetry} scheduled after error`);

            // Ne pas re-throw l'erreur pour éviter que BullMQ retry
            return {
              success: false,
              testId,
              resultId: errorResult.id,
              status: "error",
              willRetry: true,
              nextRetry,
            };
          } else {
            console.log(
              `❌ Test failed after ${currentRetry} retries - giving up`
            );
          }
        } catch (dbError) {
          console.error("Failed to save error to database:", dbError);
        }

        throw error; // Re-throw uniquement si pas de retry
      }
    },
    {
      connection: redisConnection,
      concurrency: 5, // Traiter jusqu'à 5 jobs en parallèle
    }
  );

  worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed successfully`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });

  return worker;
};

// Fonction pour ajouter un test à la queue
export async function addTestToQueue(data: TestJobData) {
  const job = await testQueue.add("generate-test", data, {
    priority: 1,
  });

  console.log(
    `📥 Test job added to queue: ${job.id} for testId: ${data.testId}`
  );
  return job;
}

// Fonction pour obtenir le statut d'un job
export async function getJobStatus(jobId: string) {
  const job = await testQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  const state = await job.getState();
  return {
    id: job.id,
    state,
    progress: job.progress,
    data: job.data,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason,
  };
}

export default testQueue;
