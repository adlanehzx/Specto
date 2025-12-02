#!/usr/bin/env node

/**
 * Script de vérification Tailwind CSS
 *
 * Vérifie que tous les fichiers nécessaires sont présents
 */

const fs = require("fs");
const path = require("path");

const checks = [
  {
    name: "tailwind.config.js",
    path: "tailwind.config.js",
    required: true,
  },
  {
    name: "postcss.config.js",
    path: "postcss.config.js",
    required: true,
  },
  {
    name: "globals.css with @tailwind",
    path: "src/app/globals.css",
    required: true,
    contains: "@tailwind",
  },
  {
    name: "layout.tsx imports globals.css",
    path: "src/app/layout.tsx",
    required: true,
    contains: "globals.css",
  },
];

console.log("🔍 Vérification de la configuration Tailwind CSS...\n");

let allPassed = true;

checks.forEach((check) => {
  const filePath = path.join(process.cwd(), check.path);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${check.name}: MANQUANT`);
    allPassed = false;
    return;
  }

  if (check.contains) {
    const content = fs.readFileSync(filePath, "utf8");
    if (!content.includes(check.contains)) {
      console.log(`❌ ${check.name}: Ne contient pas "${check.contains}"`);
      allPassed = false;
      return;
    }
  }

  console.log(`✅ ${check.name}: OK`);
});

console.log("\n");

if (allPassed) {
  console.log("🎉 Tous les fichiers de configuration sont présents!");
  console.log("\n📝 Prochaines étapes:");
  console.log("   1. Lancer le serveur: npm run dev");
  console.log("   2. Ouvrir http://localhost:3000");
  console.log("   3. Vérifier que les styles s'affichent correctement\n");
  process.exit(0);
} else {
  console.log("⚠️  Certains fichiers manquent ou sont incorrects.");
  console.log("   Consultez TAILWIND_SETUP.md pour plus d'informations.\n");
  process.exit(1);
}
