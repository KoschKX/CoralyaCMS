"use client";

import type { CSSProperties } from "react";
import { CE } from "@/components/editor/ContentEditable";
import type { EditableProps } from "@/lib/block-types";

export function ParagraphEditable({ data, onUpdate }: EditableProps) {
  const fontSize = (data.fontSize as string) || "base";
  return (
    <CE
      as="p"
      html={(data.text as string) ?? ""}
      onSave={(val) => onUpdate({ ...data, text: val })}
      className="block-paragraph leading-relaxed focus:outline-none"
      style={{
        fontSize: `var(--font-size-${fontSize})`,
        textAlign: ((data.align as string) || "left") as CSSProperties["textAlign"],
        color: (data.color as string) || undefined,
      }}
    />
  );
}
