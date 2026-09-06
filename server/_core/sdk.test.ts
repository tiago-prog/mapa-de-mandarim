import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Sdk = typeof import("./sdk")["sdk"];

describe("session tokens", () => {
  const previousSecret = process.env.JWT_SECRET;
  let sdk: Sdk;

  beforeEach(async () => {
    process.env.JWT_SECRET = "test-session-secret";
    vi.resetModules();
    sdk = (await import("./sdk")).sdk;
  });

  afterEach(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });

  it("round-trips sessionVersion in the signed payload", async () => {
    const token = await sdk.signSession(
      { openId: "google:test", name: "Test User", sessionVersion: 4 },
      { expiresInMs: 60_000 },
    );

    await expect(sdk.verifySession(token)).resolves.toEqual({
      openId: "google:test",
      name: "Test User",
      sessionVersion: 4,
    });
  });

  it("rejects an expired token", async () => {
    const token = await sdk.signSession(
      { openId: "google:expired", name: "Expired User", sessionVersion: 0 },
      { expiresInMs: -1_000 },
    );

    await expect(sdk.verifySession(token)).resolves.toBeNull();
  });
});
