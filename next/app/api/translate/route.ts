import { NextResponse } from "next/server";

/**
 * POST /api/translate
 * Body: { text: string; from: string; to: string }
 * Proxies to MyMemory (free, no key required for ~5000 words/day).
 * Auth is enforced by middleware (x-user-id header must be present).
 * Returns: { translated: string }
 */
export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { text, from, to } = body as { text?: unknown; from?: unknown; to?: unknown };

  if (typeof text !== "string" || !text.trim())
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  if (typeof from !== "string" || !from)
    return NextResponse.json({ error: "from language is required" }, { status: 400 });
  if (typeof to !== "string" || !to)
    return NextResponse.json({ error: "to language is required" }, { status: 400 });
  if (text.length > 5000)
    return NextResponse.json({ error: "Text too long (max 5000 chars)" }, { status: 400 });

  const langpair = `${from}|${to}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}`;

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  } catch {
    return NextResponse.json({ error: "Translation service unavailable" }, { status: 502 });
  }

  if (!res.ok)
    return NextResponse.json({ error: "Translation service error" }, { status: 502 });

  const data = await res.json() as { responseData?: { translatedText?: string }; responseStatus?: number };

  if (!data.responseData?.translatedText)
    return NextResponse.json({ error: "No translation returned" }, { status: 502 });

  return NextResponse.json({ translated: data.responseData.translatedText });
}
