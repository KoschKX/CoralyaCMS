"use client";

import { PanelSection } from "@/components/ui/PanelSection";
import type { PanelControlProps } from "@/lib/block-types";

// ── Shared helpers ────────────────────────────────────────────────────────────

function ColorInput({
  label,
  field,
  data,
  onChange,
}: {
  label: string;
  field: string;
  data: PanelControlProps["data"];
  onChange: PanelControlProps["onChange"];
}) {
  const value = (data[field] as string) ?? "";
  return (
    <div className="flex items-center gap-2">
      <label className="w-28 shrink-0 text-xs text-zinc-500">{label}</label>
      <div className="flex flex-1 items-center gap-1.5">
        <input
          type="color"
          aria-label={label}
          value={value || "#000000"}
          onChange={(e) => onChange({ ...data, [field]: e.target.value })}
          className="h-7 w-7 shrink-0 cursor-pointer rounded border border-zinc-200 bg-transparent p-0.5"
        />
        <input
          type="text"
          aria-label={`${label} hex`}
          value={value}
          placeholder="—"
          onChange={(e) => onChange({ ...data, [field]: e.target.value })}
          className="min-w-0 flex-1 rounded border border-zinc-200 bg-white px-2 py-1 font-mono text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
        {value && (
          <button
            type="button"
            title="Clear"
            onClick={() => onChange({ ...data, [field]: "" })}
            className="text-[10px] text-zinc-400 hover:text-red-400"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

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
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Label</label>
            <input
              type="text"
              aria-label="Button label"
              value={(data.text as string) ?? ""}
              placeholder="Button"
              onChange={(e) => onChange({ ...data, text: e.target.value })}
              className="w-full rounded border border-zinc-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">URL</label>
            <input
              type="url"
              aria-label="Button URL"
              value={(data.url as string) ?? ""}
              placeholder="https://…"
              onChange={(e) => onChange({ ...data, url: e.target.value })}
              className="w-full rounded border border-zinc-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-500">Open in new tab</label>
            <button
              type="button"
              role="switch"
              aria-checked={target === "_blank"}
              onClick={() => onChange({ ...data, target: target === "_blank" ? "_self" : "_blank" })}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                target === "_blank" ? "bg-zinc-900" : "bg-zinc-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  target === "_blank" ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </PanelSection>

      {/* ── Style ───────────────────────────────────────────────────────── */}
      <PanelSection title="Style">
        <div className="space-y-3">
          {/* Type */}
          <div>
            <p className="mb-1.5 text-xs text-zinc-500">Type</p>
            <div className="flex flex-wrap gap-1">
              {(["flat", "outline", "transparent", "3d", "link"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onChange({ ...data, type: t })}
                  className={`rounded border px-2.5 py-1 text-xs font-medium transition ${
                    type === t
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <p className="mb-1.5 text-xs text-zinc-500">Size</p>
            <div className="flex gap-1">
              {(["small", "medium", "large", "xlarge"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => onChange({ ...data, size: s })}
                  className={`flex flex-1 items-center justify-center rounded border py-1 text-xs font-medium transition ${
                    size === s
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                  }`}
                >
                  {s === "xlarge" ? "XL" : s[0].toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Border radius */}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Border radius</label>
            <input
              type="text"
              aria-label="Border radius"
              value={(data.borderRadius as string) ?? ""}
              placeholder="4px"
              onChange={(e) => onChange({ ...data, borderRadius: e.target.value })}
              className="w-full rounded border border-zinc-200 bg-white px-3 py-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>
        </div>
      </PanelSection>

      {/* ── Layout ──────────────────────────────────────────────────────── */}
      <PanelSection title="Layout">
        <div className="space-y-3">
          {/* Alignment */}
          <div>
            <p className="mb-1.5 text-xs text-zinc-500">Alignment</p>
            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map((a) => (
                <button
                  key={a}
                  title={a}
                  onClick={() => onChange({ ...data, align: a })}
                  className={`flex h-8 flex-1 items-center justify-center rounded border text-xs font-medium transition ${
                    align === a
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                  }`}
                >
                  {a[0].toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Stretch */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-500">Full width</label>
            <button
              type="button"
              role="switch"
              aria-checked={stretch}
              onClick={() => onChange({ ...data, stretch: !stretch })}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                stretch ? "bg-zinc-900" : "bg-zinc-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  stretch ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </PanelSection>

      {/* ── Colors ──────────────────────────────────────────────────────── */}
      <PanelSection title="Colors">
        <div className="space-y-2">
          <ColorInput label="Background"   field="bgColor"         data={data} onChange={onChange} />
          <ColorInput label="Text"         field="textColor"       data={data} onChange={onChange} />
          <ColorInput label="Border"       field="borderColor"     data={data} onChange={onChange} />
          <div className="my-1.5 border-t border-zinc-100" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">On hover</p>
          <ColorInput label="Background"   field="hoverBgColor"    data={data} onChange={onChange} />
          <ColorInput label="Text"         field="hoverTextColor"  data={data} onChange={onChange} />
          <ColorInput label="Border"       field="hoverBorderColor" data={data} onChange={onChange} />
        </div>
      </PanelSection>

      {/* ── Icon ────────────────────────────────────────────────────────── */}
      <PanelSection title="Icon">
        <div className="space-y-2">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Icon CSS class</label>
            <input
              type="text"
              aria-label="Icon CSS class"
              value={(data.icon as string) ?? ""}
              placeholder="e.g. fa fa-arrow-right"
              onChange={(e) => onChange({ ...data, icon: e.target.value })}
              className="w-full rounded border border-zinc-200 bg-white px-3 py-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>
          <div>
            <p className="mb-1.5 text-xs text-zinc-500">Position</p>
            <div className="flex gap-1">
              {(["left", "right"] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => onChange({ ...data, iconPosition: pos })}
                  className={`flex flex-1 items-center justify-center rounded border py-1 text-xs font-medium transition ${
                    iconPos === pos
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                  }`}
                >
                  {pos[0].toUpperCase() + pos.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PanelSection>

    </div>
  );
}
