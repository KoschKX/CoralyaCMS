"use client";

import { useState } from "react";
import { PanelSection } from "@/components/ui/PanelSection";
import type { PanelControlProps } from "@/lib/block-types";
import { MediaPickerDialog } from "@/components/MediaPickerDialog";
import { OptionToggle } from "@/components/ui/PanelControls";
import { safeSlides } from "./layout";
import type { CarouselSlide } from "./layout";

// ── Helpers ───────────────────────────────────────────────────────────────────

function newSlide(): CarouselSlide {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    src: "",
    alt: "",
    caption: "",
    link: "",
    linkTarget: "_self",
  };
}


// ── Slide accordion row ───────────────────────────────────────────────────────

function SlideEditor({
  slide,
  index,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onBrowse,
  isFirst,
  isLast,
}: {
  slide: CarouselSlide;
  index: number;
  onUpdate: (slide: CarouselSlide) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onBrowse: () => void;
  onBrowse: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);

  // Show filename from URL as accordion label, or fallback
  const filename = slide.src
    ? decodeURIComponent(slide.src.split("/").pop() ?? "").slice(0, 32) || `Slide ${index + 1}`
    : `Slide ${index + 1}`;

  return (
    <div className="rounded border border-zinc-200 bg-white">
      {/* Header ── */}
      <div className="flex items-center gap-1 px-2 py-1.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-1.5 text-left"
          aria-expanded={open}
        >
          <span
            className={`text-[10px] transition-transform ${open ? "rotate-90" : ""}`}
            aria-hidden="true"
          >
            ▶
          </span>
          <span className="flex-1 truncate text-xs font-medium text-zinc-700">{filename}</span>
        </button>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title="Move up"
            disabled={isFirst}
            onClick={onMoveUp}
            className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-zinc-400 hover:bg-zinc-100 disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            title="Move down"
            disabled={isLast}
            onClick={onMoveDown}
            className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-zinc-400 hover:bg-zinc-100 disabled:opacity-30"
          >
            ↓
          </button>
          <button
            type="button"
            title="Remove"
            onClick={onRemove}
            className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-zinc-400 hover:bg-red-50 hover:text-red-500"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Fields ── */}
      {open && (
        <div className="space-y-2 border-t border-zinc-100 px-2.5 py-2.5">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Image URL</label>
            <div className="flex gap-1.5">
              <input
                type="url"
                value={slide.src}
                placeholder="https://example.com/image.jpg"
                onChange={(e) => onUpdate({ ...slide, src: e.target.value })}
                className="min-w-0 flex-1 rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
              <button
                type="button"
                onClick={onBrowse}
                title="Browse media library"
                className="shrink-0 rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-900"
              >
                Browse
              </button>
            </div>
            {slide.src && (
              <button
                type="button"
                onClick={() => onUpdate({ ...slide, src: "" })}
                className="mt-1 text-[11px] text-zinc-400 underline hover:text-red-500"
              >
                Remove image
              </button>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-500">Alt text</label>
            <input
              type="text"
              value={slide.alt}
              placeholder="Describe the image"
              onChange={(e) => onUpdate({ ...slide, alt: e.target.value })}
              className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-500">Caption</label>
            <input
              type="text"
              value={slide.caption}
              placeholder="Overlay caption text"
              onChange={(e) => onUpdate({ ...slide, caption: e.target.value })}
              className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-500">Link URL</label>
            <input
              type="url"
              value={slide.link}
              placeholder="https://…"
              onChange={(e) => onUpdate({ ...slide, link: e.target.value })}
              className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          {slide.link && (
            <Toggle
              label="Open in new tab"
              checked={slide.linkTarget === "_blank"}
              onChange={(v) =>
                onUpdate({ ...slide, linkTarget: v ? "_blank" : "_self" })
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function CarouselPanelControls({ data, onChange }: PanelControlProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSlideIdx, setPickerSlideIdx] = useState<number | null>(null);

  const slides       = safeSlides(data.items);
  const effect       = (data.effect as string) || "slide";
  const perView      = Number(data.perView) || 1;
  const gap          = Number(data.gap) || 0;
  const aspectRatio  = (data.aspectRatio as string) || "16/9";
  const borderRadius = Number(data.borderRadius) || 0;
  const autoplay     = Boolean(data.autoplay);
  const autoplayDelay = Number(data.autoplayDelay) || 3000;
  const loop         = Boolean(data.loop);
  const showArrows   = data.showArrows !== false;
  const showDots     = data.showDots !== false;

  // ── Slide list helpers ──────────────────────────────────────────────────
  const updateSlide = (i: number, slide: CarouselSlide) => {
    const next = [...slides];
    next[i] = slide;
    onChange({ ...data, items: next });
  };

  const removeSlide = (i: number) => {
    onChange({ ...data, items: slides.filter((_, idx) => idx !== i) });
  };

  const moveSlide = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    const next = [...slides];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...data, items: next });
  };

  const addSlide = () =>
    onChange({ ...data, items: [...slides, newSlide()] });

  return (
    <div className="space-y-5">

      {/* ── Slides ──────────────────────────────────────────────────── */}
      <PanelSection title="Slides">
        <div className="space-y-1.5">
          {slides.map((slide, i) => (
            <SlideEditor
              key={slide.id}
              slide={slide}
              index={i}
              onUpdate={(s) => updateSlide(i, s)}
              onRemove={() => removeSlide(i)}
              onMoveUp={() => moveSlide(i, -1)}
              onMoveDown={() => moveSlide(i, 1)}
              onBrowse={() => { setPickerSlideIdx(i); setPickerOpen(true); }}
              isFirst={i === 0}
              isLast={i === slides.length - 1}
            />
          ))}
          <button
            type="button"
            onClick={addSlide}
            className="mt-1 w-full rounded border border-dashed border-zinc-300 py-1.5 text-xs text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-700"
          >
            + Add slide
          </button>
        </div>
      </PanelSection>

      {/* ── Style ───────────────────────────────────────────────────── */}
      <PanelSection title="Style">
        <div className="space-y-3">

          {/* Transition effect */}
          <div>
            <label className="mb-1.5 block text-xs text-zinc-500">Transition</label>
            <div className="flex gap-1">
              {(["slide", "fade"] as const).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => onChange({ ...data, effect: e })}
                  className={`flex flex-1 items-center justify-center rounded border py-1.5 text-xs font-medium capitalize transition ${
                    effect === e
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect ratio */}
          <div>
            <label className="mb-1.5 block text-xs text-zinc-500">Aspect ratio</label>
            <div className="grid grid-cols-3 gap-1">
              {(["16/9", "4/3", "3/2", "1/1", "2/3", "auto"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onChange({ ...data, aspectRatio: r })}
                  className={`rounded border py-1 text-xs font-medium transition ${
                    aspectRatio === r
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Border radius */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs text-zinc-500">Corner radius</label>
              <span className="font-mono text-xs text-zinc-400">{borderRadius}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              step={1}
              value={borderRadius}
              onChange={(e) => onChange({ ...data, borderRadius: Number(e.target.value) })}
              className="w-full accent-zinc-900"
            />
          </div>

        </div>
      </PanelSection>

      {/* ── Layout (slide mode only) ─────────────────────────────────── */}
      {effect === "slide" && (
        <PanelSection title="Layout">
          <div className="space-y-3">

            {/* Slides per view */}
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">Slides visible</label>
              <div className="flex gap-1">
                {([1, 2, 3, 4, 5] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onChange({ ...data, perView: n })}
                    className={`flex flex-1 items-center justify-center rounded border py-1.5 text-xs font-medium transition ${
                      perView === n
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Gap */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs text-zinc-500">Gap between slides</label>
                <span className="font-mono text-xs text-zinc-400">{gap}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={80}
                step={4}
                value={gap}
                onChange={(e) => onChange({ ...data, gap: Number(e.target.value) })}
                className="w-full accent-zinc-900"
              />
            </div>

          </div>
        </PanelSection>
      )}

      {/* ── Navigation ──────────────────────────────────────────────── */}
      <PanelSection title="Navigation">
        <div className="space-y-2">
          <Toggle
            label="Show arrows"
            checked={showArrows}
            onChange={(v) => onChange({ ...data, showArrows: v })}
          />
          <Toggle
            label="Show dots"
            checked={showDots}
            onChange={(v) => onChange({ ...data, showDots: v })}
          />
        </div>
      </PanelSection>

      {/* ── Playback ────────────────────────────────────────────────── */}
      <PanelSection title="Playback">
        <div className="space-y-2">
          <Toggle
            label="Autoplay"
            checked={autoplay}
            onChange={(v) => onChange({ ...data, autoplay: v })}
          />
          {autoplay && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs text-zinc-500">Delay</label>
                <span className="font-mono text-xs text-zinc-400">
                  {(autoplayDelay / 1000).toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min={500}
                max={10000}
                step={500}
                value={autoplayDelay}
                onChange={(e) =>
                  onChange({ ...data, autoplayDelay: Number(e.target.value) })
                }
                className="w-full accent-zinc-900"
              />
            </div>
          )}
          <Toggle
            label="Loop"
            checked={loop}
            onChange={(v) => onChange({ ...data, loop: v })}
          />
        </div>
      </PanelSection>

      <MediaPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => {
          if (pickerSlideIdx !== null && slides[pickerSlideIdx]) {
            updateSlide(pickerSlideIdx, { ...slides[pickerSlideIdx], src: url });
          }
          setPickerOpen(false);
        }}
      />

    </div>
  );
}
