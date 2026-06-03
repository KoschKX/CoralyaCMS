"use client";

import { useState, useEffect, useCallback } from "react";
import type { BlockLayoutProps } from "@/lib/block-types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  title: string;
  caption: string;
  link: string;
  linkTarget: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitizeImageUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const val = raw.trim();
  if (val.startsWith("/")) return val;
  try {
    const url = new URL(val);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

function sanitizeLink(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const val = raw.trim();
  if (val.startsWith("/") || val.startsWith("#")) return val;
  try {
    const url = new URL(val);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

export function safeImages(raw: unknown): GalleryImage[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is GalleryImage => x !== null && typeof x === "object");
}

// ── Placeholder gradients ─────────────────────────────────────────────────────

const GRADIENTS = [
  "linear-gradient(135deg,#e0e7ff 0%,#c7d2fe 100%)",
  "linear-gradient(135deg,#fce7f3 0%,#fbcfe8 100%)",
  "linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%)",
  "linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)",
  "linear-gradient(135deg,#fee2e2 0%,#fecaca 100%)",
  "linear-gradient(135deg,#e0f2fe 0%,#bae6fd 100%)",
  "linear-gradient(135deg,#f3e8ff 0%,#e9d5ff 100%)",
  "linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%)",
  "linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%)",
  "linear-gradient(135deg,#fff1f2 0%,#ffe4e6 100%)",
  "linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%)",
  "linear-gradient(135deg,#fdf4ff 0%,#fae8ff 100%)",
];

// Placeholder SVG icon (photo/image)
function PlaceholderIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" style={{ width: "40%", height: "40%", opacity: 0.35 }}>
      <rect x="4" y="8" width="56" height="48" rx="4" stroke="currentColor" strokeWidth="3"/>
      <circle cx="20" cy="24" r="6" stroke="currentColor" strokeWidth="3"/>
      <path d="M4 48l16-18 12 14 10-10 18 14" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  const image   = images[index];
  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowLeft"  && index > 0)                 onNavigate(index - 1);
      if (e.key === "ArrowRight" && index < images.length - 1) onNavigate(index + 1);
    },
    [index, images.length, onClose, onNavigate],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  if (!image) return null;
  const src = sanitizeImageUrl(image.src);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      onClick={onClose}
      style={{
        position:       "fixed",
        inset:          0,
        zIndex:         9999,
        background:     "rgba(0,0,0,0.92)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
      }}
    >
      {/* Image + caption wrapper */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position:       "relative",
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          maxWidth:       "90vw",
          maxHeight:      "90vh",
        }}
      >
        {/* Close button */}
        <button
          type="button"
          aria-label="Close lightbox"
          onClick={onClose}
          style={{
            position:   "absolute",
            top:        -44,
            right:      0,
            color:      "rgba(255,255,255,.85)",
            background: "none",
            border:     "none",
            fontSize:   32,
            lineHeight: 1,
            cursor:     "pointer",
            padding:    "4px 8px",
          }}
        >
          ×
        </button>

        {/* Image */}
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={image.alt || ""}
            style={{
              maxWidth:    "90vw",
              maxHeight:   "78vh",
              objectFit:   "contain",
              display:     "block",
              userSelect:  "none",
            }}
          />
        ) : (
          <div style={{
            width: 400, height: 280, background: "#1c1c1e",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#555",
          }}>
            No image
          </div>
        )}

        {/* Caption */}
        {(image.title || image.caption) && (
          <div style={{ marginTop: 14, textAlign: "center", color: "white", maxWidth: "80vw" }}>
            {image.title   && <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{image.title}</p>}
            {image.caption && <p style={{ margin: "5px 0 0", fontSize: 12, opacity: 0.7 }}>{image.caption}</p>}
          </div>
        )}

        {/* Counter */}
        <div style={{ marginTop: 10, color: "rgba(255,255,255,.5)", fontSize: 11 }}>
          {index + 1} / {images.length}
        </div>
      </div>

      {/* Prev arrow */}
      {hasPrev && (
        <button
          type="button"
          aria-label="Previous image"
          onClick={(e) => { e.stopPropagation(); onNavigate(index - 1); }}
          style={{
            position:       "fixed",
            left:           16,
            top:            "50%",
            transform:      "translateY(-50%)",
            color:          "white",
            background:     "rgba(255,255,255,.15)",
            border:         "none",
            borderRadius:   "50%",
            width:          46,
            height:         46,
            cursor:         "pointer",
            fontSize:       22,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
        >
          ‹
        </button>
      )}

      {/* Next arrow */}
      {hasNext && (
        <button
          type="button"
          aria-label="Next image"
          onClick={(e) => { e.stopPropagation(); onNavigate(index + 1); }}
          style={{
            position:       "fixed",
            right:          16,
            top:            "50%",
            transform:      "translateY(-50%)",
            color:          "white",
            background:     "rgba(255,255,255,.15)",
            border:         "none",
            borderRadius:   "50%",
            width:          46,
            height:         46,
            cursor:         "pointer",
            fontSize:       22,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
        >
          ›
        </button>
      )}
    </div>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────

export default function GalleryLayout({ data, blockId }: BlockLayoutProps) {
  const allImages    = safeImages(data.images);
  const layout       = (data.layout       as string) || "grid";
  const columns      = Math.max(1, Number(data.columns) || 3);
  const colGap       = data.columnSpacing ? `${data.columnSpacing}px` : "8px";
  const aspectRatio  = (data.aspectRatio  as string) || "1/1";
  const hoverType    = (data.hoverType    as string) || "none";
  const captionStyle = (data.captionStyle as string) || "off";
  const lightbox     = data.lightbox !== false;
  const loadMore     = (data.loadMore     as string) || "none";
  const loadMoreInitial = Math.max(1, Number(data.loadMoreInitial) || 6);
  const loadMoreText = (data.loadMoreText as string) || "Load More";

  const captionOverlayColor = (data.captionOverlayColor as string) || "rgba(0,0,0,0.6)";
  const captionTitleColor   = (data.captionTitleColor   as string) || "#ffffff";
  const captionTextColor    = (data.captionTextColor    as string) || "#ffffff";

  const borderSize   = data.borderSize   ? `${data.borderSize}px`   : undefined;
  const borderColor  = (data.borderColor  as string) || "#e5e7eb";
  const borderRadius = data.borderRadius ? `${data.borderRadius}px` : undefined;

  const loadMoreBtnColor   = (data.loadMoreBtnColor   as string) || "";
  const loadMoreBtnBgColor = (data.loadMoreBtnBgColor as string) || "";

  // ── Load-more state ────────────────────────────────────────────────────────
  const [extraShown, setExtraShown] = useState(0);
  const shownCount    = loadMore === "button"
    ? Math.min(allImages.length, loadMoreInitial + extraShown)
    : allImages.length;
  const visibleImages = allImages.slice(0, shownCount);
  const canLoadMore   = shownCount < allImages.length;

  // ── Lightbox state ─────────────────────────────────────────────────────────
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // ── Grid / masonry setup ───────────────────────────────────────────────────
  const isMasonry = layout === "masonry";

  const containerStyle: React.CSSProperties = isMasonry
    ? { columnCount: columns, columnGap: colGap }
    : { display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: colGap };

  // Aspect ratio CSS value — "auto" means no forced ratio
  const cssAspectRatio = aspectRatio === "auto" ? undefined : aspectRatio.replace("/", " / ");

  // ── Scoped CSS ─────────────────────────────────────────────────────────────
  const hoverEffect =
    hoverType === "zoom"
      ? `.gal-img-${blockId}:hover .gal-inner{transform:scale(1.05)}`
      : hoverType === "liftup"
      ? `.gal-img-${blockId}:hover .gal-inner{transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,.18)}`
      : "";

  const captionCSS =
    captionStyle === "hover"
      ? `.gal-img-${blockId} .gal-caption{opacity:0;transition:opacity .25s ease}` +
        `.gal-img-${blockId}:hover .gal-caption{opacity:1}`
      : ""; // "always" is always visible (no extra CSS needed); "off" not rendered

  // ── Cell renderer ──────────────────────────────────────────────────────────
  function renderCell(image: GalleryImage | null, idx: number) {
    const src      = image ? sanitizeImageUrl(image.src) : null;
    const linkHref = image ? sanitizeLink(image.link) : null;

    // Determine click action
    const isLightboxClick = lightbox && !linkHref && !!src;
    const allIdx          = image ? allImages.indexOf(image) : -1;

    const wrapperStyle: React.CSSProperties = isMasonry
      ? { breakInside: "avoid", marginBottom: colGap }
      : {};

    const innerStyle: React.CSSProperties = {
      position:    "relative",
      overflow:    "hidden",
      aspectRatio: cssAspectRatio,
      background:  src ? "#f4f4f5" : GRADIENTS[idx % GRADIENTS.length],
      ...(borderSize   ? { border: `${borderSize} solid ${borderColor}` } : {}),
      ...(borderRadius ? { borderRadius }                                  : {}),
      cursor:     isLightboxClick || linkHref ? "pointer" : "default",
      transition: "transform .25s ease, box-shadow .25s ease",
    };

    const hasCaption  = captionStyle !== "off" && image && (image.title || image.caption);

    const imgEl = src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={image?.alt || ""}
        loading="lazy"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    ) : (
      <div style={{
        width: "100%", height: "100%", display: "flex",
        alignItems: "center", justifyContent: "center", color: "#9ca3af",
      }}>
        <PlaceholderIcon />
      </div>
    );

    const captionEl = hasCaption ? (
      <div
        className="gal-caption"
        style={{
          position:   "absolute",
          bottom:     0,
          left:       0,
          right:      0,
          padding:    "10px 12px",
          background: captionOverlayColor,
        }}
      >
        {image.title && (
          <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: captionTitleColor, lineHeight: 1.3 }}>
            {image.title}
          </p>
        )}
        {image.caption && (
          <p style={{ margin: image.title ? "4px 0 0" : 0, fontSize: 11, color: captionTextColor, opacity: 0.85, lineHeight: 1.4 }}>
            {image.caption}
          </p>
        )}
      </div>
    ) : null;

    const inner = (
      <div className="gal-inner" style={innerStyle}>
        {imgEl}
        {captionEl}
      </div>
    );

    // Wrap in <a> for custom link, or make clickable div for lightbox
    return (
      <div
        key={image?.id ?? idx}
        className={`gal-img-${blockId}`}
        style={wrapperStyle}
      >
        {linkHref ? (
          <a href={linkHref} target={image?.linkTarget || "_self"} rel="noopener noreferrer">
            {inner}
          </a>
        ) : isLightboxClick ? (
          <div
            role="button"
            tabIndex={0}
            aria-label={image?.title || image?.alt || "Open image"}
            onClick={() => setLightboxIndex(allIdx)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setLightboxIndex(allIdx); }}
          >
            {inner}
          </div>
        ) : (
          inner
        )}
      </div>
    );
  }

  // Render placeholder cells when no images are set
  const hasAnyImages = allImages.some((img) => img.src);

  // ── Output ─────────────────────────────────────────────────────────────────
  return (
    <div data-block-id={blockId} className={`awb-gallery block-${blockId}`}>
      <style>{hoverEffect + captionCSS}</style>

      {/* Empty state hint */}
      {!hasAnyImages && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          Gallery — add images in the panel to get started.
        </div>
      )}

      {/* Grid */}
      <div style={containerStyle}>
        {visibleImages.map((img, i) => renderCell(img, i))}
      </div>

      {/* Load more button */}
      {loadMore === "button" && canLoadMore && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setExtraShown((n) => n + loadMoreInitial)}
            className="rounded border px-6 py-2 text-sm font-medium transition hover:opacity-80"
            style={{
              color:           loadMoreBtnColor   || undefined,
              backgroundColor: loadMoreBtnBgColor || undefined,
              borderColor:     loadMoreBtnBgColor || undefined,
            }}
          >
            {loadMoreText}
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={allImages}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
