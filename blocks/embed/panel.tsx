"use client";

import { useRef } from "react";
import { PanelSection } from "@/components/ui/PanelSection";
import type { PanelControlProps } from "@/lib/block-types";
import { OptionText, OptionAlign } from "@/components/ui/PanelControls";

export function EmbedPanelControls({ data, onUpdate }: PanelControlProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function handleCodeBlur() {
    onUpdate({ ...data, code: ref.current?.value ?? "" });
  }

  return (
    <>
      <PanelSection label="Embed Code">
        <textarea
          ref={ref}
          aria-label="Embed code"
          className="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-y"
          rows={5}
          defaultValue={String(data.code ?? data.embed ?? "")}
          placeholder={"<iframe src=\"https://...\" ...></iframe>"}
          onBlur={handleCodeBlur}
        />
        <p className="mt-1 text-[11px] text-zinc-400">
          Paste embed code from YouTube, Vimeo, Google Maps, etc.
        </p>
      </PanelSection>

      <PanelSection label="Display">
        <OptionText
          label="Max Width"
          value={String(data.maxWidth ?? "")}
          placeholder="e.g. 800px or 100%"
          onCommit={(v) => onUpdate({ ...data, maxWidth: v })}
        />
        <OptionAlign
          label="Alignment"
          value={String(data.alignment ?? "center")}
          onChange={(v) => onUpdate({ ...data, alignment: v })}
        />
      </PanelSection>
    </>
  );
}
