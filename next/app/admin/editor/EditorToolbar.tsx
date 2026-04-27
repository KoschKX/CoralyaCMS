"use client";

import type React from "react";
import { useRouter } from "next/navigation";

interface EditorToolbarProps {
  mainMode: "visual" | "code" | "inject";
  setMainMode: (mode: "visual" | "code" | "inject") => void;
  panelOpen: boolean;
  setPanelOpen: (fn: (o: boolean) => boolean) => void;
  blocksPanelOpen: boolean;
  setBlocksPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  saving: boolean;
  saved: boolean;
  saveError: string | null;
  slug: string;
  status: "draft" | "published";
  onSave: (targetStatus: "draft" | "published") => void;
  router: ReturnType<typeof useRouter>;
}

export default function EditorToolbar({
  mainMode,
  setMainMode,
  panelOpen,
  setPanelOpen,
  blocksPanelOpen,
  setBlocksPanelOpen,
  saving,
  saved,
  saveError,
  slug,
  status,
  onSave,
  router,
}: EditorToolbarProps) {
  return (
    <>
      {/* Top toolbar */}
      <div className="sticky top-0 z-20 flex h-12 items-center border-b border-zinc-200 bg-white px-4">
        <button onClick={() => router.push("/admin")} className="text-sm text-zinc-500 hover:text-zinc-800 mr-2">
          &larr; Pages
        </button>
        {/* Toggle left blocks panel — only relevant in visual mode */}
        {mainMode === "visual" && (
          <button
            onClick={() => setBlocksPanelOpen((o) => !o)}
            aria-label="Toggle blocks panel"
            aria-pressed={blocksPanelOpen}
            title="Toggle block inserter"
            className={`mr-2 rounded-md border px-2.5 py-1.5 text-sm transition ${blocksPanelOpen ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"}`}
          >
            {/* Grid/blocks icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M3 3h8v8H3zm0 10h8v8H3zm10-10h8v8h-8zm0 10h8v8h-8z"/>
            </svg>
          </button>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {saved && <span className="text-xs font-medium text-emerald-600">Saved &#10003;</span>}
          {slug && status === "published" && (
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View page"
              className="ml-1 rounded-md border px-2.5 py-1.5 text-sm font-medium transition border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 flex items-center"
              style={{ lineHeight: 0 }}
            >
              <img src="/icons/external-link.svg" alt="View" className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => setMainMode(mainMode === "inject" ? "visual" : "inject")}
            aria-label="Code injection"
            aria-pressed={mainMode === "inject"}
            className={`rounded-md border px-2.5 py-1.5 text-sm transition border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 flex items-center justify-center ${mainMode === "inject" ? "border-zinc-900 bg-zinc-900 text-white" : ""}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 9h8M8 15h8"/></svg>
          </button>
          <button
            onClick={() => setMainMode(mainMode === "code" ? "visual" : "code")}
            aria-label={mainMode === "code" ? "Back to visual editor" : "Code view"}
            aria-pressed={mainMode === "code"}
            className={`rounded-md border px-2.5 py-1.5 text-sm font-mono transition ${mainMode === "code" ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"}`}
          >
            {mainMode === "code" ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="currentColor">
                <path d="M3 6h11v1.5H3V6Zm3.5 5.5h11V13h-11v-1.5ZM21 17H10v1.5h11V17Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="currentColor">
                <path d="M20.8 10.7l-4.3-4.3-1.1 1.1 4.3 4.3c.1.1.1.3 0 .4l-4.3 4.3 1.1 1.1 4.3-4.3c.7-.8.7-1.9 0-2.6zM4.2 11.8l4.3-4.3-1-1-4.3 4.3c-.7.7-.7 1.8 0 2.5l4.3 4.3 1.1-1.1-4.3-4.3c-.2-.1-.2-.3-.1-.4z"/>
              </svg>
            )}
          </button>
          <button
            onClick={() => setPanelOpen((o) => !o)}
            aria-label="Toggle settings panel"
            aria-pressed={panelOpen}
            className={`ml-1 rounded-md border px-2.5 py-1.5 text-sm transition ${panelOpen ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"}`}
          >
            &#8863;
          </button>
        </div>
      </div>
      {/* Floating Save/Update buttons */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2">
        {saveError && (
          <p role="alert" className="rounded-md bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 shadow">
            {saveError}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => onSave("draft")}
            disabled={saving}
            className="rounded-md border border-zinc-200 bg-white px-5 py-2 text-base font-medium text-zinc-700 shadow-lg transition hover:bg-zinc-50 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save draft"}
          </button>
          <button
            onClick={() => onSave("published")}
            disabled={saving}
            className="rounded-md bg-zinc-900 px-5 py-2 text-base font-medium text-white shadow-lg transition hover:bg-zinc-700 disabled:opacity-40"
          >
            {status === "published" ? "Update" : "Publish"}
          </button>
        </div>
      </div>
    </>
  );
}
