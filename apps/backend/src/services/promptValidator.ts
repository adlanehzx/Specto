/**
 * Service de validation et amélioration des prompts utilisateur
 *
 * Analyse la qualité des prompts avant génération de tests E2E
 * pour éviter les requêtes inutiles et améliorer la pertinence des tests
 */

import OpenAI from "openai";

/**
 * Résultat de la validation d'un prompt
 */
export interface PromptValidationResult {
  /** Le prompt est-il valide et exploitable ? */
  valid: boolean;
  /** Score de clarté sur 100 */
  score: number;
  /** Raison du refus si invalid */
  reason?: string;
  /** Suggestion d'amélioration */
  suggestion?: string;
  /** Complexité estimée du test (0-5) */
  complexity?: number;
}

/**
 * Verbes d'action courants pour les tests E2E
 */
const ACTION_VERBS = [
  // Actions de base
  "clique",
  "cliquer",
  "click",
  "vérifie",
  "vérifier",
  "check",
  "teste",
  "tester",
  "test",
  "remplit",
  "remplir",
  "fill",
  "saisi",
  "saisir",
  "entre",
  "entrer",
  "input",

  // Navigation
  "navigue",
  "naviguer",
  "navigate",
  "va",
  "aller",
  "go",
  "visite",
  "visiter",
  "visit",
  "ouvre",
  "ouvrir",
  "open",

  // Attente et observation
  "attend",
  "attendre",
  "wait",
  "observe",
  "observer",
  "recherche",
  "rechercher",
  "search",
  "trouve",
  "trouver",
  "find",

  // Validation
  "valide",
  "valider",
  "validate",
  "confirme",
  "confirmer",
  "confirm",
  "soumet",
  "soumettre",
  "submit",
  "envoie",
  "envoyer",
  "send",

  // Autres
  "sélectionne",
  "sélectionner",
  "select",
  "choisit",
  "choisir",
  "choose",
  "scroll",
  "défile",
  "défiler",
  "hover",
  "survole",
  "survoler",
];

/**
 * Mots-clés d'éléments UI
 */
const UI_ELEMENTS = [
  "bouton",
  "button",
  "btn",
  "input",
  "champ",
  "field",
  "formulaire",
  "form",
  "lien",
  "link",
  "a",
  "menu",
  "dropdown",
  "select",
  "checkbox",
  "radio",
  "modal",
  "popup",
  "dialog",
  "table",
  "tableau",
  "liste",
  "list",
  "div",
  "span",
  "p",
  "header",
  "footer",
  "nav",
  "navbar",
  "image",
  "img",
  "icon",
  "icone",
];

/**
 * Sélecteurs CSS/XPath courants
 */
const SELECTOR_PATTERNS = [
  /#[a-zA-Z][\w-]*/g, // IDs: #login, #submit-btn
  /\.[a-zA-Z][\w-]*/g, // Classes: .btn-primary, .input-field
  /\[[a-zA-Z]+=/g, // Attributs: [name=, [type=, [data-
  /input\[/gi, // input[type="text"]
  /button\[/gi, // button[type="submit"]
];

/**
 * Mots vagues à éviter
 */
const VAGUE_WORDS = [
  "le site",
  "la page",
  "ça",
  "truc",
  "chose",
  "machin",
  "tout",
  "quelque chose",
  "n'importe",
  "fonctionne",
  "marche",
];

/**
 * Valide et analyse un prompt utilisateur
 *
 * @param prompt - Le prompt à valider
 * @returns Résultat de la validation avec score et suggestions
 *
 * @example
 * ```ts
 * const result = await validatePrompt("Vérifie que le login échoue avec mauvais mdp");
 * console.log(result.score); // 92
 * ```
 */
export async function validatePrompt(
  prompt: string
): Promise<PromptValidationResult> {
  // 1. Vérifications de base
  if (!prompt || typeof prompt !== "string") {
    return {
      valid: false,
      score: 0,
      reason: "Le prompt est vide ou invalide",
      suggestion: "Veuillez fournir une description du test à effectuer.",
    };
  }

  const trimmedPrompt = prompt.trim();
  const words = trimmedPrompt.split(/\s+/);
  const wordCount = words.length;

  // 2. Prompt trop court
  if (wordCount < 5) {
    return {
      valid: false,
      score: 20,
      reason: "Le prompt est trop court (moins de 5 mots)",
      suggestion:
        "Ajoutez plus de détails : quel élément tester ? Quelle action ? Quel résultat attendu ?",
    };
  }

  // 3. Calcul du score
  let score = 40; // Score de base

  // 3a. Longueur du prompt (max +20 points)
  if (wordCount >= 5 && wordCount <= 10) score += 10;
  else if (wordCount > 10 && wordCount <= 20) score += 20;
  else if (wordCount > 20 && wordCount <= 40) score += 15;
  else if (wordCount > 40) score += 5; // Trop long = moins clair

  // 3b. Présence de verbes d'action (max +25 points)
  const lowerPrompt = trimmedPrompt.toLowerCase();
  const foundVerbs = ACTION_VERBS.filter((verb) => lowerPrompt.includes(verb));
  const verbScore = Math.min(foundVerbs.length * 8, 25);
  score += verbScore;

  if (foundVerbs.length === 0) {
    return {
      valid: false,
      score: Math.max(score - 20, 10),
      reason: "Aucun verbe d'action détecté dans le prompt",
      suggestion:
        'Utilisez des verbes comme "clique", "vérifie", "remplit", "teste", etc.',
    };
  }

  // 3c. Présence d'éléments UI concrets (max +20 points)
  const foundElements = UI_ELEMENTS.filter((element) =>
    lowerPrompt.includes(element)
  );
  const elementScore = Math.min(foundElements.length * 5, 20);
  score += elementScore;

  // 3d. Présence de sélecteurs CSS/XPath (max +15 points)
  let selectorFound = false;
  for (const pattern of SELECTOR_PATTERNS) {
    if (pattern.test(trimmedPrompt)) {
      selectorFound = true;
      score += 15;
      break;
    }
  }

  // 3e. Pénalité pour mots vagues (-10 points par mot vague)
  const foundVagueWords = VAGUE_WORDS.filter((word) =>
    lowerPrompt.includes(word)
  );
  score -= foundVagueWords.length * 10;

  // 4. Normaliser le score (0-100)
  score = Math.max(0, Math.min(100, score));

  // 5. Calculer la complexité
  const complexity = estimatePromptComplexity(trimmedPrompt);

  // 6. Décision finale
  if (score < 60) {
    let suggestion = "Améliorez votre prompt en ajoutant : ";
    const suggestions: string[] = [];

    if (foundElements.length === 0) {
      suggestions.push("l'élément à tester (bouton, input, formulaire, etc.)");
    }
    if (foundVerbs.length <= 1) {
      suggestions.push("des actions précises (clique, vérifie, remplit)");
    }
    if (!selectorFound && foundElements.length < 2) {
      suggestions.push("des sélecteurs CSS (#id, .class, [name='...'])");
    }

    suggestion +=
      suggestions.join(", ") || "plus de détails sur le test attendu";
    suggestion += ".";

    return {
      valid: false,
      score,
      reason: `Score de clarté insuffisant (${score}/100)`,
      suggestion,
      complexity,
    };
  }

  // 7. Prompt valide
  let reason = "Prompt clair et exploitable";
  if (score >= 90)
    reason = "Prompt excellent avec actions et éléments explicites";
  else if (score >= 75) reason = "Prompt clair avec bonne structure";

  return {
    valid: true,
    score,
    reason,
    complexity,
  };
}

/**
 * Estime la complexité d'un prompt (0-5)
 * Basé sur le nombre d'actions différentes et la structure du test
 *
 * @param prompt - Le prompt à analyser
 * @returns Score de complexité entre 0 et 5
 *
 * @example
 * ```ts
 * estimatePromptComplexity("Clique sur login"); // 1
 * estimatePromptComplexity("Remplit le formulaire, clique submit, vérifie la redirection"); // 4
 * ```
 */
export function estimatePromptComplexity(prompt: string): number {
  const lowerPrompt = prompt.toLowerCase();

  // Compter les actions distinctes
  const foundVerbs = ACTION_VERBS.filter((verb) => lowerPrompt.includes(verb));

  // Compter les éléments UI mentionnés
  const foundElements = UI_ELEMENTS.filter((element) =>
    lowerPrompt.includes(element)
  );

  // Détecter les structures conditionnelles
  const hasConditions = /si|if|quand|when|alors|then|sinon|else/i.test(prompt);

  // Détecter les boucles/répétitions
  const hasLoops = /pour chaque|for each|tous les|toutes les|several/i.test(
    prompt
  );

  // Détecter les validations multiples
  const hasMultipleChecks = /et|puis|ensuite|après|finally/i.test(prompt);

  let complexity = 0;

  // Calcul de la complexité
  complexity += Math.min(foundVerbs.length, 3); // Max 3 points pour les verbes
  if (foundElements.length >= 3) complexity += 1;
  if (hasConditions) complexity += 1;
  if (hasLoops) complexity += 1;
  if (hasMultipleChecks) complexity += 1;

  return Math.min(complexity, 5);
}

/**
 * Améliore un prompt avec l'aide de l'IA (OpenAI)
 * Nécessite OPENAI_API_KEY dans l'environnement
 *
 * @param prompt - Le prompt original à améliorer
 * @returns Le prompt amélioré ou le prompt original si l'API n'est pas disponible
 *
 * @example
 * ```ts
 * const improved = await improvePrompt("teste le login");
 * // → "Vérifie que le formulaire de connexion fonctionne en remplissant
 * //    les champs email et mot de passe, puis clique sur le bouton submit"
 * ```
 */
export async function improvePrompt(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn(
      "[PromptValidator] OPENAI_API_KEY not set, skipping improvement"
    );
    return prompt;
  }

  try {
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Tu es un expert en tests E2E avec Playwright. 
          
Ton rôle : reformuler les prompts utilisateur de manière claire et précise pour générer des tests Playwright de qualité.

Règles :
- Identifie l'action principale (clique, vérifie, remplit, etc.)
- Mentionne les éléments UI concrets (bouton, input, formulaire, etc.)
- Suggère des sélecteurs CSS si possible
- Reste concis (1-2 phrases max)
- Utilise un langage impératif et technique

Exemple :
Prompt vague : "teste le login"
Prompt amélioré : "Vérifie que le formulaire de connexion fonctionne en remplissant les champs email et password, puis clique sur le bouton submit et confirme la redirection vers /dashboard"`,
        },
        {
          role: "user",
          content: `Reformule ce prompt de test E2E de manière claire et exploitable :\n\n"${prompt}"`,
        },
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    const improvedPrompt = response.choices[0]?.message?.content?.trim();

    if (!improvedPrompt) {
      console.warn("[PromptValidator] No response from OpenAI");
      return prompt;
    }

    console.log(`[PromptValidator] Prompt improved:`);
    console.log(`  Original: ${prompt}`);
    console.log(`  Improved: ${improvedPrompt}`);

    return improvedPrompt;
  } catch (error: any) {
    console.error("[PromptValidator] Error improving prompt:", error.message);
    return prompt;
  }
}

/**
 * Valide et améliore automatiquement un prompt si nécessaire
 * Combine validation + amélioration AI
 *
 * @param prompt - Le prompt original
 * @param autoImprove - Améliorer automatiquement si score < 60 (défaut: true)
 * @returns Résultat de validation avec prompt possiblement amélioré
 */
export async function validateAndImprovePrompt(
  prompt: string,
  autoImprove = true
): Promise<PromptValidationResult & { improvedPrompt?: string }> {
  const validation = await validatePrompt(prompt);

  // Si le prompt est invalide et autoImprove activé
  if (!validation.valid && autoImprove && process.env.OPENAI_API_KEY) {
    console.log(
      `[PromptValidator] Score too low (${validation.score}), attempting to improve...`
    );

    const improvedPrompt = await improvePrompt(prompt);

    // Re-valider le prompt amélioré
    const improvedValidation = await validatePrompt(improvedPrompt);

    return {
      ...improvedValidation,
      improvedPrompt:
        improvedValidation.score > validation.score
          ? improvedPrompt
          : undefined,
    };
  }

  return validation;
}

/**
 * Analyse un prompt et retourne des statistiques détaillées
 * Utile pour le debugging et l'optimisation
 */
export function analyzePrompt(prompt: string) {
  const lowerPrompt = prompt.toLowerCase();
  const words = prompt.trim().split(/\s+/);

  const foundVerbs = ACTION_VERBS.filter((verb) => lowerPrompt.includes(verb));
  const foundElements = UI_ELEMENTS.filter((element) =>
    lowerPrompt.includes(element)
  );
  const foundVagueWords = VAGUE_WORDS.filter((word) =>
    lowerPrompt.includes(word)
  );

  const selectors: string[] = [];
  for (const pattern of SELECTOR_PATTERNS) {
    const matches = prompt.match(pattern);
    if (matches) selectors.push(...matches);
  }

  return {
    wordCount: words.length,
    verbs: foundVerbs,
    uiElements: foundElements,
    vagueWords: foundVagueWords,
    selectors,
    complexity: estimatePromptComplexity(prompt),
  };
}
