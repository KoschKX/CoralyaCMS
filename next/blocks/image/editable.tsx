"use client";

import { useState } from "react";
import type { EditableProps } from "@/lib/block-types";
import ImageLayout from "./layout";
import { MediaPickerDialog } from "@/components/MediaPickerDialog";

/** Returns true only for http/https URLs (empty is also allowed). */
function isValidImageUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function ImageEditable({ data, onUpdate, blockId }: EditableProps) {
  const [mode, setMode] = useState<"choose" | "url">("choose");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const src = typeof data.src === "string" ? data.src : "";

  // Image is already set — show preview with a change button
  if (src) {
    return (
      <>
        <div className="group relative">
          <ImageLayout data={data} blockId={blockId} />
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="absolute right-2 top-2 rounded-md bg-zinc-900/80 px-2.5 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100 hover:bg-zinc-900"
          >
            Change image
          </button>
        </div>
        <MediaPickerDialog
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(url) => onUpdate({ ...data, src: url })}
        />
      </>
    );
  }

  // No image yet — show picker
  if (mode === "choose") {
    return (
      <>
        <div className="flex min-h-44 w-full flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 p-6">
          <span className="text-sm font-medium text-zinc-500">Add an image</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              Media Library
            </button>
            <button
              type="button"
              onClick={() => setMode("url")}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
            >
              Enter URL
            </button>
          </div>
        </div>
        <MediaPickerDialog
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(url) => onUpdate({ ...data, src: url })}
        />
      </>
    );
  }

  // URL input mode
  return (
    <div className="flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 p-6">
      <span className="text-sm font-medium text-zinc-500">Enter image URL</span>
      <input
        type="url"
        aria-label="Image URL"
        aria-describedby={urlError ? "image-url-error" : undefined}
        autoFocus
        className={`w-3/4 rounded border bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 ${
          urlError
            ? "border-red-400 focus:ring-red-400"
            : "border-zinc-300 focus:ring-zinc-400"
        }`}
        placeholder="https://example.com/image.jpg"
        onBlur={(e) => {
          const value = e.target.value.trim();
          if (!value) { setMode("choose"); return; }
          if (!isValidImageUrl(value)) {
            setUrlError("Only https:// and http:// URLs are allowed.");
            return;
          }
          setUrlError(null);
          onUpdate({ ...data, src: value });
        }}
      />
      {urlError && (
        <p id="image-url-error" role="alert" className="text-xs text-red-500">
          {urlError}
        </p>
      )}
      <button
        type="button"
        onClick={() => { setMode("choose"); setUrlError(null); }}
        className="text-xs text-zinc-400 underline hover:text-zinc-600"
      >
        ← Back
      </button>
    </div>
  );
}
