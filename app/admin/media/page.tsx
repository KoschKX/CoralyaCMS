"use client";

import { useState, useEffect, useRef } from "react";

interface MediaFile {
  name: string;
  url: string;
  size: number;
  createdAt: string;
}

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]);
const VIDEO_EXTS = new Set([".mp4", ".webm"]);

function extOf(name: string) {
  return name.slice(name.lastIndexOf(".")).toLowerCase();
}
function isImage(name: string) { return IMAGE_EXTS.has(extOf(name)); }
function isVideo(name: string) { return VIDEO_EXTS.has(extOf(name)); }
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailFileRef = useRef<MediaFile | null>(null);

  async function loadFiles() {
    try {
      const res = await fetch("/api/media");
      if (!res.ok) throw new Error("Failed to load");
      setFiles(await res.json());
    } catch {
      setError("Could not load media files.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadFiles(); }, []);

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

  async function handleDelete(names: string[]) {
    for (const name of names) {
      await fetch(`/api/media/${encodeURIComponent(name)}`, { method: "DELETE" });
    }
    setSelected(new Set());
    setFiles((prev) => prev.filter((f) => !names.includes(f.name)));
  }

  async function copyUrl(url: string, name: string) {
    await navigator.clipboard.writeText(`${window.location.origin}${url}`);
    setCopiedUrl(name);
    setTimeout(() => setCopiedUrl(null), 2000);
  }

  function toggleSelect(name: string) {
    if (bulkMode) {
      setSelected((prev) => {
        const next = new Set(prev);
        next.has(name) ? next.delete(name) : next.add(name);
        return next;
      });
    } else {
      setSelected((prev) =>
        prev.has(name) && prev.size === 1 ? new Set() : new Set([name])
      );
    }
  }

  function exitBulkMode() {
    setBulkMode(false);
    setSelected(new Set());
  }

  function onDragOver(e: React.DragEvent) { e.preventDefault(); setDragging(true); }
  function onDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleUpload(e.dataTransfer.files);
  }

  const allSelected = files.length > 0 && selected.size === files.length;
  const panelOpen = selected.size === 1 && !bulkMode;
  const detailFile = panelOpen ? (files.find((f) => selected.has(f.name)) ?? detailFileRef.current) : detailFileRef.current;
  if (panelOpen && detailFile) detailFileRef.current = detailFile;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-8 py-5">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Media Library</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            {loading ? "Loading\u2026" : `${files.length} file${files.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => bulkMode ? exitBulkMode() : setBulkMode(true)}
            className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
              bulkMode
                ? "border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100"
                : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
            }`}
          >
            {bulkMode ? "\u2715 Exit bulk select" : "Bulk select"}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
          >
            {uploading ? "Uploading\u2026" : "\u2191 Upload"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/mp4,video/webm,.pdf"
            className="sr-only"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      </div>

      {/* Bulk action bar */}
      {bulkMode && selected.size > 0 && (
        <div className="flex shrink-0 items-center gap-3 border-b border-zinc-200 bg-zinc-50 px-8 py-2.5">
          <span className="text-sm font-medium text-zinc-700">{selected.size} selected</span>
          <div className="h-4 w-px bg-zinc-300" />
          <button
            onClick={() => {
              if (!confirm(`Delete ${selected.size} file${selected.size !== 1 ? "s" : ""}?`)) return;
              handleDelete(Array.from(selected));
            }}
            className="text-sm text-red-500 transition hover:text-red-700"
          >
            Delete selected
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-sm text-zinc-400 transition hover:text-zinc-700">
            Clear selection
          </button>
        </div>
      )}

      {/* Body: grid + detail panel */}
      <div className="relative flex flex-1 overflow-hidden">

        {/* Left: drop zone + grid */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Error banner */}
          {error && (
            <div className="mx-8 mt-4 flex shrink-0 items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600" aria-label="Dismiss">✕</button>
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`mx-8 mt-5 shrink-0 flex cursor-default items-center justify-center rounded-lg border-2 border-dashed px-6 py-4 transition ${
              dragging ? "border-zinc-500 bg-zinc-100" : "border-zinc-200 hover:border-zinc-300"
            }`}
          >
            <p className="select-none text-sm text-zinc-400">
              Drag &amp; drop files here, or{" "}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-medium text-zinc-600 underline hover:text-zinc-900"
              >
                browse
              </button>
              <span className="ml-2 text-zinc-300">· Images, video, PDF · max 10 MB</span>
            </p>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto px-8 py-5">
          {loading ? null : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-white py-24 text-center">
              <p className="text-sm text-zinc-400">No files uploaded yet.</p>
            </div>
          ) : (
            <>
              {bulkMode && (
                <div className="mb-3 flex items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-500 select-none">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => allSelected ? setSelected(new Set()) : setSelected(new Set(files.map((f) => f.name)))}
                      className="h-3.5 w-3.5 rounded accent-blue-600"
                    />
                    {allSelected ? "Deselect all" : "Select all"}
                  </label>
                </div>
              )}

              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}
              >
                {files.map((file) => {
                  const isSelected = selected.has(file.name);
                  return (
                    <div
                      key={file.name}
                      onClick={() => toggleSelect(file.name)}
                      title={file.name}
                      className={`group relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                        isSelected
                          ? "media-tile-selected"
                          : "border-transparent bg-zinc-100 hover:border-zinc-300"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square">
                        <div className={`h-full w-full transition-transform duration-150 ${isSelected ? "media-tile-selected-inner" : ""}`}>
                          {isImage(file.name) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={file.url}
                              alt={file.name}
                              className="h-full w-full object-cover"
                              draggable={false}
                            />
                          ) : isVideo(file.name) ? (
                            <video
                              src={file.url}
                              className="h-full w-full object-cover"
                              muted
                              preload="metadata"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-3xl">
                              {extOf(file.name) === ".pdf" ? "📄" : "📎"}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Checkbox top-left (bulk mode) */}
                      {bulkMode && (
                        <div
                          className={`absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded border-2 transition ${
                            isSelected
                              ? "border-blue-600 bg-blue-600 opacity-100"
                              : "border-zinc-300 bg-white opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                              <path d="M1.5 5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          </div>
        </div>

        {/* Detail panel */}
        {(() => {
          const file = detailFile;
          const date = file ? new Date(file.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
          return (
            <aside
              className="absolute right-0 top-0 bottom-0 flex w-64 flex-col border-l border-zinc-200 bg-white overflow-hidden transition-transform duration-200 ease-in-out"
              style={{ transform: panelOpen ? "translateX(0)" : "translateX(100%)" }}
            >
              <div className="flex w-64 flex-col h-full">
              {/* Preview */}
              <div className="flex h-48 shrink-0 items-center justify-center overflow-hidden bg-zinc-50 border-b border-zinc-200 p-4">
                {file && isImage(file.name) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={file.url} alt={file.name} className="max-h-full max-w-full object-contain" />
                ) : file && isVideo(file.name) ? (
                  <video src={file.url} className="max-h-full max-w-full" muted preload="metadata" controls />
                ) : file ? (
                  <span className="text-5xl">{extOf(file.name) === ".pdf" ? "📄" : "📎"}</span>
                ) : null}
              </div>

              {/* Info */}
              {file && (
              <div className="flex-1 overflow-y-auto p-4">
                <p className="break-all text-sm font-medium text-zinc-900">{file.name}</p>
                <div className="mt-3 space-y-1.5 text-xs text-zinc-500">
                  <div className="flex justify-between">
                    <span>Size</span>
                    <span className="font-medium text-zinc-700">{formatBytes(file.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uploaded</span>
                    <span className="font-medium text-zinc-700">{date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type</span>
                    <span className="font-medium text-zinc-700">{extOf(file.name).replace(".", "").toUpperCase()}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => copyUrl(file.url, file.name)}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    {copiedUrl === file.name ? "✓ Copied!" : "Copy URL"}
                  </button>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    Open file ↗
                  </a>
                  <button
                    onClick={() => { if (confirm(`Delete "${file.name}"?`)) handleDelete([file.name]); }}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
              )}
              </div>
            </aside>
          );
        })()}
      </div>
    </div>
  );
}
