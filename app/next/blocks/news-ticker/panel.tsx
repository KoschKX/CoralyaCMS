"use client";

import { useId } from "react";
import { PanelSection } from "@/components/ui/PanelSection";
import type { PanelControlProps } from "@/lib/block-types";
import {
  OptionToggle,
  OptionSelect,
  OptionSegment,
  OptionText,
  OptionColor,
} from "@/components/ui/PanelControls";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TickerItem {
  id: string;
  text: string;
  url: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TICKER_TYPES = [
  {
    value: "marquee",
    label: "Marquee (scroll)",
    icon: (
      <svg viewBox="0 0 20 14" width="16" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="1" y="1" width="18" height="12" rx="1.5"/>
        <path d="M4 7h12M13 5l2 2-2 2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: "carousel",
    label: "Carousel (rotate)",
    icon: (
      <svg viewBox="0 0 20 14" width="16" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="1" y="1" width="18" height="12" rx="1.5"/>
        <path d="M3 7h14M5 5l-2 2 2 2M15 5l2 2-2 2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

const TITLE_SHAPES = [
  { value: "none",     label: "None"     },
  { value: "rounded",  label: "Rounded"  },
  { value: "triangle", label: "Triangle" },
];

const LINK_TARGETS = [
  { value: "_self",  label: "Same tab"  },
  { value: "_blank", label: "New tab"   },
];

const TEXT_TRANSFORMS = [
  { value: "",           label: "Default"    },
  { value: "uppercase",  label: "UPPERCASE"  },
  { value: "lowercase",  label: "lowercase"  },
  { value: "capitalize", label: "Capitalize" },
];

// ── Items editor ──────────────────────────────────────────────────────────────

function ItemsEditor({ items, onChange }: {
  items: TickerItem[];
  onChange: (items: TickerItem[]) => void;
}) {
  const baseId = useId();

  function update(index: number, field: keyof TickerItem, value: string) {
    const next = items.map((it, i) => i === index ? { ...it, [field]: value } : it);
    onChange(next);
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...items, { id: `${Date.now()}`, text: "", url: "" }]);
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={item.id} className="rounded border border-zinc-200 bg-zinc-50 p-2 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-400 font-medium w-4 shrink-0 text-center">{i + 1}</span>
            <input
              id={`${baseId}-text-${i}`}
              type="text"
              aria-label="Item text"
              value={item.text}
              placeholder="Headline text…"
              onChange={(e) => update(i, "text", e.target.value)}
              className="min-w-0 flex-1 rounded border border-zinc-200 bg-white px-2.5 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Remove item"
              title="Remove"
              className="shrink-0 rounded p-1 text-zinc-400 hover:text-red-500 transition"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M3 4h10M6 4V2.5h4V4M5 4l.5 9h5l.5-9" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-1.5 pl-5">
            <input
              type="url"
              aria-label="Item URL"
              value={item.url}
              placeholder="https://… (optional)"
              onChange={(e) => update(i, "url", e.target.value)}
              className="min-w-0 flex-1 rounded border border-zinc-200 bg-white px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full rounded border border-dashed border-zinc-300 py-1.5 text-xs text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition"
      >
        + Add item
      </button>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function NewsTickerPanelControls({ data, onChange }: PanelControlProps) {
  const tickerType = String(data.tickerType ?? "marquee");
  const isMarquee  = tickerType === "marquee";
  const isCarousel = tickerType === "carousel";

  const items: TickerItem[] = Array.isArray(data.items)
    ? (data.items as TickerItem[])
    : [];

  return (
    <div className="space-y-5">

      {/* ── Items ─────────────────────────────────────────────────── */}
      <PanelSection title="Items">
        <ItemsEditor
          items={items}
          onChange={(next) => onChange({ ...data, items: next })}
        />
      </PanelSection>

      {/* ── Ticker ────────────────────────────────────────────────── */}
      <PanelSection title="Ticker">
        <div className="space-y-3">
          <OptionSegment
            label="Type"
            value={tickerType}
            options={TICKER_TYPES}
            onChange={(v) => onChange({ ...data, tickerType: v })}
          />
          <OptionText
            label="Title label"
            value={String(data.tickerTitle ?? "")}
            placeholder="e.g. Latest, Breaking…"
            onChange={(v) => onChange({ ...data, tickerTitle: v })}
          />
          <OptionSelect
            label="Title shape"
            stacked
            value={String(data.titleShape ?? "none")}
            options={TITLE_SHAPES}
            onChange={(v) => onChange({ ...data, titleShape: v })}
          />
          <OptionSelect
            label="Link target"
            stacked
            value={String(data.linkTarget ?? "_self")}
            options={LINK_TARGETS}
            onChange={(v) => onChange({ ...data, linkTarget: v })}
          />
        </div>
      </PanelSection>

      {/* ── Marquee settings ──────────────────────────────────────── */}
      {isMarquee && (
        <PanelSection title="Marquee">
          <div className="space-y-3">
            <OptionText
              label="Speed (px / second)"
              value={String(data.tickerSpeed ?? 75)}
              placeholder="75"
              onChange={(v) => onChange({ ...data, tickerSpeed: Number(v) || 75 })}
            />
            <OptionText
              label="Separator"
              value={String(data.separator ?? "")}
              placeholder="• or | or —"
              onChange={(v) => onChange({ ...data, separator: v })}
            />
          </div>
        </PanelSection>
      )}

      {/* ── Carousel settings ─────────────────────────────────────── */}
      {isCarousel && (
        <PanelSection title="Carousel">
          <div className="space-y-3">
            <OptionText
              label="Display time (seconds)"
              value={String(data.carouselDisplayTime ?? 5)}
              placeholder="5"
              onChange={(v) => onChange({ ...data, carouselDisplayTime: Number(v) || 5 })}
            />
            <OptionToggle
              label="Show prev / next arrows"
              checked={data.carouselArrows !== false}
              onChange={(v) => onChange({ ...data, carouselArrows: v })}
            />
          </div>
        </PanelSection>
      )}

      {/* ── Colors ────────────────────────────────────────────────── */}
      <PanelSection title="Colors">
        <div className="space-y-3">
          <OptionColor
            label="Title background"
            value={String(data.titleBgColor ?? "")}
            onChange={(v) => onChange({ ...data, titleBgColor: v })}
          />
          <OptionColor
            label="Title text"
            value={String(data.titleFontColor ?? "")}
            onChange={(v) => onChange({ ...data, titleFontColor: v })}
          />
          <OptionColor
            label="Ticker background"
            value={String(data.tickerBgColor ?? "")}
            onChange={(v) => onChange({ ...data, tickerBgColor: v })}
          />
          <OptionColor
            label="Ticker text"
            value={String(data.tickerFontColor ?? "")}
            onChange={(v) => onChange({ ...data, tickerFontColor: v })}
          />
          <OptionColor
            label="Link hover color"
            value={String(data.tickerHoverColor ?? "")}
            onChange={(v) => onChange({ ...data, tickerHoverColor: v })}
          />
        </div>
      </PanelSection>

      {/* ── Typography ────────────────────────────────────────────── */}
      <PanelSection title="Typography">
        <div className="space-y-3">
          <OptionText
            label="Font size"
            value={String(data.fontSize ?? "")}
            placeholder="e.g. 14px"
            onChange={(v) => onChange({ ...data, fontSize: v })}
          />
          <OptionText
            label="Line height"
            value={String(data.lineHeight ?? "")}
            placeholder="e.g. 1.5"
            onChange={(v) => onChange({ ...data, lineHeight: v })}
          />
          <OptionText
            label="Letter spacing"
            value={String(data.letterSpacing ?? "")}
            placeholder="e.g. 0.05em"
            onChange={(v) => onChange({ ...data, letterSpacing: v })}
          />
          <OptionSelect
            label="Text transform"
            stacked
            value={String(data.textTransform ?? "")}
            options={TEXT_TRANSFORMS}
            onChange={(v) => onChange({ ...data, textTransform: v })}
          />
        </div>
      </PanelSection>

      {/* ── Dimensions ────────────────────────────────────────────── */}
      <PanelSection title="Dimensions">
        <div className="space-y-3">
          <OptionText
            label="Ticker height"
            value={String(data.tickerHeight ?? "")}
            placeholder="e.g. 2.75rem"
            onChange={(v) => onChange({ ...data, tickerHeight: v })}
          />
          <OptionText
            label="Border radius"
            value={String(data.borderRadius ?? "")}
            placeholder="e.g. 4px"
            onChange={(v) => onChange({ ...data, borderRadius: v })}
          />
        </div>
      </PanelSection>

    </div>
  );
}
