import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { getSettings } from "@/lib/settings-db";

// Max 20 uploads per IP per minute
const UPLOAD_RATE_LIMIT = 20;

export const dynamic = "force-dynamic";

const MEDIA_DIR = path.join(process.cwd(), "public", "media");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Fallback allowed types used if settings are unavailable
const DEFAULT_ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "video/mp4", "video/webm",
  "audio/mpeg", "audio/ogg", "audio/wav",
  "application/pdf",
]);

// Map from MIME type to valid extensions
const MIME_TO_EXTS: Record<string, string[]> = {
  "image/jpeg":       [".jpg", ".jpeg"],
  "image/png":        [".png"],
  "image/gif":        [".gif"],
  "image/webp":       [".webp"],
  "image/svg+xml":    [".svg"],
  "video/mp4":        [".mp4"],
  "video/webm":       [".webm"],
  "audio/mpeg":       [".mp3"],
  "audio/ogg":        [".ogg"],
  "audio/wav":        [".wav"],
  "application/pdf":  [".pdf"],
};

function getAllowedTypes(): Set<string> {
  try {
    const s = getSettings();
    if (s.allowedMimeTypes?.length) return new Set(s.allowedMimeTypes);
  } catch { /* fall through */ }
  return DEFAULT_ALLOWED_TYPES;
}

function getAllowedExtensions(): Set<string> {
  const types = getAllowedTypes();
  const exts = new Set<string>();
  for (const mime of types) {
    for (const ext of (MIME_TO_EXTS[mime] ?? [])) exts.add(ext);
  }
  return exts;
}

// ── Magic-bytes validation ────────────────────────────────────────────────────
// Verifies the file's actual binary signature matches the declared MIME type,
// preventing a spoofed Content-Type from bypassing the ALLOWED_TYPES check.

type MagicCheck = (buf: Buffer) => boolean;
const MAGIC_CHECKS = new Map<string, MagicCheck>([
  ["image/jpeg",      (b) => b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF],
  ["image/png",       (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47],
  ["image/gif",       (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38],
  ["image/webp",      (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
                              b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50],
  ["application/pdf", (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46],
  ["video/mp4",       (b) => b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70],
  ["video/webm",      (b) => b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3],
  ["image/svg+xml",   (b) => {
    // SVG is text — check for recognised XML/SVG preamble (after optional BOM)
    const text = b.slice(0, 512).toString("utf-8").replace(/^\uFEFF/, "").trimStart();
    return text.startsWith("<svg") || text.startsWith("<?xml") || text.startsWith("<!DOCTYPE svg");
  }],
  ["audio/mpeg",      (b) => (b[0] === 0xFF && (b[1] & 0xE0) === 0xE0) || (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33)], // MP3 sync or ID3
  ["audio/ogg",       (b) => b[0] === 0x4F && b[1] === 0x67 && b[2] === 0x67 && b[3] === 0x53], // OggS
  ["audio/wav",       (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x41 && b[10] === 0x56 && b[11] === 0x45], // RIFF WAVE
]);

function validateMagicBytes(buf: Buffer, mimeType: string): boolean {
  const check = MAGIC_CHECKS.get(mimeType);
  if (!check) return false; // unknown type — reject
  if (buf.length < 12) return false; // too short to be a valid file
  return check(buf);
}

// ── SVG sanitization ─────────────────────────────────────────────────────────
// Strip executable content from SVG before writing to disk.
// This prevents stored-XSS if a user opens the SVG directly in a browser tab.

function sanitizeSVG(buf: Buffer): Buffer {
  let svg = buf.toString("utf-8");
  // Remove <script>…</script> blocks (including multiline)
  svg = svg.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "");
  // Remove inline event-handler attributes (onclick, onload, onerror, etc.)
  svg = svg.replace(/\s+on[a-z][a-z0-9]*\s*=\s*(?:"[^"]*"|'[^']*'|[^\s/>]+)/gi, "");
  // Remove javascript: URI references
  svg = svg.replace(/(href|xlink:href)\s*=\s*["']\s*javascript:[^"']*/gi, '$1=""');
  return Buffer.from(svg, "utf-8");
}

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
  // Rate-limit uploads per client IP to prevent abuse
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  if (!checkRateLimit(ip, UPLOAD_RATE_LIMIT)) {
    return NextResponse.json({ error: "Too many uploads. Please wait before trying again." }, { status: 429 });
  }

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

  if (!getAllowedTypes().has(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 415 });
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!getAllowedExtensions().has(ext)) {
    return NextResponse.json({ error: "File extension not allowed" }, { status: 415 });
  }

  // Read the buffer once so we can validate magic bytes before writing.
  const buffer = Buffer.from(await file.arrayBuffer());

  if (!validateMagicBytes(buffer, file.type)) {
    return NextResponse.json(
      { error: "File content does not match declared type" },
      { status: 415 },
    );
  }

  // Sanitize SVG to strip any executable content before storing.
  const finalBuffer = file.type === "image/svg+xml" ? sanitizeSVG(buffer) : buffer;

  // Sanitize: strip path separators and dangerous characters, keep only safe chars
  const rawBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9._-]/g, "_");
  const safeName = `${Date.now()}-${rawBase}${ext}`;

  ensureMediaDir();
  const dest = path.join(MEDIA_DIR, safeName);
  // Atomic write: write to a temp file then rename so a mid-write crash
  // cannot leave a partially-written file at the public path.
  const tmp = dest + ".tmp";
  fs.writeFileSync(tmp, finalBuffer);
  fs.renameSync(tmp, dest);

  return NextResponse.json(
    { name: safeName, url: `/media/${encodeURIComponent(safeName)}` },
    { status: 201 },
  );
}
