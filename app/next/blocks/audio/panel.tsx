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

// ── Constants ─────────────────────────────────────────────────────────────────

const PRELOAD_OPTIONS = [
  { value: "metadata", label: "Metadata only" },
  { value: "auto",     label: "Auto (full preload)" },
  { value: "none",     label: "None" },
];

const SOURCE_TYPES = [
  {
    value: "hosted",
    label: "Hosted audio (MP3 / OGG…)",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="6"  cy="18" r="2.5"/>
        <circle cx="18" cy="16" r="2.5"/>
      </svg>
    ),
  },
  {
    value: "soundcloud",
    label: "SoundCloud",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M1 13.5c0 1.38 1.12 2.5 2.5 2.5H17a4 4 0 0 0 0-8 5 5 0 0 0-9.9 1" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4.5 16v-3M7 16v-4M9.5 16v-5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

// ── URL field helper ──────────────────────────────────────────────────────────

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
          className="min-w-0 flex-1 rounded border border-zinc-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
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

export function AudioPanelControls({ data, onChange }: PanelControlProps) {
  const sourceType = String(data.sourceType ?? "hosted");
  const autoplay   = data.autoplay === true;
  const isSC       = sourceType === "soundcloud";

  const [pickerOpen, setPickerOpen] = useState(false);
  function handleSelect(url: string) { onChange({ ...data, src: url }); }

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
            <UrlField
              label="Audio file URL"
              value={String(data.src ?? "")}
              placeholder="https://example.com/audio.mp3"
              onChange={(v) => onChange({ ...data, src: v })}
              onBrowse={() => setPickerOpen(true)}
            />
          )}

          {isSC && (
            <OptionText
              label="SoundCloud URL"
              value={String(data.url ?? "")}
              placeholder="https://soundcloud.com/artist/track"
              onChange={(v) => onChange({ ...data, url: v })}
            />
          )}
        </div>
      </PanelSection>

      {/* ── Playback ──────────────────────────────────────────────── */}
      <PanelSection title="Playback">
        <div className="space-y-3">
          <OptionToggle
            label="Autoplay"
            checked={autoplay}
            onChange={(v) => onChange({ ...data, autoplay: v })}
          />
          <OptionToggle
            label="Loop"
            checked={data.loop === true}
            onChange={(v) => onChange({ ...data, loop: v })}
          />
          {sourceType === "hosted" && (
            <>
              <OptionToggle
                label="Show controls"
                checked={data.controls !== false}
                onChange={(v) => onChange({ ...data, controls: v })}
              />
              <OptionSelect
                label="Preload"
                stacked
                value={String(data.preload ?? "metadata")}
                options={PRELOAD_OPTIONS}
                onChange={(v) => onChange({ ...data, preload: v })}
              />
            </>
          )}
        </div>
      </PanelSection>

      {/* ── SoundCloud options ────────────────────────────────────── */}
      {isSC && (
        <PanelSection title="SoundCloud">
          <div className="space-y-3">
            <OptionToggle
              label="Visual player (artwork + waveform)"
              checked={data.visual === true}
              onChange={(v) => onChange({ ...data, visual: v })}
            />
            <OptionToggle
              label="Hide related tracks"
              checked={data.hideRelated !== false}
              onChange={(v) => onChange({ ...data, hideRelated: v })}
            />
            <OptionToggle
              label="Show user name"
              checked={data.showUser !== false}
              onChange={(v) => onChange({ ...data, showUser: v })}
            />
            <OptionToggle
              label="Show comments"
              checked={data.showComments === true}
              onChange={(v) => onChange({ ...data, showComments: v })}
            />
            <OptionToggle
              label="Show reposts"
              checked={data.showReposts === true}
              onChange={(v) => onChange({ ...data, showReposts: v })}
            />
            <OptionToggle
              label="Show teaser"
              checked={data.showTeaser === true}
              onChange={(v) => onChange({ ...data, showTeaser: v })}
            />
            <OptionColor
              label="Accent color"
              value={String(data.color ?? "")}
              onChange={(v) => onChange({ ...data, color: v })}
            />
          </div>
        </PanelSection>
      )}

      {/* ── Display ───────────────────────────────────────────────── */}
      <PanelSection title="Display">
        <div className="space-y-3">
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
          {sourceType === "hosted" && (
            <OptionText
              label="Border radius"
              value={String(data.borderRadius ?? "")}
              placeholder="e.g. 8px"
              onChange={(v) => onChange({ ...data, borderRadius: v })}
            />
          )}
        </div>
      </PanelSection>

      {/* ── Advanced ──────────────────────────────────────────────── */}
      <PanelSection title="Advanced">
        <div className="space-y-3">
          <OptionText
            label="Title (accessibility)"
            value={String(data.title ?? "")}
            placeholder="Audio player"
            onChange={(v) => onChange({ ...data, title: v })}
          />
        </div>
      </PanelSection>

      <MediaPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
      />
    </div>
  );
}
