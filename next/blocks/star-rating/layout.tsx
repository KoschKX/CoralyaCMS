"use client";

import "./styles.css";
import type { BlockLayoutProps } from "@/lib/block-types";
import type React from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitizeColor(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const v = raw.trim();
  if (/^(#[0-9a-f]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|[a-z]+)$/i.test(v))
    return v;
  return undefined;
}

function formatRating(rating: number, rounding: string): string {
  if (rounding === "0decimals") return String(Math.round(rating));
  if (rounding === "1decimal")  return rating.toFixed(1);
  if (rounding === "2decimals") return rating.toFixed(2);
  // auto — strip trailing zeros
  if (Number.isInteger(rating)) return String(rating);
  const d = rating.toFixed(2).replace(/0+$/, "");
  return d.endsWith(".") ? d + "0" : d;
}

// ── Single star SVG ───────────────────────────────────────────────────────────

const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

interface StarProps {
  /** 0 = empty, 1 = full, 0–1 = partially filled */
  fill: number;
  activeColor: string;
  inactiveColor: string;
  size: string;
}

function Star({ fill, activeColor, inactiveColor, size }: StarProps) {
  const svgStyle: React.CSSProperties = {
    width: size,
    height: size,
    display: "block",
    flexShrink: 0,
  };

  if (fill <= 0) {
    return (
      <svg viewBox="0 0 24 24" fill={inactiveColor} style={svgStyle} aria-hidden="true">
        <path d={STAR_PATH} />
      </svg>
    );
  }

  if (fill >= 1) {
    return (
      <svg viewBox="0 0 24 24" fill={activeColor} style={svgStyle} aria-hidden="true">
        <path d={STAR_PATH} />
      </svg>
    );
  }

  // Partial: empty star as base, filled star clipped to fill% width on top
  return (
    <span
      style={{ position: "relative", display: "inline-flex", width: size, height: size, flexShrink: 0 }}
    >
      <svg viewBox="0 0 24 24" fill={inactiveColor} style={svgStyle} aria-hidden="true">
        <path d={STAR_PATH} />
      </svg>
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          width: `${fill * 100}%`,
        }}
      >
        <svg viewBox="0 0 24 24" fill={activeColor} style={svgStyle} aria-hidden="true">
          <path d={STAR_PATH} />
        </svg>
      </span>
    </span>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function StarRatingLayout({ data }: BlockLayoutProps) {
  const rating       = Math.max(0, Number(data.rating) || 0);
  const maxRating    = Math.max(1, Math.min(10, Math.round(Number(data.maxRating) || 5)));
  const hideEmpty    = data.hideEmpty === true;
  const showText     = data.showText !== false;
  const rounding     = (data.rounding   as string) || "auto";
  const alignment    = (data.alignment  as string) || "left";
  const iconSize     = (data.iconSize   as string) || "1.75rem";
  const gap          = (data.gap        as string) || "0.25rem";
  const textGap      = (data.textGap    as string) || "0.5rem";
  const activeColor  = sanitizeColor(data.activeColor)   ?? "#f59e0b";
  const inactiveColor = sanitizeColor(data.inactiveColor) ?? "#d4d4d8";
  const textColor    = sanitizeColor(data.textColor);
  const textSize     = (data.textSize as string) || undefined;

  const clamped = Math.min(rating, maxRating);

  if (hideEmpty && clamped === 0) return null;

  const alignMap: Record<string, string> = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
  };

  const stars = Array.from({ length: maxRating }, (_, i) => {
    const pos = i + 1;
    if (clamped >= pos)       return 1;                  // fully filled
    if (clamped > pos - 1)    return clamped - (pos - 1); // partial
    return 0;                                             // empty
  });

  return (
    <div
      className="coralya-star-rating"
      role="img"
      aria-label={`Rating: ${formatRating(clamped, rounding)} out of ${maxRating}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: alignMap[alignment] ?? "flex-start",
        flexWrap: "wrap",
        gap: textGap,
      }}
    >
      {/* Stars */}
      <div style={{ display: "flex", alignItems: "center", gap }}>
        {stars.map((fill, i) => (
          <Star
            key={i}
            fill={fill}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            size={iconSize}
          />
        ))}
      </div>

      {/* Numeric readout */}
      {showText && (
        <span
          className="coralya-star-rating__text"
          aria-hidden="true"
          style={{ fontSize: textSize, color: textColor }}
        >
          {formatRating(clamped, rounding)}&thinsp;/&thinsp;{maxRating}
        </span>
      )}
    </div>
  );
}
