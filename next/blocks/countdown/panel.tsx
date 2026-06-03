"use client";

import { PanelSection } from "@/components/ui/PanelSection";
import type { PanelControlProps } from "@/lib/block-types";
import {
  OptionColor,
  OptionToggle,
  OptionAlign,
  OptionSelect,
  OptionText,
} from "@/components/ui/PanelControls";

// ── Helpers ─────────────────────────────────────────────────────────────────────

// Converts any stored date string to the datetime-local input format (YYYY-MM-DDTHH:MM)
function toDatetimeLocal(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "";
  return raw.slice(0, 16);
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function CountdownPanelControls({ data, onChange }: PanelControlProps) {
  const labelPosition = (data.labelPosition as string) || "below";
  const alignment     = (data.alignment     as string) || "center";
  const showWeeks     = Boolean(data.showWeeks);
  const linkTarget    = (data.linkTarget    as string) || "_self";

  return (
    <div className="space-y-5">

      {/* ── Target date ──────────────────────────────────────────────────── */}
      <PanelSection title="Target Date">
        <div className="space-y-2">
          <OptionText
            label="Count down to"
            value={toDatetimeLocal(data.targetDate)}
            type="datetime-local"
            onChange={(v) => onChange({ ...data, targetDate: v })}
          />
          <OptionText
            label="Expired message"
            value={(data.expiredText as string) ?? ""}
            placeholder="Event has ended"
            onChange={(v) => onChange({ ...data, expiredText: v })}
          />
        </div>
      </PanelSection>

      {/* ── Text ─────────────────────────────────────────────────────────── */}
      <PanelSection title="Text">
        <div className="space-y-2">
          <OptionText label="Heading"    value={(data.heading    as string) ?? ""} placeholder="(optional)" onChange={(v) => onChange({ ...data, heading:    v })} />
          <OptionText label="Subheading" value={(data.subheading as string) ?? ""} placeholder="(optional)" onChange={(v) => onChange({ ...data, subheading: v })} />
        </div>
      </PanelSection>

      {/* ── Options ──────────────────────────────────────────────────────── */}
      <PanelSection title="Options">
        <div className="space-y-3">
          <OptionToggle
            label="Show weeks"
            checked={showWeeks}
            onChange={(v) => onChange({ ...data, showWeeks: v })}
          />
          <OptionSelect
            label="Label position"
            value={labelPosition}
            options={[
              { value: "below", label: "Below" },
              { value: "above", label: "Above" },
            ]}
            onChange={(v) => onChange({ ...data, labelPosition: v })}
          />
          <OptionAlign
            label="Alignment"
            value={alignment}
            onChange={(v) => onChange({ ...data, alignment: v })}
          />
        </div>
      </PanelSection>

      {/* ── Appearance ───────────────────────────────────────────────────── */}
      <PanelSection title="Appearance">
        <div className="space-y-2">
          <OptionColor label="Box background" value={(data.counterBgColor   as string) ?? ""} onChange={(v) => onChange({ ...data, counterBgColor:   v })} />
          <OptionColor label="Digit color"    value={(data.counterTextColor as string) ?? ""} onChange={(v) => onChange({ ...data, counterTextColor: v })} />
          <OptionColor label="Label color"    value={(data.labelColor       as string) ?? ""} onChange={(v) => onChange({ ...data, labelColor:       v })} />
          <OptionText
            label="Border radius"
            value={(data.borderRadius as string) ?? ""}
            placeholder="6px"
            mono
            onChange={(v) => onChange({ ...data, borderRadius: v })}
          />
        </div>
      </PanelSection>

      {/* ── CTA Link ─────────────────────────────────────────────────────── */}
      <PanelSection title="Link">
        <div className="space-y-2">
          <OptionText label="Link text" value={(data.linkText as string) ?? ""} placeholder="Learn more" onChange={(v) => onChange({ ...data, linkText: v })} />
          <OptionText label="Link URL"  value={(data.linkUrl  as string) ?? ""} placeholder="https://…"  onChange={(v) => onChange({ ...data, linkUrl:  v })} />
          <OptionSelect
            label="Target"
            value={linkTarget}
            options={[
              { value: "_self",  label: "Same tab" },
              { value: "_blank", label: "New tab" },
            ]}
            onChange={(v) => onChange({ ...data, linkTarget: v })}
          />
        </div>
      </PanelSection>

    </div>
  );
}
