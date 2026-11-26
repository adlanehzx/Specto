import { describe, expect, it } from "vitest";
import {
  validateCreateResult,
  validateCreateTest,
  validateTestId,
} from "./testValidator";

describe("validateCreateTest", () => {
  const valid = {
    url: "https://example.com/login",
    prompt: "Click the login button and check the dashboard",
    userId: "user-1",
  };

  it("accepts a well-formed payload", () => {
    const result = validateCreateTest(valid);
    expect(result.success).toBe(true);
  });

  it("rejects a malformed URL", () => {
    const result = validateCreateTest({ ...valid, url: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects a prompt shorter than 10 characters", () => {
    const result = validateCreateTest({ ...valid, prompt: "too short" });
    expect(result.success).toBe(false);
  });

  it("rejects a prompt longer than 2000 characters", () => {
    const result = validateCreateTest({ ...valid, prompt: "a".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("accepts a prompt of exactly 2000 characters", () => {
    const result = validateCreateTest({ ...valid, prompt: "a".repeat(2000) });
    expect(result.success).toBe(true);
  });

  it("rejects an empty user id", () => {
    const result = validateCreateTest({ ...valid, userId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields and reports which ones", () => {
    const result = validateCreateTest({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path[0]);
      expect(fields).toEqual(expect.arrayContaining(["url", "prompt", "userId"]));
    }
  });

  it("rejects non-object input", () => {
    expect(validateCreateTest(null).success).toBe(false);
    expect(validateCreateTest("string").success).toBe(false);
  });
});

describe("validateTestId", () => {
  it("accepts a non-empty id", () => {
    expect(validateTestId("abc123").success).toBe(true);
  });

  it("rejects an empty id", () => {
    expect(validateTestId("").success).toBe(false);
  });
});

describe("validateCreateResult", () => {
  it.each(["success", "failure", "error", "pending"])(
    "accepts the status %s",
    (status) => {
      expect(validateCreateResult({ testId: "t1", status }).success).toBe(true);
    }
  );

  it("rejects an unknown status", () => {
    expect(validateCreateResult({ testId: "t1", status: "done" }).success).toBe(
      false
    );
  });

  it("accepts optional and nullable fields", () => {
    const result = validateCreateResult({
      testId: "t1",
      status: "success",
      logs: null,
      screenshotUrl: "https://cdn.example.com/shot.png",
      duration: 1200,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-positive or non-integer duration", () => {
    expect(
      validateCreateResult({ testId: "t1", status: "success", duration: 0 })
        .success
    ).toBe(false);
    expect(
      validateCreateResult({ testId: "t1", status: "success", duration: 1.5 })
        .success
    ).toBe(false);
  });

  it("rejects an invalid screenshot URL", () => {
    expect(
      validateCreateResult({
        testId: "t1",
        status: "success",
        screenshotUrl: "nope",
      }).success
    ).toBe(false);
  });
});
