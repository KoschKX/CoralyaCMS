import { NextRequest, NextResponse } from "next/server";
import { getSessionToken, timingSafeEqual, COOKIE_NAME } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page and admin API endpoints through without auth check
  if (pathname === "/admin/login" || pathname.startsWith("/api/admin/")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const expected = await getSessionToken();

  if (timingSafeEqual(token, expected)) {
    return NextResponse.next();
  }

  // API routes: return JSON 401
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admin pages: redirect to login, preserving the intended destination
  const loginUrl = new URL("/admin/login", req.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/pages/:path*", "/api/settings/:path*"],
};
