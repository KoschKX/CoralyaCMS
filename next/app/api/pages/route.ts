import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { listPagesMeta, createPage } from "@/lib/pages-db";
import { CreatePageSchema } from "@/lib/api-schemas";
import { paginateList } from "@/lib/utils/paginate";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  return NextResponse.json(paginateList(listPagesMeta(), searchParams));
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = CreatePageSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const page = await createPage(result.data);
  if (page.slug) revalidatePath(`/${page.slug}`);
  revalidatePath("/");
  return NextResponse.json(page, { status: 201 });
}

