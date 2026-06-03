import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSettings, saveSettings } from "@/lib/settings-db";
import { UpdateSettingsSchema } from "@/lib/api-schemas";

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

  const result = UpdateSettingsSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updated = await saveSettings(result.data);
  // Bust the layout cache so the new CSS custom properties take effect site-wide.
  revalidatePath("/", "layout");
  return NextResponse.json(updated);
}


