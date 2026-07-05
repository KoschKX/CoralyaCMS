"use client";

import "./styles.css";
import { useState, useEffect, useRef } from "react";
import type React from "react";
import type { BlockLayoutProps } from "@/lib/block-types";
import { useBlockT } from "@/components/editor/BlockLocaleContext";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TestimonialItem {
  id: string;
  quote: string;
  name: string;
  company: string;
  companyLink: string;
  companyTarget: string;   // "_self" | "_blank"
  photo: string;           // URL — used when avatar === "image"
  photoRadius: string;     // CSS border-radius override for avatar
  avatar: string;          // "none" | "placeholder" | "image"
  avatarPosition: string;  // "above" | "below" | "left"  (clean design only)
  avatarSize: string;      // CSS size, e.g. "3rem"
  icon: string;            // FA class for decorative icon in quote bubble
  iconAlignment: string;   // "left" | "right"
  rating: number;          // 0–5 stars (not in Fusion, our addition)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitizeColor(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const v = raw.trim();
  if (/^(#[0-9a-f]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|[a-z]+)$/i.test(v))
    return v;
  return undefined;
}

export function safeItems(raw: unknown): TestimonialItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is TestimonialItem => x !== null && typeof x === "object");
}

// ── Star rating ───────────────────────────────────────────────────────────────

function Stars({ rating, t }: { rating: number; t: (key: string, fallback: string) => string }) {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5" aria-label={`${rating} ${t("aria.outOf5", "out of 5 stars")}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          style={{ color: i < rating ? "var(--tst-star-color, #f59e0b)" : "#d4d4d8" }}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ item }: { item: TestimonialItem }) {
  if (item.avatar === "none") return null;

  const sizeStyle: React.CSSProperties = item.avatarSize
    ? ({ "--tst-avatar-size": item.avatarSize } as React.CSSProperties)
    : {};
  const radiusStyle: React.CSSProperties = item.photoRadius
    ? ({ "--tst-avatar-radius": item.photoRadius } as React.CSSProperties)
    : {};
  const style = { ...sizeStyle, ...radiusStyle };

  if (item.avatar === "image" && item.photo) {
    return (
      <div className="coralya-testimonial__avatar-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.photo}
          alt={item.name ? `Photo of ${item.name}` : ""}
          className="coralya-testimonial__avatar"
          style={style}
        />
      </div>
    );
  }

  // Placeholder silhouette
  return (
    <div className="coralya-testimonial__avatar-wrap" style={style}>
      <div className="coralya-testimonial__avatar-placeholder">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
      </div>
    </div>
  );
}

// ── Author byline ─────────────────────────────────────────────────────────────

function Byline({ item }: { item: TestimonialItem }) {
  if (!item.name && !item.company) return null;
  return (
    <div className="coralya-testimonial__byline">
      {item.name && <p className="coralya-testimonial__name">{item.name}</p>}
      {item.company && (
        <p className="coralya-testimonial__company">
          {item.companyLink ? (
            <a
              href={item.companyLink}
              target={item.companyTarget || "_self"}
              rel={item.companyTarget === "_blank" ? "noopener noreferrer" : undefined}
            >
              {item.company}
            </a>
          ) : (
            item.company
          )}
        </p>
      )}
    </div>
  );
}

// ── Classic card ──────────────────────────────────────────────────────────────

function ClassicCard({ item, speechBubble, t }: { item: TestimonialItem; speechBubble: boolean; t: (key: string, fallback: string) => string }) {
  const bubbleClass = speechBubble ? "has-bubble" : "no-bubble";
  return (
    <div className={`coralya-testimonial coralya-testimonial--classic ${bubbleClass}`}>
      <div className="coralya-testimonial__bubble">
        {item.icon && (
          <i
            className={`coralya-testimonial__dec-icon${item.iconAlignment === "right" ? " coralya-testimonial__dec-icon--right" : ""} ${item.icon}`}
            aria-hidden="true"
          />
        )}
        {item.rating > 0 && <Stars rating={item.rating} t={t} />}
        <p className="coralya-testimonial__text">{item.quote || "\u00a0"}</p>
      </div>
      <div className="coralya-testimonial__author">
        <Avatar item={item} />
        <Byline item={item} />
      </div>
    </div>
  );
}

// ── Clean card ────────────────────────────────────────────────────────────────

function CleanCard({ item, t }: { item: TestimonialItem; t: (key: string, fallback: string) => string }) {
  const pos = item.avatar !== "none" ? (item.avatarPosition || "above") : "none";
  const cardClass = pos !== "none" ? `avatar-${pos}` : "";

  const quote = (
    <div className="coralya-testimonial__body">
      {item.icon && (
        <i
          className={`coralya-testimonial__dec-icon${item.iconAlignment === "right" ? " coralya-testimonial__dec-icon--right" : ""} ${item.icon}`}
          aria-hidden="true"
        />
      )}
      {item.rating > 0 && <Stars rating={item.rating} t={t} />}
      <blockquote className="coralya-testimonial__text" style={{ margin: 0 }}>
        {item.quote || "\u00a0"}
      </blockquote>
      <div className="coralya-testimonial__author">
        {pos === "below" && <Avatar item={item} />}
        <Byline item={item} />
      </div>
    </div>
  );

  return (
    <div className={`coralya-testimonial coralya-testimonial--clean ${cardClass}`}>
      {pos === "left" && <Avatar item={item} />}
      {pos === "above" && <Avatar item={item} />}
      {quote}
    </div>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────

export default function TestimonialsLayout({ data }: BlockLayoutProps) {
  const t = useBlockT("testimonials");
  const rawItems     = safeItems(data.items);
  const design       = (data.design as string) || "classic";
  const navigation   = data.navigation === true || data.navigation === "yes";
  const randomize    = data.random    === true || data.random    === "yes";
  const speechBubble = data.speechBubble !== false;
  const columns      = Math.max(1, Math.min(4, Number(data.columns) || 1));
  const speed        = Number(data.speed) || 5000;

  // Shuffle once on mount if random is set
  const [items, setItems] = useState<TestimonialItem[]>(rawItems);
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const list = safeItems(data.items);
    if (randomize) {
      const shuffled = [...list].sort(() => Math.random() - 0.5);
      setItems(shuffled);
    } else {
      setItems(list);
    }
    setActive(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.items, randomize]);

  // Auto-advance when navigation is on and speed > 0
  useEffect(() => {
    if (!navigation || items.length <= 1 || !speed) return;
    timerRef.current = setInterval(() => {
      setActive((a) => (a + 1) % items.length);
    }, speed);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [navigation, items.length, speed]);

  // CSS custom properties
  const cssVars: Record<string, string> = {
    "--tst-cols": String(columns),
  };
  if (typeof data.gap === "string" && data.gap)      cssVars["--tst-gap"]          = data.gap;
  if (typeof data.padding === "string" && data.padding) cssVars["--tst-padding"]   = data.padding;
  if (typeof data.borderRadius === "string" && data.borderRadius) cssVars["--tst-radius"] = data.borderRadius;
  if (sanitizeColor(data.bgColor))                   cssVars["--tst-bg"]           = sanitizeColor(data.bgColor)!;
  if (sanitizeColor(data.textColor))                 cssVars["--tst-color"]        = sanitizeColor(data.textColor)!;
  if (sanitizeColor(data.nameColor))                 cssVars["--tst-name-color"]   = sanitizeColor(data.nameColor)!;
  if (sanitizeColor(data.borderColor))               cssVars["--tst-border-color"] = sanitizeColor(data.borderColor)!;
  if (data.borderStyle)                              cssVars["--tst-border-style"] = String(data.borderStyle);
  if (data.borderTop)                                cssVars["--tst-border-top"]   = String(data.borderTop);
  if (data.borderRight)                              cssVars["--tst-border-right"] = String(data.borderRight);
  if (data.borderBottom)                             cssVars["--tst-border-bottom"]= String(data.borderBottom);
  if (data.borderLeft)                               cssVars["--tst-border-left"]  = String(data.borderLeft);
  if (sanitizeColor(data.navColor))                  cssVars["--tst-nav-color"]    = sanitizeColor(data.navColor)!;
  if (data.navSize)                                  cssVars["--tst-nav-size"]     = String(data.navSize);

  function renderCard(item: TestimonialItem) {
    return design === "clean"
      ? <CleanCard key={item.id} item={item} t={t} />
      : <ClassicCard key={item.id} item={item} speechBubble={speechBubble} t={t} />;
  }

  if (navigation) {
    return (
      <div className="coralya-testimonials coralya-testimonials--slider" style={cssVars as React.CSSProperties}>
        <div className="coralya-testimonials__slides">
          {items.map((item, i) => (
            <div
              key={item.id}
              className={`coralya-testimonials__slide${i === active ? " coralya-testimonials__slide--active" : ""}`}
            >
              {renderCard(item)}
            </div>
          ))}
        </div>
        {items.length > 1 && (
          <div className="coralya-testimonials__nav" role="tablist" aria-label={t("aria.navigation", "Testimonial navigation")}>
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={t("aria.testimonialN", "Testimonial") + " " + (i + 1)}
                className={`coralya-testimonials__dot${i === active ? " coralya-testimonials__dot--active" : ""}`}
                onClick={() => {
                  setActive(i);
                  if (timerRef.current) clearInterval(timerRef.current);
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="coralya-testimonials coralya-testimonials--grid" style={cssVars as React.CSSProperties}>
      {items.map((item) => renderCard(item))}
    </div>
  );
}

