"use client";

import { useContext, useEffect, useRef, useState } from "react";
import type { BlockData } from "@/lib/block-types";
import { ViewportContext } from "./ViewportContext";
import type { BackgroundBlockData, SpacingBlockData, BorderBlockData, AdvancedBlockData, DisplayBlockData } from "@/lib/block-advanced-css";
import { getBackgroundData, getSpacingData, getBorderData, getAdvancedData, getDisplayData } from "@/lib/block-advanced-css";
import type { PaletteColor } from "@/lib/color-palette";
import { COLOR_PALETTE } from "@/lib/color-palette";
import { useSettings } from "@/hooks/useSettings";
import { MediaPickerDialog } from "@/components/MediaPickerDialog";

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

type DropdownOption = { value: string; label: string };

/** Fully custom dropdown — replaces native <select> so the popup is styled. */
function Dropdown({
  value,
  onChange,
  options,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded border border-zinc-200 bg-white px-2 py-1 text-[11px] hover:border-zinc-300 focus:border-zinc-400 focus:outline-none"
      >
        <span className={selected?.value === "" ? "text-zinc-400" : "text-zinc-700"}>
          {selected?.label ?? "—"}
        </span>
        <svg
          className={`ml-1 flex-shrink-0 text-zinc-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          width="10" height="10" viewBox="0 0 12 12" fill="none"
        >
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-0.5 overflow-hidden rounded border border-zinc-200 bg-white py-0.5 shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center gap-1.5 px-2 py-1 text-left text-[11px] transition-colors hover:bg-zinc-50 ${
                opt.value === value ? "font-medium text-zinc-900" : "text-zinc-500"
              }`}
            >
              <span className="w-2 flex-shrink-0">
                {opt.value === value && (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="text-zinc-500">
                    <circle cx="4" cy="4" r="2.5"/>
                  </svg>
                )}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
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

/** Combined background colour + image controls. */
function BgImageControls({
  background,
  inherited,
  inheritedColor,
  inheritedBgImage = "",
  isResponsive = false,
  palette,
  onChange,
}: {
  background: BackgroundBlockData;
  inherited: boolean;
  inheritedColor: string | null;
  inheritedBgImage?: string;
  isResponsive?: boolean;
  palette: PaletteColor[];
  onChange: (patch: Partial<BackgroundBlockData>) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  // bgImage "none" = explicit override to hide the inherited image at this breakpoint.
  const explicitNone = background.bgImage === "none";
  // "Own" image = this viewport has explicitly set a different URL than the parent.
  // On responsive viewports, we compare against inheritedBgImage because the display
  // data is fully merged (desktop values appear in background even with no override).
  const hasOwnImage =
    !!background.bgImage &&
    background.bgImage !== "none" &&
    (!isResponsive || background.bgImage !== inheritedBgImage);
  // Image is inherited if there's a parent image and no own override at this viewport.
  const imageIsInherited = !hasOwnImage && !explicitNone && !!inheritedBgImage;
  // The effective image shown in the editor (own overrides inherited)
  const effectiveImage = hasOwnImage ? background.bgImage! : (!explicitNone ? inheritedBgImage : "");

  return (
    <div className="space-y-3">
      <div>
        <Label>Background Colour</Label>
        <BgColorSwatches
          current={background.bgColor ?? ""}
          palette={palette}
          onChange={(v) => onChange({
            // On responsive viewports with an inherited color, write "transparent"
            // explicitly so the live-page CSS can override the parent's color.
            bgColor: v === "" && isResponsive && !!inheritedColor ? "transparent" : (v || undefined),
          })}
          inheritedColor={inheritedColor}
        />
      </div>
      <div>
        <Label>Background Image</Label>
        <div className="flex items-center gap-2">
          {/* Always show thumbnail slot — filled when there's an image, empty grey box otherwise */}
          <div
            className={`h-10 w-14 flex-shrink-0 rounded border bg-zinc-100 ${
              effectiveImage
                ? imageIsInherited
                  ? "border-dashed border-blue-300 opacity-60"
                  : "border-zinc-200"
                : "border-zinc-200"
            }`}
            style={effectiveImage ? { backgroundImage: `url(${effectiveImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
          />
          <button
            onClick={() => setPickerOpen(true)}
            className={`rounded border px-2 py-1 text-[11px] transition ${
              imageIsInherited
                ? "border-dashed border-blue-300 text-blue-400"
                : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
            }`}
          >
            {hasOwnImage ? "Change image" : "Choose image"}
          </button>
          {/* Remove own override → fall back to inherited */}
          {hasOwnImage && (
            <button
              onClick={() => onChange({ bgImage: undefined, bgSize: undefined, bgPosition: undefined, bgRepeat: undefined })}
              className="rounded border border-zinc-200 px-2 py-1 text-[11px] text-zinc-400 transition hover:border-zinc-400 hover:text-zinc-600"
              title="Remove image"
            >
              ✕
            </button>
          )}
          {/* When inherited image exists and no own override, allow explicitly hiding it */}
          {imageIsInherited && (
            <button
              onClick={() => onChange({ bgImage: "none" })}
              className="rounded border border-zinc-200 px-2 py-1 text-[11px] text-zinc-400 transition hover:border-zinc-400 hover:text-zinc-600"
              title="Hide inherited image at this breakpoint"
            >
              Hide
            </button>
          )}
          {/* Re-inherit: clear the explicit "none" override */}
          {explicitNone && (
            <button
              onClick={() => onChange({ bgImage: undefined })}
              className="rounded border border-dashed border-blue-300 px-2 py-1 text-[11px] text-blue-400 transition hover:border-blue-400"
            >
              Re-inherit
            </button>
          )}
        </div>
        <MediaPickerDialog
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(url) => { onChange({ bgImage: url }); setPickerOpen(false); }}
        />
      </div>
      {hasOwnImage && (
        <>
          <div>
            <MiniLabel>Size</MiniLabel>
            <Dropdown
              value={background.bgSize ?? "cover"}
              onChange={(v) => onChange({ bgSize: v || undefined })}
              options={[
                { value: "cover",   label: "Cover" },
                { value: "contain", label: "Contain" },
                { value: "auto",    label: "Auto" },
                { value: "100% 100%", label: "Stretch" },
              ]}
              className="mt-1"
            />
          </div>
          <div>
            <MiniLabel>Position</MiniLabel>
            <Dropdown
              value={background.bgPosition ?? "center"}
              onChange={(v) => onChange({ bgPosition: v || undefined })}
              options={[
                { value: "center",       label: "Center" },
                { value: "top",          label: "Top" },
                { value: "bottom",       label: "Bottom" },
                { value: "left",         label: "Left" },
                { value: "right",        label: "Right" },
                { value: "top left",     label: "Top left" },
                { value: "top right",    label: "Top right" },
                { value: "bottom left",  label: "Bottom left" },
                { value: "bottom right", label: "Bottom right" },
              ]}
              className="mt-1"
            />
          </div>
          <div>
            <MiniLabel>Repeat</MiniLabel>
            <Dropdown
              value={background.bgRepeat ?? "no-repeat"}
              onChange={(v) => onChange({ bgRepeat: v || undefined })}
              options={[
                { value: "no-repeat", label: "No repeat" },
                { value: "repeat",    label: "Repeat" },
                { value: "repeat-x",  label: "Repeat X" },
                { value: "repeat-y",  label: "Repeat Y" },
              ]}
              className="mt-1"
            />
          </div>
        </>
      )}
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
  // "transparent" is the sentinel used on responsive breakpoints to explicitly clear an
  // inherited color. Treat it the same as "" (no color) for display purposes.
  const normalised = current === "transparent" ? "" : current;
  const isCustom = normalised !== "" && !palette.some((c) => c.value === normalised);
  return (
    <div className="flex flex-wrap gap-1.5">
      {palette.map(({ label, value }) => {
        const isSelected = normalised === value;
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
          isCustom && !(inheritedColor !== null && normalised === inheritedColor) ? "scale-110 border-2 border-zinc-900" : "hover:opacity-80"
        }`}
        style={{
          background: isCustom
            ? normalised
            : "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)",
          outline: isCustom && inheritedColor !== null && normalised === inheritedColor ? "2px dashed #60a5fa" : undefined,
          outlineOffset: isCustom && inheritedColor !== null && normalised === inheritedColor ? "2px" : undefined,
        }}
      >
        <input
          type="color"
          value={isCustom ? normalised : "#000000"}
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
  const inheritedBgImage = isResponsive ? ((inheritedBg.bgImage as string) ?? "") : "";
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
  const display    = getDisplayData(raw);
  const adv        = getAdvancedData(raw);

  /** Patch background and emit. */
  function updateBackground(patch: Partial<BackgroundBlockData>) {
    // When on a responsive viewport, build the write base from only the "own" keys
    // (values that differ from the parent viewport) to avoid carrying inherited
    // values into the override and unintentionally locking them.
    const ownBase: Partial<BackgroundBlockData> = {};
    if (isResponsive) {
      for (const k of Object.keys(background) as (keyof BackgroundBlockData)[]) {
        const v = background[k];
        if (v !== (inheritedBg as Record<string, unknown>)[k]) ownBase[k] = v;
      }
    } else {
      Object.assign(ownBase, background);
    }
    const next = { ...ownBase, ...patch } as Partial<BackgroundBlockData>;
    for (const k of Object.keys(patch) as (keyof BackgroundBlockData)[]) {
      // "none" is a valid sentinel (explicit override to no-image), keep it.
      // Only delete keys that are truly cleared (undefined or empty string).
      const v = patch[k];
      if (v === undefined || v === "") delete next[k];
    }
    onChange({ background: Object.keys(next).length ? (next as BackgroundBlockData) : undefined });
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

  /** Patch display and emit. */
  function updateDisplay(patch: Partial<DisplayBlockData>) {
    const next = { ...display, ...patch };
    for (const k of Object.keys(patch) as (keyof DisplayBlockData)[]) {
      if (patch[k] === undefined || patch[k] === "") delete next[k as keyof DisplayBlockData];
    }
    onChange({ display: Object.keys(next).length ? next : undefined });
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
        <BgImageControls
          background={background}
          inherited={bgInherited}
          inheritedColor={inheritedBgColor}
          inheritedBgImage={inheritedBgImage}
          isResponsive={isResponsive}
          palette={palette}
          onChange={updateBackground}
        />
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

      {/* ── Display ─────────────────────────────────── */}
      <Section title="Display" defaultOpen={false}>
        <div className="space-y-3">
          <div>
            <MiniLabel>Display</MiniLabel>
            <Dropdown
              value={display.display ?? ""}
              onChange={(v) => {
                const val = v || undefined;
                updateDisplay({
                  display: val,
                  flexDirection: undefined, flexWrap: undefined,
                  justifyContent: undefined, alignItems: undefined, gap: undefined,
                  gridTemplateColumns: undefined, gridGap: undefined,
                });
              }}
              options={[
                { value: "", label: "— default —" },
                { value: "block", label: "block" },
                { value: "inline", label: "inline" },
                { value: "inline-block", label: "inline-block" },
                { value: "flex", label: "flex" },
                { value: "inline-flex", label: "inline-flex" },
                { value: "grid", label: "grid" },
                { value: "inline-grid", label: "inline-grid" },
                { value: "none", label: "none" },
              ]}
              className="mt-1"
            />
          </div>

          {(display.display === "flex" || display.display === "inline-flex") && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <MiniLabel>Direction</MiniLabel>
                  <Dropdown
                    value={display.flexDirection ?? ""}
                    onChange={(v) => updateDisplay({ flexDirection: v || undefined })}
                    options={[
                      { value: "", label: "— default —" },
                      { value: "row", label: "row" },
                      { value: "row-reverse", label: "row-reverse" },
                      { value: "column", label: "column" },
                      { value: "column-reverse", label: "column-reverse" },
                    ]}
                    className="mt-1"
                  />
                </div>
                <div>
                  <MiniLabel>Wrap</MiniLabel>
                  <Dropdown
                    value={display.flexWrap ?? ""}
                    onChange={(v) => updateDisplay({ flexWrap: v || undefined })}
                    options={[
                      { value: "", label: "— default —" },
                      { value: "nowrap", label: "nowrap" },
                      { value: "wrap", label: "wrap" },
                      { value: "wrap-reverse", label: "wrap-reverse" },
                    ]}
                    className="mt-1"
                  />
                </div>
                <div>
                  <MiniLabel>Justify Content</MiniLabel>
                  <Dropdown
                    value={display.justifyContent ?? ""}
                    onChange={(v) => updateDisplay({ justifyContent: v || undefined })}
                    options={[
                      { value: "", label: "— default —" },
                      { value: "flex-start", label: "flex-start" },
                      { value: "flex-end", label: "flex-end" },
                      { value: "center", label: "center" },
                      { value: "space-between", label: "space-between" },
                      { value: "space-around", label: "space-around" },
                      { value: "space-evenly", label: "space-evenly" },
                    ]}
                    className="mt-1"
                  />
                </div>
                <div>
                  <MiniLabel>Align Items</MiniLabel>
                  <Dropdown
                    value={display.alignItems ?? ""}
                    onChange={(v) => updateDisplay({ alignItems: v || undefined })}
                    options={[
                      { value: "", label: "— default —" },
                      { value: "flex-start", label: "flex-start" },
                      { value: "flex-end", label: "flex-end" },
                      { value: "center", label: "center" },
                      { value: "baseline", label: "baseline" },
                      { value: "stretch", label: "stretch" },
                    ]}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <MiniLabel>Gap</MiniLabel>
                <input
                  type="text"
                  value={display.gap ?? ""}
                  onChange={(e) => updateDisplay({ gap: e.target.value || undefined })}
                  placeholder="1rem"
                  className="mt-1 w-full rounded border border-zinc-200 px-1.5 py-1 text-[11px] text-zinc-700 placeholder:text-zinc-300 focus:border-zinc-400 focus:outline-none"
                />
              </div>
            </>
          )}

          {(display.display === "grid" || display.display === "inline-grid") && (
            <>
              <div>
                <MiniLabel>Grid Template Columns</MiniLabel>
                <input
                  type="text"
                  value={display.gridTemplateColumns ?? ""}
                  onChange={(e) => updateDisplay({ gridTemplateColumns: e.target.value || undefined })}
                  placeholder="repeat(3, 1fr)"
                  className="mt-1 w-full rounded border border-zinc-200 px-1.5 py-1 text-[11px] text-zinc-700 placeholder:text-zinc-300 focus:border-zinc-400 focus:outline-none"
                />
              </div>
              <div>
                <MiniLabel>Gap</MiniLabel>
                <input
                  type="text"
                  value={display.gridGap ?? ""}
                  onChange={(e) => updateDisplay({ gridGap: e.target.value || undefined })}
                  placeholder="1rem"
                  className="mt-1 w-full rounded border border-zinc-200 px-1.5 py-1 text-[11px] text-zinc-700 placeholder:text-zinc-300 focus:border-zinc-400 focus:outline-none"
                />
              </div>
            </>
          )}
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
              <Dropdown
                value={border.style || "solid"}
                onChange={(v) => updateBorder({ style: v || undefined })}
                options={[
                  { value: "solid", label: "Solid" },
                  { value: "dashed", label: "Dashed" },
                  { value: "dotted", label: "Dotted" },
                  { value: "double", label: "Double" },
                  { value: "none", label: "None" },
                ]}
              />
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
