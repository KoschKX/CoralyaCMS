import { NextResponse } from "next/server";
import { listPages, createPage } from "@/lib/pages-db";

export async function GET() {
  return NextResponse.json(listPages());
}

export async function POST(req: Request) {
  const body = await req.json();
  const page = createPage(body);
  return NextResponse.json(page, { status: 201 });
}
