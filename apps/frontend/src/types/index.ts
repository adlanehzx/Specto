/**
 * Types TypeScript pour le frontend LeynAI
 */

/**
 * Modèle Test
 */
export interface Test {
  id: string;
  userId: string;
  url: string;
  prompt: string;
  code: string;
  tunnelUrl?: string | null; // URL publique du tunnel Cloudflare
  keepTunnelOpen?: boolean; // Garder le tunnel ouvert après le test
  createdAt: string;
  results?: Result[];
  user?: User;
  // Champs de retry
  maxRetries: number;
  retryDelay: number;
  // Auto-healing
  autoHealingEnabled: boolean;
}

/**
 * Modèle Result
 */
export interface Result {
  id: string;
  testId: string;
  status: "passed" | "failed" | "timedOut" | "interrupted" | "error";
  logs: string;
  screenshotUrl: string | null;
  duration: number;
  createdAt: string;
  test?: Test;
  // Champs de retry
  retryCount: number;
  isRetry: boolean;
  originalResultId?: string | null;
  // Résultats d'assertions
  assertions?: Assertion[];
  // Tentatives de healing
  healingAttempts?: HealingAttempt[];
}

/**
 * Modèle Assertion
 */
export interface Assertion {
  id: string;
  resultId: string;
  type: string;
  selector: string | null;
  attribute?: string | null;
  expectedValue: string;
  actualValue: string | null;
  passed: boolean;
  errorMessage: string | null;
  createdAt: string;
}

/**
 * Modèle HealingAttempt (Auto-Healing)
 */
export interface HealingAttempt {
  id: string;
  testId: string;
  resultId: string;
  errorType: string;
  errorMessage: string;
  originalCode: string;
  healedCode?: string | null;
  changes?: Array<{
    type: string;
    before?: string;
    after?: string;
    line?: number;
    code?: string;
    reason: string;
  }> | null;
  status: "pending" | "success" | "failed" | "manual-review";
  confidence?: number | null;
  healedAt?: string | null;
  createdAt: string;
}

/**
 * Modèle User
 */
export interface User {
  id: string;
  email: string;
  createdAt: string;
  tests?: Test[];
}

/**
 * Réponse API: POST /api/tests
 */
export interface CreateTestResponse {
  testId?: string;
  jobId?: string;
  status?: string;
  test?: Test;
  error?: string; // Pour les réponses d'erreur
  success?: boolean;
}

/**
 * Réponse API: GET /api/tests?userId=...
 */
export interface GetTestsResponse {
  tests: Test[];
  total: number;
}

/**
 * Réponse API: GET /api/tests/:id
 */
export interface GetTestResponse {
  test: Test;
}

/**
 * Données du formulaire de création de test
 */
export interface CreateTestFormData {
  url: string;
  prompt: string;
  userId: string;
  keepTunnelOpen?: boolean; // Optionnel: garder le tunnel ouvert
}

/**
 * Tunnel Cloudflare actif
 */
export interface Tunnel {
  port: number;
  url: string;
  active: boolean;
}

/**
 * Réponse API: GET /api/tunnels
 */
export interface GetTunnelsResponse {
  success: boolean;
  count: number;
  tunnels: Tunnel[];
}

/**
 * Réponse API: DELETE /api/tunnels/:port
 */
export interface CloseTunnelResponse {
  success: boolean;
  message: string;
  port: number;
}

/**
 * État de chargement
 */
export type LoadingState = "idle" | "loading" | "success" | "error";

/**
 * Statut d'un test (visuel)
 */
export type TestStatus = "pending" | "running" | "passed" | "failed" | "error";

/**
 * Badge de statut
 */
export interface StatusBadge {
  label: string;
  color: string;
  bgColor: string;
}
