/**
 * Smoke Test Runner
 * Executes quick validation tests (health checks, critical endpoints)
 */

import { PrismaClient } from "@prisma/client";
import axios, { AxiosRequestConfig, Method } from "axios";

const prisma = new PrismaClient();

/**
 * Endpoint configuration for smoke test
 */
interface SmokeEndpoint {
  url: string;
  method: Method;
  expectedStatus: number;
  timeout?: number;
  headers?: Record<string, string>;
  body?: any;
}

/**
 * Result for a single endpoint check
 */
interface EndpointResult {
  url: string;
  method: string;
  success: boolean;
  status?: number;
  responseTime: number;
  error?: string;
  timestamp: string;
}

/**
 * Execute a single smoke test
 * Returns the run ID
 */
export async function executeSmokeTest(smokeTestId: string): Promise<string> {
  console.log(`🔥 Executing smoke test: ${smokeTestId}`);

  const smokeTest = await prisma.smokeTest.findUnique({
    where: { id: smokeTestId },
  });

  if (!smokeTest) {
    throw new Error(`Smoke test ${smokeTestId} not found`);
  }

  // Create test run
  const run = await prisma.smokeTestRun.create({
    data: {
      smokeTestId,
      status: "running",
      totalEndpoints: (smokeTest.endpoints as unknown as SmokeEndpoint[])
        .length,
    },
  });

  const startTime = Date.now();
  const endpoints = smokeTest.endpoints as unknown as SmokeEndpoint[];
  const results: EndpointResult[] = [];
  let successfulChecks = 0;
  let failedChecks = 0;
  const failedEndpoints: any[] = [];

  // Execute each endpoint check
  for (const endpoint of endpoints) {
    const endpointResult = await checkEndpoint(endpoint, smokeTest.timeout);
    results.push(endpointResult);

    if (endpointResult.success) {
      successfulChecks++;
    } else {
      failedChecks++;
      failedEndpoints.push({
        url: endpoint.url,
        error: endpointResult.error,
        expectedStatus: endpoint.expectedStatus,
        actualStatus: endpointResult.status,
      });
    }
  }

  const duration = Date.now() - startTime;

  // Calculate metrics
  const responseTimes = results.map((r) => r.responseTime);
  const avgResponseTime =
    responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

  const sortedByTime = [...results].sort(
    (a, b) => b.responseTime - a.responseTime
  );
  const slowestEndpoint = sortedByTime[0]?.url;
  const fastestEndpoint = sortedByTime[sortedByTime.length - 1]?.url;

  // Determine overall status
  const status = failedChecks === 0 ? "success" : "failed";

  // Update run with results
  await prisma.smokeTestRun.update({
    where: { id: run.id },
    data: {
      status,
      completedAt: new Date(),
      duration,
      results: results as any,
      successfulChecks,
      failedChecks,
      avgResponseTime: Math.round(avgResponseTime),
      slowestEndpoint,
      fastestEndpoint,
      failedEndpoints:
        failedEndpoints.length > 0 ? (failedEndpoints as any) : null,
      error:
        failedChecks > 0
          ? `${failedChecks} endpoint(s) failed validation`
          : null,
    },
  });

  // Update last run timestamp
  await prisma.smokeTest.update({
    where: { id: smokeTestId },
    data: { lastRunAt: new Date() },
  });

  console.log(
    `✅ Smoke test completed: ${status} (${successfulChecks}/${endpoints.length} passed)`
  );

  return run.id;
}

/**
 * Check a single endpoint
 */
async function checkEndpoint(
  endpoint: SmokeEndpoint,
  defaultTimeout: number
): Promise<EndpointResult> {
  const startTime = Date.now();

  try {
    const config: AxiosRequestConfig = {
      method: endpoint.method,
      url: endpoint.url,
      timeout: endpoint.timeout || defaultTimeout,
      headers: endpoint.headers || {},
      validateStatus: () => true, // Don't throw on any status
    };

    if (endpoint.body && ["POST", "PUT", "PATCH"].includes(endpoint.method)) {
      config.data = endpoint.body;
    }

    const response = await axios(config);
    const responseTime = Date.now() - startTime;

    const success = response.status === endpoint.expectedStatus;

    return {
      url: endpoint.url,
      method: endpoint.method,
      success,
      status: response.status,
      responseTime,
      error: success
        ? undefined
        : `Expected status ${endpoint.expectedStatus}, got ${response.status}`,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    return {
      url: endpoint.url,
      method: endpoint.method,
      success: false,
      responseTime,
      error: error.message || "Request failed",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Execute smoke test with retry logic
 */
export async function executeSmokeTestWithRetry(
  smokeTestId: string
): Promise<string> {
  const smokeTest = await prisma.smokeTest.findUnique({
    where: { id: smokeTestId },
  });

  if (!smokeTest) {
    throw new Error(`Smoke test ${smokeTestId} not found`);
  }

  let lastRunId: string = "";
  let attempt = 0;

  while (attempt <= smokeTest.maxRetries) {
    lastRunId = await executeSmokeTest(smokeTestId);

    const run = await prisma.smokeTestRun.findUnique({
      where: { id: lastRunId },
    });

    if (run?.status === "success") {
      return lastRunId;
    }

    attempt++;
    if (attempt <= smokeTest.maxRetries) {
      const delay = smokeTest.retryDelay * Math.pow(2, attempt - 1);
      console.log(
        `⏳ Retrying smoke test in ${delay}ms (attempt ${attempt}/${smokeTest.maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Mark next run as retry
      await prisma.smokeTestRun.update({
        where: { id: lastRunId },
        data: {
          isRetry: true,
          retryCount: attempt,
        },
      });
    }
  }

  console.log(
    `❌ Smoke test failed after ${smokeTest.maxRetries + 1} attempts`
  );
  return lastRunId;
}

/**
 * Execute multiple smoke tests in parallel
 */
export async function executeSmokeTestsBatch(
  testIds: string[],
  parallel: number = 3
): Promise<string[]> {
  const runIds: string[] = [];

  for (let i = 0; i < testIds.length; i += parallel) {
    const batch = testIds.slice(i, i + parallel);
    const batchResults = await Promise.allSettled(
      batch.map((id) => executeSmokeTestWithRetry(id))
    );

    batchResults.forEach((result) => {
      if (result.status === "fulfilled") {
        runIds.push(result.value);
      } else {
        console.error(`Failed to execute smoke test:`, result.reason);
      }
    });
  }

  return runIds;
}
