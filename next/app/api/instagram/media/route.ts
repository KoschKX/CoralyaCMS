import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings-db";

export const dynamic = "force-dynamic";

export interface InstagramPost {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp?: string;
}

export async function GET(req: Request) {
  const settings = getSettings();
  const token = settings.instagramAccessToken?.trim();

  if (!token) {
    return NextResponse.json(
      { posts: [], error: "No Instagram access token configured. Add one in Admin → Settings → Integrations." },
    );
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(1, Number(searchParams.get("limit") || "9")), 30);

  const url = new URL("https://graph.instagram.com/v21.0/me/media");
  url.searchParams.set(
    "fields",
    "id,media_type,media_url,thumbnail_url,permalink,caption,timestamp",
  );
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", token);

  try {
    const res = await fetch(url.toString(), {
      // Cache responses for 1 hour so rapid page refreshes don't hammer the API
      next: { revalidate: 3600 },
    });

    const body = await res.json() as { data?: InstagramPost[]; error?: { message?: string } };

    if (!res.ok) {
      const msg = body?.error?.message ?? "Instagram API error";
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    return NextResponse.json({ posts: body.data ?? [] });
  } catch {
    return NextResponse.json({ error: "Failed to reach Instagram API" }, { status: 500 });
  }
}
