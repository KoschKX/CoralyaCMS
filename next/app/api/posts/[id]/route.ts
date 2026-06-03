import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getPost, updatePost, deletePost } from "@/lib/posts-db";
import { UpdatePostSchema } from "@/lib/api-schemas";

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
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = UpdatePostSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updated = await updatePost(id, result.data);
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
