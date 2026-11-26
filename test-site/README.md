# Test App - Minimal Application for Specto

## 🚀 Installation

```bash
cd test-site
npm install
```

## 🎯 Start the app

```bash
npm start
# Opens http://localhost:3001
```

## 🧪 Test with Specto

### Step 1: Log in

```bash
specto-agent login
# Enter your email and password
```

### Step 2: Initialize

```bash
specto-agent init
# Enter the project slug (from the dashboard)
# Enter the API key (created in Settings → API Keys)
```

This will create:

- `specto.json` with your configuration
- `playwright.config.ts` automatically

### Step 3: Start the agent

```bash
specto-agent start
# The agent creates a tunnel and listens for changes
```

### Step 4: Run the tests

```bash
# In another terminal
specto-agent test
```

### Step 5: See the results

Open the Specto dashboard: `http://localhost:3000`
Test results appear automatically!

## 📦 Structure

```
test-site/
├── server.js              # Minimal Express server
├── tests/
│   └── app.spec.js        # 3 simple Playwright tests
├── package.json
├── specto.json           # Created by specto-agent init
└── playwright.config.ts  # Created by specto-agent init
```

## ✨ Features

- 3 simple tests
- No test dependency (Playwright will be installed by Specto)
- Ultra-light app (Express only)
