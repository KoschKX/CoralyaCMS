import { describe, it, expect, beforeAll } from "vitest";
import { timingSafeEqual, createUserSession, verifyUserSession } from "@/lib/auth";

// Use a fixed test secret so tests never touch production defaults
beforeAll(() => {
  process.env.SESSION_SECRET = "vitest-secret-not-for-production-use-abc123";
  // Ensure NODE_ENV is not "production" during tests so getSecret() doesn't throw
  // for the real default; the override above is what matters anyway.
});

describe("timingSafeEqual", () => {
  it("returns true for identical strings", () => {
    expect(timingSafeEqual("hello", "hello")).toBe(true);
  });

  it("returns false for strings with different content", () => {
    expect(timingSafeEqual("hello", "world")).toBe(false);
  });

  it("returns false for strings with different lengths", () => {
    expect(timingSafeEqual("short", "longer")).toBe(false);
  });

  it("returns true for two empty strings", () => {
    expect(timingSafeEqual("", "")).toBe(true);
  });

  it("returns false when one string is empty", () => {
    expect(timingSafeEqual("", "x")).toBe(false);
    expect(timingSafeEqual("x", "")).toBe(false);
  });

  it("is not fooled by prefix match", () => {
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
  });
});

describe("createUserSession + verifyUserSession", () => {
  const payload = {
    sub: "user-1",
    name: "alice",
    role: "administrator",
    iat: 1_700_000_000,
  };

  it("round-trips a valid payload", async () => {
    const token = await createUserSession(payload);
    const decoded = await verifyUserSession(token);
    expect(decoded).toEqual(payload);
  });

  it("returns null for a tampered signature", async () => {
    const token = await createUserSession(payload);
    // Replace the last 4 chars of the signature with 'xxxx'
    const tampered = token.slice(0, -4) + "xxxx";
    expect(await verifyUserSession(tampered)).toBeNull();
  });

  it("returns null for a tampered payload (role escalation)", async () => {
    const editorPayload = { ...payload, role: "editor" };
    const token = await createUserSession(editorPayload);
    // Build a token with elevated role but the original signature
    const dotIdx = token.lastIndexOf(".");
    const originalSig = token.slice(dotIdx);
    const fakePayload = btoa(JSON.stringify({ ...editorPayload, role: "administrator" }))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    const tampered = fakePayload + originalSig;
    expect(await verifyUserSession(tampered)).toBeNull();
  });

  it("returns null for a token with no dot separator", async () => {
    expect(await verifyUserSession("nodottoken")).toBeNull();
  });

  it("returns null for an empty token", async () => {
    expect(await verifyUserSession("")).toBeNull();
  });

  it("returns null for a token signed with a different secret", async () => {
    // Temporarily switch to a different secret, sign, then restore
    const original = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = "different-secret-xyz-abc-123-456-789";
    const tokenOtherSecret = await createUserSession(payload);
    process.env.SESSION_SECRET = original;
    expect(await verifyUserSession(tokenOtherSecret)).toBeNull();
  });
});
