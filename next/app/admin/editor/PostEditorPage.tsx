"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { EditorBlock } from "@/lib/posts-db";
import { ViewportContext } from "@/components/ui/ViewportContext";
import { EditorViewportContext } from "@/components/editor/EditorContext";
import { ResponsiveStyleInjector } from "@/components/ResponsiveStyleInjector";
import { getEditorBreakpoints } from "@/lib/editor-breakpoints";
import BlockPanel from "@/app/admin/editor/BlockPanel";
import PostPanel from "@/app/admin/editor/PostPanel";
import PostEditorToolbar from "@/app/admin/editor/PostEditorToolbar";
import { BlocksPanel } from "@/components/editor/BlocksPanel";
import { EditorNavDrawer } from "@/components/editor/EditorNavDrawer";
import { useSavePost } from "@/app/admin/editor/hooks/useSavePost";
import { useResponsiveBlock } from "@/app/admin/editor/hooks/useResponsiveBlock";
import { useCanvasWidth } from "@/app/admin/editor/hooks/useCanvasWidth";
import { useEditorPanel, type PanelTab } from "@/app/admin/editor/hooks/useEditorPanel";
import { usePageMeta } from "@/app/admin/editor/hooks/usePageMeta";
import { useEditorPageState } from "@/app/admin/editor/hooks/useEditorPageState";
import { useDirtyTracking } from "@/app/admin/editor/hooks/useDirtyTracking";
import dynamic from "next/dynamic";
import { Suspense } from "react";
const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
});
import type { VisualEditorProps } from "@/components/VisualEditor";

const VisualEditor = dynamic<VisualEditorProps>(
  () => import("@/components/VisualEditor"),
  {
    ssr: false,
  },
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
  const {
    mainMode,
    setMainMode,
    selectedBlock,
    setSelectedBlock,
    codeText,
    setCodeText,
    visualBlocks,
    setVisualBlocks,
    liveBlocks,
    clearDraft,
  } = useEditorPageState({ id, initialBlocks, initialHtml });

  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const router = useRouter();

  const { title, slug, setSlug, status, setStatus, handleTitleChange } = usePageMeta({
    id,
    initialTitle,
    initialSlug,
    initialStatus,
  });

  // ── Dirty / unsaved-changes tracking ───────────────────────────────────────
  const { handleSaveSuccess } = useDirtyTracking(codeText, clearDraft);

  const { saving, saved, saveError, handleSave } = useSavePost({
    id,
    title,
    slug,
    codeText,
    liveBlocks,
    mainMode,
    excerpt,
    tags,
    categories,
    onStatusChange: setStatus,
    onSaveSuccess: handleSaveSuccess,
  });

  // ── Panel ──────────────────────────────────────────────────────────────────
  // useEditorPanel("post") defaults to "post" tab and forces it in code mode.
  const { panelTab, setPanelTab, panelOpen, setPanelOpen } = useEditorPanel(mainMode, "post");
  const { tablet: tabletBp, mobile: mobileBp } = getEditorBreakpoints();

  const { canvasRef, viewport, setViewport } = useCanvasWidth(tabletBp, mobileBp, panelOpen);

  const editorViewportContextValue = useMemo(() => ({ viewport }), [viewport]);

  const updateBlockHandlerRef = useRef<((id: string, newData: Record<string, unknown>) => void) | null>(null);
  const registerUpdateHandler = useCallback(
    (fn: ((id: string, newData: Record<string, unknown>) => void) | null) => {
      updateBlockHandlerRef.current = fn;
    },
    [],
  );

  // ── Fly-out drawer state ──────────────────────────────────────────────────
  const [blocksPanelOpen, setBlocksPanelOpen] = useState(false);
  const [navPanelOpen, setNavPanelOpen] = useState(false);

  const addBlockHandlerRef = useRef<((type: string) => void) | null>(null);
  const registerAddBlockHandler = useCallback(
    (fn: ((type: string) => void) | null) => { addBlockHandlerRef.current = fn; },
    [],
  );
  const handleAddBlockFromPanel = useCallback((type: string) => {
    addBlockHandlerRef.current?.(type);
  }, []);

  // React state setters are guaranteed stable by React — listed here for
  // documentation clarity rather than correctness.
  const handleSelectBlock = useCallback(
    (blockId: string | null, data: Record<string, unknown>, type: string) => {
      if (!blockId) { setSelectedBlock(null); return; }
      setSelectedBlock({ id: blockId, name: type, data });
      setPanelTab("block" as PanelTab);
    },
    [setSelectedBlock, setPanelTab],
  );

  const [activeColIdx, setActiveColIdx] = useState<number | null>(null);
  const handleColSelect = useCallback((_blockId: string, colIdx: number | null) => {
    setActiveColIdx(colIdx);
  }, []);

  const { isSectionEnabled, isFieldOverridden, toggleSection, controlsDisplayData, controlsInheritedData, handleControlsChange, handleBaseControlsChange } =
    useResponsiveBlock({
      selectedBlock,
      viewport,
      updateBlock: (blockId, data) => { updateBlockHandlerRef.current?.(blockId, data); },
      setSelectedBlock,
    });

  return (
    <EditorViewportContext.Provider value={editorViewportContextValue}>
    <div className="flex h-full flex-col overflow-hidden">
      <PostEditorToolbar
        mainMode={mainMode}
        setMainMode={(m) => setMainMode(m as "visual" | "code")}
        viewport={viewport}
        setViewport={setViewport}
        panelOpen={panelOpen}
        setPanelOpen={setPanelOpen}
        blocksPanelOpen={blocksPanelOpen}
        setBlocksPanelOpen={setBlocksPanelOpen}
        navPanelOpen={navPanelOpen}
        setNavPanelOpen={setNavPanelOpen}
        saving={saving}
        saved={saved}
        saveError={saveError}
        slug={slug}
        status={status}
        onSave={handleSave}
        router={router}
      />

      {/* ── Fly-out: admin nav drawer ───────────────────────────────────── */}
      <EditorNavDrawer open={navPanelOpen} onClose={() => setNavPanelOpen(false)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Block inserter — inline, pushes canvas when open */}
        <aside
          aria-label="Block inserter"
          className={`shrink-0 overflow-hidden border-r border-zinc-300 bg-white transition-[width] duration-200 ease-in-out ${
            blocksPanelOpen && mainMode === "visual" ? "w-64" : "w-0"
          }`}
        >
          <div className="w-64">
            <BlocksPanel onAdd={(type) => { handleAddBlockFromPanel(type); setBlocksPanelOpen(false); }} />
          </div>
        </aside>
        {/* Editor canvas */}
        <div ref={canvasRef} className="flex-1 overflow-y-auto bg-zinc-100">
          <div className="py-10">
            {/* When the panel is open, constrain canvas width to the selected viewport
                breakpoint so responsive CSS fires at the right size. */}
            <div
              className="mx-auto"
              style={panelOpen && mainMode !== "code" ? {
                maxWidth:
                  viewport === "mobile" ? "390px"
                  : viewport === "tablet" ? "768px"
                  : "100%",
              } : { maxWidth: "100%" }}
            >
            <div
              className="text-zinc-900 bg-white rounded-lg shadow-sm mx-auto"
              style={{
                maxWidth: "var(--content-max-width, 48rem)",
                padding: "2.5rem var(--content-padding-x, 1.5rem)",
                containerType: "inline-size",
              }}
            >
              {mainMode === "code" ? (
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
                  <ViewportContext.Provider value={{ viewport, isSectionEnabled, isFieldOverridden, toggleSection, inheritedData: {} }}>
                    <ResponsiveStyleInjector
                      blocks={liveBlocks}
                      tabletBp={tabletBp}
                      mobileBp={mobileBp}
                      forContainer
                      forcedViewport={panelOpen && viewport !== "desktop" ? viewport : undefined}
                    />
                    <Suspense fallback={<div style={{ minHeight: "200px" }} />}>
                      <VisualEditor
                        initialBlocks={liveBlocks}
                        onChange={(newCode, newBlocks) => { setCodeText(newCode); setVisualBlocks(newBlocks); }}
                        onSelectBlock={handleSelectBlock}
                        selectedBlockId={selectedBlock?.id ?? null}
                        registerUpdateHandler={registerUpdateHandler}
                        registerAddBlockHandler={registerAddBlockHandler}
                        onColSelect={handleColSelect}
                        disabledBlocks={disabledBlocks}
                      />
                    </Suspense>
                  </ViewportContext.Provider>
                </>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* Right panel — animates in/out */}
        <aside
          aria-label="Editor settings"
          className={`shrink-0 overflow-hidden border-l border-zinc-300 bg-white transition-[width] duration-200 ease-in-out ${panelOpen ? "w-72" : "w-0"}`}
        >
          <div className="sticky top-0 h-[calc(100vh-3rem)] w-72 overflow-y-auto">
            <div className="flex border-b border-zinc-300" role="tablist" aria-label="Panel sections">
              {(mainMode !== "code" ? ["post", "block"] : ["post"]).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={panelTab === tab}
                  onClick={() => setPanelTab(tab as PanelTab)}
                  className={`flex-1 py-2.5 text-xs font-semibold capitalize tracking-wide transition ${panelTab === tab ? "border-b-2 border-zinc-900 text-zinc-900" : "text-zinc-400 hover:text-zinc-700"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="space-y-6 px-4 py-5" role="tabpanel">
              {panelTab === "post" && (
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
              {panelTab === "block" && (
                <BlockPanel
                  selectedBlock={selectedBlock}
                  viewport={viewport}
                  setViewport={setViewport}
                  isSectionEnabled={isSectionEnabled}
                  isFieldOverridden={isFieldOverridden}
                  toggleSection={toggleSection}
                  controlsDisplayData={controlsDisplayData}
                  controlsInheritedData={controlsInheritedData}
                  onControlsChange={handleControlsChange}
                  onBaseControlsChange={handleBaseControlsChange}
                  activeColIdx={activeColIdx}
                />
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
    </EditorViewportContext.Provider>
  );
}
