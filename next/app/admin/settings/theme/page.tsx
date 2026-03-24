"use client";

import { useEffect, useState } from "react";
import { COLOR_PALETTE, type PaletteColor } from "@/lib/color-palette";
import {
  DEFAULT_TYPOGRAPHY,
  DEFAULT_LAYOUT,
  type TypographySettings,
  type HeadingStyle,
  type LayoutSettings,
} from "@/lib/settings-types";

export default function ThemePage() {
  const [colors, setColors]         = useState<PaletteColor[]>(COLOR_PALETTE);
  const [typography, setTypography] = useState<TypographySettings>(DEFAULT_TYPOGRAPHY);
  const [layout, setLayout]         = useState<LayoutSettings>(DEFAULT_LAYOUT);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        if (s.paletteColors?.length) setColors(s.paletteColors);
        if (s.typography)            setTypography(s.typography);
        if (s.layout)
          setLayout((prev) => ({
            ...prev,
            ...s.layout,
            breakpoints: { ...prev.breakpoints, ...s.layout?.breakpoints },
          }));
      });
  }, []);

  function updateColor(label: string, value: string) {
    setColors((prev) => prev.map((c) => (c.label === label ? { ...c, value } : c)));
    setSaved(false);
  }

  function updateFontSize(key: keyof TypographySettings["fontSizes"], value: string) {
    setTypography((prev) => ({ ...prev, fontSizes: { ...prev.fontSizes, [key]: value } }));
    setSaved(false);
  }

  function updateHeading(
    level: keyof TypographySettings["headings"],
    field: keyof HeadingStyle,
    value: string,
  ) {
    setTypography((prev) => ({
      ...prev,
      headings: { ...prev.headings, [level]: { ...prev.headings[level], [field]: value } },
    }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paletteColors: colors, typography, layout }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    setColors(COLOR_PALETTE);
    setTypography(DEFAULT_TYPOGRAPHY);
    setLayout(DEFAULT_LAYOUT);
    setSaved(false);
  }

  const editable = colors.filter((c) => c.label !== "Default");

  const fontSizeLabels: { key: keyof TypographySettings["fontSizes"]; label: string }[] = [
    { key: "sm",   label: "S — Small"        },
    { key: "base", label: "M — Medium"       },
    { key: "lg",   label: "L — Large"        },
    { key: "xl",   label: "XL — Extra large" },
  ];

  const headingLevels: (keyof TypographySettings["headings"])[] = ["h1", "h2", "h3", "h4"];

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-zinc-900">Theme</h1>
      <p className="mb-8 text-sm text-zinc-500">Customise your site&apos;s colours and typography.</p>

      <div className="space-y-10">

        {/* ── Colour palette ───────────────────────────────── */}
        <section>
          <h2 className="mb-1 text-sm font-semibold text-zinc-800">Editor colour palette</h2>
          <p className="mb-5 text-xs text-zinc-400">
            These swatches appear in the block editor&apos;s colour picker. Click a circle to change its colour.
          </p>
          <div className="flex flex-wrap gap-5">
            {editable.map(({ label, value }) => (
              <label key={label} className="flex cursor-pointer flex-col items-center gap-1.5 group">
                <span
                  className="relative flex h-9 w-9 items-center justify-center rounded-full shadow-sm ring-1 ring-black/10 transition group-hover:ring-2 group-hover:ring-zinc-400"
                  style={{ background: value }}
                >
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => updateColor(label, e.target.value)}
                    className="absolute inset-0 cursor-pointer rounded-full opacity-0 w-full h-full"
                  />
                </span>
                <span className="text-[10px] text-zinc-400 group-hover:text-zinc-600 transition">{label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* ── Font sizes ───────────────────────────────────── */}
        <section>
          <h2 className="mb-1 text-sm font-semibold text-zinc-800">Font sizes</h2>
          <p className="mb-4 text-xs text-zinc-400">
            Define what S, M, L, and XL mean in the block editor. Use any valid CSS value (e.g.{" "}
            <code className="font-mono">1rem</code>, <code className="font-mono">18px</code>).
          </p>
          <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
            {fontSizeLabels.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-zinc-700">{label}</span>
                <input
                  type="text"
                  value={typography.fontSizes[key]}
                  onChange={(e) => updateFontSize(key, e.target.value)}
                  className="w-28 rounded-md border border-zinc-200 px-3 py-1.5 text-right font-mono text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
                  placeholder="1rem"
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Heading styles ───────────────────────────────── */}
        <section>
          <h2 className="mb-1 text-sm font-semibold text-zinc-800">Heading styles</h2>
          <p className="mb-4 text-xs text-zinc-400">
            Controls H1 – H4 across your site and the editor canvas.
          </p>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <div className="grid grid-cols-4 gap-4 border-b border-zinc-100 bg-zinc-50 px-4 py-2">
              <span className="text-xs font-semibold text-zinc-400">Level</span>
              <span className="text-xs font-semibold text-zinc-400">Size</span>
              <span className="text-xs font-semibold text-zinc-400">Weight</span>
              <span className="text-xs font-semibold text-zinc-400">Line height</span>
            </div>
            {headingLevels.map((level) => {
              const h = typography.headings[level];
              return (
                <div
                  key={level}
                  className="grid grid-cols-4 gap-4 border-b border-zinc-100 px-4 py-2.5 last:border-0 items-center"
                >
                  <span className="font-mono text-sm font-semibold uppercase text-zinc-700">{level}</span>
                  <input
                    type="text"
                    value={h.size}
                    onChange={(e) => updateHeading(level, "size", e.target.value)}
                    className="rounded-md border border-zinc-200 px-2 py-1 font-mono text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
                    placeholder="2rem"
                  />
                  <input
                    type="text"
                    value={h.weight}
                    onChange={(e) => updateHeading(level, "weight", e.target.value)}
                    className="rounded-md border border-zinc-200 px-2 py-1 font-mono text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
                    placeholder="700"
                  />
                  <input
                    type="text"
                    value={h.lineHeight}
                    onChange={(e) => updateHeading(level, "lineHeight", e.target.value)}
                    className="rounded-md border border-zinc-200 px-2 py-1 font-mono text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
                    placeholder="1.2"
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Layout ──────────────────────────────────────── */}
        <section>
          <h2 className="mb-1 text-sm font-semibold text-zinc-800">Layout</h2>
          <p className="mb-4 text-xs text-zinc-400">
            Controls spacing and width on public pages. Use any valid CSS value (e.g.{" "}
            <code className="font-mono">48rem</code>, <code className="font-mono">800px</code>).
          </p>
          <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
            {([
              { key: "contentMaxWidth" as const, label: "Content max width",      hint: "48rem"  },
              { key: "contentPaddingX" as const, label: "Horizontal padding",     hint: "1.5rem" },
              { key: "blockSpacing"    as const, label: "Spacing between blocks", hint: "1.5rem" },
            ] satisfies { key: "contentMaxWidth" | "contentPaddingX" | "blockSpacing"; label: string; hint: string }[]).map(({ key, label, hint }) => (
              <div key={key} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-zinc-700">{label}</span>
                <input
                  type="text"
                  value={layout[key] as string}
                  onChange={(e) => setLayout((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-28 rounded-md border border-zinc-200 px-3 py-1.5 text-right font-mono text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
                  placeholder={hint}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Breakpoints ──────────────────────────────────── */}
        <section>
          <h2 className="mb-1 text-sm font-semibold text-zinc-800">Breakpoints</h2>
          <p className="mb-4 text-xs text-zinc-400">
            Screen-width thresholds for responsive behaviour. At mobile width, padding and max-width
            collapse automatically. Use <code className="font-mono">px</code> or <code className="font-mono">em</code>.
          </p>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <div className="grid grid-cols-3 divide-x divide-zinc-100">
              {([
                { key: "mobile"  as const, label: "Mobile",  hint: "640px",  sub: "max-width" },
                { key: "tablet"  as const, label: "Tablet",  hint: "1024px", sub: "max-width" },
                { key: "desktop" as const, label: "Desktop", hint: "1280px", sub: "min-width" },
              ]).map(({ key, label, hint, sub }) => (
                <div key={key} className="flex flex-col gap-2 p-4">
                  <div>
                    <p className="text-xs font-semibold text-zinc-700">{label}</p>
                    <p className="text-[10px] text-zinc-400">{sub}</p>
                  </div>
                  <input
                    type="text"
                    value={layout.breakpoints[key]}
                    onChange={(e) =>
                      setLayout((prev) => ({
                        ...prev,
                        breakpoints: { ...prev.breakpoints, [key]: e.target.value },
                      }))
                    }
                    className="rounded-md border border-zinc-200 px-2 py-1.5 font-mono text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
                    placeholder={hint}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Actions ──────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-xs text-green-600">Saved!</span>}
          <button
            onClick={handleReset}
            className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
          >
            Reset to default
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>

      </div>
    </div>
  );
}
