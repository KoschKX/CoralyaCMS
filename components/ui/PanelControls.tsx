"use client";

/**
 * Panel Control Primitives
 * ─────────────────────────
 * Shared building blocks for all block editor panels.
 * Import these instead of writing per-panel inline variants.
 */

import type { ReactNode } from "react";
import { COLOR_PALETTE } from "@/lib/color-palette";
import { useSettings } from "@/hooks/useSettings";
import type { PaletteColor } from "@/lib/color-palette";

// ── Shared Tailwind strings ───────────────────────────────────────────────────

const PILL_ACTIVE = "border-zinc-900 bg-zinc-900 text-white";
const PILL_IDLE   = "border-zinc-200 text-zinc-500 hover:border-zinc-400";
const PILL_BASE   = "rounded border text-xs font-medium transition";

// ── OptionColor ───────────────────────────────────────────────────────────────
/**
 * Palette swatches + custom colour picker, matching the Text colour control.
 * Renders a label above a swatch row.
 */
export function OptionColor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { data: settings } = useSettings();
  const palette: PaletteColor[] = settings?.paletteColors?.length
    ? settings.paletteColors
    : COLOR_PALETTE;

  const isCustom = value !== "" && !palette.some((c) => c.value === value);

  return (
    <div className="space-y-1">
      <p className="text-xs text-zinc-500">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {palette.map(({ label: swatchLabel, value: swatchValue }) => {
          const isSelected = value === swatchValue;
          return (
            <button
              key={swatchLabel}
              type="button"
              title={swatchLabel}
              onClick={() => onChange(swatchValue)}
              className={`h-6 w-6 rounded-full transition ${
                isSelected ? "scale-110 border-2 border-zinc-900" : "hover:opacity-80"
              }`}
              style={{
                background:
                  swatchValue === ""
                    ? "linear-gradient(135deg,#e5e7eb 50%,#fff 50%)"
                    : swatchValue,
                outline:
                  swatchValue === "#ffffff" && !isSelected
                    ? "1px solid #e5e7eb"
                    : undefined,
              }}
            />
          );
        })}

        {/* Custom colour */}
        <label
          title="Custom colour"
          className={`relative flex h-6 w-6 cursor-pointer items-center justify-center overflow-hidden rounded-full transition ${
            isCustom ? "scale-110 border-2 border-zinc-900" : "hover:opacity-80"
          }`}
          style={{
            background: isCustom
              ? value
              : "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)",
          }}
        >
          <input
            type="color"
            value={isCustom ? value : "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}

// ── OptionToggle ──────────────────────────────────────────────────────────────
/**
 * Toggle switch with an inline label.
 */
export function OptionToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="flex-1 text-xs text-zinc-500">{label}</label>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? "bg-zinc-900" : "bg-zinc-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// ── OptionAlign ───────────────────────────────────────────────────────────────

const ALIGN_ICONS: Record<string, ReactNode> = {
  left: (
    <svg width="13" height="11" viewBox="0 0 13 11" fill="currentColor" aria-hidden="true">
      <rect x="0" y="0"   width="13" height="2" rx="1" />
      <rect x="0" y="4.5" width="9"  height="2" rx="1" />
      <rect x="0" y="9"   width="11" height="2" rx="1" />
    </svg>
  ),
  center: (
    <svg width="13" height="11" viewBox="0 0 13 11" fill="currentColor" aria-hidden="true">
      <rect x="0" y="0"   width="13" height="2" rx="1" />
      <rect x="2" y="4.5" width="9"  height="2" rx="1" />
      <rect x="1" y="9"   width="11" height="2" rx="1" />
    </svg>
  ),
  right: (
    <svg width="13" height="11" viewBox="0 0 13 11" fill="currentColor" aria-hidden="true">
      <rect x="0" y="0"   width="13" height="2" rx="1" />
      <rect x="4" y="4.5" width="9"  height="2" rx="1" />
      <rect x="2" y="9"   width="11" height="2" rx="1" />
    </svg>
  ),
  justify: (
    <svg width="13" height="11" viewBox="0 0 13 11" fill="currentColor" aria-hidden="true">
      <rect x="0" y="0"   width="13" height="2" rx="1" />
      <rect x="0" y="4.5" width="13" height="2" rx="1" />
      <rect x="0" y="9"   width="13" height="2" rx="1" />
    </svg>
  ),
};

/**
 * Left / Center / Right alignment button group.
 * Supports a `inheritedValue` prop that shows a blue dashed outline for
 * responsive inherited-value indication (used in the image block).
 */
export function OptionAlign({
  label,
  value,
  options = ["left", "center", "right"],
  onChange,
  inheritedValue,
}: {
  label?: string;
  value: string;
  options?: readonly string[];
  onChange: (v: string) => void;
  /** When set, the matching button gets a blue dashed border (responsive inherited-value indicator). */
  inheritedValue?: string;
}) {
  return (
    <div>
      {label && <p className="mb-1.5 text-xs text-zinc-500">{label}</p>}
      <div className="flex gap-1">
        {options.map((a) => {
          const isActive    = value === a;
          const isInherited = inheritedValue !== undefined && inheritedValue === a && !isActive;
          return (
            <button
              key={a}
              type="button"
              title={a}
              onClick={() => onChange(a)}
              className={`flex h-8 flex-1 items-center justify-center rounded border text-xs font-medium transition ${
                isInherited
                  ? "border-blue-400 border-dashed bg-white text-blue-500"
                  : isActive
                  ? PILL_ACTIVE
                  : PILL_IDLE
              }`}
            >
              {ALIGN_ICONS[a] ?? a[0].toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── OptionSegment ─────────────────────────────────────────────────────────────
/**
 * Generic segmented pill button group.
 * Equal-width buttons by default; pass `wrap` for many options.
 */
export function OptionSegment({
  label,
  value,
  options,
  onChange,
  wrap = false,
}: {
  label?: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (v: string) => void;
  /** Allow buttons to wrap — useful when there are many options. */
  wrap?: boolean;
}) {
  return (
    <div>
      {label && <p className="mb-1.5 text-xs text-zinc-500">{label}</p>}
      <div className={`flex gap-1${wrap ? " flex-wrap" : ""}`}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`${PILL_BASE} px-2.5 py-1${
              wrap ? "" : " flex flex-1 items-center justify-center"
            } ${value === opt.value ? PILL_ACTIVE : PILL_IDLE}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── OptionText ────────────────────────────────────────────────────────────────
/**
 * Labelled text input. Label sits above the input.
 * Pass `mono` for CSS values, URLs, template strings, etc.
 */
export function OptionText({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-zinc-500">{label}</label>
      <input
        type={type}
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded border border-zinc-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400${
          mono ? " font-mono text-xs" : ""
        }`}
      />
    </div>
  );
}

// ── OptionSelect ──────────────────────────────────────────────────────────────
/**
 * Labelled select dropdown. Label sits inline on the left (w-28).
 */
export function OptionSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="w-28 shrink-0 text-xs text-zinc-500">{label}</label>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
