
"use client";

import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";

import { useRouter } from "next/navigation";
import type { EditorBlock } from "@/lib/pages-db";
import type { InjectCode } from "@/lib/types";
import { ViewportContext } from "@/components/ui/ViewportContext";
import { EditorViewportContext } from "@/components/editor/EditorContext";
import { ResponsiveStyleInjector } from "@/components/ResponsiveStyleInjector";
import { getEditorBreakpoints } from "@/lib/editor-breakpoints";
import EditorToolbar from "@/app/admin/editor/EditorToolbar";
import PagePanel from "@/app/admin/editor/PagePanel";
import BlockPanel from "@/app/admin/editor/BlockPanel";
import InjectCodePanel from "@/app/admin/editor/InjectCodePanel";
import { BlocksPanel } from "@/components/editor/BlocksPanel";
import { EditorNavDrawer } from "@/components/editor/EditorNavDrawer";
import { useSavePage } from "@/app/admin/editor/hooks/useSavePage";
import { useResponsiveBlock } from "@/app/admin/editor/hooks/useResponsiveBlock";
import { useCanvasWidth } from "@/app/admin/editor/hooks/useCanvasWidth";
import { useEditorPanel, type PanelTab } from "@/app/admin/editor/hooks/useEditorPanel";
import { usePageMeta } from "@/app/admin/editor/hooks/usePageMeta";
import { useEditorPageState } from "@/app/admin/editor/hooks/useEditorPageState";
import { useDirtyTracking } from "@/app/admin/editor/hooks/useDirtyTracking";
import dynamic from "next/dynamic";
const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
  loading: () => <div className="h-[60vh] animate-pulse rounded-lg bg-zinc-100" />,
});
import type { VisualEditorProps } from "@/components/VisualEditor";

const VisualEditor = dynamic<VisualEditorProps>(
  () => import("@/components/VisualEditor"),
  {
    ssr: false,
    loading: () => <div className="min-h-[400px] animate-pulse rounded-lg bg-zinc-100" />,
  },
);

interface EditorPageProps {
  id?: string;
  initialTitle?: string;
  initialSlug?: string;
  initialStatus?: "draft" | "published";
  initialBlocks?: EditorBlock[];
  initialHtml?: string;
  initialPageBgColor?: string;
  initialInjectCode?: InjectCode;
  disabledBlocks?: string[];
}

export default function EditorPage({
  id,
  initialTitle = "",
  initialSlug = "",
  initialStatus = "draft",
  initialBlocks = [],
  initialHtml = "",
  initialPageBgColor = "#ffffff",
  initialInjectCode,
  disabledBlocks = [],
}: EditorPageProps) {
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

  const [injectFields, setInjectFields] = useState<InjectCode>({
    tracking:   initialInjectCode?.tracking   ?? "",
    head:       initialInjectCode?.head       ?? "",
    beforeBody: initialInjectCode?.beforeBody ?? "",
    afterBody:  initialInjectCode?.afterBody  ?? "",
  });
  const router = useRouter();

  const { title, slug, setSlug, status, setStatus, pageBgColor, setPageBgColor, handleTitleChange } =
    usePageMeta({ id, initialTitle, initialSlug, initialStatus, initialPageBgColor });

  // ── Dirty / unsaved-changes tracking ───────────────────────────────────────
  const { handleSaveSuccess } = useDirtyTracking(codeText, clearDraft);

    const { panelTab, setPanelTab, panelOpen, setPanelOpen } = useEditorPanel(mainMode);
  const { tablet: tabletBp, mobile: mobileBp } = getEditorBreakpoints();

  const { canvasRef, viewport, setViewport } = useCanvasWidth(tabletBp, mobileBp, panelOpen);

  const editorViewportContextValue = useMemo(
    () => ({ viewport }),
    [viewport],
  );

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

  const handleSelectBlock = useCallback(
    (blockId: string | null, data: Record<string, unknown>, type: string) => {
      if (!blockId) { setSelectedBlock(null); return; }
      setSelectedBlock({ id: blockId, name: type, data });
      setPanelTab("block");
    },
    [setSelectedBlock, setPanelTab],
  );

  const [activeColIdx, setActiveColIdx] = useState<number | null>(null);
  const handleColSelect = useCallback((_blockId: string, colIdx: number | null) => {
    setActiveColIdx(colIdx);
  }, []);
  const { saving, saved, saveError, handleSave } = useSavePage({
    id,
    title,
    slug,
    codeText,
    liveBlocks,
    mainMode,
    pageBgColor,
    injectCode: injectFields,
    onStatusChange: setStatus,
    onSaveSuccess: handleSaveSuccess,
  });

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
      <EditorToolbar
        mainMode={mainMode}
        setMainMode={setMainMode}
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
          className={`shrink-0 overflow-hidden border-r border-zinc-200 bg-white transition-[width] duration-200 ease-in-out ${
            blocksPanelOpen && mainMode === "visual" ? "w-64" : "w-0"
          }`}
        >
          <div className="w-64">
            <BlocksPanel onAdd={(type) => { handleAddBlockFromPanel(type); setBlocksPanelOpen(false); }} />
          </div>
        </aside>
        {/* Editor canvas */}
        <div ref={canvasRef} className="flex-1 overflow-y-auto bg-zinc-100">
          <div className="">
            {/* When the panel is open, constrain canvas width to the selected
                viewport breakpoint so responsive CSS fires at the right size.
                When the panel is closed the ResizeObserver handles this automatically. */}
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
                minHeight: "calc(100vh - 48px)",
                maxWidth: "var(--content-max-width, 48rem)",
                padding: "2.5rem var(--content-padding-x, 1.5rem)",
                background: pageBgColor || "#fff",
                containerType: "inline-size",
              }}
            >
              {mainMode === "inject" ? (
                <InjectCodePanel
                  fields={injectFields}
                  onChange={setInjectFields}
                  onClose={() => setMainMode("visual")}
                />
              ) : mainMode === "code" ? (
                <>
                  <CodeEditor value={codeText} onValueChange={setCodeText} minHeight="60vh" />
                  <div className="overflow-hidden rounded-b-lg border border-t-0 border-zinc-700 bg-zinc-800 px-4 py-2">
                    <p className="text-[10px] text-zinc-500">
                      Shortcodes or raw HTML. Columns:{" "}
                      <span className="font-mono text-zinc-300">[columns][column width=&quot;50%&quot;]&hellip;[/column][/columns]</span>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Page title"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="mb-10 w-full bg-transparent text-4xl font-bold text-zinc-900 placeholder:text-zinc-300 focus:outline-none"
                  />
                  <textarea
                    value={codeText}
                    onChange={(e) => setCodeText(e.target.value)}
                    spellCheck={false}
                    wrap="off"
                    className="sr-only"
                  />
                  <ViewportContext.Provider value={{ viewport, isSectionEnabled, isFieldOverridden, toggleSection, inheritedData: {} }}>
                    <ResponsiveStyleInjector
                      blocks={liveBlocks}
                      tabletBp={tabletBp}
                      mobileBp={mobileBp}
                      forContainer
                      forcedViewport={panelOpen && viewport !== "desktop" ? viewport : undefined}
                    />
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
          className={`shrink-0 overflow-hidden border-l border-zinc-200 bg-white transition-[width] duration-200 ease-in-out ${panelOpen ? "w-72" : "w-0"}`}
        >
          <div className="sticky top-0 h-[calc(100vh-3rem)] w-72 overflow-y-auto">
            {mainMode === "visual" && (
              <ViewportSwitcher viewport={viewport} setViewport={setViewport} />
            )}
            <PanelTabs mainMode={mainMode} panelTab={panelTab} setPanelTab={setPanelTab} />
            <div className="space-y-6 px-4 py-5 text-zinc-900" role="tabpanel">
              {panelTab === "page" && (
                <PagePanel
                  status={status}
                  setStatus={setStatus}
                  slug={slug}
                  setSlug={setSlug}
                  pageBgColor={pageBgColor}
                  setPageBgColor={setPageBgColor}
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

// ── Local subcomponents ───────────────────────────────────────────────────────

type Viewport = "desktop" | "tablet" | "mobile";

const VIEWPORT_BUTTONS: { vp: Viewport; label: string; icon: React.ReactNode }[] = [
  {
    vp: "desktop",
    label: "Desktop",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
  },
  {
    vp: "tablet",
    label: "Tablet",
    icon: (
      <svg width="13" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    vp: "mobile",
    label: "Mobile",
    icon: (
      <svg width="10" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
];

function ViewportSwitcher({
  viewport,
  setViewport,
}: {
  viewport: Viewport;
  setViewport: (vp: Viewport) => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2">
      <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">Preview</span>
      <div className="flex items-center gap-0.5" role="group" aria-label="Preview viewport">
        {VIEWPORT_BUTTONS.map(({ vp, label, icon }) => (
          <button
            key={vp}
            onClick={() => setViewport(vp)}
            aria-label={`${label} viewport`}
            aria-pressed={viewport === vp}
            className={`flex h-7 w-7 items-center justify-center rounded transition ${
              viewport === vp ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}

function PanelTabs({
  mainMode,
  panelTab,
  setPanelTab,
}: {
  mainMode: "visual" | "code" | "inject";
  panelTab: PanelTab;
  setPanelTab: (tab: PanelTab) => void;
}) {
  const tabs = mainMode === "visual" ? (["page", "block"] as PanelTab[]) : (["page"] as PanelTab[]);
  return (
    <div className="flex border-b border-zinc-200" role="tablist" aria-label="Panel sections">
      {tabs.map((tab) => (
        <button
          key={tab}
          role="tab"
          aria-selected={panelTab === tab}
          onClick={() => setPanelTab(tab)}
          className={`flex-1 py-2.5 text-xs font-semibold capitalize tracking-wide transition ${panelTab === tab ? "border-b-2 border-zinc-900 text-zinc-900" : "text-zinc-400 hover:text-zinc-700"}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
