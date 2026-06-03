import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { listPagesMeta, createPage } from "@/lib/pages-db";
import { CreatePageSchema } from "@/lib/api-schemas";
import { paginateList } from "@/lib/utils/paginate";
import { parseSchema, readJsonBody } from "@/lib/api/route-utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  return NextResponse.json(paginateList(listPagesMeta(), searchParams));
}

export async function POST(req: Request) {
  const parsedBody = await readJsonBody(req);
  if (!parsedBody.ok) return parsedBody.response;
  const parsed = parseSchema(CreatePageSchema, parsedBody.body);
  if (!parsed.ok) return parsed.response;

  const page = await createPage(parsed.data);
  if (page.slug) revalidatePath(`/${page.slug}`);
  revalidatePath("/");
  return NextResponse.json(page, { status: 201 });
}

