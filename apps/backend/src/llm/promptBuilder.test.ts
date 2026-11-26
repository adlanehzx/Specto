import { describe, expect, it } from "vitest";
import {
  buildApiTestPrompt,
  buildApiTestRequest,
  buildLLMPrompt,
  buildLLMRequest,
} from "./promptBuilder";

const USER_PROMPT = "Click the login button and verify the dashboard loads";
const URL = "https://example.com/app";

describe("buildLLMPrompt", () => {
  it("embeds the user request and the target URL", () => {
    const prompt = buildLLMPrompt(USER_PROMPT, URL);
    expect(prompt).toContain(USER_PROMPT);
    expect(prompt).toContain(URL);
  });

  it("is deterministic", () => {
    expect(buildLLMPrompt(USER_PROMPT, URL)).toBe(buildLLMPrompt(USER_PROMPT, URL));
  });

  it("changes when the input changes", () => {
    expect(buildLLMPrompt("another request entirely", URL)).not.toBe(
      buildLLMPrompt(USER_PROMPT, URL)
    );
  });
});

describe("buildLLMRequest", () => {
  it("wraps the prompt in a single system message", () => {
    const request = buildLLMRequest(USER_PROMPT, URL);
    expect(request.messages).toHaveLength(1);
    expect(request.messages[0].role).toBe("system");
    expect(request.messages[0].content).toBe(buildLLMPrompt(USER_PROMPT, URL));
  });

  it("uses a low temperature and a bounded output size", () => {
    const request = buildLLMRequest(USER_PROMPT, URL);
    expect(request.temperature).toBe(0.3);
    expect(request.max_tokens).toBe(2000);
  });
});

describe("buildApiTestPrompt", () => {
  it("embeds the description and the target URL", () => {
    const prompt = buildApiTestPrompt("List users and check the status", URL);
    expect(prompt).toContain("List users and check the status");
    expect(prompt).toContain(URL);
  });
});

describe("buildApiTestRequest", () => {
  it("wraps the API prompt in a single system message", () => {
    const request = buildApiTestRequest("List users", URL);
    expect(request.messages).toHaveLength(1);
    expect(request.messages[0].role).toBe("system");
    expect(request.messages[0].content).toBe(buildApiTestPrompt("List users", URL));
  });

  it("is more deterministic than the E2E request", () => {
    const api = buildApiTestRequest("List users", URL);
    const e2e = buildLLMRequest(USER_PROMPT, URL);
    expect(api.temperature).toBeLessThan(e2e.temperature);
    expect(api.max_tokens).toBe(1500);
  });
});
