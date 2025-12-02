# 🎨 LeynAI Design System

## Vue d'ensemble

Design system moderne pour LeynAI utilisant **Tailwind CSS** et **Lucide React Icons**.

---

## 🎯 Principes de design

### 1. **Moderne et épuré**

- Cartes avec ombres douces et borders subtiles
- Coins arrondis (rounded-xl, rounded-2xl)
- Espaces généreux et hiérarchie claire
- Animations fluides et transitions naturelles

### 2. **Gradients vibrants**

- Dégradés de couleurs pour les éléments importants
- Background: `from-indigo-50 via-white to-purple-50`
- Boutons: `from-blue-600 via-purple-600 to-pink-600`
- Icons backgrounds: Gradients thématiques par section

### 3. **Micro-interactions**

- Hover effects sur tous les éléments interactifs
- Transformations au scale (1.02) sur les boutons
- Transitions de couleurs et d'opacité
- Icônes animées (spin, translate, scale)

---

## 🎨 Palette de couleurs

### Couleurs principales

```css
/* Bleus */
Blue 50:  #eff6ff (backgrounds)
Blue 100: #dbeafe (hover states)
Blue 600: #2563eb (primary)
Blue 700: #1d4ed8 (hover)

/* Violets/Pourpres */
Purple 50:  #faf5ff (backgrounds)
Purple 100: #f3e8ff (hover states)
Purple 600: #9333ea (accents)
Purple 700: #7e22ce (hover)

/* Indigo */
Indigo 50:  #eef2ff (backgrounds)
Indigo 500: #6366f1 (icons)

/* Roses/Pinks */
Pink 600: #db2777 (gradients)
Pink 500: #ec4899 (icons)
```

### Couleurs de statut

```javascript
// Réussi
{
  text: "text-emerald-700",
  bg: "bg-emerald-100",
  border: "border-emerald-500",
  icon: <CheckCircle2 />
}

// Échoué
{
  text: "text-red-700",
  bg: "bg-red-100",
  border: "border-red-500",
  icon: <XCircle />
}

// En cours
{
  text: "text-blue-700",
  bg: "bg-blue-100",
  border: "border-blue-500",
  icon: <Loader2 className="animate-spin" />
}

// Erreur
{
  text: "text-orange-700",
  bg: "bg-orange-100",
  border: "border-orange-500",
  icon: <AlertCircle />
}

// En attente
{
  text: "text-gray-700",
  bg: "bg-gray-100",
  border: "border-gray-500",
  icon: <Clock />
}

// Timeout
{
  text: "text-yellow-700",
  bg: "bg-yellow-100",
  border: "border-yellow-500",
  icon: <Clock />
}
```

---

## 🧩 Composants

### 1. **Cartes (Cards)**

```tsx
// Card de base
<div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-shadow duration-300">
  {/* Contenu */}
</div>

// Card avec gradient background
<div className="group border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-purple-300 transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
  {/* Contenu */}
</div>
```

### 2. **Boutons**

```tsx
// Bouton primaire (gradient)
<button className="group w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden">
  <span className="absolute inset-0 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity"></span>
  <span className="relative flex items-center justify-center gap-2">
    <Rocket className="h-5 w-5" />
    Texte du bouton
  </span>
</button>

// Bouton secondaire
<button className="flex items-center gap-2 px-4 py-2.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-all font-medium text-gray-700 hover:shadow-md">
  <RefreshCw className="h-4 w-4" />
  Actualiser
</button>

// Bouton avec état loading
<button disabled={loading}>
  {loading ? (
    <span className="relative flex items-center justify-center gap-2">
      <Loader2 className="h-5 w-5 animate-spin" />
      Chargement...
    </span>
  ) : (
    <span className="relative flex items-center justify-center gap-2">
      <Rocket className="h-5 w-5" />
      Texte normal
    </span>
  )}
</button>
```

### 3. **Inputs et Forms**

```tsx
// Input texte
<input
  type="text"
  className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
  placeholder="Placeholder..."
/>

// Textarea
<textarea
  className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none bg-gray-50 hover:bg-white"
  rows={5}
/>

// Label avec icône
<label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
  <Globe className="h-4 w-4 text-blue-600" />
  Label text
</label>
```

### 4. **Messages et Alertes**

```tsx
// Succès
<div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-lg flex items-start gap-3 shadow-sm">
  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
  <p className="text-emerald-800 font-medium">Message de succès</p>
</div>

// Erreur
<div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3 shadow-sm">
  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
  <p className="text-red-800 font-medium">Message d'erreur</p>
</div>
```

### 5. **Badges de statut**

```tsx
// Badge avec icône
<span className={`px-5 py-2.5 text-sm font-bold rounded-xl flex items-center gap-2 ${badge.bgColor} ${badge.color} shadow-sm`}>
  {badge.icon}
  {badge.label}
</span>

// Badge simple
<span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
  Label
</span>
```

### 6. **Headers de sections**

```tsx
// Header avec icône et gradient background
<div className="flex items-center gap-3 mb-6">
  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
    <Sparkles className="h-6 w-6 text-white" />
  </div>
  <h2 className="text-2xl font-bold text-gray-800">Titre de section</h2>
</div>
```

### 7. **Code blocks**

```tsx
// Code Playwright
<pre className="bg-gray-900 text-gray-100 p-6 rounded-xl overflow-x-auto text-sm leading-relaxed border border-gray-700 shadow-inner">
  {code}
</pre>
```

### 8. **Loading states**

```tsx
// Spinner centré
<div className="text-center py-16">
  <Loader2 className="inline-block h-12 w-12 text-blue-600 animate-spin mb-4" />
  <p className="text-gray-600 font-medium">Chargement...</p>
</div>

// Spinner avec gradient et blur
<div className="relative inline-block">
  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
  <Loader2 className="relative h-16 w-16 text-purple-600 animate-spin" />
</div>
```

### 9. **Empty states**

```tsx
<div className="text-center py-16">
  <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
    <Inbox className="h-10 w-10 text-gray-400" />
  </div>
  <p className="text-lg font-semibold text-gray-700 mb-2">Aucun élément</p>
  <p className="text-sm text-gray-500">Description de l'état vide</p>
</div>
```

---

## 🎭 Icônes Lucide

### Icônes utilisées par catégorie

#### Navigation et Actions

```tsx
import {
  ArrowLeft, // Retour
  ArrowRight, // Suivant/Voir plus
  RefreshCw, // Actualiser/Relancer
  Eye, // Voir
  EyeOff, // Masquer
  ChevronDown, // Expand
  ChevronUp, // Collapse
  ExternalLink, // Lien externe
} from "lucide-react";
```

#### Contenus et Données

```tsx
import {
  Globe, // URL
  FileText, // Description/Documents
  Code2, // Code
  ScrollText, // Logs
  Camera, // Screenshots
  BarChart3, // Résultats/Stats
} from "lucide-react";
```

#### États et Feedback

```tsx
import {
  CheckCircle2, // Succès
  XCircle, // Échec
  AlertCircle, // Erreur/Warning
  Clock, // En attente/Timeout
  Loader2, // Loading (animated)
} from "lucide-react";
```

#### UI et Décoratif

```tsx
import {
  Sparkles, // Logo/Magie/AI
  Rocket, // Lancer/Action
  Inbox, // Empty state
  Calendar, // Date
  Timer, // Durée
} from "lucide-react";
```

### Tailles d'icônes

```tsx
// Petite (labels, inline)
<Icon className="h-3.5 w-3.5" />

// Normale (boutons, badges)
<Icon className="h-4 w-4" />
<Icon className="h-5 w-5" />

// Grande (headers, cards)
<Icon className="h-6 w-6" />

// Extra large (empty states, loading)
<Icon className="h-10 w-10" />
<Icon className="h-12 w-12" />
<Icon className="h-16 w-16" />
```

---

## ✨ Animations et Transitions

### Transitions de base

```css
/* Toutes les propriétés */
transition-all

/* Opacité uniquement */
transition-opacity

/* Couleurs */
transition-colors

/* Ombres */
transition-shadow

/* Transformations */
transition-transform

/* Durées */
duration-200
duration-300
duration-500
```

### Transformations

```css
/* Hover scale */
hover:scale-[1.02]
active:scale-[0.98]

/* Translate */
hover:translate-x-1
hover:-translate-x-1

/* Group hover */
group-hover:opacity-100
group-hover:scale-110
```

### Animations Tailwind

```css
/* Spin (loading) */
animate-spin

/* Pulse (attention) */
animate-pulse

/* Fade in */
animate-in fade-in
```

---

## 📐 Spacing et Layout

### Padding et Margin

```css
/* Cards */
p-6   /* Petites cards */
p-8   /* Cards standards */

/* Sections */
py-8  /* Vertical padding page */
py-16 /* Empty states */

/* Gaps */
gap-2  /* Petits éléments */
gap-3  /* Éléments moyens */
gap-6  /* Sections */
```

### Responsive

```css
/* Mobile first */
px-4 sm:px-6 lg:px-8

/* Grid */
grid md:grid-cols-2 gap-6

/* Flex wrap */
flex-wrap
```

---

## 🎯 Exemples d'utilisation

### Page complète

```tsx
<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
  <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
    {/* Header */}
    <header className="mb-12 text-center">
      <div className="inline-flex items-center justify-center mb-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <Sparkles className="relative h-16 w-16 text-purple-600" />
        </div>
      </div>
      <h1 className="text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
        LeynAI
      </h1>
      <p className="text-gray-600 text-lg">Description</p>
    </header>

    {/* Content cards */}
    <div className="grid gap-6">
      {/* Card 1 */}
      {/* Card 2 */}
    </div>
  </div>
</div>
```

### Card interactive

```tsx
<div className="group border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-purple-300 transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
  <div className="flex items-center gap-3 mb-3">
    <Globe className="h-5 w-5 text-blue-600 flex-shrink-0" />
    <h3 className="font-semibold text-gray-800">Titre</h3>
    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1.5">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Réussi
    </span>
  </div>
  <p className="text-sm text-gray-600">Description</p>
</div>
```

---

## 📦 Installation

```bash
# Lucide React (déjà installé)
npm install lucide-react

# Tailwind CSS (déjà configuré)
# voir tailwind.config.js
```

---

## 🎨 Configuration Tailwind

Vérifier que `tailwind.config.js` contient:

```js
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      // Extensions personnalisées si besoin
    },
  },
  plugins: [],
};
```

---

## ✅ Checklist Design

- [x] Lucide React installé
- [x] Tailwind CSS configuré
- [x] Gradients cohérents
- [x] Icônes sur tous les éléments importants
- [x] Hover states partout
- [x] Loading states avec spinners
- [x] Empty states avec icônes
- [x] Messages d'erreur/succès stylés
- [x] Badges de statut avec icônes
- [x] Transitions fluides
- [x] Responsive design
- [x] Accessibilité (aria-labels recommandés)

---

## 🚀 Prochaines améliorations

1. **Dark mode** - Ajouter un toggle et gérer `dark:` classes
2. **Animations avancées** - Utiliser Framer Motion
3. **Components library** - Extraire dans un dossier `components/ui/`
4. **Storybook** - Documenter les composants visuellement
5. **Accessibility** - Ajouter ARIA labels et keyboard navigation
6. **Custom Tailwind plugin** - Pour des utilities personnalisées

---

**Design moderne et cohérent avec Tailwind CSS + Lucide React!** 🎨✨
