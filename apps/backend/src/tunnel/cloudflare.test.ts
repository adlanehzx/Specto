import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { extractPortFromUrl, isLocalUrl, resolveUrl } from "./cloudflare";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("isLocalUrl", () => {
  it.each([
    "http://localhost:3000",
    "http://LOCALHOST:3000/path",
    "http://127.0.0.1:8080",
    "http://0.0.0.0:5000",
    "http://[::1]:3000",
  ])("treats %s as local", (url) => {
    expect(isLocalUrl(url)).toBe(true);
  });

  it.each([
    "https://example.com",
    "https://example.com:8080",
    "https://localhost.example.com",
  ])("treats %s as public", (url) => {
    expect(isLocalUrl(url)).toBe(false);
  });

  it("returns false for an invalid URL instead of throwing", () => {
    expect(isLocalUrl("not a url")).toBe(false);
    expect(isLocalUrl("")).toBe(false);
  });
});

describe("extractPortFromUrl", () => {
  it("returns the explicit port", () => {
    expect(extractPortFromUrl("http://localhost:3000")).toBe(3000);
    expect(extractPortFromUrl("https://example.com:8080/path?q=1")).toBe(8080);
  });

  it("returns null when no port is specified", () => {
    expect(extractPortFromUrl("http://localhost")).toBeNull();
    expect(extractPortFromUrl("https://example.com")).toBeNull();
  });

  it("returns null for an invalid URL", () => {
    expect(extractPortFromUrl("not a url")).toBeNull();
  });
});

describe("resolveUrl", () => {
  it("returns a public URL unchanged without creating a tunnel", async () => {
    await expect(resolveUrl("https://example.com/page")).resolves.toEqual({
      url: "https://example.com/page",
      tunnelCreated: false,
    });
  });

  it("refuses a local URL that has no port", async () => {
    await expect(resolveUrl("http://localhost")).rejects.toThrow(
      /port not specified/
    );
  });
});
