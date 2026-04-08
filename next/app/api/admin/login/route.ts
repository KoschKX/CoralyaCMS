import { NextResponse } from "next/server";
import { getSessionToken, timingSafeEqual, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";

export async function POST(req: Request) {
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
