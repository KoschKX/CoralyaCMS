"use client";

import { useRouter } from "next/navigation";
import type { Viewport } from "@/components/ui/ViewportContext";

interface PostEditorToolbarProps {
  mainMode: "visual" | "code" | "inject";
  setMainMode: (mode: "visual" | "code") => void;
  viewport: Viewport;
  setViewport: (vp: Viewport) => void;
  panelOpen: boolean;
  setPanelOpen: (fn: (o: boolean) => boolean) => void;
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
      <div className="sticky top-0 z-20 flex h-12 items-center border-b border-zinc-200 bg-white px-4">
        <button
          onClick={() => router.push("/admin/posts")}
          className="text-sm text-zinc-500 hover:text-zinc-800 mr-2"
        >
          &larr; Posts
        </button>

        <ViewportButtons
          mainMode={mainMode}
          viewport={viewport}
          setViewport={setViewport}
        />

        <div className="flex items-center gap-2 ml-auto">
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
              className="ml-1 rounded-md border px-2.5 py-1.5 text-sm font-medium transition border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 flex items-center"
              style={{ lineHeight: 0 }}
            >
              <img src="/icons/external-link.svg" alt="View" className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => setMainMode(mainMode === "code" ? "visual" : "code")}
            aria-label={mainMode === "code" ? "Back to visual editor" : "Code view"}
            aria-pressed={mainMode === "code"}
            className={`rounded-md border px-2.5 py-1.5 text-sm font-mono transition ${
              mainMode === "code"
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
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
            className={`ml-1 rounded-md border px-2.5 py-1.5 text-sm transition ${
              panelOpen
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            &#8863;
          </button>
        </div>
      </div>

      {/* Floating save buttons */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2">
        {saveError && (
          <p
            role="alert"
            className="rounded-md bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 shadow"
          >
            {saveError}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => onSave("draft")}
            disabled={saving}
            className="rounded-md border border-zinc-200 bg-white px-5 py-2 text-base font-medium text-zinc-700 shadow-lg transition hover:bg-zinc-50 disabled:opacity-40"
          >
            {saving ? "Saving\u2026" : "Save draft"}
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
