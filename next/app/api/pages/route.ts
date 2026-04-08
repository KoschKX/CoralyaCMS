import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { listPages, createPage } from "@/lib/pages-db";

export async function GET() {
  return NextResponse.json(listPages());
}

export async function POST(req: Request) {
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
  if (data.slug !== undefined && typeof data.slug !== "string") {
    return NextResponse.json({ error: "slug must be a string" }, { status: 400 });
  }
  if (data.blocks !== undefined && !Array.isArray(data.blocks)) {
    return NextResponse.json({ error: "blocks must be an array" }, { status: 400 });
  }
  const page = createPage(data);
  if (page.slug) revalidatePath(`/${page.slug}`);
  return NextResponse.json(page, { status: 201 });
}
