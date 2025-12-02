# 🎨 Frontend LeynAI - Documentation

## 📚 Vue d'ensemble

Le frontend LeynAI est une application Next.js 14 (App Router) avec TypeScript et Tailwind CSS qui permet de créer et visualiser des tests Playwright automatisés.

## 🏗️ Architecture

```
apps/frontend/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── tests/
│   │   │       ├── route.ts              # Proxy GET/POST /api/tests
│   │   │       └── [id]/
│   │   │           └── route.ts          # Proxy GET /api/tests/:id
│   │   ├── tests/
│   │   │   └── [id]/
│   │   │       └── page.tsx              # Page détails d'un test ✨
│   │   ├── layout.tsx                    # Layout principal
│   │   ├── page.tsx                      # Page d'accueil ✨
│   │   └── globals.css                   # Styles globaux Tailwind
│   └── types/
│       └── index.ts                      # Types TypeScript
├── .env.local.example                    # Variables d'environnement
├── FRONTEND.md                           # 📖 Cette documentation
├── TEST_DETAIL_PAGE.md                   # 📖 Doc page de détails
├── next.config.js                        # Configuration Next.js
├── package.json                          # Dépendances
└── tsconfig.json                         # Configuration TypeScript
```

## 🚀 Installation

### 1. Installer les dépendances

```powershell
cd apps/frontend
npm install
```

### 2. Configurer les variables d'environnement

```powershell
# Copier le fichier d'exemple
cp .env.local.example .env.local

# Éditer .env.local
# NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

### 3. Démarrer le serveur de développement

```powershell
npm run dev
```

L'application sera accessible sur **http://localhost:3000**

## 🎯 Fonctionnalités

### ✅ Page d'accueil (`/`)

**Formulaire de création de test:**

- ✅ Champ URL (validation HTML5)
- ✅ Textarea pour le prompt (10-2000 caractères)
- ✅ Bouton "Lancer le test" avec loader
- ✅ Messages de succès/erreur
- ✅ Réinitialisation automatique du formulaire

**Liste des tests récents:**

- ✅ Affichage des tests de l'utilisateur
- ✅ Badge de statut coloré (en attente, réussi, échoué, erreur)
- ✅ Date de création formatée
- ✅ Bouton "Voir résultat" pour afficher les détails
- ✅ Bouton "Actualiser" pour recharger la liste

**Détails du test (expandable):**

- ✅ ID du test
- ✅ Bouton "Voir la page détaillée" → `/tests/[id]`
- ✅ Code Playwright généré (coloration syntaxique)
- ✅ Statut du dernier résultat
- ✅ Durée d'exécution
- ✅ Lien vers le screenshot (si disponible)
- ✅ Logs d'exécution (expandable)

### ✅ Page de détails du test (`/tests/[id]`)

**Informations complètes:**

- ✅ URL testée (lien cliquable)
- ✅ Description du test (prompt)
- ✅ Date de création formatée
- ✅ Badge de statut (passed, failed, etc.)
- ✅ Bouton "Retour à l'accueil"

**Code et résultats:**

- ✅ Code Playwright généré complet
- ✅ Statut d'exécution avec badge coloré
- ✅ Durée d'exécution (ms et secondes)
- ✅ Date d'exécution formatée

**Screenshots et logs:**

- ✅ Image du screenshot (si disponible)
- ✅ Lien "Ouvrir en plein écran"
- ✅ Logs d'exécution scrollables (max-height: 384px)
- ✅ Fond noir avec texte monospace

**Fonctionnalités:**

- ✅ Bouton "🔄 Relancer le test"
- ✅ Création d'un nouveau test avec mêmes paramètres
- ✅ Redirection automatique vers le nouveau test
- ✅ Message d'attente si test non exécuté
- ✅ Bouton "Actualiser" pour recharger

> 📖 Voir [TEST_DETAIL_PAGE.md](./TEST_DETAIL_PAGE.md) pour la documentation complète

### 📡 API Proxy Routes

#### `POST /api/tests`

Crée un nouveau test.

**Body:**

```json
{
  "url": "https://example.com",
  "prompt": "Vérifier le titre de la page",
  "userId": "temp-user-001"
}
```

**Response:**

```json
{
  "testId": "cm123...",
  "jobId": "456",
  "status": "queued",
  "test": { ... }
}
```

#### `GET /api/tests?userId=...`

Liste les tests d'un utilisateur.

**Response:**

```json
{
  "tests": [
    {
      "id": "cm123...",
      "url": "https://example.com",
      "prompt": "...",
      "code": "...",
      "createdAt": "2025-10-30T...",
      "results": [...]
    }
  ],
  "total": 10
}
```

#### `GET /api/tests/:id`

Récupère un test spécifique avec ses résultats.

**Response:**

```json
{
  "test": {
    "id": "cm123...",
    "url": "https://example.com",
    "prompt": "...",
    "code": "...",
    "results": [
      {
        "status": "passed",
        "duration": 2345,
        "screenshotUrl": "...",
        "logs": "..."
      }
    ]
  }
}
```

## 🎨 Design System

### Couleurs

- **Primary**: Blue 600 (`#2563eb`)
- **Secondary**: Purple 600 (`#9333ea`)
- **Success**: Green 100-700
- **Error**: Red 100-700
- **Warning**: Orange 100-700
- **Info**: Blue 100-700
- **Neutral**: Gray 50-900

### Composants

#### Badge de statut

```tsx
// ✅ Réussi - Green
<span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
  ✅ Réussi
</span>

// ❌ Échoué - Red
<span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
  ❌ Échoué
</span>

// ⏳ En attente - Gray
<span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
  ⏳ En attente
</span>
```

#### Bouton principal

```tsx
<button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg">
  🚀 Lancer le test
</button>
```

#### Loader

```tsx
<svg
  className="animate-spin h-5 w-5 text-white"
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
>
  <circle
    className="opacity-25"
    cx="12"
    cy="12"
    r="10"
    stroke="currentColor"
    strokeWidth="4"
  ></circle>
  <path
    className="opacity-75"
    fill="currentColor"
    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
  ></path>
</svg>
```

## 🔧 Configuration

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permettre les images depuis le backend
  images: {
    domains: ["localhost"],
  },
};

module.exports = nextConfig;
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 🧪 Tests

### Test manuel

1. Démarrer le backend:

```powershell
cd apps/backend
npm run dev
```

2. Démarrer le frontend:

```powershell
cd apps/frontend
npm run dev
```

3. Ouvrir http://localhost:3000

4. Créer un test:

   - URL: `https://example.com`
   - Prompt: `Vérifier que le titre contient Example`
   - Cliquer sur "Lancer le test"

5. Vérifier que:

   - ✅ Le message de succès s'affiche
   - ✅ Le formulaire se réinitialise
   - ✅ La liste des tests se met à jour
   - ✅ Le nouveau test apparaît dans la liste

6. Cliquer sur "Voir résultat" pour afficher les détails

## 📝 Types TypeScript

### Test

```typescript
interface Test {
  id: string;
  userId: string;
  url: string;
  prompt: string;
  code: string;
  createdAt: string;
  results?: Result[];
  user?: User;
}
```

### Result

```typescript
interface Result {
  id: string;
  testId: string;
  status: "passed" | "failed" | "timedOut" | "interrupted" | "error";
  logs: string;
  screenshotUrl: string | null;
  duration: number;
  createdAt: string;
}
```

### CreateTestResponse

```typescript
interface CreateTestResponse {
  testId: string;
  jobId: string;
  status: string;
  test: Test;
}
```

## 🔄 Workflow

```
1. Utilisateur remplit le formulaire
   ↓
2. Submit → setState('loading')
   ↓
3. POST /api/tests (frontend proxy)
   ↓
4. Proxy → POST backend:4000/api/tests
   ↓
5. Backend: Validation, génération code, DB, queue
   ↓
6. Response: { testId, jobId, status, test }
   ↓
7. Frontend: setState('success'), reset form
   ↓
8. loadTests() → GET /api/tests?userId=...
   ↓
9. Affichage de la liste mise à jour
   ↓
10. Utilisateur clique "Voir résultat"
   ↓
11. Expansion du test avec code, logs, screenshot
```

## 🚀 Déploiement

### Build production

```powershell
npm run build
```

### Démarrer en production

```powershell
npm start
```

### Variables d'environnement

En production, configurer:

```bash
NEXT_PUBLIC_BACKEND_URL=https://api.leynai.com
```

## 🐛 Débogage

### Logs frontend

Ouvrir la console du navigateur (F12) pour voir:

- Les requêtes API
- Les erreurs JavaScript
- Les logs de chargement

### Logs backend

Vérifier les logs du backend pour:

- Les requêtes reçues
- Les erreurs de validation
- Les jobs de queue

### Erreurs courantes

**"Failed to fetch tests"**

- Vérifier que le backend est démarré sur port 4000
- Vérifier NEXT_PUBLIC_BACKEND_URL dans .env.local

**"Failed to create test"**

- Vérifier la validation Zod côté backend
- Vérifier que l'userId existe dans la DB

**"TypeError: Cannot read property..."**

- Vérifier que les types correspondent entre frontend et backend
- Ajouter des vérifications optionnelles (`?.`)

## 🎓 Améliorations futures

### Court terme

- [ ] Authentification utilisateur (NextAuth.js)
- [ ] Pagination de la liste des tests
- [ ] Filtres par statut
- [ ] Recherche par URL/prompt
- [ ] Auto-refresh des résultats en cours

### Moyen terme

- [ ] Page détaillée d'un test (`/tests/[id]`)
- [ ] Graphiques de statistiques
- [ ] Historique des résultats
- [ ] Comparaison de résultats
- [ ] Export CSV/JSON

### Long terme

- [ ] Mode dark
- [ ] Notifications en temps réel (WebSocket)
- [ ] Éditeur de code intégré
- [ ] Visualisation des screenshots
- [ ] Partage de tests

## 📚 Ressources

- [Documentation Next.js 14](https://nextjs.org/docs)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Documentation TypeScript](https://www.typescriptlang.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)

## ✅ Checklist

- [x] Installation des dépendances
- [x] Configuration .env.local
- [x] Démarrage du serveur dev
- [x] Création du formulaire de test
- [x] API proxy vers le backend
- [x] Affichage de la liste des tests
- [x] Détails expandables
- [x] Badges de statut
- [x] Loader pendant la création
- [x] Messages de succès/erreur
- [x] Types TypeScript
- [ ] Tests avec un vrai backend
- [ ] Build production
- [ ] Déploiement

---

**Frontend prêt à l'emploi!** 🎨✨

Démarrer avec:

```powershell
cd apps/frontend
npm install
npm run dev
```

Puis ouvrir http://localhost:3000
