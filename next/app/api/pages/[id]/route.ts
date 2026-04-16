import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getPage, updatePage, deletePage } from "@/lib/pages-db";

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
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
  }
  const data = body as Record<string, unknown>;
  if (data.blocks !== undefined && !Array.isArray(data.blocks)) {
    return NextResponse.json({ error: "blocks must be an array" }, { status: 400 });
  }
  const updated = await updatePage(id, data);
  if (!updated)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  const ok = await deletePage(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  revalidatePath("/", "layout");
  return new NextResponse(null, { status: 204 });
}
