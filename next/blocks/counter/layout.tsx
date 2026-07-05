"use client";

import type React from "react";
import "./styles.css";
import type { BlockLayoutProps } from "@/lib/block-types";
import { useBlockT } from "@/components/editor/BlockLocaleContext";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CounterItem {
  id: string;
  value: string;
  unit: string;
  unitPos: string;        // "prefix" | "suffix"
  label: string;
  icon: string;           // CSS class (box only)
  filledColor: string;    // circle only, overrides block default
  unfilledColor: string;  // circle only, overrides block default
  size: number;           // circle only, px
}

// ── Sanitizers ────────────────────────────────────────────────────────────────

function sanitizeColor(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const v = raw.trim();
  if (/^(#[0-9a-f]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|[a-z]+)$/i.test(v))
    return v;
  return undefined;
}

function safeItems(raw: unknown): CounterItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is CounterItem => x !== null && typeof x === "object");
}

// ── Box layout ────────────────────────────────────────────────────────────────

function BoxItem({ item, color, border }: { item: CounterItem; color?: string; border?: string }) {
  const cssVars: Record<string, string> = {};
  if (color)  cssVars["--cnt-color"]  = color;
  if (border) cssVars["--cnt-border"] = border;

  const prefix = item.unitPos === "prefix" && item.unit ? item.unit : "";
  const suffix = item.unitPos !== "prefix" && item.unit ? item.unit : "";

  return (
    <div className="coralya-counter coralya-counter--box" style={cssVars as React.CSSProperties}>
      {item.icon && (
        <i className={`coralya-counter-icon ${item.icon}`} aria-hidden="true" />
      )}
      <div className="coralya-counter-value">
        {prefix && <span className="coralya-counter-unit">{prefix}</span>}
        <span className="coralya-counter-number">{item.value}</span>
        {suffix && <span className="coralya-counter-unit">{suffix}</span>}
      </div>
      {item.label && <p className="coralya-counter-label">{item.label}</p>}
    </div>
  );
}

// ── Circle layout ─────────────────────────────────────────────────────────────

function CircleItem({
  item,
  filledColor: defaultFilled,
  unfilledColor: defaultUnfilled,
}: {
  item: CounterItem;
  filledColor?: string;
  unfilledColor?: string;
}) {
  const size        = Math.max(40, Math.min(600, item.size || 200));
  const strokeWidth = Math.max(4, Math.round(size * (11 / 220)));
  const radius      = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct         = Math.min(100, Math.max(0, parseFloat(item.value) || 0));
  const offset      = circumference * (1 - pct / 100);

  const filled   = sanitizeColor(item.filledColor)   ?? sanitizeColor(defaultFilled)   ?? "#18181b";
  const unfilled = sanitizeColor(item.unfilledColor) ?? sanitizeColor(defaultUnfilled) ?? "#e4e4e7";

  const ringVars = {
    "--ring-size":     `${size}px`,
    "--ring-filled":   filled,
    "--ring-unfilled": unfilled,
    "--ring-circ":     `${circumference}`,
    "--ring-offset":   `${offset}`,
  } as React.CSSProperties;

  const unit = typeof item.unit === "string" ? item.unit : "";

  return (
    <div className="coralya-counter coralya-counter--circle">
      <div className="coralya-counter-ring" style={ringVars}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
          focusable="false"
        >
          <circle
            className="coralya-counter-ring-track"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <circle
            className="coralya-counter-ring-fill"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
        </svg>
        <span className="coralya-counter-ring-label" aria-label={`${item.value}${unit}`}>
          <span>{item.value}</span>
          {unit && <span className="coralya-counter-ring-unit">{unit}</span>}
        </span>
      </div>
      {item.label && <p className="coralya-counter-label">{item.label}</p>}
    </div>
  );
}

// ── Block layout ──────────────────────────────────────────────────────────────

export default function CounterLayout({ data, blockId }: BlockLayoutProps) {
  const t           = useBlockT("counter");
  const style       = (data.style as string) === "circle" ? "circle" : "box";
  const columns     = Math.min(6, Math.max(1, Number(data.columns) || 4));
  const color       = sanitizeColor(data.color);
  const borderColor = sanitizeColor(data.borderColor);
  const filledColor = sanitizeColor(data.filledColor);
  const unfilledColor = sanitizeColor(data.unfilledColor);
  // Translate each label keyed by its English default. Labels the user has
  // customised won't match a key and are passed through unchanged.
  const items       = safeItems(data.items).map((it) => ({
    ...it,
    label: t(it.label, it.label),
  }));

  const gridStyle = { "--cnt-cols": columns } as React.CSSProperties;

  return (
    <div
      className={`coralya-counters coralya-counters--${style}`}
      data-block-id={blockId}
    >
      <div className={`coralya-counters-grid coralya-counters-cols-${columns}`} style={gridStyle}>
        {items.map((item) =>
          style === "circle" ? (
            <CircleItem
              key={item.id}
              item={item}
              filledColor={filledColor}
              unfilledColor={unfilledColor}
            />
          ) : (
            <BoxItem
              key={item.id}
              item={item}
              color={color}
              border={borderColor}
            />
          )
        )}
      </div>
    </div>
  );
}
