"use client";

import { PanelSection } from "@/components/ui/PanelSection";
import type { PanelControlProps } from "@/lib/block-types";
import {
  OptionColor,
  OptionToggle,
  OptionSegment,
  OptionText,
  OptionSelect,
} from "@/components/ui/PanelControls";

// ── Panel ─────────────────────────────────────────────────────────────────────

export function StarRatingPanelControls({ data, onChange }: PanelControlProps) {
  const rating    = Number(data.rating)    || 0;
  const maxRating = Math.max(1, Math.min(10, Math.round(Number(data.maxRating) || 5)));

  return (
    <div className="space-y-5">

      {/* ── Rating ────────────────────────────────────────────────── */}
      <PanelSection title="Rating">
        <div className="space-y-3">

          {/* Max stars */}
          <OptionSegment
            label="Max stars"
            value={String(maxRating)}
            options={[3, 4, 5, 6, 7, 10].map((n) => ({ value: String(n), label: String(n) }))}
            onChange={(v) => {
              const next = Number(v);
              onChange({ ...data, maxRating: next, rating: Math.min(rating, next) });
            }}
          />

          {/* Rating slider + numeric readout */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Rating</span>
              <span className="font-mono text-xs text-zinc-700">
                {rating % 1 === 0 ? rating : Number(rating).toFixed(1)}&thinsp;/&thinsp;{maxRating}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={maxRating}
              step={0.5}
              value={rating}
              onChange={(e) => onChange({ ...data, rating: Number(e.target.value) })}
              className="w-full accent-zinc-800"
            />
          </div>

          <OptionSelect
            label="Rounding"
            value={(data.rounding as string) || "auto"}
            options={[
              { value: "auto",      label: "Auto" },
              { value: "0decimals", label: "0 decimals" },
              { value: "1decimal",  label: "1 decimal" },
              { value: "2decimals", label: "2 decimals" },
            ]}
            onChange={(v) => onChange({ ...data, rounding: v })}
          />

          <OptionToggle
            label="Hide when rating is 0"
            checked={data.hideEmpty === true}
            onChange={(v) => onChange({ ...data, hideEmpty: v })}
          />
        </div>
      </PanelSection>

      {/* ── Design ────────────────────────────────────────────────── */}
      <PanelSection title="Design">
        <div className="space-y-3">
          <OptionText
            label="Icon size"
            value={(data.iconSize as string) ?? ""}
            placeholder="1.75rem"
            mono
            onChange={(v) => onChange({ ...data, iconSize: v })}
          />
          <OptionColor
            label="Filled color"
            value={(data.activeColor as string) ?? ""}
            onChange={(v) => onChange({ ...data, activeColor: v })}
          />
          <OptionColor
            label="Empty color"
            value={(data.inactiveColor as string) ?? ""}
            onChange={(v) => onChange({ ...data, inactiveColor: v })}
          />
          <OptionText
            label="Gap between stars"
            value={(data.gap as string) ?? ""}
            placeholder="0.25rem"
            mono
            onChange={(v) => onChange({ ...data, gap: v })}
          />
          <OptionSegment
            label="Alignment"
            value={(data.alignment as string) || "left"}
            options={[
              { value: "left",   label: "Left" },
              { value: "center", label: "Center" },
              { value: "right",  label: "Right" },
            ]}
            onChange={(v) => onChange({ ...data, alignment: v })}
          />
        </div>
      </PanelSection>

      {/* ── Rating text ───────────────────────────────────────────── */}
      <PanelSection title="Rating text">
        <div className="space-y-3">
          <OptionToggle
            label="Show numeric readout"
            checked={data.showText !== false}
            onChange={(v) => onChange({ ...data, showText: v })}
          />
          {data.showText !== false && (
            <>
              <OptionText
                label="Gap to stars"
                value={(data.textGap as string) ?? ""}
                placeholder="0.5rem"
                mono
                onChange={(v) => onChange({ ...data, textGap: v })}
              />
              <OptionText
                label="Font size"
                value={(data.textSize as string) ?? ""}
                placeholder="inherit"
                mono
                onChange={(v) => onChange({ ...data, textSize: v })}
              />
              <OptionColor
                label="Text color"
                value={(data.textColor as string) ?? ""}
                onChange={(v) => onChange({ ...data, textColor: v })}
              />
            </>
          )}
        </div>
      </PanelSection>

    </div>
  );
}
