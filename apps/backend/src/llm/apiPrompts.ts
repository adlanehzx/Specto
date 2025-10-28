/**
 * LLM Prompts for API Test Generation
 */

export function buildApiTestGenerationPrompt(
  userPrompt: string,
  apiEndpoint?: string
): string {
  return `You are an expert API testing assistant. Generate a complete API test configuration based on the user's description.

USER REQUEST:
${userPrompt}

${apiEndpoint ? `TARGET API ENDPOINT: ${apiEndpoint}` : ""}

Generate a JSON configuration for testing this API with the following structure:

{
  "name": "Test name (descriptive)",
  "description": "What this test validates",
  "method": "HTTP method (GET, POST, PUT, DELETE, PATCH, etc.)",
  "url": "Full API endpoint URL",
  "headers": {
    "Content-Type": "application/json",
    // Add other necessary headers
  },
  "body": {
    // Request body for POST/PUT/PATCH (null for GET/DELETE)
  },
  "queryParams": {
    // Query parameters if needed (e.g., {"page": "1", "limit": "10"})
  },
  "authType": "none | bearer | basic | api-key | oauth2",
  "authConfig": {
    // Auth configuration based on authType:
    // For bearer: { "token": "your-token" }
    // For basic: { "username": "user", "password": "pass" }
    // For api-key: { "key": "X-API-Key", "value": "your-key" }
  },
  "expectedStatus": 200, // Expected HTTP status code
  "assertions": [
    {
      "type": "status-code | response-time | header | body-path | body-contains | body-schema",
      "field": "Field name for header or JSON path for body-path (e.g., 'data.user.id')",
      "operator": "equals | contains | greater-than | less-than | exists | matches",
      "expectedValue": "Expected value as string"
    }
    // Add multiple assertions
  ],
  "timeout": 30000 // Timeout in milliseconds
}

IMPORTANT GUIDELINES:
1. Use realistic and valid API endpoints
2. Include appropriate headers (Content-Type, Accept, etc.)
3. For POST/PUT requests, provide a valid request body
4. Add meaningful assertions to validate the response
5. Include authentication if the API requires it
6. Set appropriate timeout values
7. Use descriptive names and descriptions
8. Add at least 2-3 assertions to thoroughly test the response

COMMON ASSERTION TYPES:
- status-code: Validate HTTP status (e.g., 200, 201, 404)
- response-time: Check response time (e.g., less than 2000ms)
- header: Validate response headers (e.g., Content-Type)
- body-path: Check specific JSON field value (e.g., data.user.email)
- body-contains: Verify response body contains text
- body-schema: Validate response structure

EXAMPLES OF JSON PATHS:
- "user.name" → Access user.name in response
- "data.items[0].id" → Access first item's id in array
- "meta.pagination.total" → Access nested pagination info

Return ONLY the JSON configuration, no additional text or explanations.`;
}

export function buildApiTestHealingPrompt(
  testConfig: any,
  errorType: string,
  errorMessage: string,
  response?: any
): string {
  return `You are an expert at debugging and fixing API tests. An API test has failed and needs to be corrected.

TEST CONFIGURATION:
${JSON.stringify(testConfig, null, 2)}

ERROR TYPE: ${errorType}
ERROR MESSAGE: ${errorMessage}

${
  response
    ? `RESPONSE RECEIVED:\nStatus: ${
        response.status
      }\nHeaders: ${JSON.stringify(
        response.headers,
        null,
        2
      )}\nBody: ${JSON.stringify(response.data, null, 2)}`
    : ""
}

ANALYZE THE FAILURE AND PROVIDE A FIXED CONFIGURATION:

Common issues and fixes:
1. **timeout**: Increase timeout value or check if endpoint is accessible
2. **network**: Verify URL is correct, check for typos
3. **assertion**: Update expected values to match actual response
4. **auth**: Fix authentication configuration (token, credentials)
5. **rate-limit**: Add delay or reduce request frequency
6. **server-error**: Check request body format, required fields

Provide a JSON response with this structure:
{
  "errorAnalysis": "Detailed explanation of what went wrong",
  "suggestedFixes": [
    "Fix 1: Description",
    "Fix 2: Description"
  ],
  "healedConfig": {
    // Complete corrected test configuration
    // Same structure as original but with fixes applied
  },
  "changes": [
    {
      "field": "Field that was changed (e.g., 'timeout', 'assertions[0].expectedValue')",
      "oldValue": "Previous value",
      "newValue": "New value",
      "reason": "Why this change was made"
    }
  ],
  "confidence": 0.85 // Confidence in the fix (0-1)
}

Be specific and provide working fixes. Return ONLY the JSON response.`;
}

export function buildApiTestFromCurlPrompt(curlCommand: string): string {
  return `Convert this cURL command into an API test configuration.

CURL COMMAND:
${curlCommand}

Extract the following information:
- HTTP method (GET, POST, etc.)
- URL
- Headers
- Request body (if any)
- Query parameters
- Authentication details

Generate a JSON configuration with this structure:

{
  "name": "Descriptive test name based on the endpoint",
  "description": "What this API call does",
  "method": "HTTP method",
  "url": "API endpoint URL",
  "headers": {
    // Extracted headers
  },
  "body": {
    // Request body if present
  },
  "queryParams": {
    // Query parameters if any
  },
  "authType": "Detected auth type (none, bearer, basic, api-key)",
  "authConfig": {
    // Auth configuration extracted from headers or URL
  },
  "expectedStatus": 200,
  "assertions": [
    // Generate 2-3 meaningful assertions
  ],
  "timeout": 30000
}

Return ONLY the JSON configuration.`;
}

export function buildApiTestFromPostmanPrompt(postmanCollection: any): string {
  return `Convert this Postman collection/request into LeynAI API test configurations.

POSTMAN DATA:
${JSON.stringify(postmanCollection, null, 2)}

Generate an array of API test configurations, one for each request in the collection.

For each request, create a configuration with this structure:

{
  "name": "Request name from Postman",
  "description": "Request description",
  "method": "HTTP method",
  "url": "{{baseUrl}}/endpoint with variables resolved",
  "headers": {
    // Headers from Postman request
  },
  "body": {
    // Request body
  },
  "queryParams": {
    // Query parameters
  },
  "authType": "Detected from Postman auth",
  "authConfig": {
    // Auth configuration
  },
  "expectedStatus": 200,
  "assertions": [
    // Convert Postman tests to assertions
  ],
  "timeout": 30000
}

HANDLE POSTMAN VARIABLES:
- Replace {{variable}} with actual values if provided
- Use environment variables if available
- Document required variables in description

Return ONLY a JSON array of configurations: [ {...}, {...}, ... ]`;
}

export function buildApiTestOptimizationPrompt(
  testConfig: any,
  executionHistory: any[]
): string {
  return `Analyze this API test and its execution history to suggest optimizations.

TEST CONFIGURATION:
${JSON.stringify(testConfig, null, 2)}

EXECUTION HISTORY (last ${executionHistory.length} runs):
${JSON.stringify(executionHistory, null, 2)}

Analyze:
1. Response time patterns (avg, min, max)
2. Failure patterns and causes
3. Assertion effectiveness
4. Timeout appropriateness
5. Retry configuration

Provide optimization suggestions in this JSON format:

{
  "performance": {
    "avgResponseTime": 0,
    "recommendation": "Suggestion for timeout/performance"
  },
  "reliability": {
    "successRate": 0.95,
    "flakyPatterns": ["Pattern 1", "Pattern 2"],
    "recommendation": "How to improve reliability"
  },
  "assertions": {
    "effectiveness": "Are assertions catching real issues?",
    "suggestions": [
      "Add assertion for X",
      "Remove redundant assertion Y"
    ]
  },
  "optimizedConfig": {
    // Optimized test configuration
  },
  "changes": [
    {
      "field": "Field changed",
      "oldValue": "Old value",
      "newValue": "New value",
      "reason": "Why this optimization helps"
    }
  ]
}

Return ONLY the JSON response.`;
}
