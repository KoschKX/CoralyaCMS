import { NextResponse } from "next/server";
import {
  createUserSession,
  type SessionPayload,
  COOKIE_NAME,
  COOKIE_MAX_AGE,
} from "@/lib/auth";
import { LoginSchema } from "@/lib/api-schemas";
import {
  ensureDefaultAdmin,
  getUserByUsername,
  verifyPassword,
} from "@/lib/users-db";

// ── In-memory rate limiter ───────────────────────────────────────────────────
// Limits login attempts to MAX_ATTEMPTS per WINDOW_MS per IP address.
// Module-level state is shared across requests within the same Node.js process.
// Note: state does not survive process restarts and is not shared across
// multiple instances. For horizontal scaling, replace with a Redis-backed store.

const WINDOW_MS = 60_000; // 1 minute
const MAX_ATTEMPTS = 10;

interface RateEntry { count: number; resetAt: number }
const rateLimitMap = new Map<string, RateEntry>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  // Prune expired entries from ALL IPs to prevent unbounded map growth.
  for (const [key, val] of rateLimitMap) {
    if (val.resetAt < now) rateLimitMap.delete(key);
  }
  const entry = rateLimitMap.get(ip);
  if (!entry) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (entry.count >= MAX_ATTEMPTS) return true;
  entry.count++;
  return false;
}

export async function POST(req: Request) {
  // Extract client IP from standard proxy headers
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = LoginSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 },
    );
  }

  // Bootstrap default admin from ADMIN_PASSWORD env var on first login
  await ensureDefaultAdmin();

  const user = getUserByUsername(result.data.username);
  const passwordValid = user
    ? await verifyPassword(result.data.password, user.passwordHash)
    : false;

  if (!user || !passwordValid) {
    // Artificial delay to slow brute-force attempts
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 },
    );
  }

  const payload: SessionPayload = {
    sub: user.id,
    name: user.username,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
  };

  const token = await createUserSession(payload);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

