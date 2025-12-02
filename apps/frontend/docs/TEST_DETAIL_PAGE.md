# 📄 Page de Détails du Test - Documentation

## 🎯 Vue d'ensemble

La page `/tests/[id]` affiche les détails complets d'un test spécifique, incluant:

- Informations du test (URL, prompt, date)
- Code Playwright généré
- Résultats d'exécution (statut, durée, logs)
- Screenshots capturés
- Bouton pour relancer le test

## 📍 Route

**URL Pattern:** `/tests/[id]`

**Exemple:** `/tests/cm123abc456`

## 🔧 Fonctionnalités

### 1. Chargement des données

Au montage du composant, la page:

1. Récupère l'ID depuis les paramètres d'URL
2. Appelle `GET /api/tests/:id`
3. Affiche un loader pendant le chargement
4. Affiche les données ou une erreur

### 2. Affichage des informations

#### Section: Informations du test

- ✅ URL testée (lien cliquable)
- ✅ Description du test (prompt)
- ✅ Date de création (format français long)
- ✅ Badge de statut
- ✅ Bouton "Retour à l'accueil"

#### Section: Code généré

- ✅ Code Playwright complet
- ✅ Coloration syntaxique (fond noir)
- ✅ Scrollable horizontalement

#### Section: Résultats d'exécution

- ✅ Statut du test (badge coloré)
- ✅ Durée d'exécution (ms et secondes)
- ✅ Date d'exécution

#### Section: Screenshot

- ✅ Image du screenshot (si disponible)
- ✅ Lien "Ouvrir en plein écran"
- ✅ Responsive (adapté à la largeur)

#### Section: Logs

- ✅ Logs d'exécution complets
- ✅ Scrollable (max-height: 384px)
- ✅ Fond noir avec texte blanc
- ✅ Monospace pour lisibilité

### 3. Relancer le test

Le bouton "🔄 Relancer le test":

1. Récupère l'URL et le prompt du test actuel
2. Appelle `POST /api/tests` avec les mêmes paramètres
3. Affiche un loader pendant la création
4. Affiche un message de succès avec le nouvel ID
5. Redirige automatiquement vers la page du nouveau test (après 2s)

**Cas d'usage:**

- Test échoué → Relancer après correction du site
- Test réussi → Vérifier que le site fonctionne toujours
- Test ancien → Re-tester avec le code actuel

## 🎨 Design

### États visuels

#### Chargement

```tsx
<div className="text-center">
  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
  <p>Chargement du test...</p>
</div>
```

#### Erreur

```tsx
<div className="text-center">
  <div className="text-6xl">❌</div>
  <h1>Erreur</h1>
  <p className="text-red-600">{error}</p>
  <button>← Retour à l'accueil</button>
</div>
```

#### En attente d'exécution

```tsx
<div className="text-center py-12">
  <div className="text-6xl">⏳</div>
  <h2>Test en attente d'exécution</h2>
  <p>Le test sera traité prochainement par le worker.</p>
  <button>🔄 Actualiser</button>
</div>
```

### Badges de statut

| Statut     | Label         | Couleurs                        |
| ---------- | ------------- | ------------------------------- |
| `passed`   | ✅ Réussi     | `bg-green-100 text-green-700`   |
| `failed`   | ❌ Échoué     | `bg-red-100 text-red-700`       |
| `running`  | 🔄 En cours   | `bg-blue-100 text-blue-700`     |
| `error`    | ⚠️ Erreur     | `bg-orange-100 text-orange-700` |
| `timedOut` | ⏱️ Timeout    | `bg-yellow-100 text-yellow-700` |
| `pending`  | ⏳ En attente | `bg-gray-100 text-gray-700`     |

### Layout

```
┌─────────────────────────────────────────────┐
│  ← Retour à l'accueil        [Badge Statut] │
│  Détails du test                            │
│  ID: cm123...                               │
├─────────────────────────────────────────────┤
│  📋 Informations du test                    │
│  ┌───────────────────────────────────────┐  │
│  │ 🌐 URL: https://example.com           │  │
│  │ 📝 Prompt: Vérifier le titre...        │  │
│  │ 📅 Créé le: 30 octobre 2025           │  │
│  │                                        │  │
│  │ [🔄 Relancer le test]                 │  │
│  └───────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│  💻 Code Playwright généré                  │
│  ┌───────────────────────────────────────┐  │
│  │ import { test, expect } from...       │  │
│  │ test('...', async ({ page }) => {    │  │
│  │   await page.goto('...');            │  │
│  │   ...                                 │  │
│  │ });                                   │  │
│  └───────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│  📊 Résultat d'exécution                    │
│  ┌───────────────────────────────────────┐  │
│  │ Statut: [✅ Réussi]                   │  │
│  │ Durée: 2345ms (2.35 secondes)         │  │
│  │ Date: 30 octobre 2025 à 14:30:45      │  │
│  └───────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│  📸 Screenshot                              │
│  ┌───────────────────────────────────────┐  │
│  │                                        │  │
│  │          [IMAGE]                       │  │
│  │                                        │  │
│  └───────────────────────────────────────┘  │
│  🔍 Ouvrir en plein écran                   │
├─────────────────────────────────────────────┤
│  📄 Logs d'exécution                        │
│  ┌───────────────────────────────────────┐  │
│  │ === STDOUT ===                         │  │
│  │ Navigating to https://example.com...  │  │
│  │ ✅ Test completed successfully!       │  │
│  │ === STDERR ===                         │  │
│  │ (scrollable)                           │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## 🔄 Workflow

### Scénario 1: Consulter un test terminé

```
1. Utilisateur clique "Voir la page détaillée" depuis l'accueil
   ↓
2. Navigation vers /tests/cm123...
   ↓
3. Chargement: GET /api/tests/cm123...
   ↓
4. Affichage de toutes les informations
   ↓
5. Utilisateur peut:
   - Voir le code généré
   - Consulter les logs
   - Voir le screenshot
   - Relancer le test
```

### Scénario 2: Relancer un test

```
1. Utilisateur clique "🔄 Relancer le test"
   ↓
2. setRerunning(true)
   ↓
3. POST /api/tests avec { url, prompt, userId }
   ↓
4. Backend: Validation, génération, DB, queue
   ↓
5. Response: { testId: "cm456...", ... }
   ↓
6. Message de succès affiché
   ↓
7. Redirection vers /tests/cm456... (après 2s)
   ↓
8. Nouvelle page de test chargée
```

### Scénario 3: Test en attente

```
1. Utilisateur accède à /tests/cm789...
   ↓
2. GET /api/tests/cm789...
   ↓
3. Test existe mais results[] est vide
   ↓
4. Affichage du message "En attente d'exécution"
   ↓
5. Utilisateur clique "🔄 Actualiser"
   ↓
6. Rechargement des données
   ↓
7. Si exécuté: affichage des résultats
   Si toujours en attente: même message
```

## 📡 API Utilisées

### GET /api/tests/:id

**Request:**

```
GET /api/tests/cm123abc456
```

**Response (success):**

```json
{
  "test": {
    "id": "cm123abc456",
    "url": "https://example.com",
    "prompt": "Vérifier le titre",
    "code": "import { test, expect }...",
    "createdAt": "2025-10-30T14:30:00Z",
    "results": [
      {
        "id": "res123",
        "testId": "cm123abc456",
        "status": "passed",
        "logs": "=== STDOUT ===\n...",
        "screenshotUrl": "/screenshots/test-123.png",
        "duration": 2345,
        "createdAt": "2025-10-30T14:30:45Z"
      }
    ]
  }
}
```

**Response (error):**

```json
{
  "error": "Test not found"
}
```

### POST /api/tests (rerun)

**Request:**

```json
{
  "url": "https://example.com",
  "prompt": "Vérifier le titre",
  "userId": "temp-user-001"
}
```

**Response:**

```json
{
  "testId": "cm456def789",
  "jobId": "789",
  "status": "queued",
  "test": { ... }
}
```

## 🧪 Tests

### Test 1: Affichage d'un test réussi

1. Créer un test qui réussit
2. Accéder à `/tests/{testId}`
3. Vérifier:
   - ✅ Badge "✅ Réussi" affiché
   - ✅ Durée d'exécution visible
   - ✅ Logs visibles
   - ✅ Screenshot visible (si disponible)
   - ✅ Code Playwright affiché

### Test 2: Affichage d'un test échoué

1. Créer un test qui échoue
2. Accéder à `/tests/{testId}`
3. Vérifier:
   - ✅ Badge "❌ Échoué" affiché
   - ✅ Message d'erreur dans les logs
   - ✅ Screenshot de l'échec visible

### Test 3: Relancer un test

1. Accéder à `/tests/{testId}`
2. Cliquer "🔄 Relancer le test"
3. Vérifier:
   - ✅ Loader s'affiche
   - ✅ Message de succès après quelques secondes
   - ✅ Redirection automatique vers le nouveau test
   - ✅ Nouveau test a les mêmes URL et prompt

### Test 4: Test en attente

1. Créer un test (ne pas exécuter)
2. Accéder à `/tests/{testId}` immédiatement
3. Vérifier:
   - ✅ Message "Test en attente d'exécution"
   - ✅ Bouton "🔄 Actualiser" présent
   - ✅ Pas de section résultats/logs/screenshots

### Test 5: Erreur 404

1. Accéder à `/tests/invalid-id`
2. Vérifier:
   - ✅ Message d'erreur affiché
   - ✅ Bouton "Retour à l'accueil" fonctionne

## 🎯 Améliorations futures

- [ ] Auto-refresh si status = "running"
- [ ] Historique des exécutions multiples
- [ ] Comparaison de résultats (avant/après)
- [ ] Export du test (code + résultats)
- [ ] Partage de lien public
- [ ] Édition du prompt avant relance
- [ ] Galerie de screenshots (si plusieurs)
- [ ] Graphique de performance
- [ ] Métriques Web Vitals (LCP, FCP, etc.)

## 🔗 Navigation

- **Depuis l'accueil**: Cliquer "Voir la page détaillée" dans une carte de test
- **Retour à l'accueil**: Cliquer "← Retour à l'accueil" en haut
- **Vers nouveau test**: Automatique après "Relancer le test"

## 📚 Fichiers liés

- `src/app/tests/[id]/page.tsx` - Page principale
- `src/app/api/tests/[id]/route.ts` - API proxy
- `src/app/page.tsx` - Page d'accueil (lien vers détails)
- `src/types/index.ts` - Types TypeScript

---

**Page de détails complète et fonctionnelle!** 📄✨

Pour tester:

```powershell
# Démarrer frontend
npm run dev

# Créer un test depuis l'accueil
# Cliquer "Voir la page détaillée"
# Ou accéder directement: http://localhost:3000/tests/{testId}
```
