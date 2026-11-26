import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({ prisma: {} }));

const SECRET = "unit-test-secret";

type Middleware = (req: Request, res: Response, next: NextFunction) => unknown;

let authenticate: Middleware;
let optionalAuth: Middleware;

function makeRequest(authorization?: string): Request {
  return {
    path: "/api/tests",
    headers: authorization ? { authorization } : {},
  } as unknown as Request;
}

function makeResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response & typeof res;
}

beforeEach(async () => {
  vi.stubEnv("JWT_SECRET", SECRET);
  vi.resetModules();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  const mod = await import("./auth");
  authenticate = mod.authenticate as Middleware;
  optionalAuth = mod.optionalAuth as Middleware;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("authenticate", () => {
  it("rejects a request without an Authorization header", async () => {
    const res = makeResponse();
    const next = vi.fn();

    await authenticate(makeRequest(), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a header that is not a Bearer token", async () => {
    const res = makeResponse();
    const next = vi.fn();

    await authenticate(makeRequest("Basic abc123"), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a token signed with another secret", async () => {
    const token = jwt.sign({ userId: "u1", email: "a@b.c" }, "wrong-secret");
    const res = makeResponse();
    const next = vi.fn();

    await authenticate(makeRequest(`Bearer ${token}`), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Token invalide" });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a malformed token", async () => {
    const res = makeResponse();
    const next = vi.fn();

    await authenticate(makeRequest("Bearer not.a.jwt"), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an expired token with a dedicated message", async () => {
    const token = jwt.sign({ userId: "u1", email: "a@b.c" }, SECRET, {
      expiresIn: -10,
    });
    const res = makeResponse();
    const next = vi.fn();

    await authenticate(makeRequest(`Bearer ${token}`), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Token expiré - Veuillez vous reconnecter",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts a valid token and attaches the user to the request", async () => {
    const token = jwt.sign({ userId: "u1", email: "a@b.c" }, SECRET, {
      expiresIn: "1h",
    });
    const req = makeRequest(`Bearer ${token}`);
    const res = makeResponse();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.userId).toBe("u1");
    expect(req.userEmail).toBe("a@b.c");
    expect(req.user).toEqual({ id: "u1", email: "a@b.c" });
  });
});

describe("optionalAuth", () => {
  it("continues without a user when no header is sent", () => {
    const req = makeRequest();
    const next = vi.fn();

    optionalAuth(req, makeResponse(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.userId).toBeUndefined();
  });

  it("continues without a user when the token is invalid", () => {
    const req = makeRequest("Bearer garbage");
    const next = vi.fn();

    optionalAuth(req, makeResponse(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.userId).toBeUndefined();
  });

  it("attaches the user when the token is valid", () => {
    const token = jwt.sign({ userId: "u2", email: "x@y.z" }, SECRET);
    const req = makeRequest(`Bearer ${token}`);
    const next = vi.fn();

    optionalAuth(req, makeResponse(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.userId).toBe("u2");
    expect(req.userEmail).toBe("x@y.z");
  });
});
