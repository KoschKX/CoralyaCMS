"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

export interface MediaFile {
  name: string;
  url: string;
  size: number;
  createdAt: string;
}

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]);
const VIDEO_EXTS = new Set([".mp4", ".webm", ".ogg", ".mov"]);

function extOf(name: string) {
  return name.slice(name.lastIndexOf(".")).toLowerCase();
}

function isImage(name: string) {
  return IMAGE_EXTS.has(extOf(name));
}

function isVideo(name: string) {
  return VIDEO_EXTS.has(extOf(name));
}

export function MediaPickerDialog({
  open,
  onClose,
  onSelect,
  mediaType = "image",
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  mediaType?: "image" | "video" | "any";
}) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/media");
      if (!res.ok) throw new Error("Failed to load");
      setFiles(await res.json());
    } catch {
      setError("Could not load media files.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadFiles();
  }, [open, loadFiles]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setError(null);
    for (const file of Array.from(fileList)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/media", { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? "Upload failed.");
        setUploading(false);
        return;
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await loadFiles();
  }

  if (!open) return null;

  const filterFn =
    mediaType === "video" ? isVideo :
    mediaType === "any"   ? () => true :
    isImage;
  const shownFiles = files.filter((f) => filterFn(f.name));
  const acceptAttr =
    mediaType === "video" ? "video/*" :
    mediaType === "any"   ? "*/*" :
    "image/*";
  const emptyLabel =
    mediaType === "video" ? "No videos uploaded yet." :
    mediaType === "any"   ? "No files uploaded yet." :
    "No images uploaded yet.";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Media library"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 flex max-h-[80vh] w-full max-w-3xl flex-col rounded-xl border border-zinc-300 bg-white shadow-2xl mx-4">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-300 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-900">Media Library</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "↑ Upload"}
            </button>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Close media library"
            >
              ✕
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptAttr}
            className="sr-only"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-3 text-red-400 hover:text-red-600"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-zinc-400">
              Loading…
            </div>
          ) : shownFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-zinc-400">{emptyLabel}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 text-sm font-medium text-zinc-600 underline hover:text-zinc-900"
              >
                Upload your first file
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {shownFiles.map((file) => (
                <button
                  key={file.name}
                  type="button"
                  onClick={() => { onSelect(file.url); onClose(); }}
                  className="group relative overflow-hidden rounded-lg border-2 border-zinc-300 bg-zinc-50 transition hover:border-zinc-900 focus:border-zinc-900 focus:outline-none"
                  title={file.name}
                >
                  <div className="aspect-square">
                    {isImage(file.name) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={file.url}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-zinc-800 px-1">
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" strokeWidth="1.5">
                          <rect x="3" y="5" width="18" height="14" rx="1.5"/>
                          <rect x="5"  y="7"  width="2" height="2" rx="0.4" fill="white" stroke="none"/>
                          <rect x="5"  y="11" width="2" height="2" rx="0.4" fill="white" stroke="none"/>
                          <rect x="5"  y="15" width="2" height="2" rx="0.4" fill="white" stroke="none"/>
                          <rect x="17" y="7"  width="2" height="2" rx="0.4" fill="white" stroke="none"/>
                          <rect x="17" y="11" width="2" height="2" rx="0.4" fill="white" stroke="none"/>
                          <rect x="17" y="15" width="2" height="2" rx="0.4" fill="white" stroke="none"/>
                          <polygon points="10,9.5 10,14.5 15,12" fill="white" stroke="none"/>
                        </svg>
                        <span className="w-full truncate text-center text-[9px] text-zinc-300">
                          {file.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1.5 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                    {file.name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
