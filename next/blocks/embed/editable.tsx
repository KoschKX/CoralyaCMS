"use client";

import { useState } from "react";
import type { EditableProps } from "@/lib/block-types";

/** Returns true only for http/https URLs. */
function isValidEmbedUrl(value: string): boolean {
  if (!value.trim()) return true; // empty is allowed (renders nothing)
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function EmbedEditable({ data, onUpdate }: EditableProps) {
  const [error, setError] = useState<string | null>(null);

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const value = e.target.value.trim();
    if (!isValidEmbedUrl(value)) {
      setError("Only https:// and http:// URLs are allowed.");
      return;
    }
    setError(null);
    onUpdate({ ...data, embed: value });
  }

  return (
    <div className="block-embed aspect-video w-full overflow-hidden rounded-lg bg-zinc-100 flex flex-col items-center justify-center gap-2">
      <span className="text-xs text-zinc-400">Embed URL</span>
      <input
        type="url"
        aria-label="Embed URL"
        aria-describedby={error ? "embed-url-error" : undefined}
        className={`w-3/4 rounded border bg-white px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-1 ${
          error
            ? "border-red-400 focus:ring-red-400"
            : "border-zinc-300 focus:ring-zinc-400"
        }`}
        defaultValue={(data.embed as string) ?? ""}
        placeholder="https://www.youtube.com/embed/…"
        onBlur={handleBlur}
      />
      {error && (
        <p id="embed-url-error" role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
