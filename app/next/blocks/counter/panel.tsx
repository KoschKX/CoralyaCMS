"use client";

import { useState } from "react";
import { PanelSection } from "@/components/ui/PanelSection";
import type { PanelControlProps } from "@/lib/block-types";
import { OptionColor, OptionSegment } from "@/components/ui/PanelControls";
import type { CounterItem } from "./layout";

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeItems(raw: unknown): CounterItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is CounterItem => x !== null && typeof x === "object");
}

function newItem(): CounterItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    value: "100",
    unit: "",
    unitPos: "suffix",
    label: "New counter",
    icon: "",
    filledColor: "",
    unfilledColor: "",
    size: 200,
  };
}

// ── Item editor (accordion row) ───────────────────────────────────────────────

function ItemEditor({
  item,
  index,
  style,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  item: CounterItem;
  index: number;
  style: string;
  onUpdate: (item: CounterItem) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);
  const summary = item.label || `Counter ${index + 1}`;
  const valueDisplay = item.value + item.unit;

  return (
    <div className="rounded border border-zinc-200 bg-white">
      {/* Header row */}
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
          <span className="flex-1 truncate text-xs font-medium text-zinc-700">{summary}</span>
          <span className="shrink-0 font-mono text-[11px] text-zinc-400">{valueDisplay}</span>
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

      {/* Fields */}
      {open && (
        <div className="space-y-2 border-t border-zinc-100 px-2.5 py-2.5">
          {/* Value */}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">
              {style === "circle" ? "Value (0 – 100)" : "Value"}
            </label>
            <input
              type="text"
              value={item.value}
              onChange={(e) => onUpdate({ ...item, value: e.target.value })}
              className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
              placeholder={style === "circle" ? "75" : "1250"}
            />
          </div>

          {/* Unit + position */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-zinc-500">Unit</label>
              <input
                type="text"
                value={item.unit}
                onChange={(e) => onUpdate({ ...item, unit: e.target.value })}
                className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
                placeholder="%"
              />
            </div>
            <div className="w-28 shrink-0">
              <OptionSegment
                label="Position"
                value={item.unitPos || "suffix"}
                options={[
                  { value: "prefix", label: "Pre" },
                  { value: "suffix", label: "Suf" },
                ]}
                onChange={(v) => onUpdate({ ...item, unitPos: v as "prefix" | "suffix" })}
              />
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Label</label>
            <input
              type="text"
              value={item.label}
              onChange={(e) => onUpdate({ ...item, label: e.target.value })}
              className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
              placeholder="Description"
            />
          </div>

          {/* Box-only: icon */}
          {style === "box" && (
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Icon CSS class</label>
              <input
                type="text"
                value={item.icon}
                onChange={(e) => onUpdate({ ...item, icon: e.target.value })}
                className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                placeholder="fa fa-star"
              />
            </div>
          )}

          {/* Circle-only: colors + size */}
          {style === "circle" && (
            <>
              <OptionColor label="Fill color"  value={(item.filledColor   as string) ?? ""} onChange={(v) => onUpdate({ ...item, filledColor:   v })} />
              <OptionColor label="Track color" value={(item.unfilledColor as string) ?? ""} onChange={(v) => onUpdate({ ...item, unfilledColor: v })} />
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Size (px)</label>
                <input
                  type="number"
                  min={40}
                  max={600}
                  value={item.size || 200}
                  onChange={(e) =>
                    onUpdate({ ...item, size: Math.max(40, Math.min(600, Number(e.target.value))) })
                  }
                  className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function CounterPanelControls({ data, onChange }: PanelControlProps) {
  const style   = (data.style   as string) === "circle" ? "circle" : "box";
  const columns = Math.min(6, Math.max(1, Number(data.columns) || 4));
  const items   = safeItems(data.items);

  function updateItems(updated: CounterItem[]) {
    onChange({ ...data, items: updated });
  }

  function updateItem(idx: number, item: CounterItem) {
    const next = [...items];
    next[idx] = item;
    updateItems(next);
  }

  function removeItem(idx: number) {
    updateItems(items.filter((_, i) => i !== idx));
  }

  function moveItem(idx: number, dir: -1 | 1) {
    const next = [...items];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    updateItems(next);
  }

  return (
    <div className="space-y-5">

      {/* ── Style ─────────────────────────────────────────────────────── */}
      <PanelSection title="Style">
        <OptionSegment
          value={style}
          options={[
            { value: "box",    label: "Stat box" },
            { value: "circle", label: "Circle" },
          ]}
          onChange={(v) => onChange({ ...data, style: v })}
        />
      </PanelSection>

      {/* ── Layout ────────────────────────────────────────────────────── */}
      <PanelSection title="Layout">
        <OptionSegment
          label="Columns"
          value={String(columns)}
          options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: String(n) }))}
          onChange={(v) => onChange({ ...data, columns: Number(v) })}
        />
      </PanelSection>

      {/* ── Colors ────────────────────────────────────────────────────── */}
      <PanelSection title="Colors">
        <div className="space-y-2">
          {style === "box" ? (
            <>
              <OptionColor label="Number color" value={(data.color       as string) ?? ""} onChange={(v) => onChange({ ...data, color:       v })} />
              <OptionColor label="Border color" value={(data.borderColor as string) ?? ""} onChange={(v) => onChange({ ...data, borderColor: v })} />
            </>
          ) : (
            <>
              <OptionColor label="Fill color"  value={(data.filledColor   as string) ?? ""} onChange={(v) => onChange({ ...data, filledColor:   v })} />
              <OptionColor label="Track color" value={(data.unfilledColor as string) ?? ""} onChange={(v) => onChange({ ...data, unfilledColor: v })} />
            </>
          )}
        </div>
      </PanelSection>

      {/* ── Items ─────────────────────────────────────────────────────── */}
      <PanelSection title="Counters">
        <div className="space-y-1.5">
          {items.map((item, idx) => (
            <ItemEditor
              key={item.id}
              item={item}
              index={idx}
              style={style}
              onUpdate={(updated) => updateItem(idx, updated)}
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
            className="mt-1 w-full rounded border border-dashed border-zinc-300 py-1.5 text-xs font-medium text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-700"
          >
            + Add counter
          </button>
        </div>
      </PanelSection>

    </div>
  );
}
