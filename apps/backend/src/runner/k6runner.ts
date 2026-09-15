import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);
const prisma = new PrismaClient();

interface K6Result {
  metrics: {
    http_reqs: {
      values: {
        count: number;
        rate: number;
      };
    };
    http_req_duration: {
      values: {
        avg: number;
        min: number;
        max: number;
        med: number; // p50
        p90: number;
        p95: number;
        p99: number;
      };
    };
    http_req_failed: {
      values: {
        rate: number;
        passes: number;
        fails: number;
      };
    };
    data_received: {
      values: {
        count: number;
      };
    };
    data_sent: {
      values: {
        count: number;
      };
    };
    vus: {
      values: {
        value: number;
        min: number;
        max: number;
      };
    };
  };
  root_group: {
    checks: Array<{
      name: string;
      passes: number;
      fails: number;
    }>;
  };
}

/**
 * Génère un script k6 basique si aucun prompt n'est fourni
 */
function generateDefaultK6Script(
  url: string,
  method: string,
  vus: number,
  duration: number,
  headers?: any,
  body?: any
): string {
  const headersStr = headers
    ? `  const params = {
    headers: ${JSON.stringify(headers, null, 4)},
  };`
    : "  const params = {};";

  const requestCode =
    method === "GET"
      ? `http.get('${url}', params);`
      : method === "POST"
      ? `http.post('${url}', ${
          body ? `JSON.stringify(${JSON.stringify(body)})` : "''"
        }, params);`
      : method === "PUT"
      ? `http.put('${url}', ${
          body ? `JSON.stringify(${JSON.stringify(body)})` : "''"
        }, params);`
      : method === "DELETE"
      ? `http.del('${url}', params);`
      : `http.get('${url}', params);`;

  return `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: ${Math.floor(vus / 2)} }, // Ramp-up to 50%
    { duration: '${duration}s', target: ${vus} }, // Stay at ${vus} VUs
    { duration: '30s', target: 0 }, // Ramp-down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'], // Error rate must be less than 1%
  },
};

export default function () {
${headersStr}

  const res = ${requestCode}

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
`;
}

/**
 * Exécute un test de performance avec k6
 * @param testId - ID du test dans la base de données
 * @returns ID du run créé
 */
export async function executePerformanceTest(testId: string): Promise<string> {
  console.log(`[k6runner] Executing performance test ${testId}`);

  // Créer le run avec status "running"
  const run = await prisma.performanceTestRun.create({
    data: {
      performanceTestId: testId,
      status: "running",
      startedAt: new Date(),
    },
  });

  try {
    // Récupérer le test depuis la DB
    const test = await prisma.performanceTest.findUnique({
      where: { id: testId },
    });

    if (!test) {
      throw new Error(`Performance test ${testId} not found`);
    }

    // Créer un répertoire temporaire pour l'exécution
    const tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specto-perf-test-")
    );

    try {
      // Générer le script k6
      let k6Script: string;

      if (test.prompt) {
        // TODO: Utiliser l'IA pour générer un script custom
        // Pour l'instant, utiliser le script par défaut
        k6Script = generateDefaultK6Script(
          test.url,
          test.method,
          test.vus,
          test.duration,
          test.headers as any,
          test.body as any
        );
      } else {
        k6Script = generateDefaultK6Script(
          test.url,
          test.method,
          test.vus,
          test.duration,
          test.headers as any,
          test.body as any
        );
      }

      // Écrire le script k6
      const scriptPath = path.join(tempDir, "test.js");
      await fs.writeFile(scriptPath, k6Script);

      console.log(
        `[k6runner] Running k6 with ${test.vus} VUs for ${test.duration}s...`
      );

      // Exécuter k6 avec output JSON
      const { stdout, stderr } = await execAsync(
        `k6 run --out json=${path.join(tempDir, "results.json")} ${scriptPath}`,
        {
          cwd: tempDir,
          timeout: (test.duration + 120) * 1000, // Duration + 2 minutes buffer
        }
      );

      console.log(`[k6runner] k6 execution completed`);

      // Lire et parser les résultats JSON
      const resultsPath = path.join(tempDir, "results.json");
      const resultsContent = await fs.readFile(resultsPath, "utf-8");

      // k6 output est en NDJSON (newline-delimited JSON)
      const lines = resultsContent.trim().split("\n");
      const metrics: any = {};
      let finalMetrics: K6Result | null = null;

      // Parser les métriques finales
      for (const line of lines) {
        try {
          const data = JSON.parse(line);

          // k6 envoie le résumé final dans un objet avec type="metric"
          if (data.type === "metric") {
            if (!metrics[data.metric]) {
              metrics[data.metric] = data.data;
            }
          }
        } catch (err) {
          // Ignorer les lignes invalides
        }
      }

      // Extraire les métriques clés
      const httpReqs = metrics["http_reqs"] || {};
      const httpReqDuration = metrics["http_req_duration"] || {};
      const httpReqFailed = metrics["http_req_failed"] || {};
      const dataReceived = metrics["data_received"] || {};
      const dataSent = metrics["data_sent"] || {};

      const totalRequests = httpReqs.count || 0;
      const failedRequests = Math.round(
        totalRequests * (httpReqFailed.rate || 0)
      );
      const errorRate = httpReqFailed.rate || 0;

      // Convertir bytes en MB
      const dataReceivedMB = (dataReceived.count || 0) / (1024 * 1024);
      const dataSentMB = (dataSent.count || 0) / (1024 * 1024);

      // Déterminer le status (passed/failed) selon les thresholds
      let status = "passed";
      const failureReasons: string[] = [];

      // Vérifier les seuils configurés
      if (test.maxResponseTime && httpReqDuration.p95 > test.maxResponseTime) {
        status = "failed";
        failureReasons.push(
          `p95 response time (${httpReqDuration.p95.toFixed(
            0
          )}ms) exceeds threshold (${test.maxResponseTime}ms)`
        );
      }

      if (test.minRPS && httpReqs.rate < test.minRPS) {
        status = "failed";
        failureReasons.push(
          `RPS (${httpReqs.rate.toFixed(2)}) below minimum (${test.minRPS})`
        );
      }

      if (test.maxErrorRate && errorRate > test.maxErrorRate) {
        status = "failed";
        failureReasons.push(
          `Error rate (${(errorRate * 100).toFixed(2)}%) exceeds threshold (${(
            test.maxErrorRate * 100
          ).toFixed(2)}%)`
        );
      }

      // Mettre à jour le run avec les résultats
      await prisma.performanceTestRun.update({
        where: { id: run.id },
        data: {
          status,
          completedAt: new Date(),
          duration: Date.now() - run.startedAt.getTime(),
          totalRequests,
          requestsPerSecond: httpReqs.rate,
          failedRequests,
          errorRate,
          avgResponseTime: httpReqDuration.avg,
          minResponseTime: httpReqDuration.min,
          maxResponseTime: httpReqDuration.max,
          p50ResponseTime: httpReqDuration.med,
          p95ResponseTime: httpReqDuration.p95,
          p99ResponseTime: httpReqDuration.p99,
          dataReceived: dataReceivedMB,
          dataSent: dataSentMB,
          results: metrics,
          error: failureReasons.length > 0 ? failureReasons.join("; ") : null,
        },
      });

      console.log(
        `[k6runner] Test ${testId} completed: ${status} (${totalRequests} requests, ${httpReqs.rate.toFixed(
          2
        )} RPS)`
      );

      return run.id;
    } finally {
      // Nettoyer le répertoire temporaire
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`[k6runner] Error executing test ${testId}:`, error);

    // Mettre à jour le run avec l'erreur
    await prisma.performanceTestRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        duration: Date.now() - run.startedAt.getTime(),
        error: (error as Error).message,
      },
    });

    throw error;
  }
}

/**
 * Exécute plusieurs tests de performance en parallèle
 */
export async function executePerformanceTestsBatch(
  testIds: string[],
  maxParallel: number = 2
): Promise<string[]> {
  const results: string[] = [];
  const chunks: string[][] = [];

  // Diviser en chunks
  for (let i = 0; i < testIds.length; i += maxParallel) {
    chunks.push(testIds.slice(i, i + maxParallel));
  }

  // Exécuter chunk par chunk
  for (const chunk of chunks) {
    const chunkResults = await Promise.allSettled(
      chunk.map((id) => executePerformanceTest(id))
    );

    for (const result of chunkResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      }
    }
  }

  return results;
}

/**
 * Exécute un test avec retry en cas d'échec
 */
export async function executePerformanceTestWithRetry(
  testId: string,
  maxRetries: number = 2
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await executePerformanceTest(testId);
    } catch (error) {
      lastError = error as Error;
      console.log(
        `[k6runner] Attempt ${attempt}/${maxRetries} failed, retrying...`
      );

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  throw lastError;
}
