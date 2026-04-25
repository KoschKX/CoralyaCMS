"use client";

import type { CSSProperties } from "react";
import { CE } from "@/components/editor/ContentEditable";
import type { EditableProps } from "@/lib/block-types";

export function QuoteEditable({ data, onUpdate }: EditableProps) {
  return (
    <blockquote
      className="block-quote border-l-4 border-zinc-300 pl-5 italic text-zinc-600"
      style={{ textAlign: ((data.align as string) || "left") as CSSProperties["textAlign"] }}
    >
      <CE
        as="p"
        html={(data.text as string) ?? ""}
        onSave={(val) => onUpdate({ ...data, text: val })}
        className="focus:outline-none"
      />
      <cite className="mt-1 flex items-baseline gap-1 text-sm not-italic text-zinc-400">
        <span>—</span>
        <CE
          html={(data.caption as string) ?? ""}
          onSave={(val) => onUpdate({ ...data, caption: val })}
          className="focus:outline-none"
          placeholder="Attribution"
        />
      </cite>
    </blockquote>
  );
}
