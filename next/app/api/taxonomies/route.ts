import { NextResponse } from "next/server";
import { listTaxonomies, createTaxonomy } from "@/lib/taxonomies-db";
import { CreateTaxonomySchema } from "@/lib/api-schemas";

export async function GET() {
  return NextResponse.json(listTaxonomies());
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = CreateTaxonomySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const taxonomy = await createTaxonomy(result.data);
  return NextResponse.json(taxonomy, { status: 201 });
}
