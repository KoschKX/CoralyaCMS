"use client";

import type { CSSProperties } from "react";
import { CE } from "@/components/editor/ContentEditable";
import { useMediaViewport } from "@/components/editor/EditorHooks";
import { mergeViewportOverrides } from "@/lib/responsive-css";
import { HEADING_MARGIN_CLASSES } from "./layout";
import type { EditableProps } from "@/lib/block-types";

export function HeaderEditable({ data, onUpdate }: EditableProps) {
  const mediaViewport = useMediaViewport();
  const resolved = mergeViewportOverrides(data, mediaViewport);
  const level = (data.level as number) ?? 2;
  return (
    <CE
      as={`h${level}` as "h1" | "h2" | "h3" | "h4"}
      html={(data.text as string) ?? ""}
      onSave={(val) => onUpdate({ ...data, text: val })}
      className={`${HEADING_MARGIN_CLASSES[level] ?? "mt-5 mb-1"} focus:outline-none`}
      style={{
        fontSize: `var(--h${level}-size)`,
        fontWeight: `var(--h${level}-weight)` as CSSProperties["fontWeight"],
        lineHeight: `var(--h${level}-line-height)`,
        textAlign: ((resolved.align as string) || "left") as CSSProperties["textAlign"],
        color: (resolved.color as string) || undefined,
      }}
    />
  );
}
