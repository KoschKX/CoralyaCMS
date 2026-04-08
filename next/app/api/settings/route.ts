import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings-db";
import type { SiteSettings } from "@/lib/settings-types";

export const dynamic = "force-dynamic";

/** Only these top-level keys are accepted from client PATCH requests. */
const ALLOWED_KEYS = new Set<keyof SiteSettings>([
  "title",
  "tagline",
  "description",
  "siteUrl",
  "logoUrl",
  "disabledBlocks",
  "paletteColors",
  "typography",
  "layout",
]);

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

  // Strip any keys not in the allowlist before persisting
  const raw = body as Record<string, unknown>;
  const sanitized: Partial<SiteSettings> = {};
  for (const key of ALLOWED_KEYS) {
    if (key in raw) (sanitized as Record<string, unknown>)[key] = raw[key];
  }

  const updated = saveSettings(sanitized);
  return NextResponse.json(updated);
}

