# Test App - Application Minimale pour Specto

## 🚀 Installation

```bash
cd test-site
npm install
```

## 🎯 Démarrer l'app

```bash
npm start
# Ouvre http://localhost:3001
```

## 🧪 Tester avec Specto

### Étape 1 : Login

```bash
specto-agent login
# Entre ton email et password
```

### Étape 2 : Initialiser

```bash
specto-agent init
# Entre le slug du projet (depuis le dashboard)
# Entre la clé API (créée dans Settings → API Keys)
```

Cela va créer :

- `specto.json` avec ta config
- `playwright.config.ts` automatiquement

### Étape 3 : Démarrer l'agent

```bash
specto-agent start
# L'agent crée un tunnel et écoute les changements
```

### Étape 4 : Lancer les tests

```bash
# Dans un autre terminal
specto-agent test
```

### Étape 5 : Voir les résultats

Ouvre le dashboard Specto : `http://localhost:3000`
Les résultats des tests apparaissent automatiquement !

## 📦 Structure

```
test-site/
├── server.js              # Serveur Express minimal
├── tests/
│   └── app.spec.js        # 3 tests Playwright simples
├── package.json
├── specto.json           # Créé par specto-agent init
└── playwright.config.ts  # Créé par specto-agent init
```

## ✨ Fonctionnalités

- 3 tests simples
- Aucune dépendance de test (Playwright sera installé par Specto)
- App ultra-légère (Express seulement)
