"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePreferencesStore } from "@/stores/usePreferences";

type Locale = "en" | "fr";

interface TranslationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined
);

// Inline translations
const translations: Record<Locale, Record<string, any>> = {
  en: {
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      create: "Create",
      close: "Close",
      confirm: "Confirm",
      back: "Back",
      next: "Next",
      previous: "Previous",
      search: "Search",
      filter: "Filter",
      export: "Export",
      import: "Import",
    },
    navigation: {
      dashboard: "Dashboard",
      history: "History",
      apiTests: "API Tests",
      smokeTests: "Smoke Tests",
      unitTests: "Unit Tests",
      performanceTests: "Performance Tests",
      securityTests: "Security Tests",
      scheduled: "Scheduled",
      analytics: "Analytics",
      notifications: "Notifications",
      tunnels: "Tunnels",
      settings: "Settings",
      projects: "Projects",
      logout: "Logout",
    },
    auth: {
      login: {
        title: "Welcome back!",
        subtitle: "Sign in to access your tests",
        email: "Email",
        password: "Password",
        submit: "Sign in",
        continueWithGitHub: "Continue with GitHub",
        continueWithGoogle: "Continue with Google",
        continueWithSlack: "Continue with Slack",
        or: "Or",
        noAccount: "Don't have an account?",
        signUp: "Sign up",
        backToHome: "Back to home",
      },
      register: {
        title: "Create an account",
        subtitle: "Start automating your tests today",
        email: "Email",
        password: "Password",
        confirmPassword: "Confirm password",
        passwordHint: "Minimum 6 characters",
        passwordMatch: "Passwords match",
        submit: "Create my account",
        hasAccount: "Already have an account?",
        signIn: "Sign in",
        backToHome: "Back to home",
      },
    },
    settings: {
      title: "Settings",
      saving: "Saving...",
      saved: "Saved",
      profile: {
        title: "Profile",
        email: "Email",
        userId: "User ID",
      },
      preferences: {
        title: "Preferences",
        language: {
          label: "Language",
          english: "English",
          french: "French",
        },
        timezone: {
          label: "Timezone",
          placeholder: "Select timezone...",
          autoDetected: "✓ Automatically detected from your browser",
        },
        theme: {
          label: "Theme",
          light: "☀️ Light",
          dark: "🌙 Dark",
          auto: "🌗 Auto (System)",
          autoHint: "Follows your system preference",
          lightHint: "Always use light mode",
          darkHint: "Always use dark mode",
        },
        notifications: {
          title: "Notification Settings",
          email: "Email notifications",
          slack: "Slack notifications",
          ui: "In-app notifications",
        },
      },
      saveButton: "Save Settings",
      successMessage: "Settings saved successfully!",
      errorMessage: "Failed to save settings",
    },
    notifications: {
      title: "Notifications",
      empty: "No notifications",
      markAllRead: "Mark all as read",
      markRead: "Mark as read",
      previous: "Previous",
      next: "Next",
      types: {
        info: "Info",
        success: "Success",
        warning: "Warning",
        error: "Error",
      },
    },
    dashboard: {
      title: "Dashboard",
      createTest: "Create Test",
      launchTest: "Launch Test",
      scheduleTest: "Schedule Test",
      testUrl: "Test URL",
      testName: "Test Name",
      selectProject: "Select Project",
      description: "Description",
      retrySettings: "Retry Settings",
      autoHealing: "Auto-Healing",
      maxRetries: "Max Retries",
      retryDelay: "Delay between retries",
      enableAutoHealing: "Enable Auto-Healing",
    },
    history: {
      title: "Test History",
      subtitle: "View and manage all your executed tests",
      totalTests: "Total Tests",
      passed: "Passed",
      failed: "Failed",
      pending: "Pending",
      filterByStatus: "Filter by status:",
      all: "All",
      viewDetails: "View Details",
      delete: "Delete",
      confirmDelete: "Are you sure you want to delete this test?",
      noTests: "No tests found",
      retry: "Retry",
    },
    projects: {
      title: "Projects",
      createProject: "Create Project",
      editProject: "Edit Project",
      deleteProject: "Delete Project",
      projectName: "Project Name",
      projectDescription: "Description",
      members: "Members",
      tests: "Tests",
      noProjects: "No projects yet",
      createFirst: "Create your first project",
    },
    scheduled: {
      title: "Scheduled Tests",
      subtitle: "Manage your automated test executions",
      createSchedule: "Create Schedule",
      viewHistory: "View History",
      noScheduled: "No scheduled tests",
      noScheduledYet: "No scheduled tests yet",
      getStarted:
        "Get started by creating a new test or re-running an existing one from your history",
      browseHistory: "Browse History",
      createNewTest: "Create New Test",
      quickTip: "Quick Tip",
      tipContent:
        "Schedule tests to run automatically at regular intervals. Perfect for continuous monitoring of your applications!",
      totalScheduled: "Total Scheduled",
      active: "Active",
      paused: "Paused",
      frequencies: "Frequencies",
      test: "Test",
      status: "Status",
      frequency: "Frequency",
      nextRun: "Next Run",
      lastRun: "Last Run",
      lastResult: "Last Result",
      actions: "Actions",
    },
    analytics: {
      title: "Analytics",
      subtitle: "Monitor your test performance and metrics",
      totalTests: "Total Tests",
      successRate: "Success Rate",
      testsRun: "Tests Run",
      avgDuration: "Avg Duration",
      testsTimeline: "Tests Timeline (Last 30 Days)",
      statusBreakdown: "Test Status Breakdown",
      avgTestDuration: "Average Test Duration (Last 30 Days)",
      recentTests: "Recent Tests",
      url: "URL",
      prompt: "Prompt",
      status: "Status",
      duration: "Duration",
      created: "Created",
      testsCreated: "Tests Created",
      loadingAnalytics: "Loading analytics...",
      noDataAvailable: "No data available",
    },
    tunnels: {
      title: "Tunnels",
      createTunnel: "Create Tunnel",
      activeTunnels: "Active Tunnels",
      inactiveTunnels: "Inactive Tunnels",
      noTunnels: "No tunnels",
      quickTip: "Quick Tip",
      tipContent: "Use Cloudflare tunnels to test local applications securely.",
    },
    landing: {
      hero: {
        title: "Smart Automated Testing for the Modern Web",
        subtitle:
          "Generate and run Playwright tests with AI. Test your web applications in seconds, without writing a single line of code.",
        cta: "Get Started",
        login: "Sign In",
      },
      features: {
        title: "Why LeynAI?",
        ai: {
          title: "AI-Powered",
          description: "Generate tests automatically from natural language",
        },
        retry: {
          title: "Smart Retries",
          description: "Automatic retry logic with configurable delays",
        },
        healing: {
          title: "Auto-Healing",
          description: "Tests that fix themselves when elements change",
        },
      },
      howItWorks: {
        title: "How it Works",
        step1: {
          title: "Create a test",
          description: "Describe what you want to test in natural language",
        },
        step2: {
          title: "Run it",
          description: "Execute tests immediately or schedule them",
        },
        step3: {
          title: "View results",
          description: "See results, screenshots, and logs in real-time",
        },
      },
      cta: {
        title: "Ready to automate your tests?",
        subtitleLoggedIn: "Return to your dashboard to create new tests.",
        subtitleLoggedOut: "Join LeynAI today and start testing smarter.",
        buttonLoggedIn: "Go to Dashboard",
        buttonLoggedOut: "Create a free account",
      },
      footer: {
        tagline: "Smart automated testing for the modern web",
        copyright: "© 2025 LeynAI. All rights reserved.",
      },
    },
  },
  fr: {
    common: {
      save: "Enregistrer",
      cancel: "Annuler",
      delete: "Supprimer",
      edit: "Modifier",
      loading: "Chargement...",
      error: "Erreur",
      success: "Succès",
      create: "Créer",
      close: "Fermer",
      confirm: "Confirmer",
      back: "Retour",
      next: "Suivant",
      previous: "Précédent",
      search: "Rechercher",
      filter: "Filtrer",
      export: "Exporter",
      import: "Importer",
    },
    navigation: {
      dashboard: "Tableau de bord",
      history: "Historique",
      apiTests: "Tests API",
      smokeTests: "Tests Smoke",
      unitTests: "Tests Unitaires",
      performanceTests: "Tests de Performance",
      securityTests: "Tests de Sécurité",
      scheduled: "Planifiés",
      analytics: "Analytiques",
      notifications: "Notifications",
      tunnels: "Tunnels",
      settings: "Paramètres",
      projects: "Projets",
      logout: "Déconnexion",
    },
    auth: {
      login: {
        title: "Bon retour !",
        subtitle: "Connectez-vous pour accéder à vos tests",
        email: "Email",
        password: "Mot de passe",
        submit: "Se connecter",
        continueWithGitHub: "Continuer avec GitHub",
        continueWithGoogle: "Continuer avec Google",
        continueWithSlack: "Continuer avec Slack",
        or: "Ou",
        noAccount: "Pas encore de compte ?",
        signUp: "S'inscrire",
        backToHome: "Retour à l'accueil",
      },
      register: {
        title: "Créer un compte",
        subtitle: "Commencez à automatiser vos tests aujourd'hui",
        email: "Email",
        password: "Mot de passe",
        confirmPassword: "Confirmer le mot de passe",
        passwordHint: "Minimum 6 caractères",
        passwordMatch: "Les mots de passe correspondent",
        submit: "Créer mon compte",
        hasAccount: "Déjà un compte ?",
        signIn: "Se connecter",
        backToHome: "Retour à l'accueil",
      },
    },
    settings: {
      title: "Paramètres",
      saving: "Enregistrement...",
      saved: "Enregistré",
      profile: {
        title: "Profil",
        email: "Email",
        userId: "ID Utilisateur",
      },
      preferences: {
        title: "Préférences",
        language: {
          label: "Langue",
          english: "Anglais",
          french: "Français",
        },
        timezone: {
          label: "Fuseau horaire",
          placeholder: "Sélectionnez un fuseau horaire...",
          autoDetected: "✓ Détecté automatiquement depuis votre navigateur",
        },
        theme: {
          label: "Thème",
          light: "☀️ Clair",
          dark: "🌙 Sombre",
          auto: "🌗 Auto (Système)",
          autoHint: "Suit les préférences de votre système",
          lightHint: "Toujours utiliser le mode clair",
          darkHint: "Toujours utiliser le mode sombre",
        },
        notifications: {
          title: "Paramètres de notification",
          email: "Notifications par email",
          slack: "Notifications Slack",
          ui: "Notifications dans l'application",
        },
      },
      saveButton: "Enregistrer les paramètres",
      successMessage: "Paramètres enregistrés avec succès !",
      errorMessage: "Échec de l'enregistrement des paramètres",
    },
    notifications: {
      title: "Notifications",
      empty: "Aucune notification",
      markAllRead: "Tout marquer comme lu",
      markRead: "Marquer comme lu",
      previous: "Précédent",
      next: "Suivant",
      types: {
        info: "Info",
        success: "Succès",
        warning: "Avertissement",
        error: "Erreur",
      },
    },
    dashboard: {
      title: "Tableau de bord",
      createTest: "Créer un test",
      launchTest: "Lancer le test",
      scheduleTest: "Planifier le test",
      testUrl: "URL du test",
      testName: "Nom du test",
      selectProject: "Sélectionner un projet",
      description: "Description",
      retrySettings: "Paramètres de retry",
      autoHealing: "Auto-Healing",
      maxRetries: "Nombre max de retries",
      retryDelay: "Délai entre retries",
      enableAutoHealing: "Activer l'Auto-Healing",
    },
    history: {
      title: "Historique des tests",
      subtitle: "Voir et gérer tous vos tests exécutés",
      totalTests: "Total des tests",
      passed: "Réussis",
      failed: "Échoués",
      pending: "En attente",
      filterByStatus: "Filtrer par statut :",
      all: "Tous",
      viewDetails: "Voir les détails",
      delete: "Supprimer",
      confirmDelete: "Êtes-vous sûr de vouloir supprimer ce test ?",
      noTests: "Aucun test trouvé",
      retry: "Réessayer",
    },
    projects: {
      title: "Projets",
      createProject: "Créer un projet",
      editProject: "Modifier le projet",
      deleteProject: "Supprimer le projet",
      projectName: "Nom du projet",
      projectDescription: "Description",
      members: "Membres",
      tests: "Tests",
      noProjects: "Aucun projet",
      createFirst: "Créez votre premier projet",
    },
    scheduled: {
      title: "Tests planifiés",
      subtitle: "Gérez vos exécutions de tests automatisées",
      createSchedule: "Créer une planification",
      viewHistory: "Voir l'historique",
      noScheduled: "Aucun test planifié",
      noScheduledYet: "Aucun test planifié pour le moment",
      getStarted:
        "Commencez par créer un nouveau test ou réexécuter un test existant depuis votre historique",
      browseHistory: "Parcourir l'historique",
      createNewTest: "Créer un nouveau test",
      quickTip: "💡 Astuce",
      tipContent:
        "Planifiez des tests pour qu'ils s'exécutent automatiquement à intervalles réguliers. Parfait pour surveiller en continu vos applications !",
      totalScheduled: "Total planifiés",
      active: "Actifs",
      paused: "En pause",
      frequencies: "Fréquences",
      test: "Test",
      status: "Statut",
      frequency: "Fréquence",
      nextRun: "Prochaine exécution",
      lastRun: "Dernière exécution",
      lastResult: "Dernier résultat",
      actions: "Actions",
    },
    analytics: {
      title: "Analytiques",
      subtitle: "Surveillez les performances et les métriques de vos tests",
      totalTests: "Total des tests",
      successRate: "Taux de réussite",
      testsRun: "Tests exécutés",
      avgDuration: "Durée moy.",
      testsTimeline: "Chronologie des tests (30 derniers jours)",
      statusBreakdown: "Répartition par statut",
      avgTestDuration: "Durée moyenne des tests (30 derniers jours)",
      recentTests: "Tests récents",
      url: "URL",
      prompt: "Prompt",
      status: "Statut",
      duration: "Durée",
      created: "Créé",
      testsCreated: "Tests créés",
      loadingAnalytics: "Chargement des analytiques...",
      noDataAvailable: "Aucune donnée disponible",
    },
    tunnels: {
      title: "Tunnels",
      createTunnel: "Créer un tunnel",
      activeTunnels: "Tunnels actifs",
      inactiveTunnels: "Tunnels inactifs",
      noTunnels: "Aucun tunnel",
      quickTip: "💡 Astuce",
      tipContent:
        "Utilisez les tunnels Cloudflare pour tester des applications locales en toute sécurité.",
    },
    landing: {
      hero: {
        title: "Tests automatisés intelligents pour le web moderne",
        subtitle:
          "Générez et exécutez des tests Playwright avec l'IA. Testez vos applications web en quelques secondes, sans écrire une ligne de code.",
        cta: "Commencer",
        login: "Se connecter",
      },
      features: {
        title: "Pourquoi LeynAI ?",
        ai: {
          title: "IA intégrée",
          description: "Générez des tests automatiquement en langage naturel",
        },
        retry: {
          title: "Retries intelligents",
          description: "Logique de retry automatique avec délais configurables",
        },
        healing: {
          title: "Auto-Healing",
          description: "Des tests qui se réparent quand les éléments changent",
        },
      },
      howItWorks: {
        title: "Comment ça marche",
        step1: {
          title: "Créez un test",
          description: "Décrivez ce que vous voulez tester en langage naturel",
        },
        step2: {
          title: "Exécutez-le",
          description: "Lancez les tests immédiatement ou planifiez-les",
        },
        step3: {
          title: "Consultez les résultats",
          description:
            "Visualisez les résultats, screenshots et logs en temps réel",
        },
      },
      cta: {
        title: "Prêt à automatiser vos tests ?",
        subtitleLoggedIn:
          "Retournez à votre dashboard pour créer de nouveaux tests.",
        subtitleLoggedOut:
          "Rejoignez LeynAI aujourd'hui et commencez à tester plus intelligemment.",
        buttonLoggedIn: "Accéder au Dashboard",
        buttonLoggedOut: "Créer un compte gratuit",
      },
      footer: {
        tagline: "Tests automatisés intelligents pour le web moderne",
        copyright: "© 2025 LeynAI. Tous droits réservés.",
      },
    },
  },
};

export function TranslationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { preferences } = usePreferencesStore();
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  // Sync with user preferences
  useEffect(() => {
    setMounted(true);

    // If user preferences are loaded, use them
    if (preferences?.language) {
      console.log(
        "[Translation] Loading language from preferences:",
        preferences.language
      );
      setLocaleState(preferences.language);
    } else {
      // Fallback to localStorage
      const savedLocale = localStorage.getItem("locale") as Locale;
      console.log(
        "[Translation] Loading language from localStorage:",
        savedLocale
      );
      if (savedLocale === "en" || savedLocale === "fr") {
        setLocaleState(savedLocale);
      }
    }
  }, [preferences]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (mounted) {
      localStorage.setItem("locale", newLocale);
    }
  };

  const t = (key: string): string => {
    if (!mounted) {
      console.log("[Translation] Not mounted yet, returning key:", key);
      return key;
    }

    console.log(`[Translation] Translating "${key}" with locale "${locale}"`);
    const keys = key.split(".");
    let value: any = translations[locale];

    for (const k of keys) {
      if (value && typeof value === "object") {
        value = value[k];
      } else {
        console.log(`[Translation] Key not found: ${key}`);
        return key;
      }
    }

    const result = typeof value === "string" ? value : key;
    console.log(`[Translation] Result: "${result}"`);
    return result;
  };

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}
