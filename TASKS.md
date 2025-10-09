# Tasks - Nouveaux types de tests automatisés avec IA

> **Dernière mise à jour:** 6 décembre 2025  
> **Status:** Performance Tests ✅ terminé, Security Tests en cours

---

## 🚀 Résumé Rapide

| Type              | Status | Backend | Frontend | CLI | Doc |
| ----------------- | ------ | ------- | -------- | --- | --- |
| Smoke Tests       | ✅     | ✅      | ✅       | ✅  | ✅  |
| Unit Tests        | ✅     | ✅      | ✅       | ✅  | ✅  |
| Performance Tests | ✅     | ✅      | ✅       | ⏳  | ⏳  |
| Security Tests    | ⏳     | ⏳      | ⏳       | ⏳  | ⏳  |

**Légende:** ✅ Terminé | ⏳ En cours/À faire

---

## 📋 Vue d'ensemble

Ajouter nouveaux types de tests automatisés avec génération IA :

- ✅ ~~Smoke Tests~~ (TERMINÉ)
- ✅ ~~Unit Tests (Jest + Analyse IA)~~ (TERMINÉ + CI/CD)
- ✅ ~~Performance Tests (k6)~~ (TERMINÉ)
- ⏳ Security Tests (OWASP) - **PROCHAINE ÉTAPE**
- ⏳ Load Tests (scenarios k6) - Optionnel
- ⏳ Visual Regression Tests (screenshots) - Optionnel

## 🎯 Stratégie : Backend/Frontend par batch, puis CLI

### Phase 1 : Groupe "Quick Wins"

#### ✅ ~~1. Unit Tests avec Jest - Analyse Automatique~~ (TERMINÉ)

**✅ Ce qui a été fait :**

- ✅ Agent CLI avec `analyzer.ts` : Scan projet, extraction fonctions, scoring automatique
- ✅ Commande `leynai-agent analyze` avec options --threshold, --generate, --ai
- ✅ Backend : Modèles Prisma (UnitTest, UnitTestRun, FunctionAnalysis)
- ✅ Backend : Routes `/api/unit-tests/*` (analyze, generate, list, run, optimize)
- ✅ Backend : `unitPrompts.ts` (8 prompts pour scoring et génération)
- ✅ Backend : `unitrunner.ts` (wrapper Jest avec parsing couverture)
- ✅ Frontend : Pages liste et détail avec 4 onglets
- ✅ Frontend : Navigation et traductions EN/FR
- ✅ CI/CD : GitHub Actions workflows (complet + unit-only)
- ✅ CI/CD : GitLab CI pipeline
- ✅ CI/CD : Support `leynai-agent test --only=unit`
- ✅ Documentation : `docs/CI_CD_INTEGRATION.md`

**📚 Documentation créée pour les utilisateurs :**

- `examples/ci-cd/leynai-tests.yml` - Pipeline complète GitHub Actions (template)
- `examples/ci-cd/unit-tests-only.yml` - Workflow simplifié (template)
- `examples/ci-cd/.gitlab-ci.yml` - Pipeline GitLab (template)
- `examples/ci-cd/README.md` - Guide des templates CI/CD
- `docs/CI_CD_INTEGRATION.md` - Guide complet pour utilisateurs
- `CICD_QUICKSTART.md` - Démarrage rapide pour utilisateurs
- `examples/USER_PROJECT_EXAMPLE.md` - Exemple complet d'intégration

⚠️ **Important:** Ces templates sont pour que les **utilisateurs de LeynAI** testent **leur propre code**, pas pour déployer LeynAI lui-même.

---

#### ✅ ~~2. Performance Tests avec k6~~ (TERMINÉ)

**✅ Ce qui a été fait :**

- ✅ Backend : Modèles Prisma (PerformanceTest, PerformanceTestRun, PerformanceMetric)
- ✅ Backend : `k6runner.ts` - Exécution k6 avec parsing JSON metrics
- ✅ Backend : `performancePrompts.ts` - 3 prompts IA (génération scripts, optimisation, scenarios)
- ✅ Backend : Routes `/api/performance-tests/*` (CRUD complet + run + history)
- ✅ Frontend : Page liste avec métriques (P95, throughput, error rate)
- ✅ Frontend : Page création avec config (VUs, duration, AI enhancement)
- ✅ Frontend : Page détail avec 4 stats cards + 3 onglets (Overview, Script, History)
- ✅ Frontend : Navigation et traductions EN/FR (sidebar avec icône ⚡)
- ✅ Frontend : DashboardLayout intégré (header + sidebar)
- ✅ Backend compilé sans erreurs
- ✅ Frontend compilé sans erreurs

**📊 Métriques trackées :**

- Response times (avg, p95, p99)
- Throughput (requests/sec)
- Error rate (%)
- Virtual users (max)
- Data sent/received

---

#### ⏳ 3. Security Tests OWASP (2-3 jours) - **PROCHAINE ÉTAPE**

**Backend à faire :**

- [ ] Créer modèles Prisma : `SecurityTest`, `SecurityTestRun`, `Vulnerability`
- [ ] Créer `apps/backend/src/runner/securityrunner.ts` - OWASP ZAP ou checks manuels
  - [ ] SQL Injection detection
  - [ ] XSS (Cross-Site Scripting) detection
  - [ ] CSRF token validation
  - [ ] Security headers check (CSP, X-Frame-Options, etc.)
  - [ ] Authentication/Authorization tests
  - [ ] Sensitive data exposure
- [ ] Créer `apps/backend/src/llm/securityPrompts.ts` - Prompts IA pour analyse vulnérabilités
- [ ] Créer `apps/backend/src/routes/securityTests.ts` - Routes CRUD + run
- [ ] Enregistrer routes dans `apps/backend/src/routes/index.ts`
- [ ] Migration Prisma et compilation backend

**Frontend à faire :**

- [ ] Créer `apps/frontend/src/app/security-tests/page.tsx` - Liste avec severity badges
- [ ] Créer `apps/frontend/src/app/security-tests/new/page.tsx` - Form (URL, scan type)
- [ ] Créer `apps/frontend/src/app/security-tests/[id]/page.tsx` - Rapport détaillé par vulnerability
- [ ] Mettre à jour Sidebar avec icône 🛡️ + Traductions EN/FR
- [ ] Intégrer DashboardLayout
- [ ] Compiler et tester

**Severity levels:**

- 🔴 Critical (score 9-10)
- 🟠 High (score 7-8)
- 🟡 Medium (score 4-6)
- 🟢 Low (score 1-3)

---

### Phase 2 : Intégration CLI

#### ⏳ 4. Ajouter les nouveaux types au CLI (après implémentation Performance & Security)

**Configuration :**

- [x] ~~Mettre à jour `agent/src/configLoader.ts`~~ - ✅ Types `unit`, `smoke`, `performance`, `security` ajoutés
- [ ] Mettre à jour `leynai.json.example` - Ajouter exemples des nouveaux types

**Backend CLI Routes :**

- [ ] Mettre à jour `apps/backend/src/routes/cli.ts` :
  - [x] ~~Ajouter `executeUnitTest()` helper~~ - ✅ Déjà dans unitTests.ts
  - [ ] Ajouter `executePerformanceTest()` helper (appeler k6runner)
  - [ ] Ajouter `executeSecurityTest()` helper (appeler securityrunner)
  - [ ] Intégrer dans `POST /api/cli/run-tests` pour support --only=performance,security
  - [ ] Mettre à jour `GET /api/cli/tests` pour lister tous les types

**Agent CLI :**

- [x] ~~Mettre à jour `agent/src/cli.ts`~~ - ✅ Support `--only=unit/smoke/performance/security`
- [x] ~~Mettre à jour `agent/bin/leynai-agent.js`~~ - ✅ Options CLI mises à jour

**Tests à faire :**

- [ ] ✅ Tester `leynai-agent analyze` → génération → exécution → UI (Unit Tests E2E)
- [ ] Tester `leynai-agent test --only=unit` (end-to-end avec CI/CD)
- [ ] Tester création manuelle Performance Test via UI
- [ ] Tester `leynai-agent test --only=performance` (après intégration CLI)
- [ ] Tester `leynai-agent test --only=security` (après implémentation)
- [ ] Tester `leynai-agent test` (tous les types combinés)

---

### Phase 3 : Groupe "Advanced" (2 semaines) - OPTIONNEL

#### ⏳ 5. Load Tests avec k6 scenarios (3 jours)

**Backend :**

- [ ] Créer modèles Prisma : `LoadTest`, `LoadTestRun`, `LoadScenario`
- [ ] Créer `apps/backend/src/runner/loadrunner.ts` - Scenarios k6 (ramp-up, spike, stress)
- [ ] Créer `apps/backend/src/llm/loadPrompts.ts` - Prompts IA pour générer scenarios
- [ ] Créer routes + frontend (même pattern que performance)

#### ⏳ 6. Visual Regression Tests (4 jours)

**Backend :**

- [ ] Installer Playwright (déjà fait) + pixelmatch pour comparaison
- [ ] Créer modèles Prisma : `VisualTest`, `VisualTestRun`, `VisualDiff`
- [ ] Créer `apps/backend/src/runner/visualrunner.ts` - Screenshots + comparaison
- [ ] Créer `apps/backend/src/llm/visualPrompts.ts` - Prompts IA pour identifier changements visuels
- [ ] Créer routes + frontend avec affichage diff images

#### ⏳ 7. Accessibility Tests (3 jours)

**Backend :**

- [ ] Installer axe-core ou pa11y
- [ ] Créer modèles Prisma : `AccessibilityTest`, `A11yViolation`
- [ ] Créer `apps/backend/src/runner/a11yrunner.ts` - Scan WCAG compliance
- [ ] Créer routes + frontend avec rapport violations

---

## 📊 Priorités recommandées

### MVP CI/CD (Phase 1 + 2) :

1. ✅ ~~**Smoke Tests**~~ → Validations rapides en CI/CD (TERMINÉ)
2. ✅ ~~**Unit Tests**~~ → Tests unitaires avec couverture + CI/CD (TERMINÉ) ⭐⭐⭐⭐⭐
3. ✅ ~~**Performance Tests**~~ → Métriques k6 (TERMINÉ) ⭐⭐⭐⭐
4. ⏳ **Security Tests** → Détection vulnérabilités OWASP ⭐⭐⭐⭐ **← EN COURS**
5. ⏳ **Intégration CLI complète** → Tous les types accessibles en CI/CD
6. ⏳ **Test E2E Unit Tests** → Valider workflow complet analyze → generate → run

### Features avancées (Phase 3) - Optionnel :

6. **Load Tests** → Stress testing ⭐⭐⭐
7. **Visual Regression** → UI consistency ⭐⭐
8. **Accessibility** → Conformité WCAG ⭐⭐

---

## 🏗️ Architecture des nouveaux runners

Chaque runner suit le même pattern :

```typescript
// apps/backend/src/runner/[type]runner.ts
export async function execute[Type]Test(testId: string): Promise<string> {
  // 1. Charger le test depuis DB
  // 2. Exécuter (axios, k6, playwright, jest, etc.)
  // 3. Créer TestRun avec résultats
  // 4. Retourner runId
}

export async function execute[Type]TestWithRetry(testId: string): Promise<string> {
  // Retry logic avec exponential backoff
}
```

---

## 📝 Modèle Prisma générique

```prisma
model [Type]Test {
  id          String   @id @default(cuid())
  name        String
  url         String
  userId      String
  projectId   String?
  prompt      String?  @db.Text
  config      Json?    // Configuration spécifique au type
  createdAt   DateTime @default(now())

  runs        [Type]TestRun[]
  user        User     @relation(fields: [userId], references: [id])
  project     Project? @relation(fields: [projectId], references: [id])
}

model [Type]TestRun {
  id          String   @id @default(cuid())
  testId      String
  status      String   // "success", "failed", "running"
  startedAt   DateTime @default(now())
  completedAt DateTime?
  duration    Int?
  results     Json?    // Résultats spécifiques (métriques, violations, etc.)
  error       String?  @db.Text

  test        [Type]Test @relation(fields: [testId], references: [id])
}
```

---

## 🔧 Configuration leynai.json étendue

```json
{
  "server": "http://localhost:4000",
  "apiKey": "${LEYNAI_API_KEY}",
  "project": "my-project-id",
  "tests": {
    "e2e": ["test-1", "test-2"],
    "api": ["api-1", "api-2"],
    "smoke": ["smoke-1", "smoke-2"], // ✅ Déjà intégré
    "unit": ["unit-1", "unit-2"], // NOUVEAU
    "performance": ["perf-1"], // NOUVEAU
    "security": ["sec-1"], // NOUVEAU
    "load": ["load-1"], // NOUVEAU (Phase 3)
    "visual": ["visual-1"], // NOUVEAU (Phase 3)
    "accessibility": ["a11y-1"] // NOUVEAU (Phase 3)
  },
  "options": {
    "parallel": 3,
    "timeout": 60000,
    "retries": 2
  }
}
```

---

## 🚀 Pipeline CI/CD

✅ **Workflows créés :**

- `.github/workflows/leynai-tests.yml` - Pipeline complète (8 jobs)
- `.github/workflows/unit-tests-only.yml` - Workflow simplifié unit tests
- `.gitlab-ci.yml` - Pipeline GitLab CI (3 stages)

**Documentation complète :** `docs/CI_CD_INTEGRATION.md`

**Ordre d'exécution recommandé :**

1. Analyze & Generate → Unit Tests
2. Smoke Tests (validations rapides)
3. API Tests (en parallèle avec Security/Performance)
4. Security Tests
5. Performance Tests
6. E2E Tests (si tout passe)
7. Report & Deploy

---

## 📚 Documentation

**✅ Documentation créée :**

- ✅ `docs/SMOKE_TESTS.md` - Guide smoke tests
- ✅ `docs/CI_CD_INTEGRATION.md` - Guide CI/CD complet (pour utilisateurs)
- ✅ `docs/HOW_TESTS_ARE_EXECUTED.md` - Explication technique détaillée
- ✅ `CICD_QUICKSTART.md` - Quick start CI/CD en 4 étapes
- ✅ `examples/ci-cd/README.md` - Guide des templates
- ✅ `examples/USER_PROJECT_EXAMPLE.md` - Exemple complet d'intégration

**⏳ Documentation à créer :**

- [ ] `docs/UNIT_TESTS.md` - Guide détaillé tests unitaires + analyse IA
- [ ] `docs/PERFORMANCE_TESTS.md` - Guide k6 + métriques + AI script generation
- [ ] `docs/SECURITY_TESTS.md` - Guide OWASP checks + vulnerability detection
- [ ] Mettre à jour `README.md` avec Performance Tests

---

## ✅ Checklist de validation (après chaque type)

**✅ Unit Tests (approche automatique) - TERMINÉ**

- [x] Agent CLI : Commande `analyze` fonctionnelle avec extraction de fonctions
- [x] Agent CLI : Scoring d'importance implémenté (statique + contextuel + call graph + IA)
- [x] Backend : Routes d'analyse et génération créées (10 endpoints)
- [x] Backend : Runner Jest avec parsing de couverture
- [x] Modèles Prisma créés et migrés (UnitTest, UnitTestRun, FunctionAnalysis)
- [x] Agent CLI : Génération automatique de fichiers `.test.ts`
- [x] Frontend : Pages de visualisation (liste + détails avec 4 onglets)
- [x] Navigation mise à jour (Sidebar + Traductions)
- [x] CI/CD : Workflows GitHub Actions et GitLab CI créés (templates pour users)
- [x] CI/CD : Support `leynai-agent test --only=unit`
- [x] Documentation créée (CI/CD, HOW_TESTS_ARE_EXECUTED, QUICKSTART)
- [ ] ⏳ Test end-to-end complet : `leynai-agent analyze` → génère tests → exécute → vérifie UI

**✅ Performance Tests (k6) - TERMINÉ**

- [x] Modèles Prisma créés et migrés (PerformanceTest, PerformanceTestRun, PerformanceMetric)
- [x] Backend : k6runner.ts avec exécution et parsing JSON
- [x] Backend : performancePrompts.ts avec 3 prompts IA
- [x] Backend : Routes CRUD complètes
- [x] Frontend : 3 pages (liste, création, détail)
- [x] Frontend : DashboardLayout + Navigation + Traductions
- [x] Backend compilé ✅
- [x] Frontend compilé ✅
- [ ] ⏳ Intégration CLI (`leynai-agent test --only=performance`)
- [ ] ⏳ Test manuel via UI

**⏳ Security Tests (OWASP) - À FAIRE**

- [ ] Modèles Prisma créés et migrés (SecurityTest, SecurityTestRun, Vulnerability)
- [ ] Runner implémenté (OWASP ZAP ou checks manuels)
- [ ] securityPrompts.ts avec prompts IA
- [ ] Routes backend créées (CRUD + run + scan)
- [ ] Frontend : 3 pages (liste, création, détail avec severity)
- [ ] Navigation mise à jour (icône 🛡️ + traductions)
- [ ] Backend compilé
- [ ] Frontend compilé
- [ ] Test manuel via UI
- [ ] Intégration CLI
- [ ] Documentation

---

## 🎯 État actuel de la plateforme

**Types de tests implémentés :**

- ✅ **E2E Tests** (Playwright + IA) - FAIT
- ✅ **API Tests** (Axios + IA) - FAIT
- ✅ **Smoke Tests** (Validations rapides) - FAIT
- ✅ **Unit Tests** (Jest + Analyse IA + Coverage + CI/CD) - FAIT ⭐
- ✅ **Performance Tests** (k6 + métriques) - FAIT ⭐

**À implémenter :**

- ⏳ **Security Tests** (OWASP ZAP) - **PROCHAINE ÉTAPE** ⭐
- ⏳ Load Tests (Scenarios k6 avancés) - Optionnel
- ⏳ Visual Regression (Screenshots + diff) - Optionnel
- ⏳ Accessibility Tests (WCAG compliance) - Optionnel

**Intégrable en CI/CD avec une seule commande :**

```bash
leynai-agent test  # Tous les types
leynai-agent test --only=unit  # Seulement unit tests
```

---

## 📞 Notes importantes

**✅ Complété:**

- ✅ **Smoke Tests** - Backend + Frontend + Dashboard
- ✅ **Unit Tests** - Analyse automatique + génération IA + CI/CD
  - Agent scanne avec TypeScript Compiler API
  - Scoring automatique (statique + contextuel + call graph + IA)
  - Génération Jest pour fonctions score ≥ 70
  - Exécution avec couverture
  - UI complète (liste, détails, historique)
  - Workflows CI/CD (templates pour utilisateurs)
- ✅ **Performance Tests** - k6 + métriques + AI script generation
  - Backend: k6runner.ts, performancePrompts.ts, routes
  - Frontend: 3 pages + navigation
  - Métriques: P95, throughput, error rate, VUs

**⏳ Prochaines étapes:**

1. **Security Tests** (2-3 jours) - OWASP checks
2. **Tests E2E** - Valider workflows complets
3. **Intégration CLI** - Support performance + security dans agent
4. **Documentation** - Guides détaillés par type

**Architecture:**

- Garder cohérence entre tous les runners
- Pattern: analyze → generate → execute → report
- Phase 3 (Load, Visual, A11y) optionnelle selon besoins

## 🚀 Commandes disponibles

**Unit Tests :**

```bash
# Analyser le projet (affiche fonctions critiques)
leynai-agent analyze

# Analyser et générer automatiquement les tests
leynai-agent analyze --generate

# Changer le seuil de criticité (défaut: 70)
leynai-agent analyze --threshold 80

# Exécuter les tests unitaires
leynai-agent test --only=unit

# Pipeline CI/CD complet dans GitHub Actions
# (voir .github/workflows/leynai-tests.yml)
```
