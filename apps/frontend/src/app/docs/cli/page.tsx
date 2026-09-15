export default function CLIGuidePage() {
  return (
    <div className="prose prose-indigo max-w-none">
      <h1>💻 CLI Guide</h1>

      <p className="lead">
        Complete guide to using the Specto command-line interface for developers
        who prefer working in the terminal.
      </p>

      {/* Installation */}
      <section className="mt-8">
        <h2>Installation</h2>

        <h3>Global Installation (Recommended)</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`npm install -g specto-agent`}</code>
          </pre>
        </div>

        <h3>Using npx (No Installation)</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`npx specto-agent <command> [options]`}</code>
          </pre>
        </div>

        <div className="not-prose bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4">
          <p className="text-yellow-800">
            <strong>⚠️ Important:</strong> You must install{" "}
            <code className="text-yellow-900 bg-yellow-100 px-1 rounded">
              cloudflared
            </code>{" "}
            separately. See{" "}
            <a href="#prerequisites" className="text-yellow-900 underline">
              Prerequisites
            </a>{" "}
            below.
          </p>
        </div>
      </section>

      {/* Prerequisites */}
      <section className="mt-12" id="prerequisites">
        <h2>Prerequisites</h2>

        <h3>1. Node.js 18+</h3>
        <p>Check your Node.js version:</p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`node --version`}</code>
          </pre>
        </div>
        <p>
          If needed, download from{" "}
          <a
            href="https://nodejs.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            nodejs.org
          </a>
        </p>

        <h3>2. cloudflared</h3>

        <h4>Windows</h4>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`# Using winget (recommended)
winget install cloudflare.cloudflared

# Or using Chocolatey
choco install cloudflared`}</code>
          </pre>
        </div>

        <h4>macOS</h4>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`brew install cloudflared`}</code>
          </pre>
        </div>

        <h4>Linux</h4>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared`}</code>
          </pre>
        </div>

        <h4>Verify Installation</h4>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`cloudflared --version`}</code>
          </pre>
        </div>
      </section>

      {/* Commands */}
      <section className="mt-12">
        <h2>Commands</h2>

        {/* Login */}
        <h3 id="login">specto-agent login</h3>
        <p>Authenticate with your Specto account.</p>

        <h4>Usage</h4>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`specto-agent login [options]`}</code>
          </pre>
        </div>

        <h4>Options</h4>
        <div className="not-prose overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                  Option
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                  Description
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                  Required
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2 text-sm font-mono">
                  --email &lt;email&gt;
                </td>
                <td className="px-4 py-2 text-sm">Your email address</td>
                <td className="px-4 py-2 text-sm">Yes*</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm font-mono">
                  --password &lt;password&gt;
                </td>
                <td className="px-4 py-2 text-sm">Your password</td>
                <td className="px-4 py-2 text-sm">Yes*</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm font-mono">
                  --token &lt;token&gt;
                </td>
                <td className="px-4 py-2 text-sm">
                  JWT token (alternative to email/password)
                </td>
                <td className="px-4 py-2 text-sm">Yes*</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm font-mono">
                  --backend &lt;url&gt;
                </td>
                <td className="px-4 py-2 text-sm">
                  Backend API URL (default: http://localhost:4000)
                </td>
                <td className="px-4 py-2 text-sm">No</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-gray-500 mt-2">
            * Either <code>--email</code> + <code>--password</code> OR{" "}
            <code>--token</code> is required
          </p>
        </div>

        <h4>Examples</h4>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`# Login with email and password
specto-agent login --email user@example.com --password mypassword

# Login with token
specto-agent login --token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Login to production backend
specto-agent login --email user@example.com --password mypassword --backend https://api.specto.com`}</code>
          </pre>
        </div>

        <h4>What Happens</h4>
        <ol>
          <li>Authenticates with the Specto backend</li>
          <li>Validates the token</li>
          <li>
            Saves credentials to <code>~/.config/specto-agent/config.json</code>
          </li>
          <li>
            You're ready to use <code>start</code> command
          </li>
        </ol>

        {/* Start */}
        <h3 id="start" className="mt-8">
          specto-agent start
        </h3>
        <p>
          Start the Specto agent to monitor local servers and create tunnels.
        </p>

        <h4>Usage</h4>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`specto-agent start [options]`}</code>
          </pre>
        </div>

        <h4>Options</h4>
        <div className="not-prose overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                  Option
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                  Description
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                  Default
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2 text-sm font-mono">--daemon</td>
                <td className="px-4 py-2 text-sm">Run as background process</td>
                <td className="px-4 py-2 text-sm">false</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm font-mono">
                  --ports &lt;ports&gt;
                </td>
                <td className="px-4 py-2 text-sm">
                  Comma-separated ports to monitor
                </td>
                <td className="px-4 py-2 text-sm">3000,8080,5173</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm font-mono">
                  --backend &lt;url&gt;
                </td>
                <td className="px-4 py-2 text-sm">Backend API URL</td>
                <td className="px-4 py-2 text-sm">http://localhost:4000</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4>Examples</h4>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`# Start in foreground (see logs)
specto-agent start

# Start as background daemon
specto-agent start --daemon

# Monitor specific ports
specto-agent start --ports 3000,4200,8080

# Production backend with daemon
specto-agent start --daemon --backend https://api.specto.com --ports 3000`}</code>
          </pre>
        </div>

        <h4>Foreground Mode vs Daemon Mode</h4>
        <div className="not-prose grid md:grid-cols-2 gap-4 my-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-semibold text-blue-900 mb-2">
              Foreground Mode (default)
            </h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ See live logs</li>
              <li>✅ Easy debugging</li>
              <li>✅ Stops with Ctrl+C</li>
              <li>❌ Blocks terminal</li>
              <li>❌ Stops when terminal closes</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h5 className="font-semibold text-green-900 mb-2">
              Daemon Mode (--daemon)
            </h5>
            <ul className="text-sm text-green-800 space-y-1">
              <li>✅ Runs in background</li>
              <li>✅ Terminal free to use</li>
              <li>✅ Survives terminal close</li>
              <li>❌ No live logs visible</li>
              <li>
                ❌ Needs <code>stop</code> command
              </li>
            </ul>
          </div>
        </div>

        <h4>What Happens</h4>
        <ol>
          <li>Agent checks authentication</li>
          <li>Scans specified ports for active servers</li>
          <li>Creates cloudflared tunnels for each active server</li>
          <li>Registers tunnel URLs with Specto backend</li>
          <li>Starts heartbeat to keep tunnels alive</li>
          <li>Monitors for new servers on configured ports</li>
        </ol>

        {/* Status */}
        <h3 id="status" className="mt-8">
          specto-agent status
        </h3>
        <p>Check agent status, authentication, and active tunnels.</p>

        <h4>Usage</h4>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`specto-agent status`}</code>
          </pre>
        </div>

        <h4>Example Output</h4>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`📊 Specto Agent Status

Authentication: ✓ Logged in
Email: user@example.com
Backend: http://localhost:4000
Agent Status: ✓ Running (PID: 12345)

Active Tunnels:
  Port 3000: https://abc123.trycloudflare.com
  Port 8080: https://def456.trycloudflare.com

Monitored Ports: 3000, 8080, 5173`}</code>
          </pre>
        </div>

        {/* Stop */}
        <h3 id="stop" className="mt-8">
          specto-agent stop
        </h3>
        <p>Stop the background agent daemon.</p>

        <h4>Usage</h4>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`specto-agent stop`}</code>
          </pre>
        </div>

        <div className="not-prose bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
          <p className="text-blue-700">
            <strong>Note:</strong> This only works if the agent was started with{" "}
            <code className="bg-blue-100 px-1 rounded">--daemon</code> flag.
          </p>
        </div>

        {/* Logout */}
        <h3 id="logout" className="mt-8">
          specto-agent logout
        </h3>
        <p>Clear saved credentials and stop the agent.</p>

        <h4>Usage</h4>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`specto-agent logout`}</code>
          </pre>
        </div>

        <h4>What Happens</h4>
        <ol>
          <li>Stops running agent (if active)</li>
          <li>
            Deletes stored credentials from <code>~/.config/specto-agent/</code>
          </li>
          <li>
            You'll need to run <code>login</code> again to use the agent
          </li>
        </ol>
      </section>

      {/* Workflows */}
      <section className="mt-12">
        <h2>Common Workflows</h2>

        <h3>Daily Development</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`# Morning: Start agent in background
specto-agent start --daemon

# ... develop all day ...

# Evening: Check status
specto-agent status

# Stop when done
specto-agent stop`}</code>
          </pre>
        </div>

        <h3>Testing Specific App</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`# Start your app on port 3000
npm run dev

# In another terminal, start agent for that port only
specto-agent start --ports 3000

# Agent creates tunnel, you see logs
# Go to Specto dashboard and create tests
# Press Ctrl+C to stop when done`}</code>
          </pre>
        </div>

        <h3>Production Backend</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`# Login to production
specto-agent login --email pro@company.com --password *** --backend https://api.specto.com

# Start daemon with production backend
specto-agent start --daemon --backend https://api.specto.com

# Check status
specto-agent status`}</code>
          </pre>
        </div>

        <h3>Multiple Projects</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`# Start all your dev servers on different ports
npm run dev:frontend   # port 3000
npm run dev:api        # port 4000
npm run dev:admin      # port 5000

# Monitor all ports
specto-agent start --daemon --ports 3000,4000,5000

# Agent creates tunnels for all three apps`}</code>
          </pre>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="mt-12">
        <h2>Troubleshooting</h2>

        <h3>"command not found: specto-agent"</h3>
        <p>
          <strong>Solution:</strong>
        </p>
        <ul>
          <li>
            Make sure you installed globally:{" "}
            <code>npm install -g specto-agent</code>
          </li>
          <li>
            Or use npx: <code>npx specto-agent --help</code>
          </li>
          <li>Restart your terminal after installation</li>
        </ul>

        <h3>"cloudflared binary not found"</h3>
        <p>
          <strong>Solution:</strong>
        </p>
        <ul>
          <li>
            Install cloudflared (see <a href="#prerequisites">Prerequisites</a>)
          </li>
          <li>
            Verify: <code>cloudflared --version</code>
          </li>
          <li>Make sure it's in your PATH</li>
          <li>On Windows, restart terminal after installation</li>
        </ul>

        <h3>"Not authenticated. Please run login first"</h3>
        <p>
          <strong>Solution:</strong>
        </p>
        <ul>
          <li>
            Run <code>specto-agent login</code> first
          </li>
          <li>Make sure you have valid credentials</li>
        </ul>

        <h3>"No active servers detected"</h3>
        <p>
          <strong>Solution:</strong>
        </p>
        <ul>
          <li>Make sure your dev server is running</li>
          <li>Verify it's on a monitored port (default: 3000, 8080, 5173)</li>
          <li>
            Test manually: <code>curl http://localhost:3000</code>
          </li>
          <li>
            Specify correct port: <code>specto-agent start --ports 3000</code>
          </li>
        </ul>

        <h3>"Backend connection failed"</h3>
        <p>
          <strong>Solution:</strong>
        </p>
        <ul>
          <li>Check if backend is running (if using localhost)</li>
          <li>
            Verify backend URL: <code>specto-agent status</code>
          </li>
          <li>
            For production: use <code>--backend https://api.specto.com</code>
          </li>
        </ul>

        <h3>Agent running but tunnels not working</h3>
        <p>
          <strong>Solution:</strong>
        </p>
        <ul>
          <li>
            Check status: <code>specto-agent status</code>
          </li>
          <li>Verify tunnels are listed</li>
          <li>Test tunnel URL in browser</li>
          <li>Check if firewall is blocking cloudflared</li>
          <li>
            Restart agent:{" "}
            <code>specto-agent stop && specto-agent start --daemon</code>
          </li>
        </ul>
      </section>

      {/* Configuration */}
      <section className="mt-12">
        <h2>Configuration</h2>

        <h3>Config File Location</h3>
        <p>Credentials and settings are stored in:</p>
        <ul>
          <li>
            <strong>Linux/macOS:</strong>{" "}
            <code>~/.config/specto-agent/config.json</code>
          </li>
          <li>
            <strong>Windows:</strong>{" "}
            <code>%APPDATA%\specto-agent\config.json</code>
          </li>
        </ul>

        <h3>Stored Values</h3>
        <ul>
          <li>
            <code>authToken</code> - JWT authentication token
          </li>
          <li>
            <code>email</code> - User email
          </li>
          <li>
            <code>backendUrl</code> - Backend API URL
          </li>
          <li>
            <code>ports</code> - Array of monitored ports
          </li>
        </ul>

        <div className="not-prose bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4">
          <p className="text-yellow-800">
            <strong>⚠️ Security:</strong> The config file contains your auth
            token. Keep it secure and never commit to git!
          </p>
        </div>
      </section>

      {/* Advanced */}
      <section className="mt-12">
        <h2>Advanced Usage</h2>

        <h3>Environment Variables</h3>
        <p>
          For running from source, you can use <code>.env</code> file:
        </p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`# .env
AUTH_TOKEN=your_jwt_token_here
BACKEND_URL=http://localhost:4000
PORTS=3000,8080,5173`}</code>
          </pre>
        </div>

        <h3>Process Management</h3>
        <p>Daemon PID is stored in:</p>
        <ul>
          <li>
            <strong>Linux/macOS:</strong> <code>/tmp/specto-agent.pid</code>
          </li>
          <li>
            <strong>Windows:</strong> <code>%TEMP%\specto-agent.pid</code>
          </li>
        </ul>

        <h3>Logs</h3>
        <p>Foreground mode: Logs displayed in terminal</p>
        <p>Daemon mode: Logs currently not saved (coming in future version)</p>
      </section>

      {/* Next Steps */}
      <section className="mt-12">
        <div className="not-prose bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Ready to Test?</h2>
          <p className="text-indigo-100 mb-6">
            Now that your agent is running, head to the dashboard to create your
            first AI-powered test!
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
          >
            Go to Dashboard →
          </a>
        </div>
      </section>
    </div>
  );
}
