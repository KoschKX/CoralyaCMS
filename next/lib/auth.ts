/**
 * Auth utilities — edge-runtime compatible (Web Crypto API only).
 *
 * Session strategy (multi-user):
 *   Cookie = base64url(JSON payload) + "." + HMAC-SHA256(SESSION_SECRET, base64url(payload))
 *   The payload contains { sub: userId, name: username, role, iat }.
 *   The middleware verifies the signature and injects user headers for API routes.
 *
 * Legacy single-admin strategy (backward compat):
 *   Cookie = HMAC-SHA256(SESSION_SECRET, ADMIN_PASSWORD)
 *   Still accepted by middleware to avoid locking out existing deployments until
 *   they log in again after the user system is bootstrapped.
 *
 * Set env vars in .env.local (never commit them):
 *   SESSION_SECRET=<random 32+ char string>
 *   ADMIN_PASSWORD=<your chosen password>   ← used to seed the default admin user
 */

export const COOKIE_NAME = "admin-session";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// ── Session payload ───────────────────────────────────────────────────────────

export interface SessionPayload {
  sub: string;   // user id
  name: string;  // username
  role: string;  // UserRole
  iat: number;   // issued-at (unix seconds)
}

// ── HMAC helper ───────────────────────────────────────────────────────────────

async function hmacSHA256(keyStr: string, msgStr: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(keyStr),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msgStr));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Returns the expected session cookie value.
 * Derived from SESSION_SECRET and ADMIN_PASSWORD so it is stable across
 * requests without server-side session storage.
 */
export async function getSessionToken(): Promise<string> {
  const secret = process.env.SESSION_SECRET ?? "dev-secret-change-me";
  const password = process.env.ADMIN_PASSWORD ?? "admin";

  if (process.env.NODE_ENV === "production") {
    if (secret === "dev-secret-change-me" || password === "admin") {
      console.warn(
        "[auth] WARNING: Using default SESSION_SECRET or ADMIN_PASSWORD in production. " +
          "Set SESSION_SECRET and ADMIN_PASSWORD in your environment.",
      );
    }
  }

  return hmacSHA256(secret, password);
}

/**
 * Constant-time string comparison to mitigate timing attacks.
 * Pads both strings to the same length before comparing.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  // Pad to the longer length so length differences don't leak timing info
  const len = Math.max(a.length, b.length, 64);
  const aBytes = enc.encode(a.padEnd(len, "\0"));
  const bBytes = enc.encode(b.padEnd(len, "\0"));
  let diff = a.length ^ b.length; // non-zero if lengths differ
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

// ── Signed session tokens (multi-user) ────────────────────────────────────────
// Format: base64url(payload_json) + "." + hmac_hex
// All operations use Web Crypto / btoa — edge-runtime compatible.

function toB64url(str: string): string {
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function fromB64url(str: string): string {
  // Re-pad before passing to atob
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "="));
}

/**
 * Create a signed session cookie value for a logged-in user.
 */
export async function createUserSession(payload: SessionPayload): Promise<string> {
  const secret = process.env.SESSION_SECRET ?? "dev-secret-change-me";
  const data = toB64url(JSON.stringify(payload));
  const sig = await hmacSHA256(secret, data);
  return `${data}.${sig}`;
}

/**
 * Verify a signed session cookie value and return the decoded payload.
 * Returns null if the token is invalid or tampered.
 */
export async function verifyUserSession(token: string): Promise<SessionPayload | null> {
  const secret = process.env.SESSION_SECRET ?? "dev-secret-change-me";
  const lastDot = token.lastIndexOf(".");
  if (lastDot < 0) return null;

  const data = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expectedSig = await hmacSHA256(secret, data);

  if (!timingSafeEqual(sig, expectedSig)) return null;

  try {
    return JSON.parse(fromB64url(data)) as SessionPayload;
  } catch {
    return null;
  }
}
