"use client";

import { useRef } from "react";
import type { EditableProps } from "@/lib/block-types";

export function EmbedEditable({ data, onUpdate }: EditableProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const code = String(data.code ?? data.embed ?? "");

  function handleBlur() {
    onUpdate({ ...data, code: ref.current?.value ?? "" });
  }

  return (
    <div className="block-embed w-full overflow-hidden rounded-lg bg-zinc-100 flex flex-col items-center justify-center gap-2 p-4" style={{ minHeight: "140px" }}>
      <span className="text-xs text-zinc-400">Paste embed code</span>
      <textarea
        ref={ref}
        aria-label="Embed code"
        className="w-full max-w-lg rounded border border-zinc-300 bg-white px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-y"
        rows={4}
        defaultValue={code}
        placeholder={"<iframe src=\"https://...\" ...></iframe>"}
        onBlur={handleBlur}
      />
    </div>
  );
}
