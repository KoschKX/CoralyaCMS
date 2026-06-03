import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getPost, updatePost, deletePost } from "@/lib/posts-db";
import { UpdatePostSchema } from "@/lib/api-schemas";
import { parseSchema, readJsonBody } from "@/lib/api/route-utils";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const post = getPost(id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsedBody = await readJsonBody(req);
  if (!parsedBody.ok) return parsedBody.response;
  const parsed = parseSchema(UpdatePostSchema, parsedBody.body);
  if (!parsed.ok) return parsed.response;

  const updated = await updatePost(id, parsed.data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (updated.slug) revalidatePath(`/posts/${updated.slug}`);
  revalidatePath("/posts");
  return NextResponse.json(updated);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const post = getPost(id);
  const ok = await deletePost(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (post?.slug) revalidatePath(`/posts/${post.slug}`);
  revalidatePath("/posts");
  return new NextResponse(null, { status: 204 });
}
