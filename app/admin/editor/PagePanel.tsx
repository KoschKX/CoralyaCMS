"use client";

import { PanelSection } from "@/components/ui/PanelSection";
import { OptionColor } from "@/components/ui/PanelControls";
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
        <OptionColor
          value={pageBgColor}
          onChange={setPageBgColor}
        />
      </PanelSection>
    </>
  );
}
