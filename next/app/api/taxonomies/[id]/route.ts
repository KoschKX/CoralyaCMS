import { NextResponse } from "next/server";
import { getTaxonomy, updateTaxonomy, deleteTaxonomy } from "@/lib/taxonomies-db";
import { UpdateTaxonomySchema } from "@/lib/api-schemas";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const taxonomy = getTaxonomy(id);
  if (!taxonomy) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(taxonomy);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = UpdateTaxonomySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updated = await updateTaxonomy(id, result.data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ok = await deleteTaxonomy(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
