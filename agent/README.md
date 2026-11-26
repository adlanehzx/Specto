# Specto Agent & CLI

## 📦 Two Tools in One Package

This package contains **2 distinct tools**:

### 1. **Specto Agent** - Tunnel Management (local development)

Exposes your localhost through cloudflared so E2E tests can run remotely.

**Usage:**

```bash
specto-agent login --email=user@example.com --password=***
specto-agent start --ports=3000,8080
specto-agent status
specto-agent stop
```

### 2. **Specto CLI** - CI/CD Integration (automated tests)

Runs your E2E and API tests from a declarative `specto.json` configuration.

**Usage:**

```bash
specto-agent init              # Generates specto.json
specto-agent validate          # Validates the configuration
specto-agent test              # Runs the tests
specto-agent test --only=api   # API tests only
```

---

## 🚀 Installation

### Option 1: Global installation (recommended)

```bash
cd agent
npm install
npm run build
npm link  # Requires sudo/admin
```

You can then use `specto-agent` from anywhere:

```bash
specto-agent --help
```

### Option 2: Local usage

```bash
cd agent
npm install
npm run build
node bin/specto-agent.js --help
```

---

## 🔧 Agent Commands (Tunnel Management)

### `login` - Authentication

```bash
# With email/password
specto-agent login --email=user@example.com --password=***

# With a JWT token
specto-agent login --token=eyJhbGciOiJIUzI1NiIs...

# Custom backend
specto-agent login --email=user@example.com --password=*** --backend=http://localhost:4000
```

### `start` - Start the agent

```bash
# Foreground mode (default)
specto-agent start

# Daemon mode (background)
specto-agent start --daemon

# Custom ports
specto-agent start --ports=3000,8080,5173

# Custom backend
specto-agent start --backend=http://localhost:4000
```

### `status` - Check the state

```bash
specto-agent status
```

### `stop` - Stop the agent

```bash
specto-agent stop
```

### `logout` - Sign out

```bash
specto-agent logout
```

---

## 📝 CLI Commands (CI/CD Integration)

### `init` - Initialize the configuration

```bash
specto-agent init              # Creates specto.json
specto-agent init --force      # Overwrites the existing file
```

### `validate` - Validate the configuration

```bash
specto-agent validate
specto-agent validate --config=custom-config.json
```

### `test` - Run the tests

```bash
# Run all tests
specto-agent test

# With a custom configuration
specto-agent test --config=custom-config.json

# Specific environment
specto-agent test --env=production

# E2E tests only
specto-agent test --only=e2e

# API tests only
specto-agent test --only=api

# JSON output
specto-agent test --output=json
```

---

## 📋 Configuration (specto.json)

Structure of the CLI configuration file:

```json
{
  "server": "http://localhost:4000",
  "apiKey": "${SPECTO_API_KEY}",
  "project": "your-project-id",
  "environments": {
    "staging": {
      "baseUrl": "https://staging.example.com",
      "variables": {
        "API_URL": "https://api.staging.example.com"
      }
    },
    "production": {
      "baseUrl": "https://example.com",
      "variables": {
        "API_URL": "https://api.example.com"
      }
    }
  },
  "tests": {
    "e2e": ["test-id-1", "test-id-2"],
    "api": ["api-test-id-1", "api-test-id-2"]
  },
  "options": {
    "parallel": 3,
    "timeout": 30000,
    "retries": 2,
    "bail": false
  }
}
```

### Environment variables

The CLI supports the `${VAR_NAME}` syntax for environment variables:

```bash
# Set the API key
export SPECTO_API_KEY="your-api-key-from-dashboard"

# Or on Windows PowerShell
$env:SPECTO_API_KEY="your-api-key-from-dashboard"
```

---

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: Specto Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
      - name: Install CLI
        run: cd agent && npm install && npm run build
      - name: Run tests
        env:
          SPECTO_API_KEY: ${{ secrets.SPECTO_API_KEY }}
        run: cd agent && node bin/specto-agent.js test
```

### GitLab CI

```yaml
specto-tests:
  stage: test
  image: node:20-alpine
  before_script:
    - cd agent && npm install && npm run build
  script:
    - node bin/specto-agent.js test --env=production
```

### Jenkins

```groovy
pipeline {
    agent any
    environment {
        SPECTO_API_KEY = credentials('specto-api-key')
    }
    stages {
        stage('Test') {
            steps {
                sh 'cd agent && npm install && npm run build'
                sh 'cd agent && node bin/specto-agent.js test'
            }
        }
    }
}
```

---

## 🏗️ Architecture

```
agent/
├── src/
│   ├── agent.ts          # Tunnel agent (local development)
│   ├── tunnel.ts         # cloudflared management
│   ├── cli.ts            # CLI commands (agent + test)
│   ├── config.ts         # Agent configuration (auth, backend)
│   ├── configLoader.ts   # specto.json loading
│   └── index.ts          # Entry point
├── bin/
│   └── specto-agent.js   # CLI entry point
├── dist/                 # Compiled code (TypeScript → JavaScript)
├── package.json
└── tsconfig.json
```

---

## 📚 Full documentation

- **CI/CD Guide**: `../docs/CLI_CI_CD_GUIDE.md`
- **API Testing**: `../docs/API_TESTING_COMPLETE.md`
- **Quick Start**: `../docs/API_TESTING_QUICK_START.md`

---

## 🔄 How do tunnels work?

When you run `specto-agent start`:

1. **The agent detects active servers** on the configured ports (3000, 8080, 5173 by default)
2. **Creates Cloudflare tunnels** for each active port
3. **Registers the tunnels** in the backend (Redis + Database)
4. **The tunnels appear automatically** in the frontend dashboard
5. **Heartbeat every 30s** to keep the tunnels alive
6. **Automatic shutdown** if the agent stops sending heartbeats (1h timeout)

### Redis ↔ Database synchronization

- **Redis**: fast cache for agent heartbeats (1h TTL)
- **Database**: persistence for frontend display + history
- Both are synchronized automatically on every `register`

---

## 🆘 Troubleshooting

### The agent does not start

1. Check that cloudflared is installed: `cloudflared --version`
2. Check authentication: `specto-agent status`
3. Check the backend: `curl http://localhost:4000/api/health`

### Tunnels do not appear in the frontend

1. Check that the agent is started: `specto-agent status`
2. Check the backend logs (should show "Registered X tunnel(s)")
3. Refresh the frontend dashboard (auto-refresh every 5s)
4. Check that Redis is running: `redis-cli ping` (should return `PONG`)

### CLI tests fail

1. Check the configuration: `specto-agent validate`
2. Check the API key: `echo $SPECTO_API_KEY`
3. Check the project ID in `specto.json`
4. Check the test IDs: `GET /api/cli/tests?projectId=xxx`

---

## 🔗 Useful links

- Backend API: http://localhost:4000
- Frontend Dashboard: http://localhost:3000
- Cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

---

## 📦 Build & Publish

```bash
# Build
npm run build

# Publish to npm (if needed)
npm version patch
npm publish

# Or local link
npm link
```

---

## 📄 License

MIT
