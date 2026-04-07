"use client";

import type { EditableProps } from "@/lib/block-types";

export function EmbedEditable({ data, onUpdate }: EditableProps) {
  return (
    <div className="block-embed aspect-video w-full overflow-hidden rounded-lg bg-zinc-100 flex flex-col items-center justify-center gap-2">
      <span className="text-xs text-zinc-400">Embed URL</span>
      <input
        type="text"
        className="w-3/4 rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-zinc-400"
        defaultValue={(data.embed as string) ?? ""}
        placeholder="https://…"
        onBlur={(e) => onUpdate({ ...data, embed: e.target.value })}
      />
    </div>
  );
}
