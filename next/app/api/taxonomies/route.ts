import { NextResponse } from "next/server";
import { listTaxonomies, createTaxonomy } from "@/lib/taxonomies-db";
import { CreateTaxonomySchema } from "@/lib/api-schemas";
import { parseSchema, readJsonBody } from "@/lib/api/route-utils";

export async function GET() {
  return NextResponse.json(listTaxonomies());
}

export async function POST(req: Request) {
  const parsedBody = await readJsonBody(req);
  if (!parsedBody.ok) return parsedBody.response;
  const parsed = parseSchema(CreateTaxonomySchema, parsedBody.body);
  if (!parsed.ok) return parsed.response;

  const taxonomy = await createTaxonomy(parsed.data);
  return NextResponse.json(taxonomy, { status: 201 });
}
