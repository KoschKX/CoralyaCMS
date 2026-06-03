import { NextResponse } from "next/server";
import type { z, ZodType } from "zod";

export async function readJsonBody(req: Request): Promise<{ ok: true; body: unknown } | { ok: false; response: NextResponse }> {
  try {
    return { ok: true, body: await req.json() };
  } catch {
    return { ok: false, response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) };
  }
}

export function parseSchema<TSchema extends ZodType>(
  schema: TSchema,
  input: unknown,
):
  | { ok: true; data: z.infer<TSchema> }
  | { ok: false; response: NextResponse } {
  const result = schema.safeParse(input);
  if (!result.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Validation failed", issues: result.error.flatten().fieldErrors },
        { status: 400 },
      ),
    };
  }
  return { ok: true, data: result.data };
}
