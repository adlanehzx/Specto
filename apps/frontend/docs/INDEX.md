# 📚 Index de la documentation Frontend

## 📖 Documents disponibles

### Guide principal

- **[FRONTEND.md](FRONTEND.md)** - Guide complet du frontend
- **[FRONTEND_SUMMARY.md](FRONTEND_SUMMARY.md)** - Résumé

### Design System

- **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** - Système de design

### Tailwind CSS

- **[TAILWIND_SETUP.md](TAILWIND_SETUP.md)** - Configuration Tailwind
- **[TAILWIND_FIX.md](TAILWIND_FIX.md)** - Corrections Tailwind
- **[TAILWIND_CHECKLIST.md](TAILWIND_CHECKLIST.md)** - Checklist

### PostCSS

- **[POSTCSS_FIX.md](POSTCSS_FIX.md)** - Corrections PostCSS

### Pages & Features

- **[TEST_DETAIL_PAGE.md](TEST_DETAIL_PAGE.md)** - Page détails test
- **[TEST_DETAIL_SUMMARY.md](TEST_DETAIL_SUMMARY.md)** - Résumé

### Corrections rapides

- **[QUICK_FIX_SUMMARY.md](QUICK_FIX_SUMMARY.md)** - Résumé des corrections

## 🗂️ Organisation Frontend

```
apps/frontend/
├── docs/              # 📚 Cette documentation
├── src/
│   ├── app/           # App Router Next.js 14
│   │   ├── page.tsx   # Page d'accueil
│   │   ├── tests/     # Pages tests
│   │   └── api/       # API Routes (proxy vers backend)
│   ├── components/    # Composants React
│   └── types/         # Types TypeScript
├── public/            # Assets statiques
└── Dockerfile
```

## 🚀 Démarrage rapide

```bash
# Installation
npm install

# Variables d'environnement
cp .env.local.example .env.local

# Démarrer en dev
npm run dev
```

## 🎨 Stack technique

- **Framework** : Next.js 14 App Router
- **Styling** : Tailwind CSS
- **TypeScript** : Types stricts
- **API** : Proxy vers backend via API Routes

---

Retour au [README principal](../../../README.md)
