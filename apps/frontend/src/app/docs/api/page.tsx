export default function APIReferencePage() {
  return (
    <div className="prose prose-indigo max-w-none">
      <h1>📚 API Reference</h1>

      <p className="lead">
        Complete API documentation for integrating LeynAI programmatically into
        your applications and workflows.
      </p>

      {/* Base URL */}
      <section className="mt-8">
        <h2>Base URL</h2>

        <div className="not-prose bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">Production</p>
          <code className="text-lg text-indigo-600">
            https://api.leynai.com
          </code>
        </div>

        <div className="not-prose bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
          <p className="text-sm text-gray-600 mb-2">Development (local)</p>
          <code className="text-lg text-gray-600">http://localhost:4000</code>
        </div>
      </section>

      {/* Authentication */}
      <section className="mt-12">
        <h2>Authentication</h2>

        <p>
          All API requests require authentication using JWT tokens in the
          Authorization header:
        </p>

        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`Authorization: Bearer YOUR_JWT_TOKEN`}</code>
          </pre>
        </div>

        <h3>Get Your Token</h3>
        <ol>
          <li>Login to LeynAI dashboard</li>
          <li>Open browser DevTools (F12)</li>
          <li>Go to Application/Storage → Local Storage</li>
          <li>
            Find <code>auth_token</code> value
          </li>
        </ol>

        <p>Or use the login endpoint to get a token programmatically.</p>
      </section>

      {/* Endpoints */}
      <section className="mt-12">
        <h2>Endpoints</h2>

        {/* Authentication Endpoints */}
        <h3 className="text-2xl border-b-2 border-indigo-200 pb-2 mb-4">
          Authentication
        </h3>

        {/* POST /auth/register */}
        <div className="not-prose bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-bold text-gray-900">Register User</h4>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
              POST
            </span>
          </div>

          <code className="text-indigo-600">/api/auth/register</code>

          <p className="text-gray-600 mt-4 mb-4">Create a new user account.</p>

          <h5 className="font-semibold text-gray-900 mb-2">Request Body</h5>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
            <pre className="text-sm">
              <code>{`{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}`}</code>
            </pre>
          </div>

          <h5 className="font-semibold text-gray-900 mb-2">Response (201)</h5>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
              <code>{`{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}`}</code>
            </pre>
          </div>
        </div>

        {/* POST /auth/login */}
        <div className="not-prose bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-bold text-gray-900">Login</h4>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
              POST
            </span>
          </div>

          <code className="text-indigo-600">/api/auth/login</code>

          <p className="text-gray-600 mt-4 mb-4">
            Authenticate and receive JWT token.
          </p>

          <h5 className="font-semibold text-gray-900 mb-2">Request Body</h5>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
            <pre className="text-sm">
              <code>{`{
  "email": "user@example.com",
  "password": "securepassword"
}`}</code>
            </pre>
          </div>

          <h5 className="font-semibold text-gray-900 mb-2">Response (200)</h5>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
              <code>{`{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}`}</code>
            </pre>
          </div>
        </div>

        {/* Tests Endpoints */}
        <h3 className="text-2xl border-b-2 border-indigo-200 pb-2 mb-4 mt-12">
          Tests
        </h3>

        {/* GET /tests */}
        <div className="not-prose bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-bold text-gray-900">List Tests</h4>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
              GET
            </span>
          </div>

          <code className="text-indigo-600">/api/tests</code>

          <p className="text-gray-600 mt-4 mb-4">
            Get all tests for the authenticated user.
          </p>

          <h5 className="font-semibold text-gray-900 mb-2">Headers</h5>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
            <pre className="text-sm">
              <code>{`Authorization: Bearer YOUR_JWT_TOKEN`}</code>
            </pre>
          </div>

          <h5 className="font-semibold text-gray-900 mb-2">Response (200)</h5>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
              <code>{`{
  "tests": [
    {
      "id": 1,
      "name": "Login Flow Test",
      "prompt": "Test user login with email and password",
      "url": "https://example.com/login",
      "code": "import { test, expect } from '@playwright/test';...",
      "status": "completed",
      "result": "passed",
      "createdAt": "2025-11-01T10:00:00.000Z",
      "updatedAt": "2025-11-01T10:05:00.000Z"
    }
  ]
}`}</code>
            </pre>
          </div>
        </div>

        {/* POST /tests */}
        <div className="not-prose bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-bold text-gray-900">Create Test</h4>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
              POST
            </span>
          </div>

          <code className="text-indigo-600">/api/tests</code>

          <p className="text-gray-600 mt-4 mb-4">
            Create a new test with AI-generated Playwright code.
          </p>

          <h5 className="font-semibold text-gray-900 mb-2">Request Body</h5>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
            <pre className="text-sm">
              <code>{`{
  "name": "Login Flow Test",
  "prompt": "Navigate to login page, enter email and password, click submit button, verify dashboard loads",
  "url": "http://localhost:3000",
  "tunnelUrl": "https://abc123.trycloudflare.com",  // Optional
  "keepTunnelOpen": true  // Optional, default: false
}`}</code>
            </pre>
          </div>

          <h5 className="font-semibold text-gray-900 mb-2">Response (201)</h5>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
              <code>{`{
  "id": 1,
  "name": "Login Flow Test",
  "prompt": "Navigate to login page...",
  "url": "http://localhost:3000",
  "tunnelUrl": "https://abc123.trycloudflare.com",
  "status": "generating",
  "message": "Test queued for generation"
}`}</code>
            </pre>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
            <p className="text-blue-700 text-sm">
              <strong>Note:</strong> If <code>url</code> is localhost and agent
              is running, <code>tunnelUrl</code> will be auto-detected from
              agent registration.
            </p>
          </div>
        </div>

        {/* GET /tests/:id */}
        <div className="not-prose bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-bold text-gray-900">
              Get Test Details
            </h4>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
              GET
            </span>
          </div>

          <code className="text-indigo-600">/api/tests/:id</code>

          <p className="text-gray-600 mt-4 mb-4">
            Get details of a specific test including execution results.
          </p>

          <h5 className="font-semibold text-gray-900 mb-2">Response (200)</h5>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
              <code>{`{
  "id": 1,
  "name": "Login Flow Test",
  "prompt": "Navigate to login page...",
  "url": "http://localhost:3000",
  "tunnelUrl": "https://abc123.trycloudflare.com",
  "code": "import { test, expect } from '@playwright/test';\\n\\ntest('Login Flow Test', async ({ page }) => {\\n  await page.goto('https://abc123.trycloudflare.com');\\n  // ... generated code\\n});",
  "status": "completed",
  "result": "passed",
  "error": null,
  "execution": {
    "duration": 5234,
    "steps": [
      { "step": "Navigate to page", "status": "passed" },
      { "step": "Enter credentials", "status": "passed" },
      { "step": "Click submit", "status": "passed" },
      { "step": "Verify dashboard", "status": "passed" }
    ],
    "screenshots": [
      "https://storage.leynai.com/screenshots/test-1-step-1.png"
    ],
    "video": "https://storage.leynai.com/videos/test-1.webm"
  },
  "createdAt": "2025-11-01T10:00:00.000Z",
  "updatedAt": "2025-11-01T10:05:00.000Z"
}`}</code>
            </pre>
          </div>
        </div>

        {/* DELETE /tests/:id */}
        <div className="not-prose bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-bold text-gray-900">Delete Test</h4>
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
              DELETE
            </span>
          </div>

          <code className="text-indigo-600">/api/tests/:id</code>

          <p className="text-gray-600 mt-4 mb-4">Delete a test.</p>

          <h5 className="font-semibold text-gray-900 mb-2">Response (200)</h5>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
              <code>{`{
  "message": "Test deleted successfully"
}`}</code>
            </pre>
          </div>
        </div>

        {/* Agent Endpoints */}
        <h3 className="text-2xl border-b-2 border-indigo-200 pb-2 mb-4 mt-12">
          Agent
        </h3>

        {/* POST /agent/register */}
        <div className="not-prose bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-bold text-gray-900">
              Register Tunnels
            </h4>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
              POST
            </span>
          </div>

          <code className="text-indigo-600">/api/agent/register</code>

          <p className="text-gray-600 mt-4 mb-4">
            Register active tunnels from LeynAI agent. Used internally by the
            agent.
          </p>

          <h5 className="font-semibold text-gray-900 mb-2">Request Body</h5>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
            <pre className="text-sm">
              <code>{`{
  "tunnels": {
    "3000": "https://abc123.trycloudflare.com",
    "8080": "https://def456.trycloudflare.com"
  }
}`}</code>
            </pre>
          </div>

          <h5 className="font-semibold text-gray-900 mb-2">Response (200)</h5>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
              <code>{`{
  "message": "Tunnels registered successfully",
  "expiresIn": 3600
}`}</code>
            </pre>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
            <p className="text-yellow-700 text-sm">
              <strong>Note:</strong> Tunnels are stored with 1-hour TTL and
              renewed by agent heartbeat.
            </p>
          </div>
        </div>

        {/* GET /agent/tunnels */}
        <div className="not-prose bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-bold text-gray-900">
              Get Active Tunnels
            </h4>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
              GET
            </span>
          </div>

          <code className="text-indigo-600">/api/agent/tunnels</code>

          <p className="text-gray-600 mt-4 mb-4">
            Retrieve active tunnel mappings for authenticated user.
          </p>

          <h5 className="font-semibold text-gray-900 mb-2">Response (200)</h5>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
              <code>{`{
  "tunnels": {
    "3000": "https://abc123.trycloudflare.com",
    "8080": "https://def456.trycloudflare.com"
  }
}`}</code>
            </pre>
          </div>
        </div>

        {/* DELETE /agent/tunnels */}
        <div className="not-prose bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-bold text-gray-900">Clear Tunnels</h4>
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
              DELETE
            </span>
          </div>

          <code className="text-indigo-600">/api/agent/tunnels</code>

          <p className="text-gray-600 mt-4 mb-4">
            Clear all registered tunnels for user. Used when agent stops.
          </p>

          <h5 className="font-semibold text-gray-900 mb-2">Response (200)</h5>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
              <code>{`{
  "message": "Tunnels cleared successfully"
}`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Error Responses */}
      <section className="mt-12">
        <h2>Error Responses</h2>

        <p>All errors follow a consistent format:</p>

        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
          <pre className="text-sm">
            <code>{`{
  "error": "Error message description"
}`}</code>
          </pre>
        </div>

        <h3>Common HTTP Status Codes</h3>
        <div className="not-prose overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Code
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Meaning
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Example
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2 font-mono text-sm">400</td>
                <td className="px-4 py-2 text-sm">Bad Request</td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  Invalid request body or parameters
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-sm">401</td>
                <td className="px-4 py-2 text-sm">Unauthorized</td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  Missing or invalid authentication token
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-sm">404</td>
                <td className="px-4 py-2 text-sm">Not Found</td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  Resource doesn't exist
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-sm">429</td>
                <td className="px-4 py-2 text-sm">Too Many Requests</td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  Rate limit exceeded
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-sm">500</td>
                <td className="px-4 py-2 text-sm">Internal Server Error</td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  Server error occurred
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Rate Limiting */}
      <section className="mt-12">
        <h2>Rate Limiting</h2>

        <p>API requests are rate-limited to ensure fair usage:</p>

        <div className="not-prose overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Endpoint Type
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Limit
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Window
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2 text-sm">Authentication</td>
                <td className="px-4 py-2 text-sm font-mono">10 requests</td>
                <td className="px-4 py-2 text-sm">per minute</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm">Test Creation</td>
                <td className="px-4 py-2 text-sm font-mono">20 requests</td>
                <td className="px-4 py-2 text-sm">per minute</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm">General API</td>
                <td className="px-4 py-2 text-sm font-mono">100 requests</td>
                <td className="px-4 py-2 text-sm">per minute</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4">
          When rate limit is exceeded, you'll receive a{" "}
          <code>429 Too Many Requests</code> response with a{" "}
          <code>Retry-After</code> header.
        </p>
      </section>

      {/* Examples */}
      <section className="mt-12">
        <h2>Code Examples</h2>

        <h3>JavaScript/Node.js</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`const axios = require('axios');

const API_URL = 'https://api.leynai.com';
const TOKEN = 'your_jwt_token';

// Create a test
async function createTest() {
  try {
    const response = await axios.post(
      \`\${API_URL}/api/tests\`,
      {
        name: 'Login Test',
        prompt: 'Test the login functionality',
        url: 'http://localhost:3000'
      },
      {
        headers: {
          'Authorization': \`Bearer \${TOKEN}\`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Test created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Get all tests
async function getTests() {
  try {
    const response = await axios.get(\`\${API_URL}/api/tests\`, {
      headers: {
        'Authorization': \`Bearer \${TOKEN}\`
      }
    });
    
    console.log('Tests:', response.data.tests);
    return response.data.tests;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

createTest();
getTests();`}</code>
          </pre>
        </div>

        <h3>Python</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`import requests

API_URL = 'https://api.leynai.com'
TOKEN = 'your_jwt_token'

headers = {
    'Authorization': f'Bearer {TOKEN}',
    'Content-Type': 'application/json'
}

# Create a test
def create_test():
    data = {
        'name': 'Login Test',
        'prompt': 'Test the login functionality',
        'url': 'http://localhost:3000'
    }
    
    response = requests.post(
        f'{API_URL}/api/tests',
        json=data,
        headers=headers
    )
    
    if response.status_code == 201:
        print('Test created:', response.json())
    else:
        print('Error:', response.json())

# Get all tests
def get_tests():
    response = requests.get(
        f'{API_URL}/api/tests',
        headers=headers
    )
    
    if response.status_code == 200:
        tests = response.json()['tests']
        print(f'Found {len(tests)} tests')
        for test in tests:
            print(f'  - {test["name"]}: {test["status"]}')
    else:
        print('Error:', response.json())

create_test()
get_tests()`}</code>
          </pre>
        </div>

        <h3>cURL</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`# Login
curl -X POST https://api.leynai.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "password"}'

# Create test
curl -X POST https://api.leynai.com/api/tests \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Login Test",
    "prompt": "Test login functionality",
    "url": "http://localhost:3000"
  }'

# Get all tests
curl -X GET https://api.leynai.com/api/tests \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get specific test
curl -X GET https://api.leynai.com/api/tests/1 \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Delete test
curl -X DELETE https://api.leynai.com/api/tests/1 \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}</code>
          </pre>
        </div>
      </section>

      {/* Webhooks */}
      <section className="mt-12">
        <h2>Webhooks (Coming Soon)</h2>

        <p>
          Webhooks will allow you to receive real-time notifications when tests
          complete:
        </p>

        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`POST https://your-server.com/webhook

{
  "event": "test.completed",
  "test": {
    "id": 1,
    "name": "Login Test",
    "status": "completed",
    "result": "passed",
    "duration": 5234
  },
  "timestamp": "2025-11-01T10:05:00.000Z"
}`}</code>
          </pre>
        </div>

        <p>Event types:</p>
        <ul>
          <li>
            <code>test.created</code> - Test created and queued
          </li>
          <li>
            <code>test.generating</code> - AI generating test code
          </li>
          <li>
            <code>test.running</code> - Test execution started
          </li>
          <li>
            <code>test.completed</code> - Test finished (passed or failed)
          </li>
          <li>
            <code>test.error</code> - Test encountered error
          </li>
        </ul>
      </section>

      {/* SDK */}
      <section className="mt-12">
        <div className="not-prose bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">
            Official SDKs (Coming Soon)
          </h2>
          <p className="text-purple-100 mb-6">
            We're working on official SDK libraries to make integration even
            easier:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">JavaScript/TypeScript</h3>
              <code className="text-sm text-purple-100">
                npm install @leynai/sdk
              </code>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Python</h3>
              <code className="text-sm text-purple-100">
                pip install leynai
              </code>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Go</h3>
              <code className="text-sm text-purple-100">
                go get github.com/leynai/go-sdk
              </code>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
