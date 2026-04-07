"use client";

import { PanelSection } from "@/components/block-shared";
import { COLOR_PALETTE } from "@/lib/color-palette";
import { autoSlug } from "@/lib/utils/slug";

interface PagePanelProps {
  status: "draft" | "published";
  setStatus: (s: "draft" | "published") => void;
  slug: string;
  setSlug: (s: string) => void;
  pageBgColor: string;
  setPageBgColor: (c: string) => void;
}

export default function PagePanel({
  status,
  setStatus,
  slug,
  setSlug,
  pageBgColor,
  setPageBgColor,
}: PagePanelProps) {
  return (
    <>
      <PanelSection title="Status">
        <div className="flex gap-2">
          {(["draft", "published"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`flex-1 rounded-md border py-1.5 text-xs font-medium capitalize transition ${status === s ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-500 hover:border-zinc-400"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </PanelSection>
      <PanelSection title="URL Slug">
        <div className="flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1.5 text-sm focus-within:border-zinc-400">
          <span className="text-zinc-400">/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(autoSlug(e.target.value))}
            placeholder="url-slug"
            className="flex-1 bg-transparent text-xs text-zinc-800 focus:outline-none"
          />
        </div>
      </PanelSection>
      <PanelSection title="Background Color">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {COLOR_PALETTE.map(({ label, value }) => (
              <button
                key={label}
                title={label}
                onClick={() => setPageBgColor(value || "#ffffff")}
                className={`h-6 w-6 rounded-full transition ${pageBgColor === value || (!value && pageBgColor === "#ffffff") ? "border-2 border-zinc-900 scale-110" : "hover:opacity-80"}`}
                style={{
                  background: value === "" ? "linear-gradient(135deg,#e5e7eb 50%,#fff 50%)" : value,
                  outline: value === "#ffffff" ? "1px solid #e5e7eb" : undefined,
                }}
              />
            ))}
            <label
              title="Custom color"
              className={`relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full overflow-hidden transition ${!COLOR_PALETTE.some((c) => c.value === pageBgColor) ? "border-2 border-zinc-900 scale-110" : "hover:opacity-80"}`}
              style={{
                background: !COLOR_PALETTE.some((c) => c.value === pageBgColor)
                  ? pageBgColor
                  : "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)",
              }}
            >
              <input
                type="color"
                value={pageBgColor || "#ffffff"}
                onChange={(e) => setPageBgColor(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0 w-full h-full"
              />
            </label>
          </div>
        </div>
      </PanelSection>
    </>
  );
}
