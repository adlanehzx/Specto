import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  analyzePrompt,
  estimatePromptComplexity,
  improvePrompt,
  validateAndImprovePrompt,
  validatePrompt,
} from "./promptValidator";

const GOOD_PROMPT =
  "Clique sur le bouton #login-btn et vérifie que le formulaire de connexion affiche une erreur";

beforeEach(() => {
  vi.stubEnv("OPENAI_API_KEY", "");
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("validatePrompt", () => {
  it("rejects an empty prompt with a score of 0", async () => {
    const result = await validatePrompt("");
    expect(result.valid).toBe(false);
    expect(result.score).toBe(0);
  });

  it("rejects a non-string prompt", async () => {
    const result = await validatePrompt(undefined as unknown as string);
    expect(result.valid).toBe(false);
    expect(result.score).toBe(0);
  });

  it("rejects a prompt of fewer than 5 words and explains why", async () => {
    const result = await validatePrompt("teste le site");
    expect(result.valid).toBe(false);
    expect(result.score).toBe(20);
    expect(result.reason).toMatch(/trop court/);
    expect(result.suggestion).toBeTruthy();
  });

  it("rejects a prompt without any action verb", async () => {
    const result = await validatePrompt("the quick brown fox jumps over the lazy dog today");
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/verbe d'action/);
  });

  it("rejects a vague prompt below the clarity threshold", async () => {
    const result = await validatePrompt("vérifie que ça marche sur le site");
    expect(result.valid).toBe(false);
    expect(result.score).toBeLessThan(60);
    expect(result.suggestion).toMatch(/Améliorez votre prompt/);
  });

  it("accepts a precise prompt with actions, elements and a selector", async () => {
    const result = await validatePrompt(GOOD_PROMPT);
    expect(result.valid).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(75);
  });

  it("keeps the score within 0..100", async () => {
    const long = `${GOOD_PROMPT} `.repeat(30);
    const result = await validatePrompt(long);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("scores a precise prompt higher than a vague one", async () => {
    const good = await validatePrompt(GOOD_PROMPT);
    const vague = await validatePrompt("vérifie que ça marche sur le site");
    expect(good.score).toBeGreaterThan(vague.score);
  });
});

describe("estimatePromptComplexity", () => {
  it("returns 0 for an empty prompt", () => {
    expect(estimatePromptComplexity("")).toBe(0);
  });

  it("always stays within 0..5", () => {
    expect(estimatePromptComplexity(GOOD_PROMPT)).toBeLessThanOrEqual(5);
    expect(estimatePromptComplexity("x".repeat(500))).toBeGreaterThanOrEqual(0);
  });

  it("rates a multi-step prompt above a single action", () => {
    const single = estimatePromptComplexity("click login");
    const multi = estimatePromptComplexity(
      "Remplit le formulaire, clique submit, vérifie la redirection puis le menu"
    );
    expect(multi).toBeGreaterThan(single);
  });
});

describe("analyzePrompt", () => {
  const analysis = analyzePrompt(
    "Clique sur le bouton #login-btn et vérifie le formulaire"
  );

  it("counts the words", () => {
    expect(analysis.wordCount).toBe(9);
  });

  it("detects the action verbs", () => {
    expect(analysis.verbs).toEqual(expect.arrayContaining(["clique", "vérifie"]));
  });

  it("detects UI elements", () => {
    expect(analysis.uiElements).toEqual(
      expect.arrayContaining(["bouton", "formulaire"])
    );
  });

  it("extracts CSS selectors", () => {
    expect(analysis.selectors).toContain("#login-btn");
  });

  it("includes the complexity estimate", () => {
    expect(analysis.complexity).toBe(
      estimatePromptComplexity(
        "Clique sur le bouton #login-btn et vérifie le formulaire"
      )
    );
  });
});

describe("improvePrompt without an API key", () => {
  it("returns the original prompt untouched", async () => {
    await expect(improvePrompt("teste le login")).resolves.toBe("teste le login");
  });
});

describe("validateAndImprovePrompt without an API key", () => {
  it("returns the plain validation result for an invalid prompt", async () => {
    const result = await validateAndImprovePrompt("teste");
    expect(result.valid).toBe(false);
    expect(result.score).toBe(20);
  });

  it("returns a valid result for a good prompt", async () => {
    const result = await validateAndImprovePrompt(GOOD_PROMPT);
    expect(result.valid).toBe(true);
  });
});
