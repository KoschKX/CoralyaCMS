/**
 * Auth utilities — edge-runtime compatible (Web Crypto API only).
 *
 * Session strategy: the cookie value is HMAC-SHA256(SESSION_SECRET, ADMIN_PASSWORD).
 * Changing either env var immediately invalidates all existing sessions.
 *
 * Set env vars in .env.local (never commit them):
 *   SESSION_SECRET=<random 32+ char string>
 *   ADMIN_PASSWORD=<your chosen password>
 */

export const COOKIE_NAME = "admin-session";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

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
