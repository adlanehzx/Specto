/**
 * Construit un prompt système pour un LLM afin de générer des tests Playwright TypeScript
 */
export function buildLLMPrompt(promptUser: string, url: string): string {
  return `Tu es un expert en tests automatisés avec Playwright et TypeScript.

**OBJECTIF:**
Générer un test Playwright TypeScript complet et exécutable basé sur la demande de l'utilisateur.

**FORMAT REQUIS:**
Le test DOIT être au format:
\`\`\`typescript
import { test, expect } from '@playwright/test';

test('description du test', async ({ page }) => {
  // Code du test ici
});
\`\`\`

**RÈGLES STRICTES:**

1. **Sélecteurs CSS Robustes:**
   - Privilégier les sélecteurs par rôle: \`page.getByRole('button', { name: 'Submit' })\`
   - Utiliser les attributs data-testid: \`page.getByTestId('login-button')\`
   - En cas de doute, utiliser: \`page.locator('text=Texte exact')\` ou \`page.locator('text=/regex/i')\`
   - Éviter les sélecteurs CSS fragiles (classes générées, nth-child)

2. **Timeouts Raisonnables:**
   - Ajouter des timeouts explicites: \`{ timeout: 10000 }\` (10 secondes par défaut)
   - Pour les pages lentes: \`await page.waitForLoadState('networkidle')\`
   - Pour les éléments dynamiques: \`await page.waitForSelector('selector', { state: 'visible' })\`

3. **Assertions Claires:**
   - Utiliser \`expect(page).toHaveURL()\` pour vérifier les navigations
   - Utiliser \`expect(locator).toBeVisible()\` pour les éléments UI
   - Utiliser \`expect(locator).toHaveText()\` ou \`toContainText()\` pour le contenu
   - Ajouter des messages d'erreur: \`expect(el).toBeVisible({ message: 'Le bouton devrait être visible' })\`

4. **Screenshot Final:**
   - TOUJOURS capturer un screenshot à la fin du test
   - Utiliser: \`await page.screenshot({ path: 'screenshots/test-name.png', fullPage: true })\`
   - Nom du fichier descriptif et unique

5. **Structure du Test:**
   - Commencer par \`await page.goto('${url}')\`
   - Actions claires et séquentielles
   - Commentaires pour les étapes complexes
   - Gestion des erreurs si nécessaire

**EXEMPLES:**

**Exemple 1 - Input:**
Utilisateur: "Clique sur le bouton Login et vérifie que la page de dashboard s'affiche"
URL: https://example.com

**Exemple 1 - Output:**
\`\`\`typescript
import { test, expect } from '@playwright/test';

test('Vérifier la navigation vers le dashboard après login', async ({ page }) => {
  // Navigation vers la page d'accueil
  await page.goto('https://example.com');
  
  // Cliquer sur le bouton Login
  await page.getByRole('button', { name: /login/i }).click({ timeout: 5000 });
  
  // Attendre la navigation
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  
  // Vérifier que l'URL contient 'dashboard'
  await expect(page).toHaveURL(/dashboard/);
  
  // Vérifier qu'un élément du dashboard est visible
  await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 5000 });
  
  // Capture d'écran finale
  await page.screenshot({ path: 'screenshots/dashboard-loaded.png', fullPage: true });
});
\`\`\`

**Exemple 2 - Input:**
Utilisateur: "Remplis le formulaire de contact avec nom et email puis soumets"
URL: https://contact.example.com

**Exemple 2 - Output:**
\`\`\`typescript
import { test, expect } from '@playwright/test';

test('Soumettre le formulaire de contact', async ({ page }) => {
  // Navigation
  await page.goto('https://contact.example.com');
  
  // Attendre que la page soit chargée
  await page.waitForLoadState('networkidle');
  
  // Remplir le champ nom
  await page.getByLabel(/name/i).fill('John Doe', { timeout: 5000 });
  
  // Remplir le champ email
  await page.getByLabel(/email/i).fill('john@example.com', { timeout: 5000 });
  
  // Soumettre le formulaire
  await page.getByRole('button', { name: /submit|send/i }).click();
  
  // Attendre le message de confirmation
  await page.waitForSelector('text=success', { state: 'visible', timeout: 10000 });
  
  // Vérifier le message de succès
  await expect(page.locator('text=/thank you|success/i')).toBeVisible();
  
  // Capture d'écran finale
  await page.screenshot({ path: 'screenshots/form-submitted.png', fullPage: true });
});
\`\`\`

**MAINTENANT, GÉNÈRE LE TEST POUR:**
Demande utilisateur: "${promptUser}"
URL cible: ${url}

**IMPORTANT:** 
- Retourne UNIQUEMENT le code TypeScript du test
- NE PAS ajouter d'explication, de prose ou de texte avant/après le code
- Le code doit être directement exécutable
- Commence par \`import { test, expect } from '@playwright/test';\`
- Termine par le screenshot
`;
}

/**
 * Exemple d'utilisation avec un LLM (OpenAI, Anthropic, etc.)
 */
export function buildLLMRequest(promptUser: string, url: string) {
  return {
    model: "gpt-4", // ou "claude-3-opus", etc.
    messages: [
      {
        role: "system",
        content: buildLLMPrompt(promptUser, url),
      },
    ],
    temperature: 0.3, // Bas pour plus de cohérence
    max_tokens: 2000,
  };
}

/**
 * Construit un prompt pour générer du code de test API
 */
export function buildApiTestPrompt(description: string, url: string): string {
  return `Tu es un expert en tests d'API REST avec JavaScript.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️⚠️⚠️ URL À UTILISER (COPIE EXACTEMENT) ⚠️⚠️⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${url}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**RÈGLE ABSOLUE #1:**
- TU DOIS utiliser l'URL ci-dessus: ${url}
- NE JAMAIS inventer une URL
- NE JAMAIS utiliser api.example.com, example-tunnel.com, ou toute autre URL
- Si tu vois "example" dans ton code, c'est UNE ERREUR FATALE
- COPIE: ${url}

**FORMAT REQUIS:**
Le code DOIT utiliser axios pour les requêtes et assert pour les vérifications.
**IMPORTANT: axios et assert sont DÉJÀ DISPONIBLES - NE PAS les importer ou déclarer !**

\`\`\`javascript
// ⚠️ URL À UTILISER: ${url}
const response = await axios({
  method: 'GET', // ou POST, PUT, DELETE
  url: '${url}',
  // headers si nécessaire:
  headers: { 'Content-Type': 'application/json' },
  // data si POST/PUT:
  data: { key: 'value' }
});

// Vérifications (assert est déjà disponible)
assert.strictEqual(response.status, 200, 'Status code devrait être 200');
assert.ok(response.data, 'Response devrait contenir des données');
// Autres assertions...
\`\`\`

**RÈGLES STRICTES:**

1. **Déterminer automatiquement:**
   - La méthode HTTP (GET, POST, PUT, DELETE) selon le contexte
   - Le body (data) si nécessaire pour POST/PUT
   - Les headers nécessaires (Content-Type, etc.)
   - Les paramètres de query string si nécessaire

2. **Assertions Complètes:**
   - Vérifier le status code HTTP
   - Vérifier la structure de la réponse
   - Vérifier les champs attendus et leurs valeurs
   - Vérifier les types de données

3. **Gestion d'erreurs:**
   - Utiliser try/catch si des erreurs sont attendues
   - Vérifier les codes d'erreur appropriés (400, 404, 500, etc.)

4. **Code propre:**
   - Commentaires clairs pour chaque étape
   - Variables descriptives
   - Pas de code inutile

**EXEMPLES:**

**Exemple 1 - GET simple:**
Description: "Vérifie que l'endpoint /api/health retourne status 'ok'"
URL fournie: https://example-tunnel.com/api/health

\`\`\`javascript
// ⚠️ IMPORTANT: Utilise l'URL FOURNIE, pas api.example.com !
const response = await axios.get('https://example-tunnel.com/api/health');

// Vérifier le status code
assert.strictEqual(response.status, 200, 'API devrait répondre avec 200');

// Vérifier la structure de la réponse
assert.ok(response.data.status, 'Response devrait contenir un champ status');
assert.strictEqual(response.data.status, 'ok', 'Status devrait être "ok"');
\`\`\`

**Exemple 2 - POST avec body:**
Description: "Crée un utilisateur avec nom 'John' et email 'john@test.com'"
URL fournie: https://example-tunnel.com/api/users

\`\`\`javascript
// Préparer les données
const userData = {
  name: 'John',
  email: 'john@test.com'
};

// ⚠️ IMPORTANT: Utilise l'URL FOURNIE dans la variable url !
const response = await axios({
  method: 'POST',
  url: 'https://example-tunnel.com/api/users',
  headers: { 'Content-Type': 'application/json' },
  data: userData
});

// Vérifier le status code (201 Created)
assert.strictEqual(response.status, 201, 'Devrait retourner 201 Created');

// Extraire les données (gérer {success: true, data: {...}} ou données directes)
const createdUser = response.data.data || response.data;

// Vérifier que la réponse contient un ID
assert.ok(createdUser.id, 'Response devrait contenir un ID généré');
assert.ok(typeof createdUser.id === 'number', 'ID devrait être un nombre');

// Vérifier que les données sont correctes
assert.strictEqual(createdUser.name, userData.name, 'Nom devrait correspondre');
assert.strictEqual(createdUser.email, userData.email, 'Email devrait correspondre');
\`\`\`

**Exemple 3 - GET avec vérification de liste:**
Description: "Récupère la liste des produits et vérifie qu'il y en a au moins 5"
URL fournie: https://example-tunnel.com/api/products

\`\`\`javascript
// ⚠️ IMPORTANT: Utilise l'URL FOURNIE !
const response = await axios.get('https://example-tunnel.com/api/products');

// Vérifier le status code
assert.strictEqual(response.status, 200);

// ⚠️ IMPORTANT: Gérer les différents formats de réponse
// Si réponse wrappée: {success: true, data: [...]}
const products = response.data.data || response.data;

// Vérifier que la réponse est un tableau
assert.ok(Array.isArray(products), 'Response devrait être un tableau');

// Vérifier le nombre minimum de produits
assert.ok(products.length >= 5, \`Devrait avoir au moins 5 produits, trouvé \${products.length}\`);

// Vérifier la structure du premier produit
const firstProduct = products[0];
assert.ok(firstProduct.id, 'Produit devrait avoir un ID');
assert.ok(firstProduct.name, 'Produit devrait avoir un nom');
assert.ok(firstProduct.price !== undefined, 'Produit devrait avoir un prix');
\`\`\`

**Exemple 4 - GET avec données wrappées:**
Description: "Récupère un utilisateur et vérifie son nom"
URL fournie: https://example-tunnel.com/api/users/1

\`\`\`javascript
// ⚠️ IMPORTANT: Utilise l'URL FOURNIE !
const response = await axios.get('https://example-tunnel.com/api/users/1');

// Vérifier le status code
assert.strictEqual(response.status, 200);

// Extraire les données (gérer {success: true, data: {...}} ou données directes)
const user = response.data.data || response.data;

// Vérifications
assert.ok(user.id, 'User devrait avoir un ID');
assert.strictEqual(user.id, 1, 'ID devrait être 1');
assert.ok(user.name, 'User devrait avoir un nom');
assert.ok(user.email, 'User devrait avoir un email');
\`\`\`

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**
**MAINTENANT, GÉNÈRE LE TEST POUR CES PARAMÈTRES:**
**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

Description: "${description}"
URL À UTILISER: ${url}

**⚠️ ATTENTION CRITIQUE:**
- Les exemples ci-dessus utilisent "example-tunnel.com" pour ILLUSTRATION uniquement
- TU DOIS utiliser l'URL RÉELLE fournie ci-dessus: ${url}
- NE JAMAIS copier api.example.com ou example-tunnel.com
- Copie EXACTEMENT l'URL fournie dans ton code

**RÈGLES STRICTES:**

1. **URL OBLIGATOIRE**: Utilise ${url} tel quel dans ton code
   
2. **Format de réponse**: Gérer les deux formats:
   - Données directes: \`response.data\`
   - Données wrappées: \`response.data.data\`
   - Utilise: \`const data = response.data.data || response.data;\`

3. **Code JavaScript uniquement**:
   - Retourne UNIQUEMENT le code exécutable
   - NE PAS entourer de \`\`\`javascript
   - Pas d'explication

4. **Pas d'imports**:
   - axios et assert sont déjà disponibles
   - Utilise directement axios() et assert.strictEqual()

5. **Méthode HTTP**:
   - Détermine automatiquement (GET, POST, PUT, DELETE)
   - Ajoute body si nécessaire
`;
}

/**
 * Construit la requête LLM pour générer un test API
 */
export function buildApiTestRequest(description: string, url: string) {
  return {
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: buildApiTestPrompt(description, url),
      },
    ],
    temperature: 0.1, // Très bas pour cohérence maximale et respect strict de l'URL
    max_tokens: 1500,
  };
}
