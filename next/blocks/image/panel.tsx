"use client";

import { useContext, useState } from "react";
import { PanelSection } from "@/components/ui/PanelSection";
import { MediaPickerDialog } from "@/components/MediaPickerDialog";
import { ViewportContext } from "@/components/ui/ViewportContext";
import type { PanelControlProps } from "@/lib/block-types";
import { OptionAlign } from "@/components/ui/PanelControls";
import { useBlockT } from "@/components/editor/BlockLocaleContext";

export function ImagePanelControls({ data, onChange }: PanelControlProps) {
  const t = useBlockT("image");
  const [pickerOpen, setPickerOpen] = useState(false);
  const { viewport, isFieldOverridden, inheritedData } = useContext(ViewportContext);
  const isResponsive = viewport !== "desktop";
  const inheritedAlign = (inheritedData.align as string) ?? "left";

  function inheritedPlaceholder(field: string, fallback: string) {
    return isResponsive && !isFieldOverridden(field) ? "—" : fallback;
  }

  return (
    <div className="space-y-5">
      <PanelSection title={t("panel.imageSection", "Image")} fields={["src"]}>
        <div className="flex gap-1.5">
          <input
            type="url"
            aria-label={t("panel.urlAria", "Image URL")}
            className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
            value={(data.src as string) ?? ""}
            placeholder={inheritedPlaceholder("src", t("panel.urlPlaceholder", "https://…"))}
            onChange={(e) => onChange({ ...data, src: e.target.value })}
          />
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            title={t("panel.browseTitle", "Browse media library")}
            className="shrink-0 rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
          >
            {t("panel.browse", "Browse")}
          </button>
        </div>
        {(data.src as string) && (
          <button
            type="button"
            onClick={() => onChange({ ...data, src: "" })}
            className="mt-1.5 text-[11px] text-zinc-400 underline hover:text-red-500"
          >
            {t("panel.remove", "Remove image")}
          </button>
        )}
      </PanelSection>

      <PanelSection title={t("panel.altSection", "Alt text")} fields={["alt"]}>
        <input
          type="text"
          aria-label={t("panel.altSection", "Alt text")}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
          value={(data.alt as string) ?? ""}
          placeholder={inheritedPlaceholder("alt", t("panel.altPlaceholder", "Describe the image…"))}
          onChange={(e) => onChange({ ...data, alt: e.target.value })}
        />
      </PanelSection>

      <PanelSection title={t("panel.captionSection", "Caption")} fields={["caption"]}>
        <input
          type="text"
          aria-label={t("panel.captionSection", "Caption")}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
          value={(data.caption as string) ?? ""}
          placeholder={inheritedPlaceholder("caption", t("panel.captionPlaceholder", "Optional caption…"))}
          onChange={(e) => onChange({ ...data, caption: e.target.value })}
        />
      </PanelSection>

      <PanelSection title={t("panel.alignment", "Alignment")} fields={["align"]}>
        <OptionAlign
          value={(data.align as string) ?? "left"}
          onChange={(v) => onChange({ ...data, align: v })}
          inheritedValue={isResponsive ? inheritedAlign : undefined}
        />
      </PanelSection>

      <MediaPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => { onChange({ ...data, src: url }); }}
      />
    </div>
  );
}
