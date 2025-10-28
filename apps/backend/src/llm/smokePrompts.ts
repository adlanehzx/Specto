/**
 * Smoke Test LLM Prompts
 * AI prompts for generating smoke tests
 */

/**
 * Generate smoke test endpoints from natural language description
 */
export function buildSmokeTestGenerationPrompt(
  baseUrl: string,
  description: string
): string {
  return `You are an expert QA engineer specializing in smoke tests.

Generate a smoke test configuration for validating critical endpoints.

BASE URL: ${baseUrl}
USER DESCRIPTION: ${description}

SMOKE TEST DEFINITION:
A smoke test is a quick validation suite that checks if critical functionality is working.
It should test:
1. Health/Status endpoints
2. Critical API endpoints
3. Authentication endpoints
4. Database connectivity (via an endpoint)
5. External service dependencies

Your task:
1. Identify 3-8 critical endpoints to test based on the description
2. For each endpoint, specify:
   - Full URL (using the base URL)
   - HTTP method (GET, POST, etc.)
   - Expected status code (usually 200, 201, 204)
   - Brief description of what it validates

IMPORTANT:
- Keep it FAST: Each endpoint should respond in < 2 seconds
- Focus on READ operations (GET) when possible
- Only include POST/PUT if absolutely critical
- Don't test complex workflows - just availability

Return a JSON array of endpoints:
[
  {
    "url": "https://api.example.com/health",
    "method": "GET",
    "expectedStatus": 200,
    "description": "Health check endpoint",
    "timeout": 2000
  },
  {
    "url": "https://api.example.com/api/users",
    "method": "GET",
    "expectedStatus": 200,
    "description": "Validate user service is up",
    "timeout": 3000
  }
]

Generate the smoke test endpoints now:`;
}

/**
 * Generate smoke test from existing API documentation
 */
export function buildSmokeTestFromDocsPrompt(
  baseUrl: string,
  apiDocs: string
): string {
  return `You are an expert QA engineer creating smoke tests from API documentation.

BASE URL: ${baseUrl}
API DOCUMENTATION:
${apiDocs}

Your task:
Analyze the API documentation and create a smoke test suite that validates the most critical endpoints.

Selection criteria:
1. Prioritize endpoints marked as "critical" or "required"
2. Include authentication/authorization endpoints
3. Include health/status check endpoints
4. Include main resource GET endpoints
5. EXCLUDE: Complex mutations, file uploads, long-running operations

Return a JSON array with this structure:
[
  {
    "url": "full_endpoint_url",
    "method": "GET|POST|PUT|DELETE",
    "expectedStatus": 200,
    "description": "what this validates",
    "timeout": 3000,
    "headers": {
      "Accept": "application/json"
    }
  }
]

Limit to 8 most critical endpoints.
Generate the smoke test configuration:`;
}

/**
 * Optimize existing smoke test based on results
 */
export function buildSmokeTestOptimizationPrompt(
  currentEndpoints: any[],
  failureHistory: any[]
): string {
  return `You are an expert QA engineer optimizing a smoke test suite.

CURRENT SMOKE TEST ENDPOINTS:
${JSON.stringify(currentEndpoints, null, 2)}

FAILURE HISTORY (Last 10 runs):
${JSON.stringify(failureHistory, null, 2)}

Your task:
Analyze the current smoke test and its failure patterns, then suggest optimizations:

1. REMOVE endpoints that:
   - Always pass (99%+ success rate) and are not critical
   - Are too slow (> 5 seconds)
   - Are duplicates or redundant

2. ADD endpoints for:
   - Services that failed frequently (might need better monitoring)
   - Critical paths not currently covered

3. ADJUST timeouts:
   - Increase for endpoints that timeout but eventually succeed
   - Decrease for fast endpoints to detect issues faster

4. REORDER:
   - Put fastest checks first for quick feedback
   - Put critical checks before less important ones

Return TWO JSON objects:
{
  "optimizedEndpoints": [
    {
      "url": "...",
      "method": "GET",
      "expectedStatus": 200,
      "description": "...",
      "timeout": 2000
    }
  ],
  "changes": [
    "Removed slow health check (avg 6s response time)",
    "Added database connectivity check",
    "Reduced timeout for /api/status from 5s to 2s"
  ]
}

Generate the optimization:`;
}

/**
 * Generate smoke test for microservices architecture
 */
export function buildMicroservicesSmokeTestPrompt(
  services: Array<{ name: string; url: string; description: string }>
): string {
  return `You are an expert QA engineer creating smoke tests for a microservices architecture.

SERVICES:
${services
  .map(
    (s, i) => `
${i + 1}. ${s.name}
   URL: ${s.url}
   Description: ${s.description}
`
  )
  .join("\n")}

Your task:
Create a comprehensive smoke test that validates all services are healthy and can communicate.

For each service, create checks for:
1. Health endpoint (if available)
2. Main API endpoint
3. Service-to-service communication (if applicable)

IMPORTANT:
- Tests should complete in < 30 seconds total
- Parallel execution is supported, so don't worry about order
- Focus on service availability, not detailed functionality

Return a JSON array grouped by service:
[
  {
    "service": "service-name",
    "url": "endpoint-url",
    "method": "GET",
    "expectedStatus": 200,
    "description": "what it checks",
    "timeout": 3000
  }
]

Generate the microservices smoke test:`;
}

/**
 * Generate smoke test for specific tech stack
 */
export function buildStackSpecificSmokeTestPrompt(
  baseUrl: string,
  stack: string
): string {
  return `You are an expert QA engineer familiar with ${stack}.

Generate smoke tests for a ${stack} application.

BASE URL: ${baseUrl}

Your task:
Create smoke tests that validate the most common and critical endpoints for a typical ${stack} application.

Consider ${stack}-specific patterns:
- Common endpoints and routes
- Standard authentication patterns
- Typical API structure
- Database connectivity checks
- Common third-party integrations

Return a JSON array with 5-8 critical endpoints to test:
[
  {
    "url": "full_url",
    "method": "GET|POST",
    "expectedStatus": 200,
    "description": "what this validates",
    "timeout": 3000
  }
]

Generate the ${stack} smoke tests:`;
}

/**
 * Generate smoke test names and descriptions
 */
export function buildSmokeTestNamingPrompt(
  endpoints: any[],
  baseUrl: string
): string {
  return `You are a QA engineer creating clear, descriptive names for smoke tests.

BASE URL: ${baseUrl}
ENDPOINTS TO TEST:
${JSON.stringify(endpoints, null, 2)}

Your task:
Generate a concise, descriptive name and summary for this smoke test suite.

Guidelines:
- Name should be 3-6 words
- Describe what's being validated
- Use action verbs (Validate, Check, Verify)
- Be specific but not too technical

Return JSON:
{
  "name": "Descriptive Test Name",
  "description": "One sentence describing what this smoke test validates"
}

Generate the naming:`;
}
