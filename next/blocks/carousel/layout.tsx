"use client";

import { useState, useEffect, useCallback } from "react";
import type React from "react";
import "./styles.css";
import type { BlockLayoutProps } from "@/lib/block-types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CarouselSlide {
  id: string;
  src: string;
  alt: string;
  caption: string;
  link: string;
  linkTarget: string;
}

// ── Sanitizers ────────────────────────────────────────────────────────────────

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

function sanitizeUrl(raw: unknown): string | null {
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

export function safeSlides(raw: unknown): CarouselSlide[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is CarouselSlide => x !== null && typeof x === "object");
}

// ── Aspect ratio helpers ──────────────────────────────────────────────────────

const ASPECT_PADDING: Record<string, string> = {
  "16/9": "56.25%",
  "4/3":  "75%",
  "3/2":  "66.67%",
  "1/1":  "100%",
  "2/3":  "150%",
};

// ── Single slide ──────────────────────────────────────────────────────────────

function Slide({
  slide,
  isActive,
  isFade,
}: {
  slide: CarouselSlide;
  isActive: boolean;
  isFade: boolean;
}) {
  const src      = sanitizeImageUrl(slide.src);
  const linkHref = sanitizeUrl(slide.link);
  const target   = slide.linkTarget || "_self";
  const rel      = target === "_blank" ? "noopener noreferrer" : undefined;

  const imgOrPlaceholder = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={slide.alt || ""} loading="lazy" draggable={false} />
  ) : (
    <div className="coralya-carousel-slide-placeholder" role="img" aria-label="No image set">
      {/* Mountain-scene placeholder SVG */}
      <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path fill="currentColor" d="M8 48l14-20 10 13 8-10 16 17H8z" opacity=".3" />
        <circle cx="46" cy="18" r="7" fill="currentColor" opacity=".25" />
      </svg>
    </div>
  );

  const inner = linkHref ? (
    <a href={linkHref} target={target} rel={rel}>
      {imgOrPlaceholder}
    </a>
  ) : (
    imgOrPlaceholder
  );

  return (
    <div
      className={[
        "coralya-carousel-slide",
        isFade && isActive ? "coralya-carousel-slide--active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={!isActive}
    >
      <div className="coralya-carousel-media">
        {inner}
        {slide.caption && (
          <p className="coralya-carousel-caption">{slide.caption}</p>
        )}
      </div>
    </div>
  );
}

// ── Block layout ──────────────────────────────────────────────────────────────

export default function CarouselLayout({ data, blockId }: BlockLayoutProps) {
  const slides       = safeSlides(data.items);
  const effect       = (data.effect as string) === "fade" ? "fade" : "slide";
  const perView      = effect === "fade"
    ? 1
    : Math.min(5, Math.max(1, Number(data.perView) || 1));
  const gap          = Math.max(0, Number(data.gap) || 0);
  const loop         = Boolean(data.loop);
  const autoplay     = Boolean(data.autoplay);
  const autoplayDelay = Math.max(500, Number(data.autoplayDelay) || 3000);
  const showArrows   = data.showArrows !== false;
  const showDots     = data.showDots !== false;
  const aspectRatio  = (data.aspectRatio as string) || "16/9";
  const borderRadius = Math.max(0, Number(data.borderRadius) || 0);

  const count = slides.length;
  const [index, setIndex] = useState(0);

  // Clamp index when slides are removed
  useEffect(() => {
    if (count > 0 && index >= count) setIndex(count - 1);
  }, [count, index]);

  const prev = useCallback(() => {
    setIndex((i) => (loop ? ((i - 1 + count) % count) : Math.max(0, i - 1)));
  }, [count, loop]);

  const next = useCallback(() => {
    setIndex((i) => (loop ? (i + 1) % count : Math.min(count - 1, i + 1)));
  }, [count, loop]);

  // Autoplay — uses functional setState to avoid resetting interval on every tick
  useEffect(() => {
    if (!autoplay || count <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (loop ? (i + 1) % count : Math.min(count - 1, i + 1)));
    }, autoplayDelay);
    return () => clearInterval(id);
  }, [autoplay, autoplayDelay, count, loop]);

  // ── Empty state ──────────────────────────────────────────────────────────
  if (count === 0) {
    return (
      <div
        data-block-id={blockId}
        className="coralya-carousel"
        style={{ "--car-radius": `${borderRadius}px` } as React.CSSProperties}
      >
        <div className="coralya-carousel-viewport coralya-carousel-viewport--empty">
          No slides added yet.
        </div>
      </div>
    );
  }

  // ── CSS variables ────────────────────────────────────────────────────────
  const aspectPadding = ASPECT_PADDING[aspectRatio];
  const cssVars = {
    "--car-count":    count,
    "--car-per-view": perView,
    "--car-index":    index,
    "--car-gap":      `${gap}px`,
    "--car-radius":   `${borderRadius}px`,
    ...(aspectPadding ? { "--car-aspect": aspectPadding } : {}),
  } as React.CSSProperties;

  const isAtStart = !loop && index === 0;
  const isAtEnd   = !loop && index >= count - 1;

  const rootClass = [
    "coralya-carousel",
    `coralya-carousel--${effect}`,
    aspectRatio === "auto" ? "coralya-carousel--aspect-auto" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div data-block-id={blockId} className={rootClass} style={cssVars}>

      {/* Stage: positions arrows relative to the viewport without being
          clipped by the viewport's overflow:hidden */}
      <div className="coralya-carousel-stage">

        <div className="coralya-carousel-viewport">
          <div className="coralya-carousel-track" aria-live="polite" aria-atomic="false">
            {slides.map((slide, i) => (
              <Slide
                key={slide.id}
                slide={slide}
                isActive={i === index}
                isFade={effect === "fade"}
              />
            ))}
          </div>
        </div>{/* /viewport */}

        {/* ── Prev / Next arrows — outside overflow:hidden so cursor/events work ── */}
        {showArrows && count > 1 && (
          <>
            <button
              type="button"
              className="coralya-carousel-arrow coralya-carousel-arrow--prev"
              onClick={prev}
              aria-label="Previous slide"
              disabled={isAtStart}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="coralya-carousel-arrow coralya-carousel-arrow--next"
              onClick={next}
              aria-label="Next slide"
              disabled={isAtEnd}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

      </div>{/* /stage */}

      {/* ── Dot navigation ────────────────────────────────────────────── */}
      {showDots && count > 1 && (
        <div className="coralya-carousel-dots" role="tablist" aria-label="Slide navigation">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to slide ${i + 1}`}
              className={[
                "coralya-carousel-dot",
                i === index ? "coralya-carousel-dot--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setIndex(i)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </div>
      )}

    </div>
  );
}
