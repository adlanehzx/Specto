import { defineConfig, devices } from "@playwright/test";

/**
 * Configuration Playwright pour Specto Backend
 *
 * Cette configuration est utilisée pour exécuter les tests générés dynamiquement.
 * Le runner (playrunner.ts) crée des configurations temporaires basées sur celle-ci.
 */
export default defineConfig({
  // Dossier contenant les tests
  testDir: "./tests",

  // Timeout par test (30 secondes)
  timeout: 30 * 1000,

  // Nombre maximum de tentatives en cas d'échec
  retries: 0,

  // Nombre de workers parallèles
  workers: 1,

  // Reporter pour les résultats
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["list"],
  ],

  // Configuration globale des tests
  use: {
    // Mode headless par défaut
    headless: true,

    // Capturer une screenshot à chaque échec
    screenshot: "only-on-failure",

    // Enregistrer une vidéo à chaque échec
    video: "retain-on-failure",

    // Trace en cas d'échec (pour debug)
    trace: "on-first-retry",

    // Timeout pour les actions (click, fill, etc.)
    actionTimeout: 10 * 1000,

    // Timeout pour la navigation
    navigationTimeout: 30 * 1000,
  },

  // Projets de test (navigateurs)
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Décommenter pour tester sur d'autres navigateurs
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Serveur de développement (optionnel)
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
