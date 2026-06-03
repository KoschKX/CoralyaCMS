"use client";

import { PanelSection } from "@/components/ui/PanelSection";
import type { PanelControlProps } from "@/lib/block-types";
import {
  OptionText,
  OptionSelect,
  OptionSegment,
  OptionToggle,
  OptionColor,
} from "@/components/ui/PanelControls";

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: "photostream", label: "Photostream" },
  { value: "album",       label: "Album" },
] as const;

const LAYOUT_OPTIONS = [
  { value: "grid",    label: "Grid" },
  { value: "masonry", label: "Masonry" },
] as const;

const ASPECT_OPTIONS = [
  { value: "square",   label: "1:1" },
  { value: "original", label: "Original" },
] as const;

const HOVER_OPTIONS = [
  { value: "none",   label: "None" },
  { value: "zoom",   label: "Zoom" },
  { value: "liftup", label: "Lift Up" },
] as const;

const LINK_OPTIONS = [
  { value: "lightbox", label: "Lightbox" },
  { value: "page",     label: "Flickr page" },
  { value: "none",     label: "None" },
] as const;

const TARGET_OPTIONS = [
  { value: "_self",  label: "Same tab" },
  { value: "_blank", label: "New tab" },
] as const;

const LOAD_MORE_OPTIONS = [
  { value: "none",   label: "Disabled" },
  { value: "button", label: "Button" },
] as const;

const COLUMN_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
] as const;

const LIMIT_OPTIONS = [
  { value: "6",  label: "6" },
  { value: "9",  label: "9" },
  { value: "12", label: "12" },
  { value: "15", label: "15" },
  { value: "20", label: "20" },
] as const;

function str(v: unknown): string {
  if (v === undefined || v === null) return "";
  return String(v);
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function FlickrPanelControls({ data, onChange }: PanelControlProps) {
  const set = (key: string, value: unknown) => onChange({ ...data, [key]: value });

  return (
    <>
      {/* ── Source ──────────────────────────────────────────────── */}
      <PanelSection title="Source">
        <OptionText
          label="Flickr user ID (NSID)"
          value={str(data.flickrId)}
          onChange={(v) => set("flickrId", v)}
          placeholder="12345678@N00"
        />
        <OptionSegment
          label="Type"
          value={str(data.type) || "photostream"}
          options={TYPE_OPTIONS}
          onChange={(v) => set("type", v)}
        />
        {str(data.type) === "album" && (
          <OptionText
            label="Album / photoset ID"
            value={str(data.albumId)}
            onChange={(v) => set("albumId", v)}
            placeholder="72157694123456789"
          />
        )}
      </PanelSection>

      {/* ── Layout ──────────────────────────────────────────────── */}
      <PanelSection title="Layout">
        <OptionSegment
          label="Layout"
          value={str(data.layout) || "grid"}
          options={LAYOUT_OPTIONS}
          onChange={(v) => set("layout", v)}
        />
        <OptionSelect
          label="Photos shown"
          value={str(data.limit) || "12"}
          options={LIMIT_OPTIONS}
          onChange={(v) => set("limit", Number(v))}
        />
        <OptionSegment
          label="Aspect ratio"
          value={str(data.aspectRatio) || "square"}
          options={ASPECT_OPTIONS}
          onChange={(v) => set("aspectRatio", v)}
        />

        {/* Columns — desktop / tablet / mobile */}
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">Columns</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="mb-1 text-center text-[10px] text-zinc-400">Desktop</p>
              <OptionSegment
                value={str(data.columns) || "4"}
                options={COLUMN_OPTIONS}
                onChange={(v) => set("columns", Number(v))}
                wrap
              />
            </div>
            <div>
              <p className="mb-1 text-center text-[10px] text-zinc-400">Tablet</p>
              <OptionSegment
                value={str(data.columnsMedium) || "3"}
                options={COLUMN_OPTIONS}
                onChange={(v) => set("columnsMedium", Number(v))}
                wrap
              />
            </div>
            <div>
              <p className="mb-1 text-center text-[10px] text-zinc-400">Mobile</p>
              <OptionSegment
                value={str(data.columnsSmall) || "2"}
                options={COLUMN_OPTIONS}
                onChange={(v) => set("columnsSmall", Number(v))}
                wrap
              />
            </div>
          </div>
        </div>

        <OptionText
          label="Column spacing (px)"
          value={str(data.columnSpacing)}
          onChange={(v) => set("columnSpacing", v)}
          placeholder="6"
          type="number"
        />
      </PanelSection>

      {/* ── Interaction ──────────────────────────────────────────── */}
      <PanelSection title="Interaction">
        <OptionSegment
          label="Hover effect"
          value={str(data.hoverType) || "none"}
          options={HOVER_OPTIONS}
          onChange={(v) => set("hoverType", v)}
        />
        <OptionSelect
          label="Link type"
          value={str(data.linkType) || "lightbox"}
          options={LINK_OPTIONS}
          onChange={(v) => set("linkType", v)}
        />
        {str(data.linkType) !== "none" && (
          <OptionSegment
            label="Link target"
            value={str(data.linkTarget) || "_blank"}
            options={TARGET_OPTIONS}
            onChange={(v) => set("linkTarget", v)}
          />
        )}
      </PanelSection>

      {/* ── Buttons ──────────────────────────────────────────────── */}
      <PanelSection title="Buttons">
        <OptionSelect
          label="Load more"
          value={str(data.loadMore) || "none"}
          options={LOAD_MORE_OPTIONS}
          onChange={(v) => set("loadMore", v)}
        />
        {str(data.loadMore) === "button" && (
          <OptionText
            label="Button text"
            value={str(data.loadMoreText)}
            onChange={(v) => set("loadMoreText", v)}
            placeholder="Load More"
          />
        )}
        <OptionToggle
          label="View on Flickr button"
          checked={Boolean(data.viewButton)}
          onChange={(v) => set("viewButton", v)}
        />
        {Boolean(data.viewButton) && (
          <OptionText
            label="Button text"
            value={str(data.viewButtonText)}
            onChange={(v) => set("viewButtonText", v)}
            placeholder="View on Flickr"
          />
        )}
      </PanelSection>

      {/* ── Colors ───────────────────────────────────────────────── */}
      <PanelSection title="Colors">
        {str(data.loadMore) === "button" && (
          <>
            <OptionColor
              label="Load more text color"
              value={str(data.loadMoreBtnColor)}
              onChange={(v) => set("loadMoreBtnColor", v)}
            />
            <OptionColor
              label="Load more background"
              value={str(data.loadMoreBtnBgColor)}
              onChange={(v) => set("loadMoreBtnBgColor", v)}
            />
          </>
        )}
        {Boolean(data.viewButton) && (
          <>
            <OptionColor
              label="View button text color"
              value={str(data.viewBtnColor)}
              onChange={(v) => set("viewBtnColor", v)}
            />
            <OptionColor
              label="View button background"
              value={str(data.viewBtnBgColor)}
              onChange={(v) => set("viewBtnBgColor", v)}
            />
          </>
        )}
      </PanelSection>

      {/* ── Border ───────────────────────────────────────────────── */}
      <PanelSection title="Border">
        <OptionText
          label="Border size (px)"
          value={str(data.borderSize)}
          onChange={(v) => set("borderSize", v)}
          placeholder="0"
          type="number"
        />
        {str(data.borderSize) && str(data.borderSize) !== "0" && (
          <OptionColor
            label="Border color"
            value={str(data.borderColor)}
            onChange={(v) => set("borderColor", v)}
          />
        )}
        <OptionText
          label="Border radius (px)"
          value={str(data.borderRadius)}
          onChange={(v) => set("borderRadius", v)}
          placeholder="0"
          type="number"
        />
      </PanelSection>
    </>
  );
}
