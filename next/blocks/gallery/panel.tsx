"use client";

import { useState } from "react";
import { PanelSection } from "@/components/ui/PanelSection";
import type { PanelControlProps } from "@/lib/block-types";
import { MediaPickerDialog } from "@/components/MediaPickerDialog";
import {
  OptionText,
  OptionSelect,
  OptionSegment,
  OptionToggle,
  OptionColor,
} from "@/components/ui/PanelControls";
import { safeImages } from "./layout";
import type { GalleryImage } from "./layout";

// ── Constants ─────────────────────────────────────────────────────────────────

const LAYOUT_OPTIONS = [
  { value: "grid",    label: "Grid" },
  { value: "masonry", label: "Masonry" },
] as const;

const ASPECT_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "1/1",  label: "1:1" },
  { value: "4/3",  label: "4:3" },
  { value: "16/9", label: "16:9" },
  { value: "3/2",  label: "3:2" },
  { value: "2/3",  label: "2:3" },
] as const;

const HOVER_OPTIONS = [
  { value: "none",   label: "None" },
  { value: "zoom",   label: "Zoom" },
  { value: "liftup", label: "Lift Up" },
] as const;

const CAPTION_OPTIONS = [
  { value: "off",    label: "Off" },
  { value: "hover",  label: "Hover" },
  { value: "always", label: "Always" },
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

function str(v: unknown): string {
  if (v === undefined || v === null) return "";
  return String(v);
}

function newImage(): GalleryImage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    src: "",
    alt: "",
    title: "",
    caption: "",
    link: "",
    linkTarget: "_self",
  };
}

// ── Gallery image item row ─────────────────────────────────────────────────────

function ImageEditor({
  image,
  index,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onBrowse,
  isFirst,
  isLast,
}: {
  image: GalleryImage;
  index: number;
  onUpdate: (img: GalleryImage) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onBrowse: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);

  const label = image.src
    ? decodeURIComponent(image.src.split("/").pop() ?? "").slice(0, 32) || `Image ${index + 1}`
    : `Image ${index + 1}`;

  return (
    <div className="rounded border border-zinc-200 bg-white">
      {/* Header */}
      <div className="flex items-center gap-1 px-2 py-1.5">
        {/* Thumbnail */}
        {image.src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.src}
            alt=""
            className="h-6 w-6 shrink-0 rounded object-cover"
          />
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-1.5 text-left"
          aria-expanded={open}
        >
          <span className={`text-[10px] transition-transform ${open ? "rotate-90" : ""}`} aria-hidden="true">
            ▶
          </span>
          <span className="flex-1 truncate text-xs font-medium text-zinc-700">{label}</span>
        </button>
        <div className="flex items-center gap-0.5">
          <button type="button" title="Move up" disabled={isFirst} onClick={onMoveUp}
            className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-zinc-400 hover:bg-zinc-100 disabled:opacity-30">↑</button>
          <button type="button" title="Move down" disabled={isLast} onClick={onMoveDown}
            className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-zinc-400 hover:bg-zinc-100 disabled:opacity-30">↓</button>
          <button type="button" title="Remove" onClick={onRemove}
            className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-zinc-400 hover:bg-red-50 hover:text-red-500">✕</button>
        </div>
      </div>

      {/* Fields */}
      {open && (
        <div className="space-y-2 border-t border-zinc-100 px-2.5 py-2.5">
          {/* Image URL */}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Image URL</label>
            <div className="flex gap-1.5">
              <input
                type="url"
                value={image.src}
                placeholder="https://example.com/photo.jpg"
                onChange={(e) => onUpdate({ ...image, src: e.target.value })}
                className="min-w-0 flex-1 rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
              <button type="button" onClick={onBrowse}
                className="shrink-0 rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-900">
                Browse
              </button>
            </div>
            {image.src && (
              <button type="button" onClick={() => onUpdate({ ...image, src: "" })}
                className="mt-1 text-[11px] text-zinc-400 underline hover:text-red-500">
                Remove image
              </button>
            )}
          </div>

          {/* Alt */}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Alt text</label>
            <input type="text" value={image.alt} placeholder="Describe the image"
              onChange={(e) => onUpdate({ ...image, alt: e.target.value })}
              className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          {/* Title */}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Title (lightbox heading)</label>
            <input type="text" value={image.title} placeholder="Photo title"
              onChange={(e) => onUpdate({ ...image, title: e.target.value })}
              className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Caption</label>
            <input type="text" value={image.caption} placeholder="Short description"
              onChange={(e) => onUpdate({ ...image, caption: e.target.value })}
              className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          {/* Custom link */}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Custom link (overrides lightbox)</label>
            <input type="url" value={image.link} placeholder="https://…"
              onChange={(e) => onUpdate({ ...image, link: e.target.value })}
              className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          {image.link && (
            <OptionToggle
              label="Open link in new tab"
              checked={image.linkTarget === "_blank"}
              onChange={(v) => onUpdate({ ...image, linkTarget: v ? "_blank" : "_self" })}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function GalleryPanelControls({ data, onChange }: PanelControlProps) {
  const [pickerOpen, setPickerOpen]     = useState(false);
  const [pickerItemIdx, setPickerItemIdx] = useState<number | null>(null);

  const images = safeImages(data.images);
  const set    = (key: string, value: unknown) => onChange({ ...data, [key]: value });

  const updateImage = (i: number, img: GalleryImage) => {
    const next = [...images];
    next[i] = img;
    onChange({ ...data, images: next });
  };

  const removeImage = (i: number) =>
    onChange({ ...data, images: images.filter((_, idx) => idx !== i) });

  const moveImage = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...data, images: next });
  };

  return (
    <>
      {/* ── Images ──────────────────────────────────────────────── */}
      <PanelSection title="Images">
        <div className="space-y-1.5">
          {images.map((img, i) => (
            <ImageEditor
              key={img.id}
              image={img}
              index={i}
              onUpdate={(s) => updateImage(i, s)}
              onRemove={() => removeImage(i)}
              onMoveUp={() => moveImage(i, -1)}
              onMoveDown={() => moveImage(i, 1)}
              onBrowse={() => { setPickerItemIdx(i); setPickerOpen(true); }}
              isFirst={i === 0}
              isLast={i === images.length - 1}
            />
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...data, images: [...images, newImage()] })}
            className="mt-1 w-full rounded border border-dashed border-zinc-300 py-1.5 text-xs text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-700"
          >
            + Add image
          </button>
        </div>
      </PanelSection>

      {/* ── Layout ──────────────────────────────────────────────── */}
      <PanelSection title="Layout">
        <OptionSegment
          label="Layout"
          value={str(data.layout) || "grid"}
          options={LAYOUT_OPTIONS}
          onChange={(v) => set("layout", v)}
        />

        {/* Columns — desktop / tablet / mobile */}
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">Columns</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="mb-1 text-center text-[10px] text-zinc-400">Desktop</p>
              <OptionSegment value={str(data.columns) || "3"} options={COLUMN_OPTIONS}
                onChange={(v) => set("columns", Number(v))} wrap />
            </div>
            <div>
              <p className="mb-1 text-center text-[10px] text-zinc-400">Tablet</p>
              <OptionSegment value={str(data.columnsMedium) || "2"} options={COLUMN_OPTIONS}
                onChange={(v) => set("columnsMedium", Number(v))} wrap />
            </div>
            <div>
              <p className="mb-1 text-center text-[10px] text-zinc-400">Mobile</p>
              <OptionSegment value={str(data.columnsSmall) || "1"} options={COLUMN_OPTIONS}
                onChange={(v) => set("columnsSmall", Number(v))} wrap />
            </div>
          </div>
        </div>

        <OptionText
          label="Column spacing (px)"
          value={str(data.columnSpacing)}
          onChange={(v) => set("columnSpacing", v)}
          placeholder="8"
          type="number"
        />
      </PanelSection>

      {/* ── Display ──────────────────────────────────────────────── */}
      <PanelSection title="Display">
        <div className="space-y-1.5">
          <p className="text-xs text-zinc-500">Aspect ratio</p>
          <div className="grid grid-cols-3 gap-1">
            {ASPECT_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => set("aspectRatio", value)}
                className={`rounded border py-1.5 text-xs font-medium transition ${
                  (str(data.aspectRatio) || "1/1") === value
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <OptionSegment
          label="Hover effect"
          value={str(data.hoverType) || "none"}
          options={HOVER_OPTIONS}
          onChange={(v) => set("hoverType", v)}
        />
        <OptionToggle
          label="Lightbox on click"
          checked={data.lightbox !== false}
          onChange={(v) => set("lightbox", v)}
        />
      </PanelSection>

      {/* ── Captions ─────────────────────────────────────────────── */}
      <PanelSection title="Captions">
        <OptionSegment
          label="Caption style"
          value={str(data.captionStyle) || "off"}
          options={CAPTION_OPTIONS}
          onChange={(v) => set("captionStyle", v)}
        />
        {str(data.captionStyle) !== "off" && (
          <>
            <OptionColor
              label="Overlay color"
              value={str(data.captionOverlayColor)}
              onChange={(v) => set("captionOverlayColor", v)}
            />
            <OptionColor
              label="Title color"
              value={str(data.captionTitleColor)}
              onChange={(v) => set("captionTitleColor", v)}
            />
            <OptionColor
              label="Text color"
              value={str(data.captionTextColor)}
              onChange={(v) => set("captionTextColor", v)}
            />
          </>
        )}
      </PanelSection>

      {/* ── Load more ────────────────────────────────────────────── */}
      <PanelSection title="Load More">
        <OptionSelect
          label="Pagination"
          value={str(data.loadMore) || "none"}
          options={LOAD_MORE_OPTIONS}
          onChange={(v) => set("loadMore", v)}
        />
        {str(data.loadMore) === "button" && (
          <>
            <OptionText
              label="Initial images shown"
              value={str(data.loadMoreInitial)}
              onChange={(v) => set("loadMoreInitial", Number(v))}
              placeholder="6"
              type="number"
            />
            <OptionText
              label="Button text"
              value={str(data.loadMoreText)}
              onChange={(v) => set("loadMoreText", v)}
              placeholder="Load More"
            />
          </>
        )}
      </PanelSection>

      {/* ── Colors ───────────────────────────────────────────────── */}
      {str(data.loadMore) === "button" && (
        <PanelSection title="Colors">
          <OptionColor
            label="Load more text"
            value={str(data.loadMoreBtnColor)}
            onChange={(v) => set("loadMoreBtnColor", v)}
          />
          <OptionColor
            label="Load more background"
            value={str(data.loadMoreBtnBgColor)}
            onChange={(v) => set("loadMoreBtnBgColor", v)}
          />
        </PanelSection>
      )}

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

      {/* Media picker dialog */}
      <MediaPickerDialog
        open={pickerOpen}
        onClose={() => { setPickerOpen(false); setPickerItemIdx(null); }}
        onSelect={(url) => {
          if (pickerItemIdx !== null) {
            updateImage(pickerItemIdx, { ...images[pickerItemIdx], src: url });
          }
          setPickerOpen(false);
          setPickerItemIdx(null);
        }}
      />
    </>
  );
}
