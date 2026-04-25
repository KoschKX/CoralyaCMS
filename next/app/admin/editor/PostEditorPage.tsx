"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { EditorBlock } from "@/lib/posts-db";
import { ViewportContext } from "@/components/ui/ViewportContext";
import { blocksToShortcodes, shortcodesToBlocks } from "@/lib/shortcodes";
import { EditorViewportContext } from "@/components/editor/EditorContext";
import { ResponsiveStyleInjector } from "@/components/ResponsiveStyleInjector";
import { getEditorBreakpoints } from "@/lib/editor-breakpoints";
import type { SelectedBlock } from "@/lib/types";
import BlockPanel from "@/app/admin/editor/BlockPanel";
import PostPanel from "@/app/admin/editor/PostPanel";
import { useSavePost } from "@/app/admin/editor/hooks/useSavePost";
import { useResponsiveBlock } from "@/app/admin/editor/hooks/useResponsiveBlock";
import { useCanvasWidth } from "@/app/admin/editor/hooks/useCanvasWidth";
import { usePageMeta } from "@/app/admin/editor/hooks/usePageMeta";
import dynamic from "next/dynamic";
const CodeEditor = dynamic(() => import("@/components/CodeEditor"), { ssr: false });
import type { VisualEditorProps } from "@/components/VisualEditor";

const VisualEditor = dynamic<VisualEditorProps>(
  () => import("@/components/VisualEditor"),
  { ssr: false },
);

interface PostEditorPageProps {
  id?: string;
  initialTitle?: string;
  initialSlug?: string;
  initialStatus?: "draft" | "published";
  initialBlocks?: EditorBlock[];
  initialHtml?: string;
  initialExcerpt?: string;
  initialTags?: string[];
  initialCategories?: string[];
  disabledBlocks?: string[];
}

export default function PostEditorPage({
  id,
  initialTitle = "",
  initialSlug = "",
  initialStatus = "draft",
  initialBlocks = [],
  initialHtml = "",
  initialExcerpt = "",
  initialTags = [],
  initialCategories = [],
  disabledBlocks = [],
}: PostEditorPageProps) {
  const [codeMode, setCodeMode] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelTab, setPanelTab] = useState<"post" | "block">("post");
  const [selectedBlock, setSelectedBlock] = useState<SelectedBlock | null>(null);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const router = useRouter();

  const draftKey = `post-draft-${id ?? "new"}`;
  const initialParsedBlocks = initialHtml ? shortcodesToBlocks(initialHtml) : initialBlocks;

  const [codeText, setCodeText] = useState(() => {
    try {
      return sessionStorage.getItem(draftKey) ?? (initialHtml || blocksToShortcodes(initialParsedBlocks));
    } catch {
      return initialHtml || blocksToShortcodes(initialParsedBlocks);
    }
  });

  const [debouncedCode, setDebouncedCode] = useState(codeText);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedCode(codeText), 300);
    return () => clearTimeout(t);
  }, [codeText]);

  const [visualBlocks, setVisualBlocks] = useState(initialParsedBlocks);
  const parsedCodeBlocks = useMemo(() => shortcodesToBlocks(debouncedCode), [debouncedCode]);
  const liveBlocks = codeMode ? parsedCodeBlocks : visualBlocks;

  const { title, slug, setSlug, status, setStatus, handleTitleChange } = usePageMeta({
    id,
    initialTitle,
    initialSlug,
    initialStatus,
  });

  const { saving, saved, saveError, handleSave } = useSavePost({
    id,
    title,
    slug,
    codeText,
    excerpt,
    tags,
    categories,
    onStatusChange: setStatus,
  });

  useEffect(() => {
    const t = setTimeout(() => {
      try { sessionStorage.setItem(draftKey, codeText); } catch {}
    }, 1000);
    return () => clearTimeout(t);
  }, [codeText, draftKey]);

  useEffect(() => {
    if (saved) {
      try { sessionStorage.removeItem(draftKey); } catch {}
    }
  }, [saved, draftKey]);

  const { tablet: tabletBp, mobile: mobileBp } = getEditorBreakpoints();
  const { canvasRef, viewport } = useCanvasWidth(tabletBp, mobileBp);
  const [panelViewport, setPanelViewport] = useState<import("@/components/ui/ViewportContext").Viewport>("desktop");

  const editorViewportContextValue = useMemo(() => ({ viewport }), [viewport]);

  const updateBlockHandlerRef = useRef<((id: string, newData: Record<string, unknown>) => void) | null>(null);
  const registerUpdateHandler = useCallback(
    (fn: ((id: string, newData: Record<string, unknown>) => void) | null) => {
      updateBlockHandlerRef.current = fn;
    },
    [],
  );

  const handleSelectBlock = useCallback(
    (blockId: string | null, data: Record<string, unknown>, type: string) => {
      if (!blockId) { setSelectedBlock(null); return; }
      setSelectedBlock({ id: blockId, name: type, data });
      setPanelTab("block");
    },
    [],
  );

  const [activeColIdx, setActiveColIdx] = useState<number | null>(null);
  const handleColSelect = useCallback((_blockId: string, colIdx: number | null) => {
    setActiveColIdx(colIdx);
  }, []);

  const { isSectionEnabled, toggleSection, controlsDisplayData, handleControlsChange } =
    useResponsiveBlock({
      selectedBlock,
      viewport: panelViewport,
      updateBlock: (blockId, data) => { updateBlockHandlerRef.current?.(blockId, data); },
      setSelectedBlock,
    });

  const activePanelTab = !codeMode && panelTab === "block" ? "block" : "post";

  return (
    <EditorViewportContext.Provider value={editorViewportContextValue}>
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 flex h-12 items-center border-b border-zinc-200 bg-white px-4">
        <button
          onClick={() => router.push("/admin/posts")}
          className="text-sm text-zinc-500 hover:text-zinc-800 mr-2"
        >
          &larr; Posts
        </button>
        {!codeMode && (
          <div className="flex items-center gap-0.5 ml-4" role="group" aria-label="Viewport">
            {(["desktop", "tablet", "mobile"] as const).map((vp) => (
              <button
                key={vp}
                onClick={() => setPanelViewport(vp)}
                title={vp.charAt(0).toUpperCase() + vp.slice(1)}
                aria-pressed={panelViewport === vp}
                className={`flex h-8 w-8 items-center justify-center rounded transition ${panelViewport === vp ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"}`}
              >
                {vp === "desktop" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                )}
                {vp === "tablet" && (
                  <svg width="14" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/>
                  </svg>
                )}
                {vp === "mobile" && (
                  <svg width="11" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {saved && <span className="text-xs font-medium text-emerald-600">Saved &#10003;</span>}
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
            onClick={() => {
              setCodeMode((m) => !m);
              if (!codeMode) setSelectedBlock(null);
            }}
            title={codeMode ? "Back to visual editor" : "Code view"}
            className={`rounded-md border px-2.5 py-1.5 text-sm font-mono transition ${codeMode ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"}`}
          >
            {codeMode ? (
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
            title="Toggle panel"
            className={`ml-1 rounded-md border px-2.5 py-1.5 text-sm transition ${panelOpen ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"}`}
          >
            &#8863;
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor canvas */}
        <div ref={canvasRef} className="flex-1 overflow-y-auto bg-zinc-100">
          <div className="py-10">
            <div
              className="text-zinc-900 bg-white rounded-lg shadow-sm mx-auto"
              style={{
                maxWidth: "var(--content-max-width, 48rem)",
                padding: "2.5rem var(--content-padding-x, 1.5rem)",
                containerType: "inline-size",
              }}
            >
              {codeMode ? (
                <>
                  <CodeEditor value={codeText} onValueChange={setCodeText} minHeight="60vh" />
                  <div className="overflow-hidden rounded-b-lg border border-t-0 border-zinc-700 bg-zinc-800 px-4 py-2">
                    <p className="text-[10px] text-zinc-500">
                      Shortcodes or raw HTML.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Post title"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="mb-10 w-full bg-transparent text-4xl font-bold text-zinc-900 placeholder:text-zinc-300 focus:outline-none"
                  />
                  <ViewportContext.Provider value={{ viewport, isSectionEnabled, toggleSection }}>
                    <ResponsiveStyleInjector
                      blocks={liveBlocks}
                      tabletBp={tabletBp}
                      mobileBp={mobileBp}
                      forContainer
                    />
                    <VisualEditor
                      initialBlocks={liveBlocks}
                      onChange={(newCode, newBlocks) => { setCodeText(newCode); setVisualBlocks(newBlocks); }}
                      onSelectBlock={handleSelectBlock}
                      selectedBlockId={selectedBlock?.id ?? null}
                      registerUpdateHandler={registerUpdateHandler}
                      onColSelect={handleColSelect}
                      disabledBlocks={disabledBlocks}
                    />
                  </ViewportContext.Provider>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right panel */}
        {panelOpen && (
          <aside className="sticky top-0 h-[calc(100vh-3rem)] w-72 shrink-0 overflow-y-auto border-l border-zinc-200 bg-white">
            <div className="flex border-b border-zinc-200">
              {(!codeMode ? ["post", "block"] : ["post"]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPanelTab(tab as "post" | "block")}
                  className={`flex-1 py-2.5 text-xs font-semibold capitalize tracking-wide transition ${activePanelTab === tab ? "border-b-2 border-zinc-900 text-zinc-900" : "text-zinc-400 hover:text-zinc-700"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="space-y-6 px-4 py-5">
              {activePanelTab === "post" && (
                <PostPanel
                  status={status}
                  setStatus={setStatus}
                  slug={slug}
                  setSlug={setSlug}
                  excerpt={excerpt}
                  setExcerpt={setExcerpt}
                  selectedTags={tags}
                  setSelectedTags={setTags}
                  selectedCategories={categories}
                  setSelectedCategories={setCategories}
                />
              )}
              {activePanelTab === "block" && (
                <BlockPanel
                  selectedBlock={selectedBlock}
                  viewport={panelViewport}
                  setViewport={setPanelViewport}
                  isSectionEnabled={isSectionEnabled}
                  toggleSection={toggleSection}
                  controlsDisplayData={controlsDisplayData}
                  onControlsChange={handleControlsChange}
                  activeColIdx={activeColIdx}
                />
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Floating save buttons */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2">
        {saveError && (
          <p role="alert" className="rounded-md bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 shadow">
            {saveError}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="rounded-md border border-zinc-200 bg-white px-5 py-2 text-base font-medium text-zinc-700 shadow-lg transition hover:bg-zinc-50 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save draft"}
          </button>
          <button
            onClick={() => handleSave("published")}
            disabled={saving}
            className="rounded-md bg-zinc-900 px-5 py-2 text-base font-medium text-white shadow-lg transition hover:bg-zinc-700 disabled:opacity-40"
          >
            {status === "published" ? "Update" : "Publish"}
          </button>
        </div>
      </div>
    </div>
    </EditorViewportContext.Provider>
  );
}
