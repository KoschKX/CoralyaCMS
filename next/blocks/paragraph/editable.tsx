"use client";

import type { CSSProperties } from "react";
import { CE } from "@/components/editor/ContentEditable";
import { useMediaViewport } from "@/components/editor/EditorHooks";
import { mergeViewportOverrides } from "@/lib/responsive-css";
import type { EditableProps } from "@/lib/block-types";

export function ParagraphEditable({ data, onUpdate }: EditableProps) {
  const mediaViewport = useMediaViewport();
  const resolved = mergeViewportOverrides(data, mediaViewport);
  const fontSize = (resolved.fontSize as string) || "base";
  return (
    <CE
      as="p"
      html={(data.text as string) ?? ""}
      onSave={(val) => onUpdate({ ...data, text: val })}
      className="block-paragraph leading-relaxed focus:outline-none"
      style={{
        fontSize: `var(--font-size-${fontSize})`,
        textAlign: ((resolved.align as string) || "left") as CSSProperties["textAlign"],
        color: (resolved.color as string) || undefined,
      }}
    />
  );
}
