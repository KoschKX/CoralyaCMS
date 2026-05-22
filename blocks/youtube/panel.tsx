"use client";

import { PanelSection } from "@/components/ui/PanelSection";
import type { PanelControlProps } from "@/lib/block-types";
import {
  OptionText,
  OptionToggle,
  OptionSegment,
  OptionAlign,
} from "@/components/ui/PanelControls";

const ASPECT_RATIOS = [
  { value: "16:9", label: "16 : 9" },
  { value: "4:3",  label: "4 : 3"  },
  { value: "1:1",  label: "1 : 1"  },
  { value: "9:16", label: "9 : 16" },
];

// ── Panel ─────────────────────────────────────────────────────────────────────

export function YoutubePanelControls({ data, onChange }: PanelControlProps) {
  const autoplay = data.autoplay === true;

  return (
    <div className="space-y-5">

      {/* ── Video ─────────────────────────────────────────────────── */}
      <PanelSection title="Video">
        <div className="space-y-3">
          <OptionText
            label="YouTube URL or ID"
            value={String(data.url ?? "")}
            placeholder="https://youtube.com/watch?v=… or video ID"
            onChange={(v) => onChange({ ...data, url: v })}
          />
          <OptionText
            label="Title (accessibility)"
            value={String(data.title ?? "")}
            placeholder="YouTube video player"
            onChange={(v) => onChange({ ...data, title: v })}
          />
        </div>
      </PanelSection>

      {/* ── Display ───────────────────────────────────────────────── */}
      <PanelSection title="Display">
        <div className="space-y-3">
          <OptionSegment
            label="Aspect ratio"
            value={String(data.aspectRatio ?? "16:9")}
            options={ASPECT_RATIOS}
            onChange={(v) => onChange({ ...data, aspectRatio: v })}
          />
          <OptionText
            label="Max width"
            value={String(data.maxWidth ?? "")}
            placeholder="e.g. 800px or 100%"
            onChange={(v) => onChange({ ...data, maxWidth: v })}
          />
          <OptionAlign
            label="Alignment"
            value={String(data.alignment ?? "center")}
            onChange={(v) => onChange({ ...data, alignment: v })}
          />
        </div>
      </PanelSection>

      {/* ── Playback ──────────────────────────────────────────────── */}
      <PanelSection title="Playback">
        <div className="space-y-3">
          <OptionToggle
            label="Autoplay (forces mute)"
            checked={autoplay}
            onChange={(v) => onChange({ ...data, autoplay: v })}
          />
          <OptionToggle
            label="Mute"
            checked={data.mute === true || autoplay}
            onChange={(v) => onChange({ ...data, mute: autoplay ? true : v })}
          />
          <OptionToggle
            label="Loop"
            checked={data.loop === true}
            onChange={(v) => onChange({ ...data, loop: v })}
          />
          <OptionToggle
            label="Show controls"
            checked={data.controls !== false}
            onChange={(v) => onChange({ ...data, controls: v })}
          />
          <div className="grid grid-cols-2 gap-2">
            <OptionText
              label="Start (seconds)"
              value={String(data.startTime ?? "")}
              placeholder="0"
              onChange={(v) => onChange({ ...data, startTime: v ? Number(v) : "" })}
            />
            <OptionText
              label="End (seconds)"
              value={String(data.endTime ?? "")}
              placeholder="—"
              onChange={(v) => onChange({ ...data, endTime: v ? Number(v) : "" })}
            />
          </div>
        </div>
      </PanelSection>

      {/* ── Privacy ───────────────────────────────────────────────── */}
      <PanelSection title="Privacy">
        <OptionToggle
          label="Privacy-enhanced mode (youtube-nocookie.com)"
          checked={data.privacy === true}
          onChange={(v) => onChange({ ...data, privacy: v })}
        />
      </PanelSection>

    </div>
  );
}
