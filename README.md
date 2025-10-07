# LeynAI - Automated Testing Platform (E2E + API)

LeynAI est une plateforme de tests automatisés intelligente qui utilise l'IA pour générer et exécuter des tests **Playwright (E2E)** et **API (REST)** basés sur des descriptions en langage naturel.

---

## 👥 For Users: Integrate LeynAI in Your Projects

**Want to use LeynAI for your own project's testing?**

### 🚀 Quick Setup (5 minutes)

1. 📖 Read the [**Quick Start Guide**](CICD_QUICKSTART.md) ⭐
2. 📋 Copy [CI/CD templates](examples/ci-cd/) to your repository
3. 🔑 Configure your API key and Project ID (from dashboard)
4. 🚀 Push and watch your tests run automatically!

### 📚 Documentation

| Doc                                                         | Description                              |
| ----------------------------------------------------------- | ---------------------------------------- |
| [**CICD_QUICKSTART.md**](CICD_QUICKSTART.md) ⭐             | **Start here** - 4 steps to integrate    |
| [HOW_TESTS_ARE_EXECUTED.md](docs/HOW_TESTS_ARE_EXECUTED.md) | Technical deep-dive                      |
| [CI_CD_INTEGRATION.md](docs/CI_CD_INTEGRATION.md)           | Complete guide (GitHub, GitLab, Jenkins) |
| [examples/ci-cd/](examples/ci-cd/)                          | Ready-to-copy templates                  |

---

## ✨ Fonctionnalités Principales

### 🌐 Tests E2E (Playwright)

Tests d'interface utilisateur automatisés avec navigation web, interactions et screenshots.

### 🔌 Tests API (REST) **NOUVEAU**

Tests d'APIs REST automatisés avec support complet :

- **Méthodes HTTP** : GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- **Authentification** : Bearer, Basic, API Key, OAuth2
- **Assertions avancées** : Status code, response time, headers, JSON path, schema validation
- **Génération IA** : Créez des tests à partir de descriptions naturelles
- **Import cURL** : Convertissez vos commandes cURL en tests
- **Monitoring** : Temps de réponse, taux de succès, historique complet

## 🔥 Fonctionnalités Avancées

### 🔧 Auto-Healing (Correction Automatique)

Corrige automatiquement les tests qui échouent grâce à l'IA (GPT-4).

- Détection intelligente du type d'erreur (selector, timeout, assertion, etc.)
- Génération de code corrigé avec validation
- Historique des tentatives de correction
- **[Documentation complète](docs/AUTO_HEALING_COMPLETE.md)**

### 🔍 Flakiness Detection (Détection d'Instabilité)

Identifie automatiquement les tests instables (flaky) et génère des recommandations.

- Scoring de fiabilité (0-100%) avec 4 niveaux de sévérité
- Détection de 6 types de patterns d'erreurs
- Recommandations intelligentes pour stabiliser les tests
- Visualisation avec jauge circulaire animée
- **[Documentation complète](docs/FLAKINESS_DETECTION_COMPLETE.md)**

### 🔄 Retry Mechanism (Mécanisme de Retry)

Réexécute automatiquement les tests échoués avec délai exponentiel.

- Configurable : max retries + délai
- Tracking des tentatives dans l'interface
- Indicateur visuel des tests réussis après retry

### 📊 Assertions Visuelles

Valide automatiquement le contenu des pages testées.

- Vérification de texte, visibilité, attributs
- Résultats détaillés avec valeurs attendues/obtenues
- Affichage dans l'interface avec icônes ✓/✗

## 🚀 Démarrage rapide

### Option 1 : Docker (Recommandé)

```bash
# Copier les variables d'environnement
cp .env.example .env

# Lancer tous les services
docker compose up -d

# Voir les logs
docker compose logs -f
```

📖 **Guide complet** : [docs/DOCKER.md](docs/DOCKER.md)  
⚡ **Démarrage rapide** : [docs/QUICK_START_DOCKER.md](docs/QUICK_START_DOCKER.md)

### Option 2 : Développement local

```bash
# Installer les dépendances
npm install

# Backend
cd apps/backend
npm run dev

# Frontend (dans un autre terminal)
cd apps/frontend
npm run dev
```

## 📁 Structure du projet

```
LeynAI/
├── apps/
│   ├── backend/          # API Node.js + Express + Prisma + Playwright
│   └── frontend/         # Interface Next.js 14 App Router
├── docs/                 # 📚 Documentation complète
│   ├── DOCKER.md         # Guide Docker complet (2600+ lignes)
│   ├── QUICK_START_DOCKER.md
│   ├── DOCKER_SUMMARY.md
│   └── DOCKER_SUCCESS.md
├── scripts/              # 🛠️ Scripts d'automatisation
│   ├── start-docker.sh
│   ├── start-docker.ps1
│   ├── check-docker-prereqs.sh
│   ├── check-docker-prereqs.ps1
│   └── Makefile
├── docker-compose.yml    # Orchestration Docker (6 services)
├── .env.example          # Template des variables d'environnement
└── README.md             # Ce fichier
```

## 🐳 Services Docker

| Service        | Port      | Description                  |
| -------------- | --------- | ---------------------------- |
| **Frontend**   | 3000      | Interface Next.js            |
| **Backend**    | 4000      | API Node.js + Worker BullMQ  |
| **PostgreSQL** | 5432      | Base de données              |
| **Redis**      | 6379      | Queue pour BullMQ            |
| **MinIO**      | 9000/9001 | Stockage S3 pour screenshots |

## 🔧 Commandes utiles

### Docker

```bash
# Démarrer
docker compose up -d

# Arrêter
docker compose down

# Voir les logs
docker compose logs -f backend

# Rebuild un service
docker compose up -d --build backend

# Status
docker compose ps
```

### Scripts automatisés

```bash
# Windows
.\scripts\start-docker.ps1

# Linux/Mac
./scripts/start-docker.sh

# Avec Make
cd scripts && make up
cd scripts && make logs
```

## 🌐 URLs

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:4000
- **API Health** : http://localhost:4000/health
- **API Tests** : http://localhost:3000/api-tests (nouveau)
- **MinIO Console** : http://localhost:9001 (minioadmin / minioadmin123)

## 📚 Documentation

| Document                                            | Description                               |
| --------------------------------------------------- | ----------------------------------------- |
| [DOCKER.md](docs/DOCKER.md)                         | Guide complet Docker avec troubleshooting |
| [QUICK_START_DOCKER.md](docs/QUICK_START_DOCKER.md) | Démarrage rapide en 3 étapes              |
| [DOCKER_SUMMARY.md](docs/DOCKER_SUMMARY.md)         | Architecture et résumé visuel             |
| [DOCKER_SUCCESS.md](docs/DOCKER_SUCCESS.md)         | Corrections appliquées et validation      |
| **[CICD_QUICKSTART.md](CICD_QUICKSTART.md)** ⭐     | **Intégrer LeynAI dans votre CI/CD**      |
| [CI_CD_INTEGRATION.md](docs/CI_CD_INTEGRATION.md)   | Guide détaillé CI/CD (GitHub, GitLab)     |
| [examples/ci-cd/](examples/ci-cd/)                  | Templates CI/CD prêts à copier            |

## 🛠️ Technologies

- **Frontend** : Next.js 14, React, TypeScript, Tailwind CSS
- **Backend** : Node.js, Express, TypeScript, Prisma ORM
- **Testing E2E** : Playwright, Chromium
- **Testing API** : Axios (nouveau)
- **Queue** : BullMQ + Redis
- **Database** : PostgreSQL 16
- **Storage** : MinIO (S3-compatible)
- **AI** : OpenAI GPT-4 (génération de tests E2E + API)

## 🔐 Sécurité

⚠️ **Avant la production** :

1. Changez tous les mots de passe dans `.env`
2. Configurez HTTPS avec un reverse proxy (Nginx)
3. Utilisez des secrets sécurisés
4. Activez les sauvegardes PostgreSQL

Voir [docs/DOCKER.md#production](docs/DOCKER.md#production) pour le guide complet.

## 📝 Licence

MIT

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez ouvrir une issue ou une pull request.

---

**Status** : ✅ Production Ready  
**Dernière mise à jour** : 30 octobre 2025
