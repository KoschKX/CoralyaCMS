import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSettings, saveSettings } from "@/lib/settings-db";
import { UpdateSettingsSchema } from "@/lib/api-schemas";
import { parseSchema, readJsonBody } from "@/lib/api/route-utils";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getSettings());
}

export async function PATCH(req: Request) {
  const parsedBody = await readJsonBody(req);
  if (!parsedBody.ok) return parsedBody.response;
  const parsed = parseSchema(UpdateSettingsSchema, parsedBody.body);
  if (!parsed.ok) return parsed.response;

  const updated = await saveSettings(parsed.data);
  // Bust the layout cache so the new CSS custom properties take effect site-wide.
  revalidatePath("/", "layout");
  return NextResponse.json(updated);
}


