"use client";

import type React from "react";
import { useRouter } from "next/navigation";
import type { Viewport } from "@/components/ui/ViewportContext";

interface PostEditorToolbarProps {
  mainMode: "visual" | "code" | "inject";
  setMainMode: (mode: "visual" | "code") => void;
  viewport: Viewport;
  setViewport: (vp: Viewport) => void;
  panelOpen: boolean;
  setPanelOpen: (fn: (o: boolean) => boolean) => void;
  blocksPanelOpen: boolean;
  setBlocksPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  navPanelOpen: boolean;
  setNavPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  saving: boolean;
  saved: boolean;
  saveError: string | null;
  slug: string;
  status: "draft" | "published";
  onSave: (targetStatus: "draft" | "published") => void;
  router: ReturnType<typeof useRouter>;
}

const ViewportButtons = ({
  mainMode,
  viewport,
  setViewport,
}: Pick<PostEditorToolbarProps, "mainMode" | "viewport" | "setViewport">) => {
  if (mainMode === "code") return null;
  return (
    <div
      className="flex items-center gap-0.5 ml-4"
      role="group"
      aria-label="Preview viewport"
    >
      {(["desktop", "tablet", "mobile"] as const).map((vp) => (
        <button
          key={vp}
          onClick={() => setViewport(vp)}
          aria-label={`${vp.charAt(0).toUpperCase() + vp.slice(1)} viewport`}
          aria-pressed={viewport === vp}
          className={`flex h-8 w-8 items-center justify-center rounded transition ${
            viewport === vp
              ? "bg-zinc-900 text-white"
              : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
          }`}
        >
          {vp === "desktop" && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          )}
          {vp === "tablet" && (
            <svg
              width="14"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
            </svg>
          )}
          {vp === "mobile" && (
            <svg
              width="11"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
};

export default function PostEditorToolbar({
  mainMode,
  setMainMode,
  viewport,
  setViewport,
  panelOpen,
  setPanelOpen,
  blocksPanelOpen,
  setBlocksPanelOpen,
  navPanelOpen,
  setNavPanelOpen,
  saving,
  saved,
  saveError,
  slug,
  status,
  onSave,
  router,
}: PostEditorToolbarProps) {
  return (
    <>
      {/* Top toolbar */}
      <div className="sticky top-0 z-20 flex h-12 items-center border-b border-zinc-300 bg-white px-2">
        {/* Hamburger — opens the admin nav drawer */}
        <button
          onClick={() => setNavPanelOpen((o) => !o)}
          aria-label="Toggle admin navigation"
          aria-pressed={navPanelOpen}
          title="Admin menu"
          className={`flex h-8 w-8 items-center justify-center rounded border transition ${
            navPanelOpen ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {/* Block inserter toggle — only in visual mode */}
        {mainMode === "visual" && (
          <button
            onClick={() => setBlocksPanelOpen((o) => !o)}
            aria-label="Toggle block inserter"
            aria-pressed={blocksPanelOpen}
            title="Insert block"
            className={`ml-1 flex h-8 w-8 items-center justify-center rounded transition ${
              blocksPanelOpen ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </button>
        )}

        <ViewportButtons mainMode={mainMode} viewport={viewport} setViewport={setViewport} />

        <div className="flex items-center gap-1.5 ml-auto">
          {saved && (
            <span className="text-xs font-medium text-emerald-600">
              Saved &#10003;
            </span>
          )}
          {slug && status === "published" && (
            <a
              href={`/posts/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View post"
              className="flex h-8 w-8 items-center justify-center rounded border border-zinc-300 text-zinc-600 transition hover:bg-zinc-50"
            >
              <img src="/icons/external-link.svg" alt="View" className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => setMainMode(mainMode === "code" ? "visual" : "code")}
            aria-label={mainMode === "code" ? "Back to visual editor" : "Code view"}
            aria-pressed={mainMode === "code"}
            className={`flex h-8 w-8 items-center justify-center rounded border transition ${
              mainMode === "code"
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {mainMode === "code" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
                focusable="false"
                fill="currentColor"
              >
                <path d="M3 6h11v1.5H3V6Zm3.5 5.5h11V13h-11v-1.5ZM21 17H10v1.5h11V17Z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
                focusable="false"
                fill="currentColor"
              >
                <path d="M20.8 10.7l-4.3-4.3-1.1 1.1 4.3 4.3c.1.1.1.3 0 .4l-4.3 4.3 1.1 1.1 4.3-4.3c.7-.8.7-1.9 0-2.6zM4.2 11.8l4.3-4.3-1-1-4.3 4.3c-.7.7-.7 1.8 0 2.5l4.3 4.3 1.1-1.1-4.3-4.3c-.2-.1-.2-.3-.1-.4z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setPanelOpen((o) => !o)}
            aria-label="Toggle settings panel"
            aria-pressed={panelOpen}
            className={`flex h-8 w-8 items-center justify-center rounded border transition ${
              panelOpen
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            &#8863;
          </button>
          <div className="ml-1.5 flex items-center gap-2 border-l border-zinc-300 pl-2.5">
            {saveError && (
              <span role="alert" className="text-xs font-medium text-red-600">{saveError}</span>
            )}
            <button
              onClick={() => onSave("draft")}
              disabled={saving}
              className="h-8 rounded border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40"
            >
              {saving ? "Saving\u2026" : "Save draft"}
            </button>
            <button
              onClick={() => onSave("published")}
              disabled={saving}
              className="h-8 rounded bg-zinc-900 px-3 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:opacity-40"
            >
              {status === "published" ? "Update" : "Publish"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
