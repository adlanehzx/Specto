export default function DocsPage() {
  return (
    <div className="prose prose-indigo max-w-none">
      <h1>Welcome to Specto Documentation</h1>

      <p className="lead">
        Specto is an AI-powered testing platform that automatically generates
        and runs Playwright tests for your web applications. Test your localhost
        applications with automatic tunnel management.
      </p>

      {/* Quick Start */}
      <section className="mt-8">
        <h2>🚀 Quick Start</h2>

        <div className="not-prose bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
          <p className="text-blue-700 font-medium">
            Choose your installation method:
          </p>
        </div>

        <h3>Option 1: NPM Package (Recommended for Developers)</h3>

        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`# Install globally
npm install -g specto-agent

# Or use with npx
npx specto-agent --help`}</code>
          </pre>
        </div>

        <h3>Option 2: Desktop Application (Coming Soon)</h3>

        <p>
          Download the desktop application for Windows, macOS, or Linux. No
          command-line knowledge required!
        </p>

        <div className="not-prose grid grid-cols-3 gap-4 my-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">🪟</div>
            <h4 className="font-semibold text-gray-900 mb-1">Windows</h4>
            <p className="text-sm text-gray-600 mb-3">.exe installer</p>
            <button
              className="bg-gray-300 text-gray-500 px-4 py-2 rounded text-sm cursor-not-allowed"
              disabled
            >
              Coming Soon
            </button>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">🍎</div>
            <h4 className="font-semibold text-gray-900 mb-1">macOS</h4>
            <p className="text-sm text-gray-600 mb-3">.dmg installer</p>
            <button
              className="bg-gray-300 text-gray-500 px-4 py-2 rounded text-sm cursor-not-allowed"
              disabled
            >
              Coming Soon
            </button>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">🐧</div>
            <h4 className="font-semibold text-gray-900 mb-1">Linux</h4>
            <p className="text-sm text-gray-600 mb-3">AppImage</p>
            <button
              className="bg-gray-300 text-gray-500 px-4 py-2 rounded text-sm cursor-not-allowed"
              disabled
            >
              Coming Soon
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mt-12">
        <h2>💡 How It Works</h2>

        <div className="not-prose">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Install the Agent
                </h3>
                <p className="text-gray-600">
                  Install the Specto agent on your local machine using npm or
                  download the desktop app.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Authenticate
                </h3>
                <p className="text-gray-600">
                  Login with your Specto account credentials to connect the
                  agent to your dashboard.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Start Your Local Server
                </h3>
                <p className="text-gray-600">
                  Run your development server on any port (e.g.,
                  localhost:3000). The agent automatically detects it.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                4
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Agent Creates Tunnels
                </h3>
                <p className="text-gray-600">
                  The agent automatically creates secure cloudflared tunnels for
                  your localhost servers.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                5
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Generate Tests
                </h3>
                <p className="text-gray-600">
                  Use the Specto dashboard to describe your tests in plain
                  English. AI generates Playwright code.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                6
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Tests Run Remotely
                </h3>
                <p className="text-gray-600">
                  Tests execute on Specto's cloud infrastructure via the tunnel,
                  testing your local app remotely.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mt-12">
        <h2>✨ Key Features</h2>

        <div className="not-prose grid md:grid-cols-2 gap-6 mt-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-100 rounded-lg p-6">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI-Powered Test Generation
            </h3>
            <p className="text-gray-700">
              Describe your tests in plain English. AI generates
              production-ready Playwright code automatically.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-lg p-6">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Secure Tunnel Management
            </h3>
            <p className="text-gray-700">
              Automatic cloudflared tunnels for your localhost. No manual
              configuration, no ngrok accounts needed.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-lg p-6">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Instant Feedback
            </h3>
            <p className="text-gray-700">
              Run tests on-demand and get instant results. Video recordings,
              screenshots, and detailed logs included.
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-100 rounded-lg p-6">
            <div className="text-3xl mb-3">🔄</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              CI/CD Integration
            </h3>
            <p className="text-gray-700">
              Integrate with GitHub Actions, GitLab CI, Jenkins, and more. Run
              tests automatically on every commit.
            </p>
          </div>
        </div>
      </section>

      {/* Prerequisites */}
      <section className="mt-12">
        <h2>📋 Prerequisites</h2>

        <h3>For CLI Users</h3>
        <ul>
          <li>
            <strong>Node.js 18+</strong> -{" "}
            <a
              href="https://nodejs.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download
            </a>
          </li>
          <li>
            <strong>cloudflared</strong> -{" "}
            <a
              href="https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Installation Guide
            </a>
          </li>
        </ul>

        <h3>For Desktop App Users</h3>
        <ul>
          <li>
            <strong>cloudflared</strong> - Included in installer (automatic)
          </li>
          <li>
            <strong>Windows 10+</strong>, <strong>macOS 11+</strong>, or{" "}
            <strong>Linux (Ubuntu 20.04+)</strong>
          </li>
        </ul>
      </section>

      {/* Next Steps */}
      <section className="mt-12">
        <h2>📚 Next Steps</h2>

        <div className="not-prose space-y-4">
          <a
            href="/docs/cli"
            className="block bg-white border-2 border-indigo-200 hover:border-indigo-400 rounded-lg p-4 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  💻 CLI Guide
                </h3>
                <p className="text-gray-600 mt-1">
                  Complete guide to using the command-line interface
                </p>
              </div>
              <span className="text-2xl">→</span>
            </div>
          </a>

          <a
            href="/docs/desktop"
            className="block bg-white border-2 border-indigo-200 hover:border-indigo-400 rounded-lg p-4 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  🖥️ Desktop App Guide
                </h3>
                <p className="text-gray-600 mt-1">
                  Using the desktop application (coming soon)
                </p>
              </div>
              <span className="text-2xl">→</span>
            </div>
          </a>

          <a
            href="/docs/cicd"
            className="block bg-white border-2 border-indigo-200 hover:border-indigo-400 rounded-lg p-4 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  ⚙️ CI/CD Integration
                </h3>
                <p className="text-gray-600 mt-1">
                  Integrate Specto into your deployment pipeline
                </p>
              </div>
              <span className="text-2xl">→</span>
            </div>
          </a>

          <a
            href="/docs/api"
            className="block bg-white border-2 border-indigo-200 hover:border-indigo-400 rounded-lg p-4 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  📚 API Reference
                </h3>
                <p className="text-gray-600 mt-1">
                  Complete API documentation for developers
                </p>
              </div>
              <span className="text-2xl">→</span>
            </div>
          </a>
        </div>
      </section>

      {/* Support */}
      <section className="mt-12">
        <div className="not-prose bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
          <p className="text-indigo-100 mb-6">
            Our team is here to help you get the most out of Specto.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://github.com/specto/specto-agent/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
            >
              GitHub Issues
            </a>
            <a
              href="mailto:support@specto.com"
              className="bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-800 transition-colors"
            >
              Email Support
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
