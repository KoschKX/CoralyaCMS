import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings-db";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getSettings());
}

export async function PATCH(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
  }
  const updated = saveSettings(body as Parameters<typeof saveSettings>[0]);
  return NextResponse.json(updated);
}
