export default function DesktopAppGuidePage() {
  return (
    <div className="prose prose-indigo max-w-none">
      <h1>🖥️ Desktop Application Guide</h1>

      <p className="lead">
        The LeynAI Desktop App provides a user-friendly graphical interface for
        managing tunnels and tests, without requiring command-line knowledge.
      </p>

      <div className="not-prose bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6">
        <p className="text-yellow-800 font-medium">
          🚧 <strong>Coming Soon!</strong> The desktop application is currently
          in development. Expected release: Q1 2026
        </p>
      </div>

      {/* Features */}
      <section className="mt-8">
        <h2>Planned Features</h2>

        <div className="not-prose grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-100 rounded-lg p-6">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Simple Setup
            </h3>
            <p className="text-gray-700">
              One-click installer with automatic cloudflared setup. No terminal
              commands required.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-lg p-6">
            <div className="text-3xl mb-3">🔔</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              System Tray
            </h3>
            <p className="text-gray-700">
              Runs quietly in your system tray. Quick access to status, tunnels,
              and settings.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-lg p-6">
            <div className="text-3xl mb-3">⚙️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Visual Configuration
            </h3>
            <p className="text-gray-700">
              Configure ports, backend URL, and credentials through an intuitive
              GUI.
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-100 rounded-lg p-6">
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Auto-Start
            </h3>
            <p className="text-gray-700">
              Optionally start with your system. Your tunnels ready when you
              need them.
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 rounded-lg p-6">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Real-Time Monitoring
            </h3>
            <p className="text-gray-700">
              Live dashboard showing active tunnels, port status, and connection
              health.
            </p>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100 rounded-lg p-6">
            <div className="text-3xl mb-3">💾</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Auto-Updates
            </h3>
            <p className="text-gray-700">
              Automatic updates ensure you always have the latest features and
              security fixes.
            </p>
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="mt-12">
        <h2>Supported Platforms</h2>

        <div className="not-prose grid md:grid-cols-3 gap-6">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">🪟</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Windows</h3>
            <p className="text-gray-600 mb-4">Windows 10 and later</p>
            <div className="space-y-2 text-sm text-left">
              <p className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>NSIS installer (.exe)</span>
              </p>
              <p className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>Auto-update support</span>
              </p>
              <p className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>System tray integration</span>
              </p>
              <p className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>Start with Windows</span>
              </p>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">🍎</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">macOS</h3>
            <p className="text-gray-600 mb-4">macOS 11 Big Sur and later</p>
            <div className="space-y-2 text-sm text-left">
              <p className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>DMG installer</span>
              </p>
              <p className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>Auto-update support</span>
              </p>
              <p className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>Menu bar integration</span>
              </p>
              <p className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>Launch at login</span>
              </p>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">🐧</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Linux</h3>
            <p className="text-gray-600 mb-4">Ubuntu 20.04+ and similar</p>
            <div className="space-y-2 text-sm text-left">
              <p className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>AppImage (universal)</span>
              </p>
              <p className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>.deb package (Debian/Ubuntu)</span>
              </p>
              <p className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>.rpm package (Fedora/RHEL)</span>
              </p>
              <p className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>System tray integration</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mockup */}
      <section className="mt-12">
        <h2>Interface Preview</h2>
        <p>Here's what the desktop app will look like:</p>

        <div className="not-prose my-8">
          {/* Main Window Mockup */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-6 shadow-2xl">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Title Bar */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">🚀</div>
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      LeynAI Agent
                    </h3>
                    <p className="text-indigo-200 text-sm">Running</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Status */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="text-lg font-bold text-green-700">
                        ● Connected
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">User</p>
                      <p className="text-lg font-semibold text-gray-900">
                        user@example.com
                      </p>
                    </div>
                  </div>
                </div>

                {/* Active Tunnels */}
                <div className="mb-6">
                  <h4 className="text-gray-700 font-semibold mb-3">
                    Active Tunnels
                  </h4>
                  <div className="space-y-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm text-gray-700">
                          localhost:3000
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          https://abc123.trycloudflare.com
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Active
                        </span>
                        <button className="text-gray-400 hover:text-gray-600">
                          📋
                        </button>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm text-gray-700">
                          localhost:8080
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          https://def456.trycloudflare.com
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Active
                        </span>
                        <button className="text-gray-400 hover:text-gray-600">
                          📋
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monitored Ports */}
                <div className="mb-6">
                  <h4 className="text-gray-700 font-semibold mb-3">
                    Monitored Ports
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
                      3000
                    </span>
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
                      8080
                    </span>
                    <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-sm">
                      5173
                    </span>
                    <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200">
                      + Add Port
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700">
                    Open Dashboard
                  </button>
                  <button className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300">
                    Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Installation Preview */}
      <section className="mt-12">
        <h2>Installation (When Available)</h2>

        <h3>Windows Installation</h3>
        <ol>
          <li>
            Download <code>LeynAI-Agent-Setup-1.0.0.exe</code>
          </li>
          <li>Double-click to run the installer</li>
          <li>Follow the installation wizard</li>
          <li>Launch LeynAI Agent from Start Menu</li>
          <li>Login with your credentials</li>
        </ol>

        <h3>macOS Installation</h3>
        <ol>
          <li>
            Download <code>LeynAI-Agent-1.0.0.dmg</code>
          </li>
          <li>Open the DMG file</li>
          <li>Drag LeynAI Agent to Applications folder</li>
          <li>Open LeynAI Agent from Applications</li>
          <li>Allow app in System Preferences (if prompted)</li>
          <li>Login with your credentials</li>
        </ol>

        <h3>Linux Installation</h3>

        <h4>AppImage (Universal)</h4>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`# Download
wget https://releases.leynai.com/LeynAI-Agent-1.0.0.AppImage

# Make executable
chmod +x LeynAI-Agent-1.0.0.AppImage

# Run
./LeynAI-Agent-1.0.0.AppImage`}</code>
          </pre>
        </div>

        <h4>Debian/Ubuntu (.deb)</h4>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`# Download
wget https://releases.leynai.com/leynai-agent_1.0.0_amd64.deb

# Install
sudo dpkg -i leynai-agent_1.0.0_amd64.deb

# Run
leynai-agent`}</code>
          </pre>
        </div>

        <h4>Fedora/RHEL (.rpm)</h4>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`# Download
wget https://releases.leynai.com/leynai-agent-1.0.0.x86_64.rpm

# Install
sudo rpm -i leynai-agent-1.0.0.x86_64.rpm

# Run
leynai-agent`}</code>
          </pre>
        </div>
      </section>

      {/* Key Differences from CLI */}
      <section className="mt-12">
        <h2>Desktop App vs CLI</h2>

        <div className="not-prose overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Feature
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Desktop App
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  CLI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-sm font-medium">Installation</td>
                <td className="px-4 py-3 text-sm">One-click installer</td>
                <td className="px-4 py-3 text-sm">npm install</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium">Interface</td>
                <td className="px-4 py-3 text-sm">Graphical (GUI)</td>
                <td className="px-4 py-3 text-sm">Command-line</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium">Configuration</td>
                <td className="px-4 py-3 text-sm">Visual settings panel</td>
                <td className="px-4 py-3 text-sm">
                  Command flags or config file
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium">Monitoring</td>
                <td className="px-4 py-3 text-sm">Real-time dashboard</td>
                <td className="px-4 py-3 text-sm">status command</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium">Auto-start</td>
                <td className="px-4 py-3 text-sm">Yes (optional)</td>
                <td className="px-4 py-3 text-sm">Manual setup required</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium">Updates</td>
                <td className="px-4 py-3 text-sm">Automatic</td>
                <td className="px-4 py-3 text-sm">npm update -g</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium">System Tray</td>
                <td className="px-4 py-3 text-sm">Yes</td>
                <td className="px-4 py-3 text-sm">No</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium">Notifications</td>
                <td className="px-4 py-3 text-sm">Desktop notifications</td>
                <td className="px-4 py-3 text-sm">Terminal output only</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium">Target Users</td>
                <td className="px-4 py-3 text-sm">Everyone</td>
                <td className="px-4 py-3 text-sm">Developers</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Use CLI Now */}
      <section className="mt-12">
        <div className="not-prose bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Can't Wait?</h2>
          <p className="text-blue-100 mb-6">
            The CLI is available now and provides all the same functionality! If
            you're comfortable with the terminal, you can start using LeynAI
            today.
          </p>
          <a
            href="/docs/cli"
            className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            View CLI Guide →
          </a>
        </div>
      </section>

      {/* Newsletter */}
      <section className="mt-12">
        <div className="not-prose bg-indigo-50 border border-indigo-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Get Notified
          </h2>
          <p className="text-gray-700 mb-6">
            Want to be the first to know when the desktop app launches? We'll
            email you as soon as it's available!
          </p>
          <div className="flex gap-3">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 whitespace-nowrap">
              Notify Me
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            We'll only email you about the desktop app launch. No spam, ever.
          </p>
        </div>
      </section>
    </div>
  );
}
