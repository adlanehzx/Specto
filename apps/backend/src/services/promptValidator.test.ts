/**
 * Tests pour le module de validation de prompts
 *
 * Exécuter : npx tsx src/services/promptValidator.test.ts
 */

import {
  validatePrompt,
  estimatePromptComplexity,
  analyzePrompt,
  improvePrompt,
} from "./promptValidator";

async function runTests() {
  console.log("🧪 Tests du module PromptValidator\n");

  // Test 1 : Prompt vide
  console.log("1️⃣ Test : Prompt vide");
  const test1 = await validatePrompt("");
  console.log(`   Score: ${test1.score}/100`);
  console.log(`   Valid: ${test1.valid}`);
  console.log(`   Raison: ${test1.reason}\n`);
  console.assert(!test1.valid, "❌ Devrait être invalide");
  console.assert(test1.score === 0, "❌ Score devrait être 0");

  // Test 2 : Prompt trop court
  console.log("2️⃣ Test : Prompt trop court");
  const test2 = await validatePrompt("teste le site");
  console.log(`   Score: ${test2.score}/100`);
  console.log(`   Valid: ${test2.valid}`);
  console.log(`   Raison: ${test2.reason}`);
  console.log(`   Suggestion: ${test2.suggestion}\n`);
  console.assert(!test2.valid, "❌ Devrait être invalide");

  // Test 3 : Prompt vague
  console.log("3️⃣ Test : Prompt vague");
  const test3 = await validatePrompt("vérifie que ça marche sur le site");
  console.log(`   Score: ${test3.score}/100`);
  console.log(`   Valid: ${test3.valid}`);
  console.log(`   Raison: ${test3.reason}\n`);

  // Test 4 : Prompt correct
  console.log("4️⃣ Test : Prompt correct");
  const test4 = await validatePrompt(
    "Vérifie que la connexion échoue avec un mauvais mot de passe"
  );
  console.log(`   Score: ${test4.score}/100`);
  console.log(`   Valid: ${test4.valid}`);
  console.log(`   Raison: ${test4.reason}`);
  console.log(`   Complexité: ${test4.complexity}/5\n`);
  console.assert(test4.valid, "❌ Devrait être valide");
  console.assert(test4.score >= 60, "❌ Score devrait être >= 60");

  // Test 5 : Prompt excellent avec sélecteurs
  console.log("5️⃣ Test : Prompt avec sélecteurs CSS");
  const test5 = await validatePrompt(
    'Clique sur le bouton #submit-btn, vérifie que l\'input[name="email"] est vide et que le formulaire .login-form affiche une erreur'
  );
  console.log(`   Score: ${test5.score}/100`);
  console.log(`   Valid: ${test5.valid}`);
  console.log(`   Raison: ${test5.reason}`);
  console.log(`   Complexité: ${test5.complexity}/5\n`);
  console.assert(test5.valid, "❌ Devrait être valide");
  console.assert(test5.score >= 80, "❌ Score devrait être >= 80");

  // Test 6 : Complexité
  console.log("6️⃣ Test : Estimation de complexité");
  const complexity1 = estimatePromptComplexity("Clique sur le bouton login");
  const complexity2 = estimatePromptComplexity(
    "Remplit le formulaire, clique sur submit, vérifie la redirection, puis teste le logout"
  );
  console.log(`   Simple (1 action): ${complexity1}/5`);
  console.log(`   Complexe (4+ actions): ${complexity2}/5\n`);
  console.assert(complexity1 <= 2, "❌ Devrait être simple");
  console.assert(complexity2 >= 3, "❌ Devrait être complexe");

  // Test 7 : Analyse détaillée
  console.log("7️⃣ Test : Analyse détaillée du prompt");
  const analysis = analyzePrompt(
    'Clique sur input[type="submit"], vérifie le bouton et navigue vers #dashboard'
  );
  console.log(`   Mots: ${analysis.wordCount}`);
  console.log(`   Verbes: ${analysis.verbs.join(", ")}`);
  console.log(`   Éléments UI: ${analysis.uiElements.join(", ")}`);
  console.log(`   Sélecteurs: ${analysis.selectors.join(", ")}`);
  console.log(`   Complexité: ${analysis.complexity}/5\n`);

  // Test 8 : Amélioration avec OpenAI (si API key disponible)
  if (process.env.OPENAI_API_KEY) {
    console.log("8️⃣ Test : Amélioration avec OpenAI");
    const improved = await improvePrompt("teste le login");
    console.log(`   Original: "teste le login"`);
    console.log(`   Amélioré: "${improved}"\n`);

    const validation = await validatePrompt(improved);
    console.log(`   Score amélioré: ${validation.score}/100`);
    console.log(`   Valid: ${validation.valid}\n`);
  } else {
    console.log("⚠️  OPENAI_API_KEY non défini, test d'amélioration sauté\n");
  }

  console.log("✅ Tous les tests sont terminés !");
}

// Exécuter les tests
runTests().catch(console.error);
