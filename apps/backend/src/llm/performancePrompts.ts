/**
 * AI Prompts for Performance Test Generation with k6
 */

interface PerformanceTestConfig {
  url: string;
  method: string;
  vus: number;
  duration: number;
  headers?: Record<string, string>;
  body?: any;
}

/**
 * Prompt pour générer un script k6 de test de performance
 */
export function buildK6ScriptPrompt(
  config: PerformanceTestConfig,
  userPrompt?: string
): string {
  const { url, method, vus, duration, headers, body } = config;

  return `Tu es un expert en tests de performance avec k6. Génère un script k6 complet pour tester cette API.

**Configuration du test :**
- URL : ${url}
- Méthode HTTP : ${method}
- Virtual Users (VUs) : ${vus}
- Durée : ${duration}s
${headers ? `- Headers : ${JSON.stringify(headers, null, 2)}` : ""}
${body ? `- Body : ${JSON.stringify(body, null, 2)}` : ""}

${userPrompt ? `**Instructions utilisateur :**\n${userPrompt}\n` : ""}

**Objectifs du script :**
1. Tester la montée en charge progressive (ramp-up)
2. Maintenir la charge stable pendant la durée du test
3. Mesurer les métriques clés : response time, RPS, error rate
4. Définir des seuils (thresholds) pour valider la performance

**Bonnes pratiques k6 :**
- Utilise \`import http from 'k6/http';\`
- Utilise \`import { check, sleep } from 'k6';\`
- Configure \`options\` avec \`stages\` pour ramp-up/down
- Ajoute des \`checks\` pour valider le status code
- Utilise \`thresholds\` pour définir des critères de succès
- Ajoute un \`sleep(1)\` entre les requêtes
- Groupe les requêtes similaires avec \`group()\`

**Thresholds recommandés :**
- http_req_duration : ['p(95)<500'] // 95% des requêtes < 500ms
- http_req_failed : ['rate<0.01'] // Moins de 1% d'erreurs
- http_reqs : ['rate>10'] // Au moins 10 RPS

**Format de sortie :**
Retourne UNIQUEMENT le code JavaScript k6, sans explications avant/après.
Commence directement par les imports.

Script k6:`;
}

/**
 * Prompt pour analyser les résultats de performance et suggérer des optimisations
 */
export function buildPerformanceAnalysisPrompt(
  results: any,
  testConfig: PerformanceTestConfig
): string {
  return `Tu es un expert en optimisation de performance. Analyse ces résultats de test k6 et identifie les problèmes.

**Configuration du test :**
- URL : ${testConfig.url}
- VUs : ${testConfig.vus}
- Durée : ${testConfig.duration}s

**Résultats k6 :**
\`\`\`json
${JSON.stringify(results, null, 2)}
\`\`\`

**Analyse demandée :**
1. **État global** : Le test est-il passé ou échoué ?
2. **Problèmes identifiés** : Quels sont les goulots d'étranglement ?
3. **Métriques critiques** :
   - Response time (p50, p95, p99) : Normal, lent, ou très lent ?
   - Error rate : Acceptable (<1%) ou problématique ?
   - RPS : Atteint-il l'objectif ?
4. **Causes probables** : Pourquoi ces performances ?
   - Surcharge serveur (CPU, RAM)
   - Lenteur base de données
   - Latence réseau
   - Configuration inadéquate (trop de VUs)
5. **Recommandations** : Comment améliorer ?
   - Optimisations backend
   - Mise en cache
   - Scaling horizontal
   - Ajustement config k6

**Format de sortie :**
Retourne un JSON structuré :
\`\`\`json
{
  "status": "passed" | "failed",
  "score": 85, // 0-100
  "summary": "Description courte du résultat",
  "issues": [
    {
      "severity": "critical" | "high" | "medium" | "low",
      "metric": "p95_response_time",
      "value": 1200,
      "threshold": 500,
      "description": "Le p95 dépasse largement le seuil"
    }
  ],
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "category": "backend" | "database" | "cache" | "infrastructure",
      "title": "Ajouter un index sur la colonne user_id",
      "description": "Les requêtes DB sont lentes, un index améliorerait les temps de réponse"
    }
  ]
}
\`\`\`

JSON:`;
}

/**
 * Prompt pour générer un test de montée en charge (stress test)
 */
export function buildStressTestPrompt(
  baseUrl: string,
  endpoints: string[]
): string {
  return `Tu es un expert en stress testing avec k6. Génère un script de test de montée en charge progressif.

**Objectif :** Trouver le point de rupture du système

**Configuration :**
- Base URL : ${baseUrl}
- Endpoints à tester : ${endpoints.join(", ")}

**Scénario de montée en charge :**
1. Stage 1 : 0 → 10 VUs en 30s (warm-up)
2. Stage 2 : 10 → 50 VUs en 1min (charge normale)
3. Stage 3 : 50 → 100 VUs en 1min (charge élevée)
4. Stage 4 : 100 → 200 VUs en 2min (stress)
5. Stage 5 : 200 → 500 VUs en 2min (breaking point)
6. Stage 6 : 500 → 0 VUs en 1min (ramp-down)

**Fonctionnalités requises :**
- Tester chaque endpoint avec un poids différent (simuler traffic réel)
- Mesurer à quel moment les erreurs commencent
- Tracker le point où p95 > 1s
- Générer un rapport avec le nombre max de VUs supportés

**Thresholds :**
- http_req_duration : ['p(95)<1000', 'p(99)<2000']
- http_req_failed : ['rate<0.05'] // Max 5% d'erreurs
- http_reqs : ['rate>50'] // Au moins 50 RPS au pic

Retourne uniquement le code k6:`;
}

/**
 * Prompt pour générer un test de spike (pic soudain de trafic)
 */
export function buildSpikeTestPrompt(
  url: string,
  normalLoad: number,
  spikeLoad: number
): string {
  return `Tu es un expert en spike testing avec k6. Génère un script simulant un pic soudain de trafic.

**Objectif :** Vérifier la résilience du système face à un spike inattendu

**Configuration :**
- URL : ${url}
- Charge normale : ${normalLoad} VUs
- Charge spike : ${spikeLoad} VUs

**Scénario spike :**
1. Stage 1 : 0 → ${normalLoad} VUs en 30s (montée normale)
2. Stage 2 : ${normalLoad} VUs constant 2min (stable)
3. Stage 3 : ${normalLoad} → ${spikeLoad} VUs en 10s (SPIKE BRUTAL)
4. Stage 4 : ${spikeLoad} VUs constant 1min (maintien spike)
5. Stage 5 : ${spikeLoad} → ${normalLoad} VUs en 10s (retour normal)
6. Stage 6 : ${normalLoad} VUs constant 1min (récupération)
7. Stage 7 : ${normalLoad} → 0 VUs en 30s (ramp-down)

**Métriques à observer :**
- Le système survit-il au spike ?
- Temps de récupération après le spike
- Erreurs pendant et après le spike
- Impact sur les temps de réponse

**Thresholds adaptatifs :**
- Pendant le spike : tolérer des temps plus longs
- Après le spike : retour à la normale attendu

Retourne uniquement le code k6:`;
}

/**
 * Prompt pour générer un test de soak (endurance)
 */
export function buildSoakTestPrompt(
  url: string,
  vus: number,
  durationMinutes: number
): string {
  return `Tu es un expert en soak testing (endurance) avec k6. Génère un script pour tester la stabilité long-terme.

**Objectif :** Détecter les fuites mémoire, memory leaks, et problèmes d'endurance

**Configuration :**
- URL : ${url}
- VUs constants : ${vus}
- Durée : ${durationMinutes} minutes

**Scénario soak :**
1. Stage 1 : 0 → ${vus} VUs en 2min (ramp-up)
2. Stage 2 : ${vus} VUs constant ${durationMinutes}min (SOAK)
3. Stage 3 : ${vus} → 0 VUs en 2min (ramp-down)

**Métriques critiques pour soak :**
- Response time : doit rester STABLE (pas d'augmentation progressive)
- Error rate : doit rester constant (pas d'augmentation)
- Memory usage : surveiller côté serveur
- Connection leaks : vérifier les connexions DB

**Thresholds stricts :**
- http_req_duration : ['p(95)<500', 'p(99)<1000']
- http_req_failed : ['rate<0.01']
- Variance du p95 : ne doit pas augmenter de plus de 20% sur la durée

**Best practices :**
- Ajouter des tags pour grouper par type de requête
- Logger des métriques custom toutes les minutes
- Vérifier que les temps ne dégradent pas avec le temps

Retourne uniquement le code k6:`;
}

/**
 * Prompt pour optimiser un script k6 existant
 */
export function buildK6OptimizationPrompt(
  currentScript: string,
  issues: string[]
): string {
  return `Tu es un expert k6. Optimise ce script pour améliorer la fiabilité et les performances.

**Script actuel :**
\`\`\`javascript
${currentScript}
\`\`\`

**Problèmes identifiés :**
${issues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}

**Optimisations à appliquer :**
1. **Thresholds** : Ajouter ou ajuster pour être plus réalistes
2. **Checks** : Améliorer la validation des réponses
3. **Sleep** : Ajuster le temps entre requêtes (trop court = irréaliste)
4. **Groups** : Organiser les requêtes logiquement
5. **Tags** : Ajouter pour mieux analyser les résultats
6. **Error handling** : Gérer les timeouts et erreurs réseau
7. **Data parameterization** : Varier les données de test

**Best practices k6 :**
- Utiliser \`__ENV\` pour les variables d'environnement
- Externaliser les seuils dans \`options.thresholds\`
- Ajouter des commentaires pour expliquer chaque stage
- Utiliser \`Trend\` pour des métriques custom

Retourne le script k6 optimisé (complet, pas juste les changements):`;
}
