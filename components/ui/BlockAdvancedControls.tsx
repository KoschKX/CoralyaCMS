"use client";

import { useContext, useState } from "react";
import type { BlockData } from "@/lib/block-types";
import { ViewportContext } from "./ViewportContext";
import type { BackgroundBlockData, SpacingBlockData, BorderBlockData, AdvancedBlockData } from "@/lib/block-advanced-css";
import { getBackgroundData, getSpacingData, getBorderData, getAdvancedData } from "@/lib/block-advanced-css";
import type { PaletteColor } from "@/lib/color-palette";
import { COLOR_PALETTE } from "@/lib/color-palette";
import { useSettings } from "@/hooks/useSettings";

// ── Internal helpers ─────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
      {children}
    </p>
  );
}

function MiniLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-400">
      {children}
    </span>
  );
}

/** A small labeled text input used for spacing / border values. */
function BoxInput({
  label,
  value,
  onChange,
  placeholder = "—",
  inherited = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inherited?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={inherited ? "—" : placeholder}
        aria-label={label}
        className={`w-full rounded border bg-white px-1 py-1 text-center text-[11px] text-zinc-700 focus:outline-none ${
          inherited
            ? "border-dashed border-blue-300 placeholder:text-blue-300 focus:border-blue-400"
            : "border-zinc-200 placeholder:text-zinc-300 focus:border-zinc-400"
        }`}
      />
      <MiniLabel>{label}</MiniLabel>
    </div>
  );
}

/** Row of four side inputs (top / right / bottom / left). */
function FourSideInputs({
  top, right, bottom, left,
  onChange,
  inherited = false,
}: {
  top: string; right: string; bottom: string; left: string;
  onChange: (side: "t" | "r" | "b" | "l", value: string) => void;
  inherited?: boolean;
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      <BoxInput label="Top"    value={top}    onChange={(v) => onChange("t", v)} inherited={inherited} />
      <BoxInput label="Right"  value={right}  onChange={(v) => onChange("r", v)} inherited={inherited} />
      <BoxInput label="Bottom" value={bottom} onChange={(v) => onChange("b", v)} inherited={inherited} />
      <BoxInput label="Left"   value={left}   onChange={(v) => onChange("l", v)} inherited={inherited} />
    </div>
  );
}

/** Colour swatch row — same style as ColorPicker. */
function BgColorSwatches({
  current,
  palette,
  onChange,
  inheritedColor = null,
}: {
  current: string;
  palette: PaletteColor[];
  onChange: (v: string) => void;
  inheritedColor?: string | null;
}) {
  const isCustom = current !== "" && !palette.some((c) => c.value === current);
  return (
    <div className="flex flex-wrap gap-1.5">
      {palette.map(({ label, value }) => {
        const isSelected = current === value;
        const isBlue = inheritedColor !== null && value === inheritedColor;
        return (
          <button
            key={label}
            title={label}
            onClick={() => onChange(value)}
            className={`h-6 w-6 rounded-full transition ${
              !isBlue && isSelected
                ? "scale-110 border-2 border-zinc-900"
                : "hover:opacity-80"
            }`}
            style={{
              background:
                value === ""
                  ? "linear-gradient(135deg,#e5e7eb 50%,#fff 50%)"
                  : value,
              outline: isBlue
                ? "2px dashed #60a5fa"
                : value === "#ffffff" ? "1px solid #e5e7eb" : undefined,
              outlineOffset: isBlue ? "2px" : undefined,
            }}
          />
        );
      })}
      {/* Custom colour */}
      <label
        title="Custom colour"
        className={`relative flex h-6 w-6 cursor-pointer items-center justify-center overflow-hidden rounded-full transition ${
          isCustom && !(inheritedColor !== null && current === inheritedColor) ? "scale-110 border-2 border-zinc-900" : "hover:opacity-80"
        }`}
        style={{
          background: isCustom
            ? current
            : "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)",
          outline: isCustom && inheritedColor !== null && current === inheritedColor ? "2px dashed #60a5fa" : undefined,
          outlineOffset: isCustom && inheritedColor !== null && current === inheritedColor ? "2px" : undefined,
        }}
      >
        <input
          type="color"
          value={isCustom ? current : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}

// ── Section accordion ────────────────────────────────────────────────────────

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-zinc-100 pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition"
      >
        {title}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && <div className="mt-3 space-y-4">{children}</div>}
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

/**
 * Generic CSS panel controls available for every block type —
 * analogous to WordPress Gutenberg's colour, dimensions, border,
 * and advanced panels.
 *
 * All settings are stored as a single `__advanced` JSON object in block.data,
 * matching the same pattern as the `responsive` field — one shortcode attribute,
 * reliable round-trip through the parser.
 */
export function BlockAdvancedControls({
  data,
  onChange,
  onBaseChange,
}: {
  data: BlockData;
  onChange: (d: BlockData) => void;
  /** Always writes to base level — used for Advanced (CSS ID/class) section. */
  onBaseChange: (d: BlockData) => void;
}) {
  const { data: settings } = useSettings();
  const palette: PaletteColor[] = settings?.paletteColors?.length
    ? settings.paletteColors
    : COLOR_PALETTE;

  const { viewport, isFieldOverridden, inheritedData } = useContext(ViewportContext);
  const isResponsive = viewport !== "desktop";
  const bgInherited = isResponsive && !isFieldOverridden("background");
  const spacingInherited = isResponsive && !isFieldOverridden("spacing");
  const borderInherited = isResponsive && !isFieldOverridden("border");
  const inheritedBg = (inheritedData.background as Record<string, unknown>) ?? {};
  const inheritedBgColor = isResponsive ? ((inheritedBg.bgColor as string) ?? "") : null;
  const borderInputCls = (hasValue: boolean) =>
    `rounded border px-1.5 py-1 text-[11px] text-zinc-700 focus:outline-none ${
      borderInherited && !hasValue
        ? "border-dashed border-blue-300 placeholder:text-blue-300 focus:border-blue-400"
        : "border-zinc-200 placeholder:text-zinc-300 focus:border-zinc-400"
    }`;

  const raw = data as Record<string, unknown>;
  const background = getBackgroundData(raw);
  const spacing    = getSpacingData(raw);
  const border     = getBorderData(raw);
  const adv        = getAdvancedData(raw);

  /** Patch background and emit. */
  function updateBackground(patch: Partial<BackgroundBlockData>) {
    const next = { ...background, ...patch };
    for (const k of Object.keys(patch) as (keyof BackgroundBlockData)[]) {
      if (!patch[k]) delete next[k];
    }
    onChange({ background: Object.keys(next).length ? next : undefined });
  }

  /** Patch spacing and emit. */
  function updateSpacing(patch: Partial<SpacingBlockData>) {
    const next = { ...spacing, ...patch };
    for (const k of Object.keys(patch) as (keyof SpacingBlockData)[]) {
      if (!patch[k]) delete next[k];
    }
    onChange({ spacing: Object.keys(next).length ? next : undefined });
  }

  /** Patch border and emit. */
  function updateBorder(patch: Partial<BorderBlockData>) {
    const next = { ...border, ...patch };
    for (const k of Object.keys(patch) as (keyof BorderBlockData)[]) {
      if (!patch[k]) delete next[k];
    }
    onChange({ border: Object.keys(next).length ? next : undefined });
  }

  /** Patch advanced and emit (always base-level — CSS ID/class are never viewport-specific). */
  function updateAdv(patch: Partial<AdvancedBlockData>) {
    const next = { ...adv, ...patch };
    for (const k of Object.keys(patch) as (keyof AdvancedBlockData)[]) {
      if (!patch[k]) delete next[k];
    }
    onBaseChange({ advanced: Object.keys(next).length ? next : undefined });
  }

  return (
    <div className="space-y-0">
      {/* ── Background ──────────────────────────────── */}
      <Section title="Background" defaultOpen={false}>
        <div>
          <Label>Background Colour</Label>
          <BgColorSwatches
            current={background.bgColor ?? ""}
            palette={palette}
            onChange={(v) => updateBackground({ bgColor: v || undefined })}
            inheritedColor={inheritedBgColor}
          />
        </div>
      </Section>

      {/* ── Spacing ─────────────────────────────────── */}
      <Section title="Spacing" defaultOpen={false}>
        <div>
          <Label>Padding</Label>
          <FourSideInputs
            top={spacing.pt ?? ""} right={spacing.pr ?? ""}
            bottom={spacing.pb ?? ""} left={spacing.pl ?? ""}
            onChange={(side, v) =>
              updateSpacing({ [`p${side}`]: v || undefined } as Partial<SpacingBlockData>)
            }
            inherited={spacingInherited}
          />
        </div>
        <div>
          <Label>Margin</Label>
          <FourSideInputs
            top={spacing.mt ?? ""} right={spacing.mr ?? ""}
            bottom={spacing.mb ?? ""} left={spacing.ml ?? ""}
            onChange={(side, v) =>
              updateSpacing({ [`m${side}`]: v || undefined } as Partial<SpacingBlockData>)
            }
            inherited={spacingInherited}
          />
        </div>
      </Section>

      {/* ── Border ──────────────────────────────────── */}
      <Section title="Border" defaultOpen={false}>
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <MiniLabel>Color</MiniLabel>
              <div className="flex items-center gap-1">
                <label className="relative flex h-6 w-6 flex-shrink-0 cursor-pointer overflow-hidden rounded border border-zinc-200">
                  <span
                    className="absolute inset-0"
                    style={{ background: border.color || "#000000" }}
                  />
                  <input
                    type="color"
                    value={border.color || "#000000"}
                    onChange={(e) => updateBorder({ color: e.target.value || undefined })}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </label>
                <input
                  type="text"
                  value={border.color ?? ""}
                  onChange={(e) => updateBorder({ color: e.target.value || undefined })}
                  placeholder={borderInherited ? "—" : "#000000"}
                  className={`min-w-0 flex-1 ${borderInputCls(!!border.color)}`}
                />
              </div>
            </div>
            <div className="flex w-16 flex-col gap-1">
              <MiniLabel>Width</MiniLabel>
              <input
                type="text"
                value={border.width ?? ""}
                onChange={(e) => updateBorder({ width: e.target.value || undefined })}
                placeholder={borderInherited ? "—" : "1px"}
                className={borderInputCls(!!border.width)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <MiniLabel>Style</MiniLabel>
              <select
                value={border.style || "solid"}
                onChange={(e) => updateBorder({ style: e.target.value || undefined })}
                className="rounded border border-zinc-200 bg-white px-1.5 py-1 text-[11px] text-zinc-700 focus:border-zinc-400 focus:outline-none"
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
                <option value="double">Double</option>
                <option value="none">None</option>
              </select>
            </div>
            <div className="flex w-16 flex-col gap-1">
              <MiniLabel>Radius</MiniLabel>
              <input
                type="text"
                value={border.radius ?? ""}
                onChange={(e) => updateBorder({ radius: e.target.value || undefined })}
                placeholder={borderInherited ? "—" : "4px"}
                className={borderInputCls(!!border.radius)}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ── Advanced ────────────────────────────────── */}
      <Section title="Advanced" defaultOpen={false}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              HTML Anchor
            </label>
            <input
              type="text"
              value={adv.cssId ?? ""}
              onChange={(e) => updateAdv({ cssId: e.target.value || undefined })}
              placeholder="my-section"
              className="w-full rounded border border-zinc-200 px-2 py-1 text-[11px] text-zinc-700 placeholder:text-zinc-300 focus:border-zinc-400 focus:outline-none"
            />
            <p className="mt-0.5 text-[10px] text-zinc-400">
              Creates an <code className="text-[10px]">#anchor</code> link to this block.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Additional CSS Class(es)
            </label>
            <input
              type="text"
              value={adv.cssClass ?? ""}
              onChange={(e) => updateAdv({ cssClass: e.target.value || undefined })}
              placeholder="my-class another-class"
              className="w-full rounded border border-zinc-200 px-2 py-1 text-[11px] text-zinc-700 placeholder:text-zinc-300 focus:border-zinc-400 focus:outline-none"
            />
          </div>
        </div>
      </Section>
    </div>
  );
}
