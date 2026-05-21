"use client";

import { useContext, useState } from "react";
import { PanelSection } from "@/components/ui/PanelSection";
import { MediaPickerDialog } from "@/components/MediaPickerDialog";
import { ViewportContext } from "@/components/ui/ViewportContext";
import type { PanelControlProps } from "@/lib/block-types";

export function ImagePanelControls({ data, onChange }: PanelControlProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { viewport, isFieldOverridden, inheritedData } = useContext(ViewportContext);
  const isResponsive = viewport !== "desktop";
  const inheritedAlign = (inheritedData.align as string) ?? "left";

  function inheritedPlaceholder(field: string, fallback: string) {
    return isResponsive && !isFieldOverridden(field) ? "—" : fallback;
  }

  return (
    <div className="space-y-5">
      <PanelSection title="Image" fields={["src"]}>
        <div className="flex gap-1.5">
          <input
            type="url"
            aria-label="Image URL"
            className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
            value={(data.src as string) ?? ""}
            placeholder={inheritedPlaceholder("src", "https://…")}
            onChange={(e) => onChange({ ...data, src: e.target.value })}
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
        {(data.src as string) && (
          <button
            type="button"
            onClick={() => onChange({ ...data, src: "" })}
            className="mt-1.5 text-[11px] text-zinc-400 underline hover:text-red-500"
          >
            Remove image
          </button>
        )}
      </PanelSection>

      <PanelSection title="Alt text" fields={["alt"]}>
        <input
          type="text"
          aria-label="Alt text"
          className="w-full rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
          value={(data.alt as string) ?? ""}
          placeholder={inheritedPlaceholder("alt", "Describe the image…")}
          onChange={(e) => onChange({ ...data, alt: e.target.value })}
        />
      </PanelSection>

      <PanelSection title="Caption" fields={["caption"]}>
        <input
          type="text"
          aria-label="Caption"
          className="w-full rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
          value={(data.caption as string) ?? ""}
          placeholder={inheritedPlaceholder("caption", "Optional caption…")}
          onChange={(e) => onChange({ ...data, caption: e.target.value })}
        />
      </PanelSection>

      <PanelSection title="Alignment" fields={["align"]}>
        <div className="flex gap-1">
          {(["left", "center", "right"] as const).map((a) => {
            const isSelected = (data.align ?? "left") === a;
            const isBlue = isResponsive && a === inheritedAlign;
            return (
              <button
                key={a}
                title={a}
                onClick={() => onChange({ ...data, align: a })}
                className={`flex h-8 flex-1 items-center justify-center rounded border text-xs font-medium transition ${
                  isBlue
                    ? "border-blue-400 border-dashed bg-white text-blue-500"
                    : isSelected
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                }`}
              >
                {a[0].toUpperCase()}
              </button>
            );
          })}
        </div>
      </PanelSection>

      <MediaPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => { onChange({ ...data, src: url }); }}
      />
    </div>
  );
}
