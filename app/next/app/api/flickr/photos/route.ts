import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings-db";

export interface FlickrPhoto {
  id:       string;
  title:    string;
  pageUrl:  string;  // https://www.flickr.com/photos/{owner}/{id}/
  url_z?:   string;  // 640 wide  — main display size
  url_b?:   string;  // 1024 wide — lightbox / full
  url_m?:   string;  // 240 wide  — fallback thumbnail
  width_z?: string;
  height_z?: string;
}

const FLICKR_REST = "https://api.flickr.com/services/rest/";
const EXTRAS      = "url_z,url_b,url_m,owner_name";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type    = searchParams.get("type")    ?? "photostream"; // "photostream" | "album"
  const userId  = searchParams.get("userId")  ?? "";
  const albumId = searchParams.get("albumId") ?? "";
  const limit   = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 12));

  const settings = await getSettings();
  const apiKey   = settings.flickrApiKey ?? "";

  if (!apiKey) {
    return NextResponse.json({ error: "No Flickr API key configured. Add one in Settings → Integrations." }, { status: 200 });
  }
  if (!userId) {
    return NextResponse.json({ error: "No Flickr user ID set. Add one in the block settings." }, { status: 200 });
  }

  try {
    let flickrUrl: string;

    if (type === "album" && albumId) {
      flickrUrl =
        `${FLICKR_REST}?method=flickr.photosets.getPhotos` +
        `&api_key=${encodeURIComponent(apiKey)}` +
        `&photoset_id=${encodeURIComponent(albumId)}` +
        `&user_id=${encodeURIComponent(userId)}` +
        `&per_page=${limit}` +
        `&extras=${EXTRAS}` +
        `&format=json&nojsoncallback=1`;
    } else {
      flickrUrl =
        `${FLICKR_REST}?method=flickr.people.getPublicPhotos` +
        `&api_key=${encodeURIComponent(apiKey)}` +
        `&user_id=${encodeURIComponent(userId)}` +
        `&per_page=${limit}` +
        `&extras=${EXTRAS}` +
        `&format=json&nojsoncallback=1`;
    }

    const res  = await fetch(flickrUrl, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json({ error: `Flickr API returned ${res.status}` }, { status: 200 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();

    if (data.stat !== "ok") {
      const msg = data.message ?? "Unknown Flickr error";
      return NextResponse.json({ error: msg }, { status: 200 });
    }

    // Normalise photostream vs. photoset response shapes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawPhotos: any[] =
      type === "album" && albumId
        ? (data.photoset?.photo ?? [])
        : (data.photos?.photo   ?? []);

    const photos: FlickrPhoto[] = rawPhotos.map((p) => ({
      id:       String(p.id),
      title:    String(p.title ?? ""),
      pageUrl:  `https://www.flickr.com/photos/${encodeURIComponent(p.owner ?? userId)}/${encodeURIComponent(p.id)}/`,
      url_z:    p.url_z   as string | undefined,
      url_b:    p.url_b   as string | undefined,
      url_m:    p.url_m   as string | undefined,
      width_z:  p.width_z  as string | undefined,
      height_z: p.height_z as string | undefined,
    }));

    return NextResponse.json({ photos });
  } catch (err) {
    console.error("[flickr/photos]", err);
    return NextResponse.json({ error: "Failed to fetch photos from Flickr." }, { status: 200 });
  }
}
