"use client";

import { useState } from "react";
import { PanelSection } from "@/components/ui/PanelSection";
import { MediaPickerDialog } from "@/components/MediaPickerDialog";
import type { PanelControlProps } from "@/lib/block-types";
import {
  OptionToggle,
  OptionSelect,
  OptionSegment,
  OptionAlign,
  OptionText,
  OptionColor,
} from "@/components/ui/PanelControls";

const PRELOAD_OPTIONS = [
  { value: "metadata", label: "Metadata only" },
  { value: "auto",     label: "Auto (full preload)" },
  { value: "none",     label: "None" },
];

const ASPECT_RATIOS = [
  { value: "16:9", label: "16 : 9" },
  { value: "4:3",  label: "4 : 3"  },
  { value: "1:1",  label: "1 : 1"  },
  { value: "9:16", label: "9 : 16" },
];

const SOURCE_TYPES = [
  {
    value: "hosted",
    label: "Hosted video (MP4/WebM)",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="1.5"/>
        <rect x="5"  y="7"  width="2" height="2" rx="0.4" fill="currentColor" stroke="none"/>
        <rect x="5"  y="11" width="2" height="2" rx="0.4" fill="currentColor" stroke="none"/>
        <rect x="5"  y="15" width="2" height="2" rx="0.4" fill="currentColor" stroke="none"/>
        <rect x="17" y="7"  width="2" height="2" rx="0.4" fill="currentColor" stroke="none"/>
        <rect x="17" y="11" width="2" height="2" rx="0.4" fill="currentColor" stroke="none"/>
        <rect x="17" y="15" width="2" height="2" rx="0.4" fill="currentColor" stroke="none"/>
        <polygon points="10,9.5 10,14.5 15,12" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    value: "youtube",
    label: "YouTube",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <rect x="2" y="5" width="20" height="14" rx="3.5"/>
        <polygon points="10,9 10,15 16,12" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    value: "vimeo",
    label: "Vimeo",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="12" cy="12" r="9"/>
        <path d="M8.5 9.5c.8-.1 1.4.2 1.6 1l.9 3.8c.3 1 .6 1.2.9.7l1-1.8" stroke="currentColor" strokeLinecap="round"/>
        <path d="M11 10.5c.6-1 1.4-1.7 2.3-1.8 1.2-.1 1.6.9 1.3 2.5-.3 1.3-1.2 2.8-2.1 3.3" stroke="currentColor" strokeLinecap="round"/>
      </svg>
    ),
  },
];

function UrlField({ label, value, placeholder, onChange, onBrowse }: {
  label: string; value: string; placeholder?: string;
  onChange: (v: string) => void; onBrowse?: () => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-zinc-500">{label}</label>
      <div className="flex gap-1.5">
        <input
          type="url"
          aria-label={label}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
        {onBrowse && (
          <button
            type="button"
            onClick={onBrowse}
            title="Browse media library"
            className="shrink-0 rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
          >
            Browse
          </button>
        )}
      </div>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function VideoPanelControls({ data, onChange }: PanelControlProps) {
  const sourceType = String(data.sourceType ?? "hosted");
  const autoplay   = data.autoplay === true;
  const isEmbed    = sourceType === "youtube" || sourceType === "vimeo";

  type PickerField = "mp4" | "webm" | "poster";
  const [pickerOpen,   setPickerOpen]   = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerField>("mp4");

  function openPicker(target: PickerField) { setPickerTarget(target); setPickerOpen(true); }
  function handleSelect(url: string) { onChange({ ...data, [pickerTarget]: url }); }

  return (
    <div className="space-y-5">

      {/* ── Source type ───────────────────────────────────────────── */}
      <PanelSection title="Source">
        <div className="space-y-3">
          <OptionSegment
            label="Type"
            value={sourceType}
            options={SOURCE_TYPES}
            onChange={(v) => onChange({ ...data, sourceType: v })}
          />

          {sourceType === "hosted" && (
            <>
              <UrlField
                label="MP4 URL"
                value={String(data.mp4 ?? "")}
                placeholder="https://example.com/video.mp4"
                onChange={(v) => onChange({ ...data, mp4: v })}
                onBrowse={() => openPicker("mp4")}
              />
              <UrlField
                label="WebM URL (optional)"
                value={String(data.webm ?? "")}
                placeholder="https://example.com/video.webm"
                onChange={(v) => onChange({ ...data, webm: v })}
                onBrowse={() => openPicker("webm")}
              />
              <UrlField
                label="Poster image"
                value={String(data.poster ?? "")}
                placeholder="https://example.com/poster.jpg"
                onChange={(v) => onChange({ ...data, poster: v })}
                onBrowse={() => openPicker("poster")}
              />
            </>
          )}

          {sourceType === "youtube" && (
            <OptionText
              label="YouTube URL or ID"
              value={String(data.url ?? "")}
              placeholder="https://youtube.com/watch?v=… or video ID"
              onChange={(v) => onChange({ ...data, url: v })}
            />
          )}

          {sourceType === "vimeo" && (
            <OptionText
              label="Vimeo URL or ID"
              value={String(data.url ?? "")}
              placeholder="https://vimeo.com/123456789 or video ID"
              onChange={(v) => onChange({ ...data, url: v })}
            />
          )}
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
          {sourceType === "hosted" && (
            <OptionSelect
              label="Preload"
              stacked
              value={String(data.preload ?? "metadata")}
              options={PRELOAD_OPTIONS}
              onChange={(v) => onChange({ ...data, preload: v })}
            />
          )}
          {sourceType !== "vimeo" && (
            <div className="grid grid-cols-2 gap-2">
              <OptionText
                label="Start (seconds)"
                value={String(data.startTime ?? "")}
                placeholder="0"
                onChange={(v) => onChange({ ...data, startTime: v })}
              />
              <OptionText
                label="End (seconds)"
                value={String(data.endTime ?? "")}
                placeholder="—"
                onChange={(v) => onChange({ ...data, endTime: v })}
              />
            </div>
          )}
        </div>
      </PanelSection>

      {/* ── Display ───────────────────────────────────────────────── */}
      <PanelSection title="Display">
        <div className="space-y-3">
          {isEmbed && (
            <OptionSegment
              label="Aspect ratio"
              value={String(data.aspectRatio ?? "16:9")}
              options={ASPECT_RATIOS}
              onChange={(v) => onChange({ ...data, aspectRatio: v })}
            />
          )}
          <OptionText
            label="Max width"
            value={String(data.maxWidth ?? "")}
            placeholder="100%"
            onChange={(v) => onChange({ ...data, maxWidth: v })}
          />
          <OptionAlign
            label="Alignment"
            value={String(data.alignment ?? "center")}
            onChange={(v) => onChange({ ...data, alignment: v })}
          />
          <OptionText
            label="Border radius"
            value={String(data.borderRadius ?? "")}
            placeholder="e.g. 8px"
            onChange={(v) => onChange({ ...data, borderRadius: v })}
          />
        </div>
      </PanelSection>

      {/* ── Advanced ──────────────────────────────────────────────── */}
      {(sourceType === "hosted" || sourceType === "youtube") && (
        <PanelSection title="Advanced">
          <div className="space-y-3">
            {sourceType === "youtube" && (
              <OptionToggle
                label="Privacy-enhanced mode (youtube-nocookie.com)"
                checked={data.privacy === true}
                onChange={(v) => onChange({ ...data, privacy: v })}
              />
            )}
            {sourceType === "hosted" && (
              <OptionColor
                label="Overlay color"
                value={String(data.overlayColor ?? "")}
                onChange={(v) => onChange({ ...data, overlayColor: v })}
              />
            )}
            <OptionText
              label="Title (accessibility)"
              value={String(data.title ?? "")}
              placeholder="Video player"
              onChange={(v) => onChange({ ...data, title: v })}
            />
          </div>
        </PanelSection>
      )}

      <MediaPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
        mediaType={pickerTarget === "poster" ? "image" : "video"}
      />

    </div>
  );
}
