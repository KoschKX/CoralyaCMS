"use client";

import { useState, useEffect } from "react";
import type { BlockLayoutProps } from "@/lib/block-types";
import type { FlickrPhoto } from "@/app/api/flickr/photos/route";

// Placeholder gradients shown while loading or when API key/user ID not yet set
const GRADIENTS = [
  "linear-gradient(135deg,#ff0084 0%,#ff6ab2 100%)",
  "linear-gradient(135deg,#0063dc 0%,#5ba4f5 100%)",
  "linear-gradient(135deg,#ff0084 0%,#0063dc 100%)",
  "linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)",
  "linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)",
  "linear-gradient(135deg,#fa709a 0%,#fee140 100%)",
  "linear-gradient(135deg,#a18cd1 0%,#fbc2eb 100%)",
  "linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)",
  "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
  "linear-gradient(135deg,#f77062 0%,#fe5196 100%)",
  "linear-gradient(135deg,#d4fc79 0%,#96e6a1 100%)",
  "linear-gradient(135deg,#0ba360 0%,#3cba92 100%)",
];

const MASONRY_RATIOS = [
  "1/1","4/3","3/4","4/3","1/1","3/4",
  "4/3","1/1","3/4","4/3","1/1","3/4",
];

export default function FlickrLayout({ data, blockId }: BlockLayoutProps) {
  const limit        = Math.max(1, Number(data.limit)   || 12);
  const columns      = Math.max(1, Number(data.columns) || 4);
  const colGap       = data.columnSpacing ? `${data.columnSpacing}px` : "6px";
  const layout       = (data.layout      as string) || "grid";
  const aspectRatio  = (data.aspectRatio as string) || "square";
  const hoverType    = (data.hoverType   as string) || "none";
  const linkType     = (data.linkType    as string) || "lightbox";
  const linkTarget   = (data.linkTarget  as string) || "_blank";
  const loadMore     = (data.loadMore    as string) || "none";
  const viewButton   = Boolean(data.viewButton);
  const flickrId     = (data.flickrId    as string) || "";
  const type         = (data.type        as string) || "photostream";
  const albumId      = (data.albumId     as string) || "";

  const borderSize   = data.borderSize   ? `${data.borderSize}px`   : undefined;
  const borderColor  = (data.borderColor  as string) || "#e5e7eb";
  const borderRadius = data.borderRadius ? `${data.borderRadius}px` : undefined;

  const loadMoreBtnColor   = (data.loadMoreBtnColor   as string) || "";
  const loadMoreBtnBgColor = (data.loadMoreBtnBgColor as string) || "";
  const viewBtnColor       = (data.viewBtnColor       as string) || "";
  const viewBtnBgColor     = (data.viewBtnBgColor     as string) || "";

  // ── Data fetching ──────────────────────────────────────────────────────────
  const [photos,     setPhotos]     = useState<FlickrPhoto[] | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [fetchLimit, setFetchLimit] = useState(limit);

  useEffect(() => {
    if (!flickrId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      type,
      userId: flickrId,
      limit:  String(fetchLimit),
      ...(type === "album" && albumId ? { albumId } : {}),
    });
    fetch(`/api/flickr/photos?${params}`)
      .then((r) => r.json())
      .then((d: { photos?: FlickrPhoto[]; error?: string }) => {
        if (d.error) setError(d.error);
        else         setPhotos(d.photos ?? []);
      })
      .catch(() => setError("Could not reach the Flickr API."))
      .finally(() => setLoading(false));
  }, [flickrId, type, albumId, fetchLimit]);

  // ── Grid / masonry styles ──────────────────────────────────────────────────
  const isMasonry = layout === "masonry";

  const containerStyle: React.CSSProperties = isMasonry
    ? { columnCount: columns, columnGap: colGap }
    : { display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: colGap };

  const hoverCSS =
    hoverType === "zoom"
      ? `.fk-post-${blockId}:hover .fk-post-inner{transform:scale(1.05)}`
      : hoverType === "liftup"
      ? `.fk-post-${blockId}:hover .fk-post-inner{transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,.18)}`
      : "";

  // ── Render a single photo cell ─────────────────────────────────────────────
  function renderCell(photo: FlickrPhoto | null, idx: number) {
    const postAspect = aspectRatio === "original"
      ? MASONRY_RATIOS[idx % MASONRY_RATIOS.length]
      : "1 / 1";

    const postStyle: React.CSSProperties = isMasonry
      ? { breakInside: "avoid", marginBottom: colGap }
      : {};

    // Use url_z (640w) as the display image; fallback to url_m (240w)
    const imgSrc = photo ? (photo.url_z ?? photo.url_m) : null;

    // Lightbox opens the large version (url_b); page link opens the Flickr photo page
    let href: string | undefined;
    if (photo) {
      if (linkType === "lightbox") href = photo.url_b ?? photo.url_z;
      if (linkType === "page")     href = photo.pageUrl;
    }

    const innerStyle: React.CSSProperties = {
      background:  imgSrc ? "#f4f4f5" : GRADIENTS[idx % GRADIENTS.length],
      aspectRatio: postAspect,
      position:    "relative",
      ...(borderSize   ? { border: `${borderSize} solid ${borderColor}` } : {}),
      ...(borderRadius ? { borderRadius }                                  : {}),
      overflow:   "hidden",
      transition: "transform .25s ease, box-shadow .25s ease",
    };

    const inner = (
      <div className="fk-post-inner" style={innerStyle}>
        {imgSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={photo?.title || "Flickr photo"}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
      </div>
    );

    return (
      <div key={photo?.id ?? idx} className={`fk-post-${blockId}`} style={postStyle}>
        {href ? (
          <a href={href} target={linkTarget} rel="noopener noreferrer" aria-label={photo?.title || "Flickr photo"}>
            {inner}
          </a>
        ) : (
          inner
        )}
      </div>
    );
  }

  const placeholders = Array.from({ length: limit }, (_, i) => renderCell(null, i));
  const canLoadMore  = !loading && photos != null && photos.length >= fetchLimit;

  // Flickr profile URL for "View on Flickr" button
  const flickrProfileUrl = flickrId
    ? `https://www.flickr.com/photos/${encodeURIComponent(flickrId)}/`
    : "https://www.flickr.com/";

  // ── Output ─────────────────────────────────────────────────────────────────
  return (
    <div data-block-id={blockId} className={`awb-flickr block-${blockId}`}>
      <style>{hoverCSS}</style>

      {/* No user ID notice */}
      {!flickrId && !error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <circle cx="7.5"  cy="12" r="5" fill="currentColor" opacity="0.55"/>
            <circle cx="16.5" cy="12" r="5" fill="currentColor"/>
          </svg>
          Flickr feed — add a user ID in the block settings to show photos.
        </div>
      )}

      {/* Error / no-key notice */}
      {error && (
        <div className="mb-3 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <strong>Flickr:</strong> {error}
          {error.includes("API key") && (
            <> — <a href="/admin/settings/integrations" className="underline hover:text-amber-900">Add key in Settings → Integrations</a></>
          )}
        </div>
      )}

      {/* Grid */}
      <div style={containerStyle}>
        {loading
          ? placeholders
          : photos && photos.length > 0
            ? photos.map((p, i) => renderCell(p, i))
            : !error && placeholders
        }
      </div>

      {/* Buttons */}
      {(loadMore === "button" || viewButton) && (
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {loadMore === "button" && canLoadMore && (
            <button
              type="button"
              onClick={() => setFetchLimit((n) => n + limit)}
              className="rounded border px-5 py-2 text-sm font-medium transition hover:opacity-80"
              style={{
                color:           loadMoreBtnColor   || undefined,
                backgroundColor: loadMoreBtnBgColor || undefined,
                borderColor:     loadMoreBtnBgColor || undefined,
              }}
            >
              {(data.loadMoreText as string) || "Load More"}
            </button>
          )}

          {viewButton && (
            <a
              href={flickrProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded border px-5 py-2 text-sm font-medium transition hover:opacity-80"
              style={{
                color:           viewBtnColor   || undefined,
                backgroundColor: viewBtnBgColor || undefined,
                borderColor:     viewBtnBgColor || undefined,
              }}
            >
              {/* Inline Flickr icon */}
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <circle cx="7.5"  cy="12" r="5" fill="currentColor" opacity="0.55"/>
                <circle cx="16.5" cy="12" r="5" fill="currentColor"/>
              </svg>
              {(data.viewButtonText as string) || "View on Flickr"}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
