/**
 * Script de test du Playwright Runner
 *
 * Usage:
 *   npx tsx scripts/test-runner.ts
 */

import {
  runTestFromCode,
  validatePlaywrightInstallation,
} from "../src/runner/playrunner";

async function main() {
  console.log("🎭 Testing Playwright Runner...\n");

  // 1. Vérifier que Playwright est installé
  console.log("1️⃣ Checking Playwright installation...");
  const isInstalled = await validatePlaywrightInstallation();

  if (!isInstalled) {
    console.error("❌ Playwright is not installed!");
    console.log(
      "Run: npm install -D @playwright/test && npx playwright install"
    );
    process.exit(1);
  }

  console.log("✅ Playwright is installed\n");

  // 2. Test simple
  console.log("2️⃣ Running a simple test...");

  const simpleTestCode = `
import { test, expect } from '@playwright/test';

test('Example.com test', async ({ page }) => {
  console.log('🌐 Navigating to example.com...');
  await page.goto('https://example.com');
  
  console.log('🔍 Checking page title...');
  await expect(page).toHaveTitle(/Example Domain/);
  
  console.log('📝 Checking heading text...');
  await expect(page.locator('h1')).toContainText('Example Domain');
  
  console.log('✅ Test completed successfully!');
});
`;

  const result = await runTestFromCode(simpleTestCode, {
    headless: true,
    timeout: 30000,
    cleanup: false, // Garder les fichiers pour inspection
  });

  console.log("\n📊 Test Result:");
  console.log("Status:", result.status);
  console.log("Duration:", result.duration, "ms");
  console.log("Tests Count:", result.testsCount);
  console.log("Passed:", result.passedCount);
  console.log("Failed:", result.failedCount);
  console.log("Screenshots:", result.screenshotPaths.length);

  if (result.screenshotPaths.length > 0) {
    console.log("\n📸 Screenshot paths:");
    result.screenshotPaths.forEach((path, i) => {
      console.log(`  ${i + 1}. ${path}`);
    });
  }

  if (result.status === "failed") {
    console.log("\n❌ Error:");
    console.log(result.errorMessage);
    if (result.errorStack) {
      console.log("\nStack trace:");
      console.log(result.errorStack);
    }
  }

  console.log("\n📝 Logs:");
  console.log(result.logs);

  // 3. Résumé
  console.log("\n" + "=".repeat(60));
  if (result.status === "passed") {
    console.log("✅ All tests passed!");
  } else {
    console.log(`❌ Tests ${result.status}`);
  }
  console.log("=".repeat(60));
}

main()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
