import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ApiTestConfig {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  queryParams?: Record<string, string>;
  authType?: string;
  authConfig?: any;
  timeout?: number;
  expectedStatus?: number;
  assertions?: any[];
}

interface ApiTestResult {
  status: "success" | "failure" | "error";
  requestUrl: string;
  requestMethod: string;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseStatus?: number;
  responseHeaders?: Record<string, any>;
  responseBody?: any;
  responseTime?: number;
  duration: number;
  error?: string;
  logs: string[];
  assertionResults: AssertionResult[];
}

interface AssertionResult {
  type: string;
  field?: string;
  operator?: string;
  expectedValue?: string;
  actualValue?: string;
  passed: boolean;
  errorMessage?: string;
}

/**
 * Execute an API test
 */
export async function executeApiTest(
  apiTestId: string,
  retryCount: number = 0
): Promise<string> {
  const logs: string[] = [];
  const startTime = Date.now();

  try {
    // Fetch test configuration
    const apiTest = await prisma.apiTest.findUnique({
      where: { id: apiTestId },
    });

    if (!apiTest) {
      throw new Error(`API Test ${apiTestId} not found`);
    }

    logs.push(`🚀 Starting API test: ${apiTest.name}`);
    logs.push(`Method: ${apiTest.method} | URL: ${apiTest.url}`);

    // Build request configuration
    const config = buildRequestConfig(apiTest, logs);

    // Execute request with timing
    const requestStartTime = Date.now();
    let response: AxiosResponse;
    let responseTime: number;

    try {
      response = await axios(config);
      responseTime = Date.now() - requestStartTime;
      logs.push(`✅ Request completed in ${responseTime}ms`);
      logs.push(`Status: ${response.status} ${response.statusText}`);
    } catch (error) {
      responseTime = Date.now() - requestStartTime;
      if (axios.isAxiosError(error) && error.response) {
        // Got a response but with error status
        response = error.response;
        logs.push(`⚠️ Request completed with error status: ${response.status}`);
      } else {
        // Network error or timeout
        throw error;
      }
    }

    // Execute assertions
    const assertionResults = await executeAssertions(
      apiTest,
      response,
      responseTime,
      logs
    );

    const duration = Date.now() - startTime;
    const allAssertionsPassed = assertionResults.every((a) => a.passed);
    const status = allAssertionsPassed ? "success" : "failure";

    // Save run result
    const runId = await saveApiTestRun({
      apiTestId,
      status,
      requestUrl: config.url || apiTest.url,
      requestMethod: apiTest.method,
      requestHeaders: config.headers as Record<string, string>,
      requestBody: config.data,
      responseStatus: response.status,
      responseHeaders: response.headers,
      responseBody: response.data,
      responseTime,
      duration,
      logs: logs.join("\n"),
      retryCount,
      assertionResults,
    });

    logs.push(`\n📊 Test ${status.toUpperCase()}`);
    logs.push(`Total duration: ${duration}ms`);

    // Update test last run time
    await prisma.apiTest.update({
      where: { id: apiTestId },
      data: { lastRunAt: new Date() },
    });

    return runId;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logs.push(`❌ Error: ${error.message}`);

    // Save error result
    const runId = await saveApiTestRun({
      apiTestId,
      status: "error",
      requestUrl: "",
      requestMethod: "",
      duration,
      error: error.message,
      logs: logs.join("\n"),
      retryCount,
      assertionResults: [],
    });

    return runId;
  }
}

/**
 * Build Axios request configuration from API test
 */
function buildRequestConfig(apiTest: any, logs: string[]): AxiosRequestConfig {
  const config: AxiosRequestConfig = {
    method: apiTest.method.toLowerCase(),
    url: apiTest.url,
    timeout: apiTest.timeout || 30000,
    validateStatus: () => true, // Don't throw on any status code
  };

  // Add headers
  if (apiTest.headers) {
    config.headers = apiTest.headers as Record<string, string>;
    logs.push(`Headers: ${JSON.stringify(apiTest.headers)}`);
  }

  // Add query parameters
  if (apiTest.queryParams) {
    config.params = apiTest.queryParams;
    logs.push(`Query params: ${JSON.stringify(apiTest.queryParams)}`);
  }

  // Add body for POST/PUT/PATCH
  if (["POST", "PUT", "PATCH"].includes(apiTest.method) && apiTest.body) {
    config.data = apiTest.body;
    logs.push(`Body: ${JSON.stringify(apiTest.body)}`);
  }

  // Add authentication
  if (apiTest.authType && apiTest.authType !== "none") {
    addAuthentication(config, apiTest.authType, apiTest.authConfig, logs);
  }

  return config;
}

/**
 * Add authentication to request config
 */
function addAuthentication(
  config: AxiosRequestConfig,
  authType: string,
  authConfig: any,
  logs: string[]
): void {
  if (!config.headers) {
    config.headers = {};
  }

  switch (authType) {
    case "bearer":
      if (authConfig?.token) {
        config.headers["Authorization"] = `Bearer ${authConfig.token}`;
        logs.push("🔐 Authentication: Bearer token");
      }
      break;

    case "basic":
      if (authConfig?.username && authConfig?.password) {
        const credentials = Buffer.from(
          `${authConfig.username}:${authConfig.password}`
        ).toString("base64");
        config.headers["Authorization"] = `Basic ${credentials}`;
        logs.push("🔐 Authentication: Basic auth");
      }
      break;

    case "api-key":
      if (authConfig?.key && authConfig?.value) {
        config.headers[authConfig.key] = authConfig.value;
        logs.push(`🔐 Authentication: API key (${authConfig.key})`);
      }
      break;

    case "oauth2":
      if (authConfig?.accessToken) {
        config.headers["Authorization"] = `Bearer ${authConfig.accessToken}`;
        logs.push("🔐 Authentication: OAuth2");
      }
      break;
  }
}

/**
 * Execute assertions on API response
 */
async function executeAssertions(
  apiTest: any,
  response: AxiosResponse,
  responseTime: number,
  logs: string[]
): Promise<AssertionResult[]> {
  const results: AssertionResult[] = [];

  // Check expected status if defined
  if (apiTest.expectedStatus) {
    const passed = response.status === apiTest.expectedStatus;
    results.push({
      type: "status-code",
      expectedValue: String(apiTest.expectedStatus),
      actualValue: String(response.status),
      passed,
      errorMessage: passed
        ? undefined
        : `Expected status ${apiTest.expectedStatus}, got ${response.status}`,
    });
    logs.push(
      passed
        ? `✅ Status code assertion passed`
        : `❌ Status code assertion failed`
    );
  }

  // Execute custom assertions
  if (apiTest.assertions && Array.isArray(apiTest.assertions)) {
    for (const assertion of apiTest.assertions) {
      const result = await executeAssertion(assertion, response, responseTime);
      results.push(result);
      logs.push(
        result.passed
          ? `✅ Assertion passed: ${assertion.type}`
          : `❌ Assertion failed: ${assertion.type} - ${result.errorMessage}`
      );
    }
  }

  return results;
}

/**
 * Execute a single assertion
 */
async function executeAssertion(
  assertion: any,
  response: AxiosResponse,
  responseTime: number
): Promise<AssertionResult> {
  const { type, field, operator, expectedValue } = assertion;

  try {
    switch (type) {
      case "status-code":
        return assertStatusCode(response.status, expectedValue);

      case "response-time":
        return assertResponseTime(responseTime, operator, expectedValue);

      case "header":
        return assertHeader(response.headers, field, operator, expectedValue);

      case "body-path":
        return assertBodyPath(response.data, field, operator, expectedValue);

      case "body-contains":
        return assertBodyContains(response.data, expectedValue);

      case "body-schema":
        return assertBodySchema(response.data, expectedValue);

      default:
        return {
          type,
          passed: false,
          errorMessage: `Unknown assertion type: ${type}`,
        };
    }
  } catch (error: any) {
    return {
      type,
      field,
      operator,
      expectedValue,
      passed: false,
      errorMessage: error.message,
    };
  }
}

/**
 * Assertion: Status code
 */
function assertStatusCode(
  actualStatus: number,
  expectedStatus: string
): AssertionResult {
  const expected = parseInt(expectedStatus, 10);
  const passed = actualStatus === expected;

  return {
    type: "status-code",
    expectedValue: String(expected),
    actualValue: String(actualStatus),
    passed,
    errorMessage: passed
      ? undefined
      : `Expected ${expected}, got ${actualStatus}`,
  };
}

/**
 * Assertion: Response time
 */
function assertResponseTime(
  actualTime: number,
  operator: string,
  expectedTime: string
): AssertionResult {
  const expected = parseInt(expectedTime, 10);
  let passed = false;

  switch (operator) {
    case "less-than":
      passed = actualTime < expected;
      break;
    case "greater-than":
      passed = actualTime > expected;
      break;
    case "equals":
      passed = actualTime === expected;
      break;
  }

  return {
    type: "response-time",
    operator,
    expectedValue: `${expected}ms`,
    actualValue: `${actualTime}ms`,
    passed,
    errorMessage: passed
      ? undefined
      : `Response time ${actualTime}ms ${operator} ${expected}ms`,
  };
}

/**
 * Assertion: Header value
 */
function assertHeader(
  headers: any,
  headerName: string,
  operator: string,
  expectedValue: string
): AssertionResult {
  const actualValue = headers[headerName.toLowerCase()];
  let passed = false;

  switch (operator) {
    case "equals":
      passed = actualValue === expectedValue;
      break;
    case "contains":
      passed = actualValue && actualValue.includes(expectedValue);
      break;
    case "exists":
      passed = actualValue !== undefined;
      break;
  }

  return {
    type: "header",
    field: headerName,
    operator,
    expectedValue,
    actualValue: actualValue || "(not set)",
    passed,
    errorMessage: passed ? undefined : `Header assertion failed`,
  };
}

/**
 * Assertion: JSON path value
 */
function assertBodyPath(
  body: any,
  path: string,
  operator: string,
  expectedValue: string
): AssertionResult {
  const actualValue = getValueByPath(body, path);
  let passed = false;

  switch (operator) {
    case "equals":
      passed = String(actualValue) === expectedValue;
      break;
    case "contains":
      passed = String(actualValue).includes(expectedValue);
      break;
    case "exists":
      passed = actualValue !== undefined;
      break;
    case "greater-than":
      passed = Number(actualValue) > Number(expectedValue);
      break;
    case "less-than":
      passed = Number(actualValue) < Number(expectedValue);
      break;
  }

  return {
    type: "body-path",
    field: path,
    operator,
    expectedValue,
    actualValue: String(actualValue),
    passed,
    errorMessage: passed ? undefined : `Path ${path} assertion failed`,
  };
}

/**
 * Assertion: Body contains text
 */
function assertBodyContains(body: any, text: string): AssertionResult {
  const bodyString = JSON.stringify(body);
  const passed = bodyString.includes(text);

  return {
    type: "body-contains",
    expectedValue: text,
    actualValue: passed ? text : "(not found)",
    passed,
    errorMessage: passed ? undefined : `Body does not contain "${text}"`,
  };
}

/**
 * Assertion: Body matches JSON schema (basic validation)
 */
function assertBodySchema(body: any, schema: any): AssertionResult {
  // Basic schema validation (can be extended with ajv or joi)
  try {
    const schemaObj = typeof schema === "string" ? JSON.parse(schema) : schema;
    const passed = validateSchema(body, schemaObj);

    return {
      type: "body-schema",
      expectedValue: JSON.stringify(schemaObj),
      actualValue: JSON.stringify(body),
      passed,
      errorMessage: passed ? undefined : "Body does not match schema",
    };
  } catch (error: any) {
    return {
      type: "body-schema",
      passed: false,
      errorMessage: `Invalid schema: ${error.message}`,
    };
  }
}

/**
 * Get value from object by path (e.g., "user.name", "data.items[0].id")
 */
function getValueByPath(obj: any, path: string): any {
  const keys = path.split(".");
  let value = obj;

  for (const key of keys) {
    // Handle array access like "items[0]"
    const arrayMatch = key.match(/(\w+)\[(\d+)\]/);
    if (arrayMatch) {
      const [, arrayKey, index] = arrayMatch;
      value = value?.[arrayKey]?.[parseInt(index, 10)];
    } else {
      value = value?.[key];
    }

    if (value === undefined) {
      return undefined;
    }
  }

  return value;
}

/**
 * Basic schema validation
 */
function validateSchema(data: any, schema: any): boolean {
  // Simple type checking (can be extended)
  if (schema.type) {
    const dataType = Array.isArray(data) ? "array" : typeof data;
    if (dataType !== schema.type) {
      return false;
    }
  }

  // Check required properties
  if (schema.required && Array.isArray(schema.required)) {
    for (const prop of schema.required) {
      if (!(prop in data)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Save API test run to database
 */
async function saveApiTestRun(data: {
  apiTestId: string;
  status: "success" | "failure" | "error";
  requestUrl: string;
  requestMethod: string;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseStatus?: number;
  responseHeaders?: Record<string, any>;
  responseBody?: any;
  responseTime?: number;
  duration: number;
  error?: string;
  logs: string;
  retryCount: number;
  assertionResults: AssertionResult[];
}): Promise<string> {
  const run = await prisma.apiTestRun.create({
    data: {
      apiTestId: data.apiTestId,
      status: data.status,
      requestUrl: data.requestUrl,
      requestMethod: data.requestMethod,
      requestHeaders: data.requestHeaders || {},
      requestBody: data.requestBody || null,
      responseStatus: data.responseStatus,
      responseHeaders: data.responseHeaders || {},
      responseBody: data.responseBody || null,
      responseTime: data.responseTime,
      duration: data.duration,
      error: data.error,
      logs: data.logs,
      retryCount: data.retryCount,
      isRetry: data.retryCount > 0,
    },
  });

  // Save assertions
  if (data.assertionResults.length > 0) {
    await prisma.apiAssertion.createMany({
      data: data.assertionResults.map((assertion) => ({
        runId: run.id,
        type: assertion.type,
        field: assertion.field,
        operator: assertion.operator,
        expectedValue: assertion.expectedValue,
        actualValue: assertion.actualValue,
        passed: assertion.passed,
        errorMessage: assertion.errorMessage,
      })),
    });
  }

  return run.id;
}

/**
 * Execute API test with retry logic
 */
export async function executeApiTestWithRetry(
  apiTestId: string
): Promise<string> {
  const apiTest = await prisma.apiTest.findUnique({
    where: { id: apiTestId },
  });

  if (!apiTest) {
    throw new Error(`API Test ${apiTestId} not found`);
  }

  let lastRunId: string = "";
  let attempt = 0;

  while (attempt <= apiTest.maxRetries) {
    lastRunId = await executeApiTest(apiTestId, attempt);

    const run = await prisma.apiTestRun.findUnique({
      where: { id: lastRunId },
    });

    if (run?.status === "success") {
      return lastRunId;
    }

    attempt++;
    if (attempt <= apiTest.maxRetries) {
      const delay = apiTest.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
      console.log(
        `⏳ Retrying in ${delay}ms (attempt ${attempt}/${apiTest.maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return lastRunId;
}
