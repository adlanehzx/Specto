# Test App - Application Minimale pour LeynAI

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

## 🧪 Tester avec LeynAI

### Étape 1 : Login

```bash
leynai-agent login
# Entre ton email et password
```

### Étape 2 : Initialiser

```bash
leynai-agent init
# Entre le slug du projet (depuis le dashboard)
# Entre la clé API (créée dans Settings → API Keys)
```

Cela va créer :

- `leynai.json` avec ta config
- `playwright.config.ts` automatiquement

### Étape 3 : Démarrer l'agent

```bash
leynai-agent start
# L'agent crée un tunnel et écoute les changements
```

### Étape 4 : Lancer les tests

```bash
# Dans un autre terminal
leynai-agent test
```

### Étape 5 : Voir les résultats

Ouvre le dashboard LeynAI : `http://localhost:3000`
Les résultats des tests apparaissent automatiquement !

## 📦 Structure

```
test-site/
├── server.js              # Serveur Express minimal
├── tests/
│   └── app.spec.js        # 3 tests Playwright simples
├── package.json
├── leynai.json           # Créé par leynai-agent init
└── playwright.config.ts  # Créé par leynai-agent init
```

## ✨ Fonctionnalités

- 3 tests simples
- Aucune dépendance de test (Playwright sera installé par LeynAI)
- App ultra-légère (Express seulement)
