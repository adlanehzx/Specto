export default function CICDGuidePage() {
  return (
    <div className="prose prose-indigo max-w-none">
      <h1>⚙️ CI/CD Integration Guide</h1>

      <p className="lead">
        Integrate Specto into your continuous integration and deployment
        pipeline to run automated tests on every commit, pull request, or
        deployment.
      </p>

      {/* Overview */}
      <section className="mt-8">
        <h2>Overview</h2>

        <p>
          Specto can be integrated into any CI/CD platform. The agent runs in
          your CI environment, creates tunnels for your application, and
          executes tests via the Specto API.
        </p>

        <div className="not-prose bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
          <p className="text-blue-700">
            <strong>How it works:</strong>
          </p>
          <ol className="text-blue-700 mt-2 space-y-1">
            <li>1. CI pipeline starts</li>
            <li>2. Your application builds and starts</li>
            <li>3. Specto agent creates tunnel</li>
            <li>4. Tests run via Specto API</li>
            <li>5. Results returned to CI</li>
          </ol>
        </div>
      </section>

      {/* GitHub Actions */}
      <section className="mt-12">
        <h2>GitHub Actions</h2>

        <p>The most popular CI/CD platform. Here's a complete example:</p>

        <h3>Complete Workflow</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`# .github/workflows/specto-tests.yml
name: Specto E2E Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      # 1. Checkout code
      - name: Checkout repository
        uses: actions/checkout@v3
      
      # 2. Setup Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      # 3. Install dependencies
      - name: Install dependencies
        run: npm ci
      
      # 4. Build application
      - name: Build application
        run: npm run build
      
      # 5. Install cloudflared
      - name: Install cloudflared
        run: |
          wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
          sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
          sudo chmod +x /usr/local/bin/cloudflared
      
      # 6. Install Specto agent
      - name: Install Specto agent
        run: npm install -g specto-agent
      
      # 7. Start application in background
      - name: Start application
        run: |
          npm start &
          sleep 10  # Wait for app to start
      
      # 8. Start Specto agent
      - name: Start Specto agent
        env:
          SPECTO_TOKEN: \${{ secrets.SPECTO_TOKEN }}
        run: |
          specto-agent login --token \$SPECTO_TOKEN --backend https://api.specto.com
          specto-agent start --daemon --ports 3000
          sleep 5  # Wait for tunnel creation
      
      # 9. Run tests via API
      - name: Run Specto tests
        env:
          SPECTO_TOKEN: \${{ secrets.SPECTO_TOKEN }}
        run: |
          # Get tunnel URL
          TUNNEL_URL=$(specto-agent status | grep "Port 3000" | awk '{print $3}')
          echo "Tunnel URL: $TUNNEL_URL"
          
          # Trigger test via API (example)
          curl -X POST https://api.specto.com/api/tests/run \\
            -H "Authorization: Bearer \$SPECTO_TOKEN" \\
            -H "Content-Type: application/json" \\
            -d '{"testId": "your-test-id"}'
      
      # 10. Cleanup
      - name: Stop Specto agent
        if: always()
        run: |
          specto-agent stop
          specto-agent logout`}</code>
          </pre>
        </div>

        <h3>Setup Secrets</h3>
        <p>Add your Specto token to GitHub Secrets:</p>
        <ol>
          <li>
            Go to your repository Settings → Secrets and variables → Actions
          </li>
          <li>Click "New repository secret"</li>
          <li>
            Name: <code>SPECTO_TOKEN</code>
          </li>
          <li>Value: Your JWT token from Specto dashboard</li>
          <li>Click "Add secret"</li>
        </ol>

        <h3>Matrix Testing (Multiple Node Versions)</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 21]
    
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js \${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: \${{ matrix.node-version }}
      # ... rest of steps`}</code>
          </pre>
        </div>
      </section>

      {/* GitLab CI */}
      <section className="mt-12">
        <h2>GitLab CI/CD</h2>

        <p>
          GitLab CI uses <code>.gitlab-ci.yml</code> in your repository root:
        </p>

        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`# .gitlab-ci.yml
stages:
  - build
  - test

variables:
  NODE_VERSION: "18"

build:
  stage: build
  image: node:\${NODE_VERSION}
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
      - node_modules/
    expire_in: 1 hour

test:
  stage: test
  image: node:\${NODE_VERSION}
  before_script:
    # Install cloudflared
    - wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
    - mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
    - chmod +x /usr/local/bin/cloudflared
    # Install Specto agent
    - npm install -g specto-agent
  script:
    # Start application
    - npm start &
    - sleep 10
    # Start Specto agent
    - specto-agent login --token \$SPECTO_TOKEN --backend https://api.specto.com
    - specto-agent start --daemon --ports 3000
    - sleep 5
    # Run tests (replace with your test command)
    - echo "Tests would run here via Specto API"
  after_script:
    - specto-agent stop
    - specto-agent logout
  only:
    - main
    - merge_requests`}</code>
          </pre>
        </div>

        <h3>Setup Variables</h3>
        <ol>
          <li>Go to Settings → CI/CD → Variables</li>
          <li>
            Add variable: <code>SPECTO_TOKEN</code>
          </li>
          <li>Value: Your JWT token</li>
          <li>Check "Mask variable"</li>
          <li>Save</li>
        </ol>
      </section>

      {/* CircleCI */}
      <section className="mt-12">
        <h2>CircleCI</h2>

        <p>
          CircleCI configuration in <code>.circleci/config.yml</code>:
        </p>

        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`# .circleci/config.yml
version: 2.1

jobs:
  test:
    docker:
      - image: cimg/node:18.0
    
    steps:
      - checkout
      
      - restore_cache:
          keys:
            - v1-dependencies-{{ checksum "package-lock.json" }}
            - v1-dependencies-
      
      - run:
          name: Install dependencies
          command: npm ci
      
      - save_cache:
          paths:
            - node_modules
          key: v1-dependencies-{{ checksum "package-lock.json" }}
      
      - run:
          name: Build application
          command: npm run build
      
      - run:
          name: Install cloudflared
          command: |
            wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
            sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
            sudo chmod +x /usr/local/bin/cloudflared
      
      - run:
          name: Install Specto agent
          command: npm install -g specto-agent
      
      - run:
          name: Start application
          command: npm start
          background: true
      
      - run:
          name: Wait for application
          command: sleep 10
      
      - run:
          name: Start Specto agent
          command: |
            specto-agent login --token \$SPECTO_TOKEN --backend https://api.specto.com
            specto-agent start --daemon --ports 3000
            sleep 5
      
      - run:
          name: Run tests
          command: |
            # Your test execution command here
            echo "Running Specto tests"
      
      - run:
          name: Cleanup
          command: |
            specto-agent stop
            specto-agent logout
          when: always

workflows:
  version: 2
  test:
    jobs:
      - test`}</code>
          </pre>
        </div>

        <h3>Setup Environment Variables</h3>
        <ol>
          <li>Project Settings → Environment Variables</li>
          <li>
            Add Variable: <code>SPECTO_TOKEN</code>
          </li>
          <li>Value: Your JWT token</li>
          <li>Save</li>
        </ol>
      </section>

      {/* Jenkins */}
      <section className="mt-12">
        <h2>Jenkins</h2>

        <p>
          Jenkins pipeline using <code>Jenkinsfile</code>:
        </p>

        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`// Jenkinsfile
pipeline {
    agent any
    
    environment {
        SPECTO_TOKEN = credentials('specto-token')
        NODE_VERSION = '18'
    }
    
    stages {
        stage('Setup') {
            steps {
                sh '''
                    # Install Node.js (if not available)
                    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                    sudo apt-get install -y nodejs
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        
        stage('Install Tools') {
            steps {
                sh '''
                    # Install cloudflared
                    wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
                    sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
                    sudo chmod +x /usr/local/bin/cloudflared
                    
                    # Install Specto agent
                    npm install -g specto-agent
                '''
            }
        }
        
        stage('Start Application') {
            steps {
                sh '''
                    npm start &
                    sleep 10
                '''
            }
        }
        
        stage('Start Specto Agent') {
            steps {
                sh '''
                    specto-agent login --token $SPECTO_TOKEN --backend https://api.specto.com
                    specto-agent start --daemon --ports 3000
                    sleep 5
                '''
            }
        }
        
        stage('Run Tests') {
            steps {
                sh '''
                    # Get tunnel URL
                    TUNNEL_URL=$(specto-agent status | grep "Port 3000" | awk '{print $3}')
                    echo "Testing via: $TUNNEL_URL"
                    
                    # Run tests via API
                    # ... your test commands
                '''
            }
        }
    }
    
    post {
        always {
            sh '''
                specto-agent stop || true
                specto-agent logout || true
            '''
        }
    }
}`}</code>
          </pre>
        </div>

        <h3>Setup Credentials</h3>
        <ol>
          <li>Manage Jenkins → Manage Credentials</li>
          <li>Add Credentials</li>
          <li>Kind: Secret text</li>
          <li>
            ID: <code>specto-token</code>
          </li>
          <li>Secret: Your JWT token</li>
          <li>Save</li>
        </ol>
      </section>

      {/* Azure Pipelines */}
      <section className="mt-12">
        <h2>Azure Pipelines</h2>

        <p>
          Azure DevOps pipeline in <code>azure-pipelines.yml</code>:
        </p>

        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`# azure-pipelines.yml
trigger:
  - main
  - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  NODE_VERSION: '18.x'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: $(NODE_VERSION)
  displayName: 'Install Node.js'

- script: npm ci
  displayName: 'Install dependencies'

- script: npm run build
  displayName: 'Build application'

- script: |
    wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
    sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
    sudo chmod +x /usr/local/bin/cloudflared
  displayName: 'Install cloudflared'

- script: npm install -g specto-agent
  displayName: 'Install Specto agent'

- script: |
    npm start &
    sleep 10
  displayName: 'Start application'

- script: |
    specto-agent login --token $(SPECTO_TOKEN) --backend https://api.specto.com
    specto-agent start --daemon --ports 3000
    sleep 5
  displayName: 'Start Specto agent'
  env:
    SPECTO_TOKEN: $(SPECTO_TOKEN)

- script: |
    # Run your tests
    echo "Running Specto tests"
  displayName: 'Run tests'

- script: |
    specto-agent stop || true
    specto-agent logout || true
  displayName: 'Cleanup'
  condition: always()`}</code>
          </pre>
        </div>

        <h3>Setup Variables</h3>
        <ol>
          <li>Pipelines → Edit → Variables</li>
          <li>
            New variable: <code>SPECTO_TOKEN</code>
          </li>
          <li>Value: Your JWT token</li>
          <li>Check "Keep this value secret"</li>
          <li>Save</li>
        </ol>
      </section>

      {/* Best Practices */}
      <section className="mt-12">
        <h2>Best Practices</h2>

        <h3>1. Use Secrets Management</h3>
        <p>
          Never hardcode tokens in your CI configuration. Always use your
          platform's secrets/credentials system.
        </p>

        <h3>2. Wait for Application Startup</h3>
        <p>
          Add appropriate sleep time or health checks to ensure your application
          is ready before creating tunnels.
        </p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`# Simple sleep
sleep 10

# Better: wait for health check
while ! curl -f http://localhost:3000/health; do
  sleep 2
done`}</code>
          </pre>
        </div>

        <h3>3. Always Cleanup</h3>
        <p>
          Use <code>always()</code> or equivalent to stop the agent even if
          tests fail.
        </p>

        <h3>4. Cache Dependencies</h3>
        <p>
          Cache <code>node_modules</code> to speed up builds.
        </p>

        <h3>5. Run on Specific Branches</h3>
        <p>
          Only run expensive E2E tests on main branches and PRs, not every
          commit.
        </p>

        <h3>6. Parallel Testing</h3>
        <p>Run different test suites in parallel jobs for faster feedback.</p>

        <h3>7. Use Production Backend</h3>
        <p>
          In CI, use <code>--backend https://api.specto.com</code> to connect to
          production Specto.
        </p>
      </section>

      {/* Docker */}
      <section className="mt-12">
        <h2>Docker-based CI</h2>

        <p>If your CI runs in Docker, you can create a custom image:</p>

        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`# Dockerfile.ci
FROM node:18-alpine

# Install cloudflared
RUN wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \\
    && mv cloudflared-linux-amd64 /usr/local/bin/cloudflared \\
    && chmod +x /usr/local/bin/cloudflared

# Install Specto agent
RUN npm install -g specto-agent

WORKDIR /app

# Your app setup
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Run tests script
COPY ci-test.sh /ci-test.sh
RUN chmod +x /ci-test.sh

CMD ["/ci-test.sh"]`}</code>
          </pre>
        </div>

        <p>
          Test script (<code>ci-test.sh</code>):
        </p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`#!/bin/sh
set -e

# Start app in background
npm start &
sleep 10

# Start Specto agent
specto-agent login --token $SPECTO_TOKEN --backend https://api.specto.com
specto-agent start --daemon --ports 3000
sleep 5

# Run tests
# ... your test commands

# Cleanup
specto-agent stop
specto-agent logout`}</code>
          </pre>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="mt-12">
        <h2>Troubleshooting CI/CD</h2>

        <h3>Agent fails to install</h3>
        <p>
          <strong>Solution:</strong>
        </p>
        <ul>
          <li>Ensure Node.js 18+ is installed</li>
          <li>
            Use <code>npm install -g specto-agent</code> not{" "}
            <code>npm install</code>
          </li>
          <li>Check npm has proper permissions</li>
        </ul>

        <h3>Cloudflared not found</h3>
        <p>
          <strong>Solution:</strong>
        </p>
        <ul>
          <li>Make sure install step completed successfully</li>
          <li>
            Verify path: <code>/usr/local/bin/cloudflared</code>
          </li>
          <li>
            Check permissions: <code>chmod +x /usr/local/bin/cloudflared</code>
          </li>
        </ul>

        <h3>Tunnel creation times out</h3>
        <p>
          <strong>Solution:</strong>
        </p>
        <ul>
          <li>Increase sleep time after starting app</li>
          <li>Add health check instead of sleep</li>
          <li>Check if application actually started</li>
          <li>Verify port number is correct</li>
        </ul>

        <h3>Tests fail but work locally</h3>
        <p>
          <strong>Solution:</strong>
        </p>
        <ul>
          <li>Check CI environment variables</li>
          <li>Verify backend URL is correct for CI</li>
          <li>Ensure test data/fixtures are available</li>
          <li>Check for timing issues (add more waits)</li>
        </ul>
      </section>

      {/* Example Projects */}
      <section className="mt-12">
        <div className="not-prose bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Example Projects</h2>
          <p className="text-green-100 mb-6">
            Check out our example repositories with working CI/CD
            configurations:
          </p>
          <div className="space-y-3">
            <a
              href="https://github.com/specto/example-nextjs"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-colors"
            >
              <h3 className="font-semibold mb-1">Next.js + GitHub Actions</h3>
              <p className="text-sm text-green-100">
                Complete example with Specto testing
              </p>
            </a>
            <a
              href="https://github.com/specto/example-react"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-colors"
            >
              <h3 className="font-semibold mb-1">React + GitLab CI</h3>
              <p className="text-sm text-green-100">
                React app with GitLab pipeline
              </p>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
