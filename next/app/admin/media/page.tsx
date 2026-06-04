"use client";

import { useState, useEffect, useRef } from "react";

interface MediaFile {
  name: string;
  url: string;
  size: number;
  createdAt: string;
}

const IMAGE_EXTS  = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]);
const VIDEO_EXTS  = new Set([".mp4", ".webm"]);
const AUDIO_EXTS  = new Set([".mp3", ".ogg", ".wav"]);
const DOC_EXTS    = new Set([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv"]);

function extOf(name: string) { return name.slice(name.lastIndexOf(".")).toLowerCase(); }
function isImage(name: string)  { return IMAGE_EXTS.has(extOf(name)); }
function isVideo(name: string)  { return VIDEO_EXTS.has(extOf(name)); }
function isAudio(name: string)  { return AUDIO_EXTS.has(extOf(name)); }
function isDoc(name: string)    { return DOC_EXTS.has(extOf(name)); }
function categoryOf(name: string): Category {
  if (isImage(name))  return "Image";
  if (isVideo(name))  return "Video";
  if (isAudio(name))  return "Audio";
  if (isDoc(name))    return "Document";
  return "Misc";
}
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Category = "All" | "Image" | "Video" | "Audio" | "Document" | "Misc";
const CATEGORIES: Category[] = ["All", "Image", "Video", "Audio", "Document", "Misc"];

const ALL_MIME_TYPES = [
  { mime: "image/jpeg",      label: "JPEG images (.jpg)" },
  { mime: "image/png",       label: "PNG images (.png)" },
  { mime: "image/gif",       label: "GIF images (.gif)" },
  { mime: "image/webp",      label: "WebP images (.webp)" },
  { mime: "image/svg+xml",   label: "SVG images (.svg)" },
  { mime: "video/mp4",       label: "MP4 video (.mp4)" },
  { mime: "video/webm",      label: "WebM video (.webm)" },
  { mime: "audio/mpeg",      label: "MP3 audio (.mp3)" },
  { mime: "audio/ogg",       label: "OGG audio (.ogg)" },
  { mime: "audio/wav",       label: "WAV audio (.wav)" },
  { mime: "application/pdf", label: "PDF documents (.pdf)" },
];

function MediaTile({ file, isSel, bulkMode, onToggle }: { file: MediaFile; isSel: boolean; bulkMode: boolean; onToggle: (name: string) => void }) {
  return (
    <div onClick={() => onToggle(file.name)} title={file.name}
      className={`group relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${isSel ? "media-tile-selected" : "border-transparent bg-zinc-100 hover:border-zinc-300"}`}
    >
      <div className="aspect-square">
        <div className={`h-full w-full transition-transform duration-150 ${isSel ? "media-tile-selected-inner" : ""}`}>
          {isImage(file.name) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.url} alt={file.name} className="h-full w-full object-cover" draggable={false} />
          ) : isVideo(file.name) ? (
            <video src={file.url} className="h-full w-full object-cover" muted preload="metadata" />
          ) : isAudio(file.name) ? (
            <div className="flex h-full w-full items-center justify-center text-3xl">🎵</div>
          ) : isDoc(file.name) ? (
            <div className="flex h-full w-full items-center justify-center text-3xl">{extOf(file.name) === ".pdf" ? "📄" : "📝"}</div>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl">📎</div>
          )}
        </div>
      </div>
      {bulkMode && (
        <div className={`absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded border-2 transition ${isSel ? "border-blue-600 bg-blue-600 opacity-100" : "border-zinc-300 bg-white opacity-0 group-hover:opacity-100"}`}>
          {isSel && <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M1.5 5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
      )}
    </div>
  );
}

export default function MediaPage() {
  const [files, setFiles]           = useState<MediaFile[]>([]);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode]     = useState(false);
  const [copiedUrl, setCopiedUrl]   = useState<string | null>(null);
  const [dragging, setDragging]     = useState(false);
  const [category, setCategory]     = useState<Category>("All");
  const [allowedMimes, setAllowedMimes]   = useState<string[]>([]);
  const [mimesSaving, setMimesSaving]     = useState(false);
  const [mimesSaved, setMimesSaved]       = useState(false);
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

  useEffect(() => {
    loadFiles();
    fetch("/api/settings").then(r => r.json()).then(s => {
      setAllowedMimes(s.allowedMimeTypes ?? ALL_MIME_TYPES.map(m => m.mime));
    });
  }, []);

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
      setSelected((prev) => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });
    } else {
      setSelected((prev) => prev.has(name) && prev.size === 1 ? new Set() : new Set([name]));
    }
  }

  function exitBulkMode() { setBulkMode(false); setSelected(new Set()); }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); setDragging(true); }
  function onDragLeave(e: React.DragEvent) { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }
  function onDrop(e: React.DragEvent) { e.preventDefault(); setDragging(false); handleUpload(e.dataTransfer.files); }

  function toggleMime(mime: string) {
    setAllowedMimes(prev => prev.includes(mime) ? prev.filter(m => m !== mime) : [...prev, mime]);
  }

  async function saveMimes() {
    setMimesSaving(true);
    await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ allowedMimeTypes: allowedMimes }) });
    setMimesSaving(false); setMimesSaved(true);
    setTimeout(() => setMimesSaved(false), 2500);
  }

  const visibleFiles = category === "All" ? files : files.filter(f => categoryOf(f.name) === category);
  const groupedFiles: { cat: Category; items: MediaFile[] }[] = category === "All"
    ? (["Image", "Video", "Audio", "Document", "Misc"] as Category[])
        .map(cat => ({ cat, items: files.filter(f => categoryOf(f.name) === cat) }))
        .filter(g => g.items.length > 0)
    : [];
  const allSelected  = visibleFiles.length > 0 && visibleFiles.every(f => selected.has(f.name));
  const panelOpen    = selected.size === 1 && !bulkMode;
  const detailFile   = panelOpen ? (files.find((f) => selected.has(f.name)) ?? detailFileRef.current) : detailFileRef.current;
  if (panelOpen && detailFile) detailFileRef.current = detailFile;

  // Accept string based on current allowed mimes
  const acceptStr = allowedMimes.length
    ? allowedMimes.join(",")
    : ALL_MIME_TYPES.map(m => m.mime).join(",");

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-300 bg-white px-8 py-5">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Media Library</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            {loading ? "Loading\u2026" : `${files.length} file${files.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => bulkMode ? exitBulkMode() : setBulkMode(true)}
            className={`rounded-md border px-3 py-2 text-sm font-medium transition ${bulkMode ? "border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100" : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"}`}
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
          <input ref={fileInputRef} type="file" multiple accept={acceptStr} className="sr-only" onChange={(e) => handleUpload(e.target.files)} />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex shrink-0 items-center gap-0 border-b border-zinc-300 bg-white px-8">
        {CATEGORIES.map(cat => {
          const count = cat === "All" ? files.length : files.filter(f => categoryOf(f.name) === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`relative px-4 py-2.5 text-sm font-medium transition ${category === cat ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}
            >
              {cat}
              {count > 0 && <span className="ml-1.5 text-xs text-zinc-400">{count}</span>}
              {category === cat && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-t" />}
            </button>
          );
        })}
      </div>

      {/* Bulk action bar */}
      {bulkMode && selected.size > 0 && (
        <div className="flex shrink-0 items-center gap-3 border-b border-zinc-300 bg-zinc-50 px-8 py-2.5">
          <span className="text-sm font-medium text-zinc-700">{selected.size} selected</span>
          <div className="h-4 w-px bg-zinc-300" />
          <button onClick={() => { if (!confirm(`Delete ${selected.size} file${selected.size !== 1 ? "s" : ""}?`)) return; handleDelete(Array.from(selected)); }} className="text-sm text-red-500 transition hover:text-red-700">Delete selected</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-sm text-zinc-400 transition hover:text-zinc-700">Clear selection</button>
        </div>
      )}

      {/* Body */}
      <div className="relative flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-y-auto">
          {error && (
            <div className="mx-8 mt-4 flex shrink-0 items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600" aria-label="Dismiss">✕</button>
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            className={`mx-8 mt-5 shrink-0 flex cursor-default items-center justify-center rounded-lg border-2 border-dashed px-6 py-4 transition ${dragging ? "border-zinc-500 bg-zinc-100" : "border-zinc-300 hover:border-zinc-300"}`}
          >
            <p className="select-none text-sm text-zinc-400">
              Drag &amp; drop files here, or{" "}
              <button type="button" onClick={() => fileInputRef.current?.click()} className="font-medium text-zinc-600 underline hover:text-zinc-900">browse</button>
              <span className="ml-2 text-zinc-300">· max 10 MB</span>
            </p>
          </div>

          {/* Grid */}
          <div className="flex-1 px-8 py-5">
            {loading ? null : visibleFiles.length === 0 && groupedFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-white py-24 text-center">
                <p className="text-sm text-zinc-400">{files.length === 0 ? "No files uploaded yet." : `No ${category.toLowerCase()} files.`}</p>
              </div>
            ) : category === "All" ? (
              // Grouped sections
              <div className="space-y-8">
                {groupedFiles.map(({ cat, items }) => (
                  <div key={cat}>
                    <div className="mb-3 flex items-center gap-3">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{cat}</h2>
                      <span className="text-xs text-zinc-300">{items.length}</span>
                      <div className="flex-1 border-t border-zinc-200" />
                    </div>
                    <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}>
                      {items.map((file) => <MediaTile key={file.name} file={file} isSel={selected.has(file.name)} bulkMode={bulkMode} onToggle={toggleSelect} />)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Flat filtered grid
              <>
                {bulkMode && (
                  <div className="mb-3 flex items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-500 select-none">
                      <input type="checkbox" checked={allSelected} onChange={() => allSelected ? setSelected(new Set()) : setSelected(new Set(visibleFiles.map(f => f.name)))} className="h-3.5 w-3.5 rounded accent-blue-600" />
                      {allSelected ? "Deselect all" : "Select all"}
                    </label>
                  </div>
                )}
                <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}>
                  {visibleFiles.map((file) => <MediaTile key={file.name} file={file} isSel={selected.has(file.name)} bulkMode={bulkMode} onToggle={toggleSelect} />)}
                </div>
              </>
            )}
          </div>

          {/* Upload settings */}
          <div className="mx-8 mb-8 rounded-xl border border-zinc-300 bg-white p-6">
            <h2 className="text-sm font-semibold text-zinc-900">Upload settings</h2>
            <p className="mt-0.5 mb-4 text-xs text-zinc-400">Choose which file types are allowed to be uploaded.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ALL_MIME_TYPES.map(({ mime, label }) => (
                <label key={mime} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 select-none">
                  <input type="checkbox" checked={allowedMimes.includes(mime)} onChange={() => toggleMime(mime)} className="h-4 w-4 rounded accent-zinc-900" />
                  {label}
                </label>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              {mimesSaved && <span className="text-xs text-green-600">Saved!</span>}
              <button onClick={saveMimes} disabled={mimesSaving} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-40 ml-auto">
                {mimesSaving ? "Saving\u2026" : "Save"}
              </button>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {(() => {
          const file = detailFile;
          const date = file ? new Date(file.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
          return (
            <aside
              className="absolute right-0 top-0 bottom-0 flex w-64 flex-col border-l border-zinc-300 bg-white overflow-hidden transition-transform duration-200 ease-in-out"
              style={{ transform: panelOpen ? "translateX(0)" : "translateX(100%)" }}
            >
              <div className="flex w-64 flex-col h-full">
                <div className="flex h-48 shrink-0 items-center justify-center overflow-hidden bg-zinc-50 border-b border-zinc-300 p-4">
                  {file && isImage(file.name) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.url} alt={file.name} className="max-h-full max-w-full object-contain" />
                  ) : file && isVideo(file.name) ? (
                    <video src={file.url} className="max-h-full max-w-full" muted preload="metadata" controls />
                  ) : file && isAudio(file.name) ? (
                    <audio src={file.url} controls className="w-full" />
                  ) : file ? (
                    <span className="text-5xl">{extOf(file.name) === ".pdf" ? "📄" : "📎"}</span>
                  ) : null}
                </div>
                {file && (
                  <div className="flex-1 overflow-y-auto p-4">
                    <p className="break-all text-sm font-medium text-zinc-900">{file.name}</p>
                    <div className="mt-3 space-y-1.5 text-xs text-zinc-500">
                      <div className="flex justify-between"><span>Size</span><span className="font-medium text-zinc-700">{formatBytes(file.size)}</span></div>
                      <div className="flex justify-between"><span>Uploaded</span><span className="font-medium text-zinc-700">{date}</span></div>
                      <div className="flex justify-between"><span>Type</span><span className="font-medium text-zinc-700">{extOf(file.name).replace(".", "").toUpperCase()}</span></div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <button onClick={() => copyUrl(file.url, file.name)} className="flex w-full items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50">
                        {copiedUrl === file.name ? "✓ Copied!" : "Copy URL"}
                      </button>
                      <a href={file.url} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50">
                        Open file ↗
                      </a>
                      <button onClick={() => { if (confirm(`Delete "${file.name}"?`)) handleDelete([file.name]); }} className="flex w-full items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50">
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
