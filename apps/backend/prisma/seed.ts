import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Nettoyer les données existantes
  console.log("🧹 Cleaning existing data...");
  await prisma.vulnerability.deleteMany();
  await prisma.securityTestRun.deleteMany();
  await prisma.securityTest.deleteMany();
  await prisma.performanceMetric.deleteMany();
  await prisma.performanceTestRun.deleteMany();
  await prisma.performanceTest.deleteMany();
  await prisma.unitTestRun.deleteMany();
  await prisma.unitTest.deleteMany();
  await prisma.functionAnalysis.deleteMany();
  await prisma.result.deleteMany();
  await prisma.test.deleteMany();
  await prisma.apiTestRun.deleteMany();
  await prisma.apiTest.deleteMany();
  await prisma.smokeTestRun.deleteMany();
  await prisma.smokeTest.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.tunnel.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Cleaned all existing data");

  // ==========================================
  // UTILISATEURS
  // ==========================================
  console.log("\n👤 Creating users...");

  const demoPassword = await bcrypt.hash("demo123", 10);
  const testPassword = await bcrypt.hash("test123", 10);

  const demoUser = await prisma.user.create({
    data: {
      email: "demo@leynai.com",
      passwordHash: demoPassword,
    },
  });
  console.log("✅ Created demo user:", demoUser.email);

  const testUser = await prisma.user.create({
    data: {
      email: "test@leynai.com",
      passwordHash: testPassword,
    },
  });
  console.log("✅ Created test user:", testUser.email);

  // ==========================================
  // TUNNELS
  // ==========================================
  console.log("\n🌐 Creating tunnels...");

  // Tunnels actifs
  const tunnel3000Active = await prisma.tunnel.create({
    data: {
      userId: demoUser.id,
      url: "https://demo-3000.trycloudflare.com",
      port: 3000,
      status: "active",
      agentId: "agent_demo_001",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2h
    },
  });
  console.log("✅ Created active tunnel (port 3000)");

  const tunnel4000Active = await prisma.tunnel.create({
    data: {
      userId: demoUser.id,
      url: "https://demo-4000.trycloudflare.com",
      port: 4000,
      status: "active",
      agentId: "agent_demo_001",
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // Il y a 1h
    },
  });
  console.log("✅ Created active tunnel (port 4000)");

  const tunnel5000Active = await prisma.tunnel.create({
    data: {
      userId: testUser.id,
      url: "https://test-5000.trycloudflare.com",
      port: 5000,
      status: "active",
      agentId: "agent_test_001",
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // Il y a 30min
    },
  });
  console.log("✅ Created active tunnel (port 5000)");

  // Tunnels fermés (historique)
  const tunnel3000Closed1 = await prisma.tunnel.create({
    data: {
      userId: demoUser.id,
      url: "https://demo-3000-old1.trycloudflare.com",
      port: 3000,
      status: "closed",
      agentId: "agent_demo_001",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Il y a 24h
      closedAt: new Date(Date.now() - 23 * 60 * 60 * 1000), // Fermé après 1h
    },
  });
  console.log("✅ Created closed tunnel (port 3000, 1 day ago)");

  const tunnel3000Closed2 = await prisma.tunnel.create({
    data: {
      userId: demoUser.id,
      url: "https://demo-3000-old2.trycloudflare.com",
      port: 3000,
      status: "closed",
      agentId: "agent_demo_001",
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // Il y a 12h
      closedAt: new Date(Date.now() - 11.5 * 60 * 60 * 1000), // Fermé après 30min
    },
  });
  console.log("✅ Created closed tunnel (port 3000, 12h ago)");

  const tunnel8080Closed = await prisma.tunnel.create({
    data: {
      userId: demoUser.id,
      url: "https://demo-8080.trycloudflare.com",
      port: 8080,
      status: "closed",
      agentId: "agent_demo_001",
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // Il y a 6h
      closedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // Fermé après 1h
    },
  });
  console.log("✅ Created closed tunnel (port 8080)");

  // ==========================================
  // PROJETS
  // ==========================================
  console.log("\n📁 Creating projects...");

  const projectDemo = await prisma.project.create({
    data: {
      name: "Demo E-commerce",
      description: "Projet de démonstration - Application e-commerce complète",
      createdBy: demoUser.id,
    },
  });
  console.log("✅ Created project:", projectDemo.name);

  const projectAPI = await prisma.project.create({
    data: {
      name: "REST API Backend",
      description: "API backend avec Node.js et Express",
      createdBy: demoUser.id,
    },
  });
  console.log("✅ Created project:", projectAPI.name);

  const projectMobile = await prisma.project.create({
    data: {
      name: "Mobile App",
      description: "Application mobile React Native",
      createdBy: testUser.id,
    },
  });
  console.log("✅ Created project:", projectMobile.name);

  // ==========================================
  // UNIT TESTS
  // ==========================================
  console.log("\n🧪 Creating unit tests...");

  const unitTest1 = await prisma.unitTest.create({
    data: {
      userId: demoUser.id,
      projectId: projectDemo.id,
      name: "User Authentication Tests",
      framework: "jest",
      sourceFile: "/src/auth/auth.ts",
      functionName: "validateUserCredentials",
      sourceCode: `export function validateUserCredentials(email: string, password: string): boolean {\n  if (!email || !password) return false;\n  return email.includes('@') && password.length >= 8;\n}`,
      generatedCode: `import { validateUserCredentials } from './auth';\n\ndescribe('validateUserCredentials', () => {\n  it('should return false for empty email', () => {\n    expect(validateUserCredentials('', 'password123')).toBe(false);\n  });\n  it('should return false for invalid email', () => {\n    expect(validateUserCredentials('invalid', 'password123')).toBe(false);\n  });\n  it('should return false for short password', () => {\n    expect(validateUserCredentials('test@example.com', 'short')).toBe(false);\n  });\n  it('should return true for valid credentials', () => {\n    expect(validateUserCredentials('test@example.com', 'password123')).toBe(true);\n  });\n});`,
      importance: 95,
    },
  });
  console.log("✅ Created unit test:", unitTest1.name);

  await prisma.unitTestRun.create({
    data: {
      unitTestId: unitTest1.id,
      status: "completed",
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 45000),
      totalTests: 24,
      passedTests: 22,
      failedTests: 2,
      coverage: 87.5,
      duration: 45000,
    },
  });
  console.log("✅ Created unit test run with 87.5% coverage");

  const unitTest2 = await prisma.unitTest.create({
    data: {
      userId: demoUser.id,
      projectId: projectAPI.id,
      name: "API Controllers Tests",
      framework: "jest",
      sourceFile: "/src/controllers/user.controller.ts",
      functionName: "getUserById",
      sourceCode: `export async function getUserById(id: string): Promise<User | null> {\n  const user = await db.user.findUnique({ where: { id } });\n  return user;\n}`,
      generatedCode: `import { getUserById } from './user.controller';\nimport { db } from '../db';\n\njest.mock('../db');\n\ndescribe('getUserById', () => {\n  it('should return user when found', async () => {\n    const mockUser = { id: '1', name: 'John' };\n    (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);\n    const result = await getUserById('1');\n    expect(result).toEqual(mockUser);\n  });\n  it('should return null when user not found', async () => {\n    (db.user.findUnique as jest.Mock).mockResolvedValue(null);\n    const result = await getUserById('999');\n    expect(result).toBeNull();\n  });\n});`,
      importance: 88,
    },
  });
  console.log("✅ Created unit test:", unitTest2.name);

  await prisma.unitTestRun.create({
    data: {
      unitTestId: unitTest2.id,
      status: "completed",
      startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000 + 32000),
      totalTests: 18,
      passedTests: 18,
      failedTests: 0,
      coverage: 95.2,
      duration: 32000,
    },
  });
  console.log("✅ Created unit test run with 95.2% coverage");

  // ==========================================
  // PERFORMANCE TESTS (COMMENTED - Schema needs fixes)
  // ==========================================
  // console.log("\n⚡ Creating performance tests...");

  /* const perfTest1 = await prisma.performanceTest.create({
    data: {
      userId: demoUser.id,
      projectId: projectDemo.id,
      name: "Homepage Load Test",
      description: "Test de charge sur la page d'accueil",
      url: "https://demo-shop.leynai.com",
      vus: 50,
      duration: 60,
      rampUpTime: 10,
      status: "completed",
      lastRunAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
  });
  console.log("✅ Created performance test:", perfTest1.name);

  const perfRun1 = await prisma.performanceTestRun.create({
    data: {
      performanceTestId: perfTest1.id,
      status: "completed",
      startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000 + 70000),
      vus: 50,
      duration: 60,
      totalRequests: 12500,
      successfulRequests: 12450,
      requestsPerSecond: 208.33,
      failedRequests: 50,
      errorRate: 0.004,
      avgResponseTime: 145.3,
      minResponseTime: 89.2,
      maxResponseTime: 2340.1,
      p50ResponseTime: 142.5,
      p95ResponseTime: 234.7,
      p99ResponseTime: 456.2,
      dataReceived: 125.5,
      dataSent: 45.2,
    },
  });
  console.log("✅ Created performance test run - P95: 234.7ms, RPS: 208.33");

  const perfTest2 = await prisma.performanceTest.create({
    data: {
      userId: demoUser.id,
      projectId: projectAPI.id,
      name: "API Endpoint Stress Test",
      description: "Test de stress sur /api/users",
      url: "https://api.leynai.com/users",
      vus: 100,
      duration: 120,
      rampUpTime: 20,
      status: "completed",
      lastRunAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
  });
  console.log("✅ Created performance test:", perfTest2.name);

  const perfRun2 = await prisma.performanceTestRun.create({
    data: {
      performanceTestId: perfTest2.id,
      status: "completed",
      startedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 5 * 60 * 60 * 1000 + 140000),
      vus: 100,
      duration: 120,
      totalRequests: 48000,
      successfulRequests: 47800,
      requestsPerSecond: 400.0,
      failedRequests: 200,
      errorRate: 0.00417,
      avgResponseTime: 98.5,
      minResponseTime: 45.1,
      maxResponseTime: 3200.0,
      p50ResponseTime: 95.2,
      p95ResponseTime: 178.3,
      p99ResponseTime: 420.5,
      dataReceived: 480.2,
      dataSent: 120.5,
    },
  });
  console.log("✅ Created performance test run - P95: 178.3ms, RPS: 400.0");
  */

  // ==========================================
  // SECURITY TESTS (COMMENTED - Schema needs fixes)
  // ==========================================
  // console.log("\n🛡️  Creating security tests...");

  /* const secTest1 = await prisma.securityTest.create({
    data: {
      userId: demoUser.id,
      projectId: projectDemo.id,
      name: "E-commerce Security Scan",
      description: "Scan OWASP complet de l'application e-commerce",
      targetUrl: "https://demo-shop.leynai.com",
      scanType: "full",
      checkSqlInjection: true,
      checkXss: true,
      checkCsrf: true,
      checkAuthBypass: true,
      checkSensitiveData: true,
      checkSecurityHeaders: true,
      checkSslTls: true,
      checkDirectoryTraversal: true,
      authType: "bearer",
      status: "completed",
      lastRunAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  });
  console.log("✅ Created security test:", secTest1.name);

  const secRun1 = await prisma.securityTestRun.create({
    data: {
      securityTestId: secTest1.id,
      status: "completed",
      startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 1200000),
      totalChecks: 45,
      vulnerabilitiesFound: 8,
      criticalCount: 1,
      highCount: 2,
      mediumCount: 3,
      lowCount: 2,
      infoCount: 0,
      riskScore: 52.5,
    },
  });
  console.log("✅ Created security test run - Risk Score: 52.5, Vulns: 8");

  // Créer des vulnérabilités
  await prisma.vulnerability.create({
    data: {
      runId: secRun1.id,
      type: "sql_injection",
      severity: "critical",
      title: "SQL Injection dans le paramètre 'id'",
      description: "Le paramètre 'id' est vulnérable à l'injection SQL. Un attaquant peut exécuter des requêtes SQL arbitraires.",
      url: "https://demo-shop.leynai.com/product",
      parameter: "id",
      method: "GET",
      evidence: "Payload: ' OR '1'='1 a retourné tous les produits",
      cwe: "CWE-89",
      owasp: "A03:2021 - Injection",
      remediation: "Utiliser des requêtes paramétrées ou des prepared statements. Ne jamais concaténer directement les entrées utilisateur dans les requêtes SQL.",
      status: "open",
    },
  });

  await prisma.vulnerability.create({
    data: {
      runId: secRun1.id,
      type: "xss",
      severity: "high",
      title: "XSS Réfléchi dans la recherche",
      description: "Le champ de recherche est vulnérable au XSS. Les entrées utilisateur ne sont pas encodées.",
      url: "https://demo-shop.leynai.com/search",
      parameter: "q",
      method: "GET",
      evidence: "Payload: <script>alert(1)</script> s'exécute dans le navigateur",
      cwe: "CWE-79",
      owasp: "A03:2021 - Injection",
      remediation: "Encoder toutes les entrées utilisateur avant de les afficher. Utiliser des en-têtes Content-Security-Policy.",
      status: "acknowledged",
    },
  });

  await prisma.vulnerability.create({
    data: {
      runId: secRun1.id,
      type: "security_headers",
      severity: "medium",
      title: "En-tête Content-Security-Policy manquant",
      description: "L'en-tête CSP n'est pas configuré, ce qui réduit la protection contre les attaques XSS.",
      url: "https://demo-shop.leynai.com",
      evidence: "Aucun en-tête Content-Security-Policy détecté dans la réponse",
      cwe: "CWE-16",
      owasp: "A05:2021 - Security Misconfiguration",
      remediation: "Ajouter l'en-tête: Content-Security-Policy: default-src 'self'",
      status: "open",
    },
  });

  console.log("✅ Created 3 vulnerabilities (Critical, High, Medium)");

  const secTest2 = await prisma.securityTest.create({
    data: {
      userId: demoUser.id,
      projectId: projectAPI.id,
      name: "API Security Quick Scan",
      description: "Scan rapide de sécurité de l'API",
      targetUrl: "https://api.leynai.com",
      scanType: "quick",
      checkSqlInjection: true,
      checkXss: false,
      checkCsrf: true,
      checkAuthBypass: true,
      checkSensitiveData: true,
      checkSecurityHeaders: true,
      checkSslTls: true,
      checkDirectoryTraversal: false,
      authType: "bearer",
      status: "completed",
      lastRunAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  });
  console.log("✅ Created security test:", secTest2.name);

  const secRun2 = await prisma.securityTestRun.create({
    data: {
      securityTestId: secTest2.id,
      status: "completed",
      startedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000 + 600000),
      totalChecks: 28,
      vulnerabilitiesFound: 2,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 1,
      lowCount: 1,
      infoCount: 0,
      riskScore: 18.0,
    },
  });
  console.log("✅ Created security test run - Risk Score: 18.0, Vulns: 2");

  await prisma.vulnerability.create({
    data: {
      runId: secRun2.id,
      type: "security_headers",
      severity: "medium",
      title: "En-tête Strict-Transport-Security manquant",
      description: "L'en-tête HSTS n'est pas configuré",
      url: "https://api.leynai.com",
      evidence: "Aucun en-tête Strict-Transport-Security détecté",
      cwe: "CWE-16",
      owasp: "A05:2021 - Security Misconfiguration",
      remediation: "Ajouter l'en-tête: Strict-Transport-Security: max-age=31536000; includeSubDomains",
      status: "fixed",
      fixedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  });

  console.log("✅ Created 1 vulnerability (Fixed)");
  */

  // ==========================================
  // TESTS E2E (anciens tests)
  // ==========================================
  console.log("\n🧪 Creating E2E tests...");

  // Tests avec tunnels actifs
  const test1 = await prisma.test.create({
    data: {
      userId: demoUser.id,
      projectId: projectDemo.id,
      tunnelId: tunnel3000Active.id,
      url: "http://localhost:3000",
      prompt: "Test the homepage and verify the title is correct",
      code: `import { test, expect } from '@playwright/test';

test('homepage test', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/LeynAI/);
  await page.screenshot({ path: 'screenshot.png' });
});`,
      keepTunnelOpen: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });
  console.log("✅ Created test 1 (homepage)");

  const test2 = await prisma.test.create({
    data: {
      userId: demoUser.id,
      tunnelId: tunnel3000Active.id,
      url: "http://localhost:3000",
      prompt: "Click on the login button and verify the form appears",
      code: `import { test, expect } from '@playwright/test';

test('login form test', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('text=Login');
  await expect(page.locator('input[type="email"]')).toBeVisible();
});`,
      keepTunnelOpen: true,
      projectId: projectDemo.id,
      createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    },
  });
  console.log("✅ Created test 2 (login form)");

  const test3 = await prisma.test.create({
    data: {
      userId: demoUser.id,
      tunnelId: tunnel4000Active.id,
      url: "http://localhost:4000",
      prompt: "Test API health endpoint",
      code: `import { test, expect } from '@playwright/test';

test('API health test', async ({ request }) => {
  const response = await request.get('http://localhost:4000/api/health');
  expect(response.status()).toBe(200);
});`,
      keepTunnelOpen: true,
      projectId: projectAPI.id,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
  });
  console.log("✅ Created test 3 (API health)");

  const test4 = await prisma.test.create({
    data: {
      userId: testUser.id,
      tunnelId: tunnel5000Active.id,
      url: "http://localhost:5000",
      prompt: "Test admin dashboard access",
      code: `import { test, expect } from '@playwright/test';

test('admin dashboard test', async ({ page }) => {
  await page.goto('http://localhost:5000/admin');
  await expect(page.locator('h1')).toContainText('Dashboard');
});`,
      keepTunnelOpen: false,
      projectId: projectMobile.id,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  });
  console.log("✅ Created test 4 (admin dashboard)");

  // Tests avec tunnels fermés (historique)
  const test5 = await prisma.test.create({
    data: {
      userId: demoUser.id,
      tunnelId: tunnel3000Closed1.id,
      url: "http://localhost:3000",
      prompt: "Old test - homepage validation",
      code: `import { test, expect } from '@playwright/test';

test('old homepage test', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/Home/);
});`,
      keepTunnelOpen: false,
      projectId: projectDemo.id,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });
  console.log("✅ Created test 5 (old homepage)");

  // ==========================================
  // RÉSULTATS
  // ==========================================
  console.log("\n📊 Creating results...");

  // Résultats pour test 1 (succès)
  const result1 = await prisma.result.create({
    data: {
      testId: test1.id,
      status: "success",
      logs: "✅ Test passed successfully\nAll assertions passed\nScreenshot saved",
      screenshotUrl: "http://localhost:9000/screenshots/test1-screenshot.png",
      duration: 2340,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });
  console.log("✅ Created result 1 (success)");

  // Résultats pour test 2 (échec)
  const result2 = await prisma.result.create({
    data: {
      testId: test2.id,
      status: "failure",
      logs: `❌ Test failed
Error: expect(locator).toBeVisible()
Expected: visible
Received: hidden

Timeout: 5000ms`,
      screenshotUrl: "http://localhost:9000/screenshots/test2-screenshot.png",
      duration: 5120,
      createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    },
  });
  console.log("✅ Created result 2 (failure)");

  // Résultats pour test 3 (succès)
  const result3 = await prisma.result.create({
    data: {
      testId: test3.id,
      status: "success",
      logs: "✅ API health check passed\nStatus: 200 OK\nResponse time: 45ms",
      duration: 890,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
  });
  console.log("✅ Created result 3 (success)");

  // Résultats pour test 4 (erreur)
  const result4 = await prisma.result.create({
    data: {
      testId: test4.id,
      status: "error",
      logs: `❌ Test error
Error: page.goto: net::ERR_CONNECTION_REFUSED
  at http://localhost:5000/admin

Possible causes:
- Server not running
- Wrong port
- Firewall blocking connection`,
      duration: 1200,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  });
  console.log("✅ Created result 4 (error)");

  // Résultats pour test 5 (succès - historique)
  const result5 = await prisma.result.create({
    data: {
      testId: test5.id,
      status: "success",
      logs: "✅ Old test passed",
      screenshotUrl: "http://localhost:9000/screenshots/test5-screenshot.png",
      duration: 1800,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });
  console.log("✅ Created result 5 (success - old)");

  // ==========================================
  // RÉSUMÉ
  // ==========================================
  console.log("\n" + "=".repeat(60));
  console.log("🎉 Database seeding completed!");
  console.log("=".repeat(60));
  console.log("\n📊 Summary:");
  console.log(`  👤 Users:              ${await prisma.user.count()}`);
  console.log(`  📁 Projects:           ${await prisma.project.count()}`);
  console.log(
    `  🌐 Tunnels:            ${await prisma.tunnel.count()} (${await prisma.tunnel.count(
      {
        where: { status: "active" },
      }
    )} active, ${await prisma.tunnel.count({
      where: { status: "closed" },
    })} closed)`
  );
  console.log(`  🧪 E2E Tests:          ${await prisma.test.count()}`);
  console.log(`  📊 E2E Results:        ${await prisma.result.count()}`);
  console.log(`  🧪 Unit Tests:         ${await prisma.unitTest.count()}`);
  console.log(`  📊 Unit Test Runs:     ${await prisma.unitTestRun.count()}`);

  console.log("\n🔑 Login credentials:");
  console.log("  📧 Email: demo@leynai.com");
  console.log("  � Password: demo123");
  console.log("\n  📧 Email: test@leynai.com");
  console.log("  � Password: test123");

  console.log("\n💡 Projects created:");
  console.log("  � Demo E-commerce (with E2E and Unit Tests)");
  console.log("  📁 REST API Backend (with E2E and Unit Tests)");
  console.log("  � Mobile App (by test@leynai.com)");

  console.log("\n🧪 Test Data:");
  console.log("  • 5 E2E Tests with full execution history");
  console.log("  • 2 Unit Tests with coverage reports (87.5% and 95.2%)");
  console.log("  • All tests associated with projects");
  console.log("  • Multiple test results showing success/failure patterns");

  console.log("\n� Next Steps:");
  console.log(
    "  1. Login at http://localhost:3000 with demo@leynai.com / demo123"
  );
  console.log("  2. View unified test history across all types");
  console.log("  3. Create new Performance or Security tests");
  console.log("  4. Use CLI: leynai-agent test --project=<id>");
  console.log("\n" + "=".repeat(60));
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
