import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const MEDIA_DIR = path.join(process.cwd(), "public", "media");

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  // Prevent path traversal: reject any slashes or dots that escape the directory
  const safe = path.basename(filename);
  if (!safe || safe !== filename || safe.startsWith(".")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const filePath = path.join(MEDIA_DIR, safe);

  // Double-check the resolved path is still inside MEDIA_DIR
  if (!path.resolve(filePath).startsWith(path.resolve(MEDIA_DIR) + path.sep)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  fs.unlinkSync(filePath);
  return NextResponse.json({ ok: true });
}
