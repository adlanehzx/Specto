/**
 * Exemple d'intégration du Playwright Runner dans le BullMQ Worker
 *
 * Ce fichier montre comment modifier queue.ts pour utiliser le runner.
 *
 * À FAIRE:
 * 1. Copier le code de la fonction processTestJob ci-dessous
 * 2. Remplacer le worker actuel dans queue.ts
 * 3. Implémenter uploadScreenshots() pour sauvegarder les images
 */

import { Job, Worker } from "bullmq";
import { prisma } from "../db";
import { runTestFromCode } from "../runner/playrunner";
import type { TestJobData } from "../queue";
import { uploadAndCleanup } from "../services/storageService";
import path from "path";

/**
 * Fonction de traitement des jobs de test
 *
 * Cette fonction:
 * 1. Récupère le test depuis la DB
 * 2. Exécute le code avec Playwright
 * 3. Upload les screenshots (TODO)
 * 4. Sauvegarde le résultat dans la DB
 */
async function processTestJob(job: Job<TestJobData>) {
  const { testId, url, prompt, userId } = job.data;

  console.log(`🔄 Processing test job ${job.id}`);
  console.log(`  Test ID: ${testId}`);
  console.log(`  URL: ${url}`);
  console.log(`  User ID: ${userId}`);

  try {
    // 1. Récupérer le test depuis la DB
    const test = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!test) {
      throw new Error(`Test ${testId} not found in database`);
    }

    if (!test.code) {
      throw new Error(`Test ${testId} has no code to execute`);
    }

    console.log(`  Code length: ${test.code.length} characters`);

    // 2. Exécuter le test avec Playwright
    console.log(`🎭 Executing Playwright test...`);

    const result = await runTestFromCode(test.code, {
      headless: true,
      timeout: 30000,
      cleanup: true, // Nettoyer les fichiers temp après exécution
    });

    console.log(`  Status: ${result.status}`);
    console.log(`  Duration: ${result.duration}ms`);
    console.log(`  Screenshots: ${result.screenshotPaths.length}`);

    // 3. Upload les screenshots (si présents)
    let screenshotUrl: string | null = null;

    if (result.screenshotPaths.length > 0) {
      console.log(
        `📸 Uploading ${result.screenshotPaths.length} screenshot(s)...`
      );

      // TODO: Implémenter l'upload vers S3, Cloudinary, etc.
      screenshotUrl = await uploadScreenshots(result.screenshotPaths);

      console.log(`  Screenshot URL: ${screenshotUrl}`);
    }

    // 4. Sauvegarder le résultat dans la DB
    console.log(`💾 Saving result to database...`);

    const dbResult = await prisma.result.create({
      data: {
        testId,
        status: result.status,
        logs: result.logs,
        screenshotUrl,
        duration: result.duration,
      },
    });

    console.log(`✅ Test job ${job.id} completed successfully`);
    console.log(`  Result ID: ${dbResult.id}`);

    // Mettre à jour la progression du job
    await job.updateProgress(100);

    return {
      success: true,
      testId,
      resultId: dbResult.id,
      status: result.status,
      duration: result.duration,
      screenshotUrl,
    };
  } catch (error: any) {
    console.error(`❌ Test job ${job.id} failed:`, error.message);

    // Sauvegarder l'erreur dans la DB
    try {
      await prisma.result.create({
        data: {
          testId,
          status: "error",
          logs: `Error: ${error.message}\n\n${error.stack || ""}`,
          duration: 0,
        },
      });
    } catch (dbError) {
      console.error("Failed to save error to database:", dbError);
    }

    throw error; // Re-throw pour que BullMQ gère le retry
  }
}

/**
 * Créer le worker BullMQ avec le runner intégré
 *
 * Remplacer la fonction createTestWorker() dans queue.ts par celle-ci
 */
export function createTestWorker(redisConnection: any) {
  const worker = new Worker<TestJobData>("test-generation", processTestJob, {
    connection: redisConnection,
    concurrency: 5, // Traiter jusqu'à 5 jobs en parallèle
  });

  // Event: Job complété avec succès
  worker.on("completed", (job, result) => {
    console.log(`✅ Job ${job.id} completed successfully`);
    console.log(`  Result ID: ${result.resultId}`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Duration: ${result.duration}ms`);
  });

  // Event: Job échoué
  worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
    if (job) {
      console.error(`  Test ID: ${job.data.testId}`);
      console.error(`  Attempt: ${job.attemptsMade}/${job.opts.attempts}`);
    }
  });

  // Event: Job en cours de traitement
  worker.on("active", (job) => {
    console.log(`🔄 Job ${job.id} is now active`);
  });

  // Event: Job mis en attente
  worker.on("stalled", (jobId) => {
    console.warn(`⚠️ Job ${jobId} has stalled`);
  });

  return worker;
}

/**
 * Upload les screenshots vers un service de stockage
 *
 * TODO: Implémenter l'upload vers S3, Cloudinary, etc.
 * Pour l'instant, retourne juste le premier chemin local
 *
 * @param screenshotPaths - Chemins locaux des screenshots
 * @returns URL du screenshot uploadé
 */
async function uploadScreenshots(screenshotPaths: string[]): Promise<string> {
  if (!screenshotPaths || screenshotPaths.length === 0) return "";

  // Use the central storage service (MinIO/S3-compatible)
  // Upload all screenshots and cleanup local files afterwards.
  const uploadResults = await Promise.all(
    screenshotPaths.map(async (localPath, idx) => {
      // Generate a stable remote file name
      const fileName = `screenshot-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}-${path.basename(localPath)}`;

      try {
        const url = await uploadAndCleanup(localPath, fileName);
        return url;
      } catch (err) {
        console.error("uploadScreenshots: failed to upload", localPath, err);
        return null;
      }
    })
  );

  // Return the first successfully uploaded URL (or empty string)
  const firstSuccess = uploadResults.find((u) => !!u);
  return firstSuccess || "";
}

/**
 * INSTRUCTIONS D'INTÉGRATION
 *
 * 1. Copier processTestJob() ci-dessus
 * 2. Remplacer le worker dans queue.ts:
 *
 *    import { runTestFromCode } from './runner/playrunner';
 *
 *    export const createTestWorker = () => {
 *      const worker = new Worker<TestJobData>(
 *        "test-generation",
 *        processTestJob,  // ← Utiliser la nouvelle fonction
 *        { connection: redisConnection, concurrency: 5 }
 *      );
 *      // ... event handlers ...
 *      return worker;
 *    };
 *
 * 3. Démarrer le worker dans server.ts:
 *
 *    import { createTestWorker } from './queue';
 *    const worker = createTestWorker();
 *    console.log('🔄 BullMQ worker started');
 *
 * 4. Tester avec une requête POST:
 *
 *    curl -X POST http://localhost:4000/api/tests \
 *      -H "Content-Type: application/json" \
 *      -d '{
 *        "url": "https://example.com",
 *        "prompt": "Vérifier le titre de la page",
 *        "userId": "cm123..."
 *      }'
 *
 * 5. Vérifier les logs du worker pour voir l'exécution
 *
 * 6. Vérifier dans la DB que le Result a été créé:
 *
 *    SELECT * FROM "Result" ORDER BY "createdAt" DESC LIMIT 1;
 */

// Export pour utilisation
export { processTestJob, uploadScreenshots };
