import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getPage, updatePage, deletePage } from "@/lib/pages-db";
import { UpdatePageSchema } from "@/lib/api-schemas";
import { parseSchema, readJsonBody } from "@/lib/api/route-utils";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const page = getPage(id);
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(page);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsedBody = await readJsonBody(req);
  if (!parsedBody.ok) return parsedBody.response;
  const parsed = parseSchema(UpdatePageSchema, parsedBody.body);
  if (!parsed.ok) return parsed.response;

  const updated = await updatePage(id, parsed.data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Bust the ISR cache for this page's public URL immediately.
  if (updated.slug) revalidatePath(`/${updated.slug}`);
  revalidatePath("/");
  return NextResponse.json(updated);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Get the slug before deleting so we can revalidate the specific public URL.
  const page = getPage(id);
  const ok = await deletePage(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (page?.slug) revalidatePath(`/${page.slug}`);
  revalidatePath("/");
  revalidatePath("/", "layout");
  return new NextResponse(null, { status: 204 });
}

