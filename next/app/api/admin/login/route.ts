import { NextResponse } from "next/server";
import { getSessionToken, timingSafeEqual, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";

// ── In-memory rate limiter ───────────────────────────────────────────────────
// Limits login attempts to MAX_ATTEMPTS per WINDOW_MS per IP address.
// Module-level state is shared across requests within the same Node.js process.

const WINDOW_MS = 60_000; // 1 minute
const MAX_ATTEMPTS = 10;

interface RateEntry { count: number; resetAt: number }
const rateLimitMap = new Map<string, RateEntry>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
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

  const submitted = (body as Record<string, unknown>)?.password;
  if (typeof submitted !== "string" || submitted.length === 0) {
    return NextResponse.json({ error: "password is required" }, { status: 400 });
  }

  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin";

  if (!timingSafeEqual(submitted, adminPassword)) {
    // Artificial delay to slow brute-force attempts
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await getSessionToken();
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
