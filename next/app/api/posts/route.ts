import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { listPostsMeta, createPost } from "@/lib/posts-db";
import { CreatePostSchema } from "@/lib/api-schemas";
import { paginateList } from "@/lib/utils/paginate";
import { parseSchema, readJsonBody } from "@/lib/api/route-utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  return NextResponse.json(paginateList(listPostsMeta(), searchParams));
}

export async function POST(req: Request) {
  const parsedBody = await readJsonBody(req);
  if (!parsedBody.ok) return parsedBody.response;
  const parsed = parseSchema(CreatePostSchema, parsedBody.body);
  if (!parsed.ok) return parsed.response;

  const post = await createPost(parsed.data);
  if (post.slug) revalidatePath(`/posts/${post.slug}`);
  revalidatePath("/posts");
  return NextResponse.json(post, { status: 201 });
}
