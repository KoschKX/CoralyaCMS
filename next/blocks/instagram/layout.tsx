"use client";

import { useState, useEffect } from "react";
import type { BlockLayoutProps } from "@/lib/block-types";
import type { InstagramPost } from "@/app/api/instagram/media/route";

// Placeholder gradients shown while loading or when no token is configured
const GRADIENTS = [
  "linear-gradient(135deg,#f093fb 0%,#f5576c 100%)",
  "linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)",
  "linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)",
  "linear-gradient(135deg,#fa709a 0%,#fee140 100%)",
  "linear-gradient(135deg,#a18cd1 0%,#fbc2eb 100%)",
  "linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)",
  "linear-gradient(135deg,#ff9a9e 0%,#fecfef 100%)",
  "linear-gradient(135deg,#a1c4fd 0%,#c2e9fb 100%)",
  "linear-gradient(135deg,#d4fc79 0%,#96e6a1 100%)",
  "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
  "linear-gradient(135deg,#f77062 0%,#fe5196 100%)",
  "linear-gradient(135deg,#0ba360 0%,#3cba92 100%)",
];

// Masonry-mode: varied aspect ratios so posts look different heights
const MASONRY_RATIOS = ["1/1","4/3","3/4","4/3","1/1","3/4","4/3","1/1","3/4","4/3","1/1","3/4"];

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" aria-hidden="true" style={{ width: "100%", height: "100%" }}>
      <polygon points="5,3 19,12 5,21"/>
    </svg>
  );
}
function CarouselIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true" style={{ width: "100%", height: "100%" }}>
      <rect x="2"  y="5" width="13" height="14" rx="1"/>
      <rect x="17" y="7" width="5"  height="10" rx="1"/>
    </svg>
  );
}

export default function InstagramLayout({ data, blockId }: BlockLayoutProps) {
  const limit        = Math.max(1, Number(data.limit)   || 9);
  const columns      = Math.max(1, Number(data.columns) || 3);
  const colGap       = data.columnSpacing ? `${data.columnSpacing}px` : "8px";
  const layout       = (data.layout      as string) || "grid";
  const aspectRatio  = (data.aspectRatio as string) || "square";
  const hoverType    = (data.hoverType   as string) || "none";
  const loadMore     = (data.loadMore    as string) || "none";
  const followButton = Boolean(data.followButton);
  const username     = (data.username    as string) || "";
  const linkType     = (data.linkType    as string) || "lightbox";
  const linkTarget   = (data.linkTarget  as string) || "_blank";

  const borderSize   = data.borderSize   ? `${data.borderSize}px`   : undefined;
  const borderColor  = (data.borderColor  as string) || "#e5e7eb";
  const borderRadius = data.borderRadius ? `${data.borderRadius}px` : undefined;

  const loadMoreBtnColor   = (data.loadMoreBtnColor   as string) || "";
  const loadMoreBtnBgColor = (data.loadMoreBtnBgColor as string) || "";
  const followBtnColor     = (data.followBtnColor     as string) || "";
  const followBtnBgColor   = (data.followBtnBgColor   as string) || "";

  // ── Data fetching ──────────────────────────────────────────────────────────
  const [posts,      setPosts]      = useState<InstagramPost[] | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [fetchLimit, setFetchLimit] = useState(limit);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/instagram/media?limit=${fetchLimit}`)
      .then((r) => r.json())
      .then((d: { posts?: InstagramPost[]; error?: string }) => {
        if (d.error) setError(d.error);
        else         setPosts(d.posts ?? []);
      })
      .catch(() => setError("Could not reach the Instagram API."))
      .finally(() => setLoading(false));
  }, [fetchLimit]);

  // ── Grid CSS ───────────────────────────────────────────────────────────────
  const isMasonry = layout === "masonry";

  const containerStyle: React.CSSProperties = isMasonry
    ? { columnCount: columns, columnGap: colGap }
    : { display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: colGap };

  const hoverCSS =
    hoverType === "zoom"
      ? `.ig-post-${blockId}:hover .ig-post-inner{transform:scale(1.05)}`
      : hoverType === "liftup"
      ? `.ig-post-${blockId}:hover .ig-post-inner{transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,.18)}`
      : "";

  // ── Render one post cell ───────────────────────────────────────────────────
  function renderCell(post: InstagramPost | null, idx: number) {
    const postAspect = aspectRatio === "original"
      ? MASONRY_RATIOS[idx % MASONRY_RATIOS.length]
      : "1 / 1";

    const postStyle: React.CSSProperties = isMasonry
      ? { breakInside: "avoid", marginBottom: colGap }
      : {};

    const imgSrc = post
      ? (post.media_type === "VIDEO" ? (post.thumbnail_url ?? post.media_url) : post.media_url)
      : null;

    const innerStyle: React.CSSProperties = {
      background:  imgSrc ? "#f4f4f5" : GRADIENTS[idx % GRADIENTS.length],
      aspectRatio: postAspect,
      position:    "relative",
      ...(borderSize   ? { border: `${borderSize} solid ${borderColor}` } : {}),
      ...(borderRadius ? { borderRadius }                                  : {}),
      overflow:   "hidden",
      transition: "transform .25s ease, box-shadow .25s ease",
    };

    const typeIcon =
      post?.media_type === "VIDEO"          ? <VideoIcon />    :
      post?.media_type === "CAROUSEL_ALBUM" ? <CarouselIcon /> :
      null;

    let href: string | undefined;
    if (post) {
      if (linkType === "post")     href = post.permalink;
      if (linkType === "lightbox") href = post.media_url;
    }

    const inner = (
      <div className="ig-post-inner" style={innerStyle}>
        {imgSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={post?.caption ? post.caption.slice(0, 120) : "Instagram post"}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
        {typeIcon && (
          <span aria-hidden="true" style={{ position: "absolute", top: 6, right: 6, width: 18, height: 18, opacity: 0.9 }}>
            {typeIcon}
          </span>
        )}
      </div>
    );

    return (
      <div key={post?.id ?? idx} className={`ig-post-${blockId}`} style={postStyle}>
        {href ? (
          <a href={href} target={linkTarget} rel="noopener noreferrer" aria-label={post?.caption?.slice(0, 80) || "Instagram post"}>
            {inner}
          </a>
        ) : inner}
      </div>
    );
  }

  const placeholders = Array.from({ length: limit }, (_, i) => renderCell(null, i));
  const canLoadMore  = !loading && posts != null && posts.length >= fetchLimit;

  // ── Output ─────────────────────────────────────────────────────────────────
  return (
    <div data-block-id={blockId} className={`awb-instagram block-${blockId}`}>
      <style>{hoverCSS}</style>

      {/* Error / no-token notice */}
      {error && (
        <div className="mb-3 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <strong>Instagram:</strong> {error}
          {error.includes("access token") && (
            <> — <a href="/admin/settings/integrations" className="underline hover:text-amber-900">Add token in Settings → Integrations</a></>
          )}
        </div>
      )}

      {/* Grid */}
      <div style={containerStyle}>
        {loading
          ? placeholders
          : posts && posts.length > 0
            ? posts.map((p, i) => renderCell(p, i))
            : !error && placeholders
        }
      </div>

      {/* Buttons */}
      {(loadMore === "button" || followButton) && (
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

          {followButton && (
            <a
              href={username ? `https://www.instagram.com/${username.replace(/^@/, "")}` : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded border px-5 py-2 text-sm font-medium transition hover:opacity-80"
              style={{
                color:           followBtnColor   || undefined,
                backgroundColor: followBtnBgColor || undefined,
                borderColor:     followBtnBgColor || undefined,
              }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
              {(data.followButtonText as string) || "Follow Us On Instagram"}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
