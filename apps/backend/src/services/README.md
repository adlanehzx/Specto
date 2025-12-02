# 📁 Services - Architecture

Ce dossier contient les services métier de l'application backend.

## Structure

```
services/
├── llm.ts              # Service de génération de code avec LLM
└── testGenerator.ts    # Orchestrateur de génération de tests
```

---

## 📄 Fichiers

### `llm.ts` - Service LLM

**Responsabilité :** Génération de code de test Playwright TypeScript

**Fonctions principales :**

- `generateTestCode(prompt, url)` - Génère du code de test
- `validateGeneratedCode(code)` - Valide le code généré
- `extractCodeMetadata(code)` - Extrait les métadonnées
- `estimateTestDuration(code)` - Estime la durée d'exécution

**État actuel :** Template basique (stub)

**Future :** Intégration OpenAI GPT-4, Mistral, Claude (code commenté prêt)

**Configuration :**

```env
OPENAI_API_KEY=sk-...    # Optionnel
MISTRAL_API_KEY=...      # Optionnel
```

**Utilisation :**

```typescript
import { generateTestCode } from "./services/llm";

const code = await generateTestCode(
  "Cliquer sur le bouton de connexion",
  "https://example.com"
);
```

---

### `testGenerator.ts` - Orchestrateur

**Responsabilité :** Interface de haut niveau pour la génération de tests

**Rôle :**

- Orchestre les appels au service LLM
- Gère la validation du code généré
- Retourne les résultats structurés

**Utilisation :**

```typescript
import { generateTestCode } from "./services/testGenerator";

const result = await generateTestCode({
  prompt: "Tester le formulaire de contact",
  url: "https://example.com/contact",
});

console.log(result.code);
console.log(result.estimatedDuration);
```

---

## 🔄 Flux de données

```
routes.ts (POST /api/tests)
    ↓
testGenerator.generateTestCode({ prompt, url })
    ↓
llm.generateTestCode(prompt, url)
    ↓
[Template actuel OU OpenAI/Mistral futur]
    ↓
llm.validateGeneratedCode(code)
    ↓
llm.estimateTestDuration(code)
    ↓
Retour: { code, framework, estimatedDuration }
```

---

## 🚀 Évolution future

### Phase 1 : Template (Actuel) ✅

- Code Playwright basique
- Prompt et URL incorporés
- Validation simple

### Phase 2 : LLM Simple (Prochain)

- Intégration OpenAI GPT-3.5
- Prompts système optimisés
- Fallback sur template

### Phase 3 : LLM Avancé

- Few-shot learning
- Analyse de page web (Puppeteer)
- Sélecteurs intelligents
- Tests multi-étapes

### Phase 4 : Multi-LLM

- Support GPT-4, Mistral, Claude
- Sélection automatique selon complexité
- A/B testing qualité

---

## 🛠️ Ajout d'un nouveau service

Pour ajouter un service dans ce dossier :

1. **Créer le fichier**

```typescript
// services/myService.ts
export async function myFunction() {
  // ...
}
```

2. **Ajouter les types**

```typescript
export interface MyServiceResult {
  data: string;
}
```

3. **Documenter**

```typescript
/**
 * Description de la fonction
 *
 * @param param1 - Description
 * @returns Description du retour
 */
```

4. **Tester**

```typescript
// tests/services/myService.test.ts
import { myFunction } from "../src/services/myService";

test("myFunction works", async () => {
  const result = await myFunction();
  expect(result).toBeDefined();
});
```

5. **Utiliser dans les routes**

```typescript
// routes.ts
import { myFunction } from "./services/myService";

router.post("/endpoint", async (req, res) => {
  const result = await myFunction();
  res.json(result);
});
```

---

## 📚 Documentation associée

- [LLM_INTEGRATION.md](../LLM_INTEGRATION.md) - Guide d'intégration LLM complet
- [API_TESTS.md](../API_TESTS.md) - Documentation de l'API

---

## ⚙️ Configuration

Les services utilisent les variables d'environnement suivantes :

| Variable            | Requis | Description                     |
| ------------------- | ------ | ------------------------------- |
| `OPENAI_API_KEY`    | Non    | Clé API OpenAI (pour GPT-4)     |
| `MISTRAL_API_KEY`   | Non    | Clé API Mistral                 |
| `ANTHROPIC_API_KEY` | Non    | Clé API Anthropic (pour Claude) |

**Note :** Si aucune clé n'est fournie, le système utilise le template basique.

---

## 🧪 Tests

Pour tester un service individuellement :

```bash
npx tsx -e "
import { generateTestCode } from './src/services/llm';
const code = await generateTestCode('Test prompt', 'https://example.com');
console.log(code);
"
```

---

## 🐛 Debugging

### Activer les logs détaillés

Dans `llm.ts`, ajoutez :

```typescript
console.log("🔍 Prompt:", prompt);
console.log("🔍 URL:", url);
console.log("🔍 Code généré:", code);
```

### Vérifier la validation

```typescript
import { validateGeneratedCode } from "./services/llm";

const isValid = validateGeneratedCode(myCode);
console.log("Valid:", isValid);
```

---

## 💡 Best Practices

1. **Toujours valider** le code généré avant de le retourner
2. **Gérer les erreurs** avec try/catch et fallback
3. **Logger** les événements importants
4. **Documenter** avec JSDoc
5. **Typer** avec TypeScript strict
6. **Tester** avec des exemples variés

---

## 📊 Métriques

À monitorer dans les services :

- Temps de génération du code
- Taux de validation réussie
- Nombre de tokens utilisés (si LLM)
- Coût par requête (si LLM payant)
- Taux d'erreur

Exemple :

```typescript
const startTime = Date.now();
const code = await generateTestCode(prompt, url);
const duration = Date.now() - startTime;

console.log(`⏱️ Génération en ${duration}ms`);
```

---

Cette architecture de services permet une **séparation claire des responsabilités** et facilite les **tests unitaires** et l'**évolution future** vers des LLM plus sophistiqués.
