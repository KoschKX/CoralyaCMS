import { NextRequest, NextResponse } from "next/server";
import {
  getSessionToken,
  timingSafeEqual,
  verifyUserSession,
  COOKIE_NAME,
} from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // These admin API endpoints handle their own auth (login + logout)
  if (
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout"
  ) {
    return NextResponse.next();
  }

  // ── CSRF: Origin header check for state-mutating requests ─────────────────
  // Browsers always send `Origin` on cross-origin requests (POST/PUT/PATCH/DELETE).
  // If it is present and does not match our own host, reject — this prevents an
  // attacker's page from making authenticated requests using the victim's cookie.
  // Requests without Origin (e.g. cURL, server-to-server) are allowed through;
  // they cannot carry the HTTP-only session cookie anyway.
  const mutationMethods = ["POST", "PUT", "PATCH", "DELETE"];
  if (pathname.startsWith("/api/") && mutationMethods.includes(req.method)) {
    const origin = req.headers.get("origin");
    if (origin && origin !== req.nextUrl.origin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const token = req.cookies.get(COOKIE_NAME)?.value ?? "";

  // ── New multi-user session (contains ".") ──────────────────────────────────
  if (token.includes(".")) {
    const session = await verifyUserSession(token);
    if (session) {
      const reqHeaders = new Headers(req.headers);
      reqHeaders.set("x-user-id", session.sub);
      reqHeaders.set("x-user-name", session.name);
      reqHeaders.set("x-user-role", session.role);
      return NextResponse.next({ request: { headers: reqHeaders } });
    }
  } else {
    // ── Legacy single-admin session (no ".") ───────────────────────────────
    // Accepted until the user logs in again and gets a new-format cookie.
    const expected = await getSessionToken();
    if (timingSafeEqual(token, expected)) {
      const reqHeaders = new Headers(req.headers);
      reqHeaders.set("x-user-id", "legacy-admin");
      reqHeaders.set("x-user-name", "admin");
      reqHeaders.set("x-user-role", "administrator");
      return NextResponse.next({ request: { headers: reqHeaders } });
    }
  }

  // Unauthorized
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admin pages: redirect to login, preserving the intended destination
  const loginUrl = new URL("/admin/login", req.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/pages/:path*",
    "/api/settings/:path*",
    "/api/plugins/:path*",
    "/api/media",
    "/api/media/:path*",
    // Users API is protected so role checks can read headers set above
    "/api/admin/users",
    "/api/admin/users/:path*",
  ],
};
