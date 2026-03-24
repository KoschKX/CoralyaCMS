import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings-db";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getSettings());
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const updated = saveSettings(body);
  return NextResponse.json(updated);
}
