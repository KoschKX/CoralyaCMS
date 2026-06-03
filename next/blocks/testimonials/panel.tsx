"use client";

import { useState } from "react";
import { PanelSection } from "@/components/ui/PanelSection";
import { MediaPickerDialog } from "@/components/MediaPickerDialog";
import type { PanelControlProps } from "@/lib/block-types";
import {
  OptionColor,
  OptionToggle,
  OptionSegment,
  OptionText,
  OptionSelect,
} from "@/components/ui/PanelControls";
import type { TestimonialItem } from "./layout";
import { safeItems } from "./layout";

// ── Helpers ───────────────────────────────────────────────────────────────────

function newItem(): TestimonialItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    quote: "Great experience working with this team. Highly recommended!",
    name: "Jane Smith",
    company: "Acme Corp",
    companyLink: "",
    companyTarget: "_self",
    photo: "",
    photoRadius: "",
    avatar: "placeholder",
    avatarPosition: "above",
    avatarSize: "",
    icon: "",
    iconAlignment: "left",
    rating: 5,
  };
}

// ── Item accordion ────────────────────────────────────────────────────────────

function ItemEditor({
  item,
  index,
  design,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  item: TestimonialItem;
  index: number;
  design: string;
  onUpdate: (item: TestimonialItem) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const summary = item.name || `Testimonial ${index + 1}`;

  return (
    <div className="rounded border border-zinc-200 bg-white">
      <div className="flex items-center gap-1 px-2 py-1.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-1.5 text-left"
          aria-expanded={open}
        >
          <span className={`text-[10px] transition-transform ${open ? "rotate-90" : ""}`} aria-hidden="true">▶</span>
          <span className="flex-1 truncate text-xs font-medium text-zinc-700">{summary}</span>
          {item.company && (
            <span className="shrink-0 truncate text-[11px] text-zinc-400 max-w-[80px]">{item.company}</span>
          )}
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

      {open && (
        <div className="space-y-3 border-t border-zinc-100 px-2.5 py-2.5">
          {/* Quote */}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Quote</label>
            <textarea
              rows={3}
              value={item.quote}
              onChange={(e) => onUpdate({ ...item, quote: e.target.value })}
              className="w-full resize-y rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              placeholder="Write the testimonial quote…"
            />
          </div>

          {/* Name */}
          <OptionText label="Name" value={item.name} placeholder="Author name"
            onChange={(v) => onUpdate({ ...item, name: v })} />

          {/* Company */}
          <OptionText label="Company" value={item.company} placeholder="Company name"
            onChange={(v) => onUpdate({ ...item, company: v })} />

          {/* Company link */}
          <OptionText label="Company URL" value={item.companyLink} placeholder="https://…"
            onChange={(v) => onUpdate({ ...item, companyLink: v })} />

          {item.companyLink && (
            <OptionSegment
              label="Link target"
              value={item.companyTarget || "_self"}
              options={[{ value: "_self", label: "Same tab" }, { value: "_blank", label: "New tab" }]}
              onChange={(v) => onUpdate({ ...item, companyTarget: v })}
            />
          )}

          {/* Avatar */}
          <OptionSegment
            label="Avatar"
            value={item.avatar || "placeholder"}
            options={[
              { value: "none",        label: "None" },
              { value: "placeholder", label: "Silhouette" },
              { value: "image",       label: "Image" },
            ]}
            onChange={(v) => onUpdate({ ...item, avatar: v })}
          />

          {item.avatar === "image" && (
            <div>
              <p className="mb-1 text-xs text-zinc-500">Photo</p>
              <div className="flex gap-1.5">
                <input
                  type="url"
                  aria-label="Photo URL"
                  value={item.photo}
                  placeholder="https://…"
                  onChange={(e) => onUpdate({ ...item, photo: e.target.value })}
                  className="min-w-0 flex-1 rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  title="Browse media library"
                  className="shrink-0 rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
                >
                  Browse
                </button>
              </div>
              {item.photo && (
                <button
                  type="button"
                  onClick={() => onUpdate({ ...item, photo: "" })}
                  className="mt-1 text-[11px] text-zinc-400 underline hover:text-red-500"
                >
                  Remove photo
                </button>
              )}
              <MediaPickerDialog
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={(url) => { onUpdate({ ...item, photo: url }); setPickerOpen(false); }}
              />
            </div>
          )}

          {item.avatar !== "none" && (
            <>
              <OptionText label="Avatar size" value={item.avatarSize} placeholder="3rem" mono
                onChange={(v) => onUpdate({ ...item, avatarSize: v })} />
              {item.avatar === "image" && (
                <OptionText label="Photo radius" value={item.photoRadius} placeholder="50%" mono
                  onChange={(v) => onUpdate({ ...item, photoRadius: v })} />
              )}
              {design === "clean" && (
                <OptionSegment
                  label="Avatar position"
                  value={item.avatarPosition || "above"}
                  options={[
                    { value: "above", label: "Above" },
                    { value: "below", label: "Below" },
                    { value: "left",  label: "Left" },
                  ]}
                  onChange={(v) => onUpdate({ ...item, avatarPosition: v })}
                />
              )}
            </>
          )}

          {/* Decorative icon */}
          <OptionText label="Icon CSS class" value={item.icon} placeholder="fa fa-quote-left" mono
            onChange={(v) => onUpdate({ ...item, icon: v })} />

          {item.icon && (
            <OptionSegment
              label="Icon side"
              value={item.iconAlignment || "left"}
              options={[{ value: "left", label: "Left" }, { value: "right", label: "Right" }]}
              onChange={(v) => onUpdate({ ...item, iconAlignment: v })}
            />
          )}

          {/* Rating */}
          <div>
            <p className="mb-1.5 text-xs text-zinc-500">Star rating</p>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button"
                  title={n === 0 ? "None" : `${n} star${n > 1 ? "s" : ""}`}
                  onClick={() => onUpdate({ ...item, rating: n })}
                  className={`flex h-7 w-7 items-center justify-center rounded border text-xs font-medium transition ${
                    item.rating === n
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                  }`}
                >
                  {n === 0 ? "—" : n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function TestimonialsPanelControls({ data, onChange }: PanelControlProps) {
  const items    = safeItems(data.items);
  const design   = (data.design as string) || "classic";
  const nav      = data.navigation === true || data.navigation === "yes";

  function updateItems(next: TestimonialItem[]) { onChange({ ...data, items: next }); }
  function updateItem(idx: number, item: TestimonialItem) {
    const next = [...items]; next[idx] = item; updateItems(next);
  }
  function removeItem(idx: number) { updateItems(items.filter((_, i) => i !== idx)); }
  function moveItem(idx: number, dir: -1 | 1) {
    const next = [...items];
    const t = idx + dir;
    if (t < 0 || t >= next.length) return;
    [next[idx], next[t]] = [next[t], next[idx]];
    updateItems(next);
  }

  return (
    <div className="space-y-5">
      {/* ── Items ─────────────────────────────────────────────────────── */}
      <PanelSection title="Testimonials">
        <div className="space-y-1.5">
          {items.map((item, idx) => (
            <ItemEditor
              key={item.id}
              item={item}
              index={idx}
              design={design}
              onUpdate={(it) => updateItem(idx, it)}
              onRemove={() => removeItem(idx)}
              onMoveUp={() => moveItem(idx, -1)}
              onMoveDown={() => moveItem(idx, 1)}
              isFirst={idx === 0}
              isLast={idx === items.length - 1}
            />
          ))}
          <button
            type="button"
            onClick={() => updateItems([...items, newItem()])}
            className="w-full rounded border border-dashed border-zinc-300 py-1.5 text-xs text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition"
          >
            + Add testimonial
          </button>
        </div>
      </PanelSection>

      {/* ── Design ────────────────────────────────────────────────────── */}
      <PanelSection title="Design">
        <div className="space-y-3">
          <OptionSegment
            label="Style"
            value={design}
            options={[{ value: "classic", label: "Classic" }, { value: "clean", label: "Clean" }]}
            onChange={(v) => onChange({ ...data, design: v })}
          />
          {design === "classic" && (
            <OptionToggle
              label="Speech bubble"
              checked={data.speechBubble !== false}
              onChange={(v) => onChange({ ...data, speechBubble: v })}
            />
          )}
        </div>
      </PanelSection>

      {/* ── Layout ────────────────────────────────────────────────────── */}
      <PanelSection title="Layout">
        <div className="space-y-3">
          <OptionSegment
            label="Display mode"
            value={nav ? "slider" : "grid"}
            options={[
              { value: "slider", label: "Slider" },
              { value: "grid",   label: "Grid" },
            ]}
            onChange={(v) => onChange({ ...data, navigation: v === "slider" })}
          />
          {nav ? (
            <OptionText
              label="Autoplay (ms)"
              value={String(data.speed || "")}
              placeholder="5000"
              mono
              onChange={(v) => onChange({ ...data, speed: Number(v) || 0 })}
            />
          ) : (
            <OptionSegment
              label="Columns"
              value={String(Number(data.columns) || 1)}
              options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: String(n) }))}
              onChange={(v) => onChange({ ...data, columns: Number(v) })}
            />
          )}
          <OptionToggle
            label="Randomize order"
            checked={data.random === true || data.random === "yes"}
            onChange={(v) => onChange({ ...data, random: v })}
          />
          <OptionText label="Gap" value={(data.gap as string) ?? ""} placeholder="1.5rem" mono
            onChange={(v) => onChange({ ...data, gap: v })} />
          <OptionText label="Padding" value={(data.padding as string) ?? ""} placeholder="1.75rem" mono
            onChange={(v) => onChange({ ...data, padding: v })} />
        </div>
      </PanelSection>

      {/* ── Border ────────────────────────────────────────────────────── */}
      <PanelSection title="Border">
        <div className="space-y-3">
          <OptionText label="Radius" value={(data.borderRadius as string) ?? ""} placeholder="0.5rem" mono
            onChange={(v) => onChange({ ...data, borderRadius: v })} />
          <OptionSelect
            label="Style"
            value={(data.borderStyle as string) || "solid"}
            options={["solid", "dashed", "dotted", "none"].map((s) => ({ value: s, label: s }))}
            onChange={(v) => onChange({ ...data, borderStyle: v })}
          />
          <OptionColor label="Border color" value={(data.borderColor as string) ?? ""}
            onChange={(v) => onChange({ ...data, borderColor: v })} />
          {/* Per-side widths */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
            {(["Top", "Right", "Bottom", "Left"] as const).map((side) => {
              const key = `border${side}` as keyof typeof data;
              return (
                <OptionText
                  key={side}
                  label={side}
                  value={(data[key] as string) ?? ""}
                  placeholder="1px"
                  mono
                  onChange={(v) => onChange({ ...data, [key]: v })}
                />
              );
            })}
          </div>
        </div>
      </PanelSection>

      {/* ── Colors ────────────────────────────────────────────────────── */}
      <PanelSection title="Colors">
        <div className="space-y-3">
          <OptionColor label="Card background" value={(data.bgColor as string) ?? ""}
            onChange={(v) => onChange({ ...data, bgColor: v })} />
          <OptionColor label="Quote text" value={(data.textColor as string) ?? ""}
            onChange={(v) => onChange({ ...data, textColor: v })} />
          <OptionColor label="Name / company" value={(data.nameColor as string) ?? ""}
            onChange={(v) => onChange({ ...data, nameColor: v })} />
          {nav && (
            <>
              <OptionColor label="Nav dots" value={(data.navColor as string) ?? ""}
                onChange={(v) => onChange({ ...data, navColor: v })} />
              <OptionText label="Nav dot size" value={(data.navSize as string) ?? ""} placeholder="8px" mono
                onChange={(v) => onChange({ ...data, navSize: v })} />
            </>
          )}
        </div>
      </PanelSection>
    </div>
  );
}

