import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { listPostsMeta, createPost } from "@/lib/posts-db";
import { CreatePostSchema } from "@/lib/api-schemas";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const all = listPostsMeta();
  const start = (page - 1) * limit;
  return NextResponse.json({
    data: all.slice(start, start + limit),
    total: all.length,
    page,
    limit,
  });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = CreatePostSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const post = await createPost(result.data);
  if (post.slug) revalidatePath(`/posts/${post.slug}`);
  revalidatePath("/posts");
  return NextResponse.json(post, { status: 201 });
}
