# 🎨 Tailwind CSS Setup - LeynAI Frontend

## ✅ Installation complète

Tailwind CSS est maintenant correctement configuré dans le projet!

---

## 📦 Packages installés

```json
{
  "devDependencies": {
    "tailwindcss": "^3.x",
    "postcss": "^8.x",
    "autoprefixer": "^10.x"
  }
}
```

---

## 📁 Fichiers de configuration

### 1. `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        spin: "spin 1s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
```

### 2. `postcss.config.js`

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 3. `src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  line-height: 1.6;
}
```

### 4. `.vscode/settings.json`

```json
{
  "css.validate": false,
  "less.validate": false,
  "scss.validate": false
}
```

Ce fichier désactive les warnings CSS dans VS Code pour les directives `@tailwind`.

---

## 🚀 Démarrage

```powershell
# Depuis le dossier frontend
cd apps/frontend

# Démarrer le serveur de développement
npm run dev
```

Le serveur démarre sur **http://localhost:3000**

---

## ✅ Vérification

### 1. Vérifier que Tailwind fonctionne

Ouvrez http://localhost:3000 dans votre navigateur.

Vous devriez voir:

- ✅ Gradients de couleurs
- ✅ Ombres et borders
- ✅ Coins arrondis
- ✅ Hover effects
- ✅ Animations (spinner, pulse)

### 2. Inspecter dans DevTools

Ouvrez les DevTools (F12) et inspectez un élément. Vous devriez voir des classes comme:

- `bg-gradient-to-br`
- `from-indigo-50`
- `rounded-2xl`
- `shadow-xl`
- etc.

### 3. Vérifier la console

Dans la console du terminal où `npm run dev` tourne, vous devriez voir:

```
✓ Ready in Xms
○ Local:        http://localhost:3000
○ Compiling /...
✓ Compiled in Xms
```

**AUCUNE erreur Tailwind ne devrait apparaître!**

---

## 🐛 Troubleshooting

### Problème: "Les styles ne s'affichent pas"

**Solutions:**

1. **Redémarrer le serveur Next.js**

   ```powershell
   # Ctrl+C pour arrêter
   npm run dev
   ```

2. **Vider le cache Next.js**

   ```powershell
   rm -rf .next
   npm run dev
   ```

3. **Vérifier que globals.css est importé**

   - Ouvrir `src/app/layout.tsx`
   - Vérifier la ligne: `import "./globals.css";`

4. **Vérifier les fichiers de config**
   - `tailwind.config.js` existe
   - `postcss.config.js` existe
   - `globals.css` contient les directives `@tailwind`

### Problème: "Erreur @tailwind unknown at rule"

C'est normal! C'est juste VS Code qui ne reconnaît pas la directive.

**Solution:** Installer l'extension "Tailwind CSS IntelliSense"

- ID: `bradlc.vscode-tailwindcss`
- Ou créer `.vscode/settings.json` (déjà fait)

### Problème: "Module not found: Can't resolve 'tailwindcss'"

**Solution:**

```powershell
npm install -D tailwindcss postcss autoprefixer
```

---

## 🎨 Classes Tailwind utilisées

### Couleurs et Gradients

```
bg-gradient-to-br from-indigo-50 via-white to-purple-50
bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600
text-emerald-700 bg-emerald-100
```

### Layout

```
min-h-screen max-w-6xl mx-auto
px-4 py-8 sm:px-6 lg:px-8
grid gap-6 md:grid-cols-2
flex items-center justify-between
```

### Spacing

```
p-4 p-6 p-8
mb-4 mb-6 mb-12
gap-2 gap-3 gap-6
```

### Borders et Coins

```
rounded-lg rounded-xl rounded-2xl
border border-gray-200 border-l-4 border-emerald-500
```

### Ombres

```
shadow-sm shadow-md shadow-lg shadow-xl shadow-2xl
```

### Typography

```
text-sm text-lg text-2xl text-4xl text-6xl
font-medium font-semibold font-bold font-black
text-gray-600 text-gray-800
```

### Hover et States

```
hover:bg-gray-200
hover:shadow-lg
hover:scale-[1.02]
disabled:opacity-50
group-hover:opacity-100
```

### Animations

```
animate-spin
animate-pulse
transition-all transition-colors transition-shadow
duration-200 duration-300
```

---

## 📚 Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com/components)
- [Tailwind Play (Playground)](https://play.tailwindcss.com/)
- [Lucide React Icons](https://lucide.dev/)

---

## 🎯 Next Steps

1. **Installer Tailwind CSS IntelliSense** (VS Code extension)

   - Autocomplétion des classes
   - Preview des couleurs
   - Suggestions intelligentes

2. **Créer des composants réutilisables**

   ```tsx
   // src/components/ui/Button.tsx
   // src/components/ui/Card.tsx
   // src/components/ui/Badge.tsx
   ```

3. **Ajouter un dark mode**

   ```js
   // tailwind.config.js
   module.exports = {
     darkMode: "class",
     // ...
   };
   ```

4. **Custom utilities** (si besoin)
   ```css
   @layer utilities {
     .text-gradient {
       @apply bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent;
     }
   }
   ```

---

**Tailwind CSS est maintenant opérationnel!** 🎨✨

Pour démarrer:

```powershell
npm run dev
```

Puis ouvrir http://localhost:3000
