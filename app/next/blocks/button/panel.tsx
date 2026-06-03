"use client";

import { PanelSection } from "@/components/ui/PanelSection";
import type { PanelControlProps } from "@/lib/block-types";
import {
  OptionColor,
  OptionToggle,
  OptionAlign,
  OptionSegment,
  OptionText,
} from "@/components/ui/PanelControls";

// ── Panel ─────────────────────────────────────────────────────────────────────

export function ButtonPanelControls({ data, onChange }: PanelControlProps) {
  const type      = (data.type      as string) || "flat";
  const size      = (data.size      as string) || "medium";
  const align     = (data.align     as string) || "left";
  const stretch   = Boolean(data.stretch);
  const target    = (data.target    as string) || "_self";
  const iconPos   = (data.iconPosition as string) || "left";

  return (
    <div className="space-y-5">

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <PanelSection title="Content">
        <div className="space-y-2">
          <OptionText
            label="Label"
            value={(data.text as string) ?? ""}
            placeholder="Button"
            onChange={(v) => onChange({ ...data, text: v })}
          />
          <OptionText
            label="URL"
            value={(data.url as string) ?? ""}
            placeholder="https://…"
            type="url"
            onChange={(v) => onChange({ ...data, url: v })}
          />
          <OptionToggle
            label="Open in new tab"
            checked={target === "_blank"}
            onChange={(v) => onChange({ ...data, target: v ? "_blank" : "_self" })}
          />
        </div>
      </PanelSection>

      {/* ── Style ───────────────────────────────────────────────────────── */}
      <PanelSection title="Style">
        <div className="space-y-3">
          <OptionSegment
            label="Type"
            value={type}
            options={[
              { value: "flat",        label: "Flat" },
              { value: "outline",     label: "Outline" },
              { value: "transparent", label: "Transparent" },
              { value: "3d",          label: "3D" },
              { value: "link",        label: "Link" },
            ]}
            onChange={(v) => onChange({ ...data, type: v })}
            wrap
          />
          <OptionSegment
            label="Size"
            value={size}
            options={[
              { value: "small",  label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large",  label: "Large" },
              { value: "xlarge", label: "XL" },
            ]}
            onChange={(v) => onChange({ ...data, size: v })}
          />
          <OptionText
            label="Border radius"
            value={(data.borderRadius as string) ?? ""}
            placeholder="4px"
            mono
            onChange={(v) => onChange({ ...data, borderRadius: v })}
          />
        </div>
      </PanelSection>

      {/* ── Layout ──────────────────────────────────────────────────────── */}
      <PanelSection title="Layout">
        <div className="space-y-3">
          <OptionAlign
            label="Alignment"
            value={align}
            onChange={(v) => onChange({ ...data, align: v })}
          />
          <OptionToggle
            label="Full width"
            checked={stretch}
            onChange={(v) => onChange({ ...data, stretch: v })}
          />
        </div>
      </PanelSection>

      {/* ── Colors ──────────────────────────────────────────────────────── */}
      <PanelSection title="Colors">
        <div className="space-y-2">
          <OptionColor label="Background" value={(data.bgColor          as string) ?? ""} onChange={(v) => onChange({ ...data, bgColor:           v })} />
          <OptionColor label="Text"       value={(data.textColor        as string) ?? ""} onChange={(v) => onChange({ ...data, textColor:         v })} />
          <OptionColor label="Border"     value={(data.borderColor      as string) ?? ""} onChange={(v) => onChange({ ...data, borderColor:       v })} />
          <div className="my-1.5 border-t border-zinc-100" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">On hover</p>
          <OptionColor label="Background" value={(data.hoverBgColor     as string) ?? ""} onChange={(v) => onChange({ ...data, hoverBgColor:      v })} />
          <OptionColor label="Text"       value={(data.hoverTextColor   as string) ?? ""} onChange={(v) => onChange({ ...data, hoverTextColor:    v })} />
          <OptionColor label="Border"     value={(data.hoverBorderColor as string) ?? ""} onChange={(v) => onChange({ ...data, hoverBorderColor: v })} />
        </div>
      </PanelSection>

      {/* ── Icon ────────────────────────────────────────────────────────── */}
      <PanelSection title="Icon">
        <div className="space-y-2">
          <OptionText
            label="Icon CSS class"
            value={(data.icon as string) ?? ""}
            placeholder="e.g. fa fa-arrow-right"
            mono
            onChange={(v) => onChange({ ...data, icon: v })}
          />
          <OptionSegment
            label="Position"
            value={iconPos}
            options={[
              { value: "left",  label: "Left" },
              { value: "right", label: "Right" },
            ]}
            onChange={(v) => onChange({ ...data, iconPosition: v })}
          />
        </div>
      </PanelSection>

    </div>
  );
}
