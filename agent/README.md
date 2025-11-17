# LeynAI Agent & CLI

## 📦 Two Tools in One Package

Ce package contient **2 outils distincts** :

### 1. **LeynAI Agent** - Tunnel Management (Développement local)

Expose votre localhost via cloudflared pour permettre l'exécution de tests E2E à distance.

**Usage :**

```bash
leynai-agent login --email=user@example.com --password=***
leynai-agent start --ports=3000,8080
leynai-agent status
leynai-agent stop
```

### 2. **LeynAI CLI** - CI/CD Integration (Tests automatisés)

Exécute vos tests E2E et API depuis une configuration déclarative `leynai.json`.

**Usage :**

```bash
leynai-agent init              # Génère leynai.json
leynai-agent validate          # Valide la configuration
leynai-agent test              # Lance les tests
leynai-agent test --only=api   # Seulement les tests API
```

---

## 🚀 Installation

### Option 1 : Installation globale (Recommandé)

```bash
cd agent
npm install
npm run build
npm link  # Nécessite sudo/admin
```

Ensuite vous pouvez utiliser `leynai-agent` depuis n'importe où :

```bash
leynai-agent --help
```

### Option 2 : Utilisation locale

```bash
cd agent
npm install
npm run build
node bin/leynai-agent.js --help
```

---

## 🔧 Agent Commands (Tunnel Management)

### `login` - Authentification

```bash
# Avec email/password
leynai-agent login --email=user@example.com --password=***

# Avec token JWT
leynai-agent login --token=eyJhbGciOiJIUzI1NiIs...

# Backend personnalisé
leynai-agent login --email=user@example.com --password=*** --backend=http://localhost:4000
```

### `start` - Démarrer l'agent

```bash
# Mode foreground (par défaut)
leynai-agent start

# Mode daemon (arrière-plan)
leynai-agent start --daemon

# Ports personnalisés
leynai-agent start --ports=3000,8080,5173

# Backend personnalisé
leynai-agent start --backend=http://localhost:4000
```

### `status` - Vérifier l'état

```bash
leynai-agent status
```

### `stop` - Arrêter l'agent

```bash
leynai-agent stop
```

### `logout` - Déconnexion

```bash
leynai-agent logout
```

---

## 📝 CLI Commands (CI/CD Integration)

### `init` - Initialiser la configuration

```bash
leynai-agent init              # Crée leynai.json
leynai-agent init --force      # Écrase le fichier existant
```

### `validate` - Valider la configuration

```bash
leynai-agent validate
leynai-agent validate --config=custom-config.json
```

### `test` - Lancer les tests

```bash
# Lancer tous les tests
leynai-agent test

# Avec configuration personnalisée
leynai-agent test --config=custom-config.json

# Environnement spécifique
leynai-agent test --env=production

# Seulement les tests E2E
leynai-agent test --only=e2e

# Seulement les tests API
leynai-agent test --only=api

# Sortie JSON
leynai-agent test --output=json
```

---

## 📋 Configuration (leynai.json)

Structure du fichier de configuration pour le CLI :

```json
{
  "server": "http://localhost:4000",
  "apiKey": "${LEYNAI_API_KEY}",
  "project": "your-project-id",
  "environments": {
    "staging": {
      "baseUrl": "https://staging.example.com",
      "variables": {
        "API_URL": "https://api.staging.example.com"
      }
    },
    "production": {
      "baseUrl": "https://example.com",
      "variables": {
        "API_URL": "https://api.example.com"
      }
    }
  },
  "tests": {
    "e2e": ["test-id-1", "test-id-2"],
    "api": ["api-test-id-1", "api-test-id-2"]
  },
  "options": {
    "parallel": 3,
    "timeout": 30000,
    "retries": 2,
    "bail": false
  }
}
```

### Variables d'environnement

Le CLI supporte la syntaxe `${VAR_NAME}` pour les variables d'environnement :

```bash
# Définir la clé API
export LEYNAI_API_KEY="your-api-key-from-dashboard"

# Ou sur Windows PowerShell
$env:LEYNAI_API_KEY="your-api-key-from-dashboard"
```

---

## 🔄 Intégration CI/CD

### GitHub Actions

```yaml
name: LeynAI Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
      - name: Install CLI
        run: cd agent && npm install && npm run build
      - name: Run tests
        env:
          LEYNAI_API_KEY: ${{ secrets.LEYNAI_API_KEY }}
        run: cd agent && node bin/leynai-agent.js test
```

### GitLab CI

```yaml
leynai-tests:
  stage: test
  image: node:20-alpine
  before_script:
    - cd agent && npm install && npm run build
  script:
    - node bin/leynai-agent.js test --env=production
```

### Jenkins

```groovy
pipeline {
    agent any
    environment {
        LEYNAI_API_KEY = credentials('leynai-api-key')
    }
    stages {
        stage('Test') {
            steps {
                sh 'cd agent && npm install && npm run build'
                sh 'cd agent && node bin/leynai-agent.js test'
            }
        }
    }
}
```

---

## 🏗️ Architecture

```
agent/
├── src/
│   ├── agent.ts          # Agent tunnel (développement local)
│   ├── tunnel.ts         # Gestion cloudflared
│   ├── cli.ts            # Commandes CLI (agent + test)
│   ├── config.ts         # Configuration agent (auth, backend)
│   ├── configLoader.ts   # Chargement leynai.json
│   └── index.ts          # Point d'entrée
├── bin/
│   └── leynai-agent.js   # CLI entry point
├── dist/                 # Code compilé (TypeScript → JavaScript)
├── package.json
└── tsconfig.json
```

---

## 📚 Documentation complète

- **CI/CD Guide** : `../docs/CLI_CI_CD_GUIDE.md`
- **API Testing** : `../docs/API_TESTING_COMPLETE.md`
- **Quick Start** : `../docs/API_TESTING_QUICK_START.md`

---

## 🆘 Troubleshooting

### Agent ne démarre pas

1. Vérifier que cloudflared est installé : `cloudflared --version`
2. Vérifier l'authentification : `leynai-agent status`
3. Vérifier le backend : `curl http://localhost:4000/api/health`

### Tests CLI échouent

1. Vérifier la configuration : `leynai-agent validate`
2. Vérifier la clé API : `echo $LEYNAI_API_KEY`
3. Vérifier le project ID dans `leynai.json`
4. Vérifier les IDs des tests : `GET /api/cli/tests?projectId=xxx`

---

## 🔗 Liens utiles

- Backend API : http://localhost:4000
- Frontend Dashboard : http://localhost:3000
- Cloudflared : https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

---

## 📦 Build & Publish

```bash
# Build
npm run build

# Publish to npm (si nécessaire)
npm version patch
npm publish

# Ou lien local
npm link
```

---

## 📄 License

MIT
