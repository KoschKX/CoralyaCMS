import { NextResponse } from "next/server";
import { getTaxonomy, updateTaxonomy, deleteTaxonomy } from "@/lib/taxonomies-db";
import { UpdateTaxonomySchema } from "@/lib/api-schemas";
import { parseSchema, readJsonBody } from "@/lib/api/route-utils";

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
  const parsedBody = await readJsonBody(req);
  if (!parsedBody.ok) return parsedBody.response;
  const parsed = parseSchema(UpdateTaxonomySchema, parsedBody.body);
  if (!parsed.ok) return parsed.response;

  const updated = await updateTaxonomy(id, parsed.data);
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
