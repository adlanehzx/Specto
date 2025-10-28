/**
 * AI Prompts for Unit Test Generation
 */

interface FunctionInfo {
  name: string;
  code: string;
  parameters?: string[];
  isAsync?: boolean;
  filePath?: string;
}

/**
 * Prompt pour analyser l'importance des fonctions (scoring uniquement, pas de génération)
 */
export function buildFunctionAnalysisPrompt(functions: FunctionInfo[]): string {
  return `Tu es un expert en tests unitaires. Analyse ces fonctions et donne un score d'importance (0-100) pour chacune.

**Critères de criticité :**

🔴 **Score 90-100 - CRITIQUE** :
- Fonctions de paiement, transactions financières
- Authentification, gestion de mots de passe, tokens
- Cryptographie, encryption/decryption
- Validation et sanitization de données utilisateur
- Tout ce qui touche à la sécurité ou à l'argent

🟠 **Score 70-89 - IMPORTANT** :
- Business logic principale
- API endpoints publics
- Accès et manipulation de base de données
- Calculs métier complexes
- Gestion d'erreurs critiques

🟡 **Score 50-69 - UTILE** :
- Utilitaires complexes (parsing, transformations)
- Helpers avec logique conditionnelle
- Formatage de données importantes
- Validations secondaires

🟢 **Score 0-49 - FAIBLE PRIORITÉ** :
- Getters/Setters simples
- Formatage trivial (dates, strings simples)
- Logs et debug
- Utilitaires très simples

**Fonctions à analyser :**

${functions
  .map(
    (f, i) => `
## Fonction ${i + 1}
- Nom: ${f.name}
- Fichier: ${f.filePath || "N/A"}
- Paramètres: ${f.parameters?.join(", ") || "aucun"}
- Async: ${f.isAsync ? "oui" : "non"}

Code:
\`\`\`typescript
${f.code}
\`\`\`
`
  )
  .join("\n")}

**Instructions :**
- NE génère PAS de tests
- Retourne UNIQUEMENT un JSON avec les scores
- Sois strict : seules les fonctions vraiment critiques méritent 90+
- Format exact: { "functions": [{ "functionName": "nom", "importance": 85, "reason": "raison détaillée" }] }

JSON:`;
}

/**
 * Prompt pour générer des tests unitaires pour une fonction spécifique
 */
export function buildFunctionTestPrompt(
  functionName: string,
  functionCode: string,
  testDepth: "exhaustive" | "standard" | "basic",
  context?: string
): string {
  const depthInstructions = {
    exhaustive: `
**Tests EXHAUSTIFS requis :**
✅ Tous les cas normaux (happy path)
✅ Tous les edge cases imaginables
✅ Toutes les erreurs possibles
✅ Valeurs nulles, undefined, empty
✅ Types invalides et conversions
✅ Limites (min, max, overflow)
✅ Comportements asynchrones
✅ Effets de bord et side effects
✅ Concurrence et race conditions

**Objectif : 100% de couverture de code**
`,
    standard: `
**Tests STANDARD requis :**
✅ Cas principaux (happy path)
✅ 2-3 cas d'erreur courants
✅ 1-2 edge cases importants
✅ Valeurs nulles/undefined
✅ Comportements asynchrones si applicable

**Objectif : 80% de couverture de code**
`,
    basic: `
**Tests BASIQUES requis :**
✅ 1-2 cas principaux
✅ 1 cas d'erreur
✅ 1 edge case simple

**Objectif : 60% de couverture de code**
`,
  };

  return `Tu es un expert en tests unitaires Jest/TypeScript. Génère des tests unitaires complets pour cette fonction.

**Fonction à tester :**
\`\`\`typescript
${functionCode}
\`\`\`

${
  context
    ? `**Contexte (imports, types) :**
\`\`\`typescript
${context}
\`\`\`
`
    : ""
}

${depthInstructions[testDepth]}

**Instructions techniques :**
- Framework : Jest + TypeScript
- Utilise describe() pour grouper les tests
- Nomme chaque test clairement : it('should...', ...)
- Mock les dépendances externes (DB, API, etc.) avec jest.mock()
- Utilise expect() avec les matchers appropriés
- Ajoute des commentaires pour expliquer les tests complexes
- Si la fonction est async, utilise async/await dans les tests
- Gère les cas d'erreur avec expect().toThrow() ou try/catch

**Format de sortie :**
Retourne UNIQUEMENT le code des tests, sans explications avant/après.
Commence directement par les imports nécessaires.

Code Jest:`;
}

/**
 * Prompt pour optimiser des tests existants basés sur les échecs
 */
export function buildTestOptimizationPrompt(
  functionName: string,
  currentTests: string,
  failureHistory: any[]
): string {
  return `Tu es un expert en tests unitaires. Améliore ces tests basés sur l'historique d'échecs.

**Fonction testée :** ${functionName}

**Tests actuels :**
\`\`\`typescript
${currentTests}
\`\`\`

**Historique d'échecs récents :**
${failureHistory
  .map(
    (failure, i) => `
${i + 1}. ${failure.testName}
   Erreur: ${failure.error}
   Date: ${failure.date}
`
  )
  .join("\n")}

**Instructions :**
- Analyse pourquoi ces tests échouent
- Identifie les cas manquants
- Ajoute des tests pour couvrir ces scénarios
- Améliore les mocks si nécessaire
- Rends les assertions plus robustes

Retourne le code des tests améliorés (complet, pas juste les ajouts):`;
}

/**
 * Prompt pour générer des tests de régression après un bug
 */
export function buildRegressionTestPrompt(
  functionName: string,
  functionCode: string,
  bugDescription: string,
  bugFix: string
): string {
  return `Génère un test de régression pour éviter qu'un bug réapparaisse.

**Fonction :**
\`\`\`typescript
${functionCode}
\`\`\`

**Bug découvert :**
${bugDescription}

**Fix appliqué :**
\`\`\`typescript
${bugFix}
\`\`\`

**Instructions :**
- Crée un test qui aurait détecté ce bug
- Nomme le test explicitement en référence au bug
- Ajoute un commentaire expliquant le bug et le fix
- Le test doit échouer sur l'ancienne version et passer sur la nouvelle

Retourne uniquement le code du nouveau test:`;
}

/**
 * Prompt pour générer des tests de sécurité
 */
export function buildSecurityTestPrompt(
  functionName: string,
  functionCode: string
): string {
  return `Génère des tests de sécurité pour cette fonction.

**Fonction :**
\`\`\`typescript
${functionCode}
\`\`\`

**Tests de sécurité à créer :**
✅ Injection SQL (si accès DB)
✅ XSS (si manipulation HTML/string)
✅ Path traversal (si manipulation fichiers)
✅ Buffer overflow / dépassement de limites
✅ Injection de code
✅ Caractères spéciaux et Unicode
✅ Null bytes
✅ Validation des entrées utilisateur

**Instructions :**
- Teste avec des payloads malveillants courants
- Vérifie que la fonction refuse ou sanitize les inputs dangereux
- Utilise des exemples réels d'attaques

Retourne uniquement les tests de sécurité:`;
}

/**
 * Prompt pour générer des tests de performance
 */
export function buildPerformanceTestPrompt(
  functionName: string,
  functionCode: string,
  expectedMaxDuration: number
): string {
  return `Génère des tests de performance pour cette fonction.

**Fonction :**
\`\`\`typescript
${functionCode}
\`\`\`

**Critères de performance :**
- Durée maximale acceptée : ${expectedMaxDuration}ms
- Tester avec différentes tailles d'input
- Vérifier la complexité algorithmique

**Instructions :**
- Utilise performance.now() pour mesurer le temps
- Teste avec des inputs de tailles croissantes (10, 100, 1000, 10000)
- Vérifie que le temps reste dans les limites acceptables
- Identifie les cas où la performance se dégrade

Retourne uniquement les tests de performance:`;
}

/**
 * Prompt pour générer des mocks complexes
 */
export function buildMockGenerationPrompt(
  functionCode: string,
  dependencies: string[]
): string {
  return `Génère les mocks Jest nécessaires pour tester cette fonction.

**Fonction :**
\`\`\`typescript
${functionCode}
\`\`\`

**Dépendances à mocker :**
${dependencies.map((dep) => `- ${dep}`).join("\n")}

**Instructions :**
- Utilise jest.mock() pour les modules externes
- Crée des mocks détaillés avec jest.fn()
- Simule les réponses success et error
- Rends les mocks réutilisables

Retourne uniquement le code des mocks:`;
}

/**
 * Prompt pour convertir des tests d'un framework à un autre
 */
export function buildTestConversionPrompt(
  tests: string,
  fromFramework: string,
  toFramework: string
): string {
  return `Convertis ces tests de ${fromFramework} vers ${toFramework}.

**Tests ${fromFramework} :**
\`\`\`typescript
${tests}
\`\`\`

**Instructions :**
- Convertis toute la syntaxe
- Adapte les matchers/assertions
- Garde la même structure logique
- Ajoute les imports nécessaires pour ${toFramework}

Retourne uniquement les tests convertis:`;
}
