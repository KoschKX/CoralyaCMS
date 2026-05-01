import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const MEDIA_DIR = path.join(process.cwd(), "public", "media");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "application/pdf",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".mp4",
  ".webm",
  ".pdf",
]);

function ensureMediaDir() {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

export function GET() {
  ensureMediaDir();
  const files = fs
    .readdirSync(MEDIA_DIR)
    .filter((f) => !f.startsWith("."))
    .map((name) => {
      const stat = fs.statSync(path.join(MEDIA_DIR, name));
      return {
        name,
        url: `/media/${encodeURIComponent(name)}`,
        size: stat.size,
        createdAt: stat.birthtime.toISOString(),
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(files);
}

export async function POST(req: Request) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 415 });
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: "File extension not allowed" }, { status: 415 });
  }

  // Sanitize: strip path separators and dangerous characters, keep only safe chars
  const rawBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9._-]/g, "_");
  const safeName = `${Date.now()}-${rawBase}${ext}`;

  ensureMediaDir();
  const dest = path.join(MEDIA_DIR, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(dest, buffer);

  return NextResponse.json(
    { name: safeName, url: `/media/${encodeURIComponent(safeName)}` },
    { status: 201 },
  );
}
