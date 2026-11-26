import { describe, expect, it, vi } from "vitest";

// llm.ts builds an OpenAI client at import time, which throws without an API
// key. These tests only cover the pure helpers, so the SDK is replaced.
vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: vi.fn() } };
  },
}));

import {
  estimateTestDuration,
  extractCodeMetadata,
  validateGeneratedCode,
} from "./llm";

const SAMPLE = `import { test, expect } from '@playwright/test';

test('Login', async ({ page }) => {
  await page.goto('https://example.com/login');
  await page.fill('#email', 'a@b.c');
  await page.click('#submit');
  await page.click('#again');
  await page.waitForTimeout(100);
  await expect(page).toHaveURL('/home');
});
`;

describe("validateGeneratedCode", () => {
  it("accepts a complete Playwright test", () => {
    expect(validateGeneratedCode(SAMPLE)).toBe(true);
  });

  it("rejects empty or blank code", () => {
    expect(validateGeneratedCode("")).toBe(false);
    expect(validateGeneratedCode("   \n  ")).toBe(false);
  });

  it("rejects code without the Playwright import", () => {
    expect(validateGeneratedCode(SAMPLE.replace("@playwright/test", "vitest"))).toBe(
      false
    );
  });

  it("rejects code without a test definition", () => {
    const noTest = `import { expect } from '@playwright/test';\nconst f = async () => {};`;
    expect(validateGeneratedCode(noTest)).toBe(false);
  });

  it("rejects code without an async function", () => {
    const noAsync = `import { test } from '@playwright/test';\ntest('x', () => {});`;
    expect(validateGeneratedCode(noAsync)).toBe(false);
  });
});

describe("extractCodeMetadata", () => {
  it("extracts the URL and the test name", () => {
    const metadata = extractCodeMetadata(SAMPLE);
    expect(metadata.url).toBe("https://example.com/login");
    expect(metadata.testName).toBe("Login");
  });

  it("reports which constructs are present", () => {
    const metadata = extractCodeMetadata(SAMPLE);
    expect(metadata.hasImports).toBe(true);
    expect(metadata.hasAsync).toBe(true);
    expect(metadata.hasExpect).toBe(true);
  });

  it("counts lines", () => {
    expect(extractCodeMetadata(SAMPLE).lineCount).toBe(SAMPLE.split("\n").length);
    expect(extractCodeMetadata("a\nb\nc").lineCount).toBe(3);
  });

  it("returns undefined fields when nothing matches", () => {
    const metadata = extractCodeMetadata("const x = 1;");
    expect(metadata.url).toBeUndefined();
    expect(metadata.testName).toBeUndefined();
    expect(metadata.hasImports).toBe(false);
    expect(metadata.hasAsync).toBe(false);
    expect(metadata.hasExpect).toBe(false);
  });
});

describe("estimateTestDuration", () => {
  it("returns the 2s base for code without actions", () => {
    expect(estimateTestDuration("const x = 1;")).toBe(2000);
  });

  it("adds time per click, fill, wait and assertion", () => {
    // base 2000 + 2 clicks * 500 + 1 fill * 300 + 1 wait * 1000 + 1 expect * 200
    expect(estimateTestDuration(SAMPLE)).toBe(4500);
  });

  it("grows with the number of actions", () => {
    const one = estimateTestDuration("await page.click('a');");
    const three = estimateTestDuration(
      "await page.click('a'); await page.click('b'); await page.click('c');"
    );
    expect(three).toBeGreaterThan(one);
    expect(three - one).toBe(1000);
  });
});
