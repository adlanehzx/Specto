# 🎨 Frontend LeynAI - Guide complet

## ✅ État actuel

Le frontend est **100% opérationnel** avec:

- ✅ Next.js 14.2.33
- ✅ React 18.2.0
- ✅ TypeScript 5.3.3
- ✅ Tailwind CSS 3.4.0 (stable)
- ✅ Lucide React 0.548.0
- ✅ Design moderne avec gradients et animations

## 🚀 Démarrage rapide

```powershell
cd apps/frontend
npm run dev
```

Le serveur démarre sur **http://localhost:3001** (ou 3000 si disponible)

## 📦 Technologies

| Package      | Version   | Usage           |
| ------------ | --------- | --------------- |
| Next.js      | 14.2.33   | Framework React |
| React        | 18.2.0    | UI Library      |
| TypeScript   | 5.3.3     | Type safety     |
| Tailwind CSS | **3.4.0** | Styling         |
| Lucide React | 0.548.0   | Icons           |
| PostCSS      | 8.5.6     | CSS processing  |
| Autoprefixer | 10.4.21   | Vendor prefixes |

## 🎨 Design System

Le projet utilise un design system moderne avec:

### Couleurs

- **Gradients de fond:** `from-indigo-50 via-white to-purple-50`
- **Boutons:** `from-blue-600 via-purple-600 to-pink-600`
- **Badges de statut:** Emerald (success), Red (error), Blue (running), etc.

### Composants

- Cards avec `rounded-2xl` et `shadow-xl`
- Boutons avec animations `hover:scale-[1.02]`
- Icônes Lucide colorées et animées
- Loading states avec spinners
- Empty states avec icônes

Voir **DESIGN_SYSTEM.md** pour la documentation complète.

## 📁 Structure

```
apps/frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Page d'accueil
│   │   ├── tests/[id]/
│   │   │   └── page.tsx          # Page de détails
│   │   ├── api/
│   │   │   └── tests/            # Proxy API
│   │   ├── layout.tsx            # Layout principal
│   │   └── globals.css           # Styles Tailwind
│   └── types/
│       └── index.ts              # Types TypeScript
├── tailwind.config.js            # Config Tailwind v3
├── postcss.config.js             # Config PostCSS
├── tsconfig.json                 # Config TypeScript
└── package.json
```

## 🎯 Pages disponibles

### 1. Homepage (`/`)

- Formulaire de création de test (URL + prompt)
- Liste des tests récents
- Navigation vers détails
- Actualisation manuelle

### 2. Test Details (`/tests/[id]`)

- Informations complètes du test
- Code Playwright généré
- Résultats d'exécution
- Screenshots (si disponibles)
- Logs scrollables
- Bouton "Relancer le test"

## 🔧 Problèmes résolus

### ✅ Tailwind CSS ne s'affichait pas

**Cause:** Tailwind n'était pas installé
**Solution:** Installation de Tailwind CSS v3 + configuration complète
**Doc:** TAILWIND_FIX.md

### ✅ Erreur PostCSS "Malformed Configuration"

**Cause:** Conflit entre Tailwind v4 et Next.js 14
**Solution:** Downgrade vers Tailwind v3.4.0 (stable)
**Doc:** POSTCSS_FIX.md

## 📚 Documentation disponible

| Fichier                   | Description                                          |
| ------------------------- | ---------------------------------------------------- |
| **DESIGN_SYSTEM.md**      | Design system complet (composants, couleurs, icônes) |
| **TAILWIND_FIX.md**       | Installation et configuration Tailwind               |
| **POSTCSS_FIX.md**        | Résolution erreur PostCSS                            |
| **TAILWIND_SETUP.md**     | Guide setup détaillé                                 |
| **TAILWIND_CHECKLIST.md** | Checklist de vérification                            |
| **FRONTEND.md**           | Documentation architecture frontend                  |
| **TEST_DETAIL_PAGE.md**   | Doc page de détails                                  |

## 🧪 Scripts disponibles

```json
{
  "dev": "next dev", // Démarrage développement
  "build": "next build", // Build production
  "start": "next start", // Démarrage production
  "lint": "next lint", // Linter
  "type-check": "tsc --noEmit" // Vérification types
}
```

## ⚙️ Configuration

### Tailwind CSS (v3)

```js
// tailwind.config.js
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // ... voir tailwind.config.js
};
```

### PostCSS

```js
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

## 🐛 Troubleshooting

### Le serveur ne démarre pas

```powershell
# Supprimer le cache
Remove-Item -Recurse -Force .next

# Redémarrer
npm run dev
```

### Les styles ne s'affichent pas

1. Vérifier que `globals.css` contient les directives `@tailwind`
2. Vérifier que `layout.tsx` importe `globals.css`
3. Vider le cache du navigateur (Ctrl+F5)
4. Redémarrer le serveur

### Erreur TypeScript

```powershell
npm run type-check
```

### Port déjà utilisé

Next.js choisira automatiquement le port suivant (3001, 3002, etc.)

## 🚀 Build production

```powershell
# Build
npm run build

# Démarrer en production
npm start
```

## 📊 Performances

- ✅ Fast Refresh activé
- ✅ TypeScript strict mode
- ✅ CSS optimisé par Tailwind
- ✅ Code splitting automatique (Next.js)
- ✅ Images optimisées (si utilisées)

## 🎯 Prochaines étapes

- [ ] Ajouter des tests (Jest, React Testing Library)
- [ ] Implémenter l'authentification (NextAuth.js)
- [ ] Ajouter un dark mode
- [ ] Créer des composants réutilisables (UI library)
- [ ] Optimiser les performances
- [ ] Ajouter un système de notifications
- [ ] Implémenter le WebSocket pour les updates temps réel

## 🔗 Liens utiles

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS v3 Docs](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Frontend LeynAI prêt pour le développement!** ✨

Pour démarrer:

```powershell
npm run dev
```

Puis ouvrir **http://localhost:3001** 🚀
