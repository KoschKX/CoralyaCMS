
"use client";

import { useRef, useState, useCallback, useMemo } from "react";

import { useRouter } from "next/navigation";
import type { EditorBlock } from "@/lib/pages-db";
import { ViewportContext, type Viewport } from "@/components/block-shared";
import { blocksToShortcodes, shortcodesToBlocks } from "@/lib/shortcodes";
import { autoSlug } from "@/lib/utils/slug";
import { EditorViewportContext } from "@/components/editor/EditorContext";
import EditorToolbar from "@/app/admin/editor/EditorToolbar";
import PagePanel from "@/app/admin/editor/PagePanel";
import BlockPanel from "@/app/admin/editor/BlockPanel";
import InjectCodePanel from "@/app/admin/editor/InjectCodePanel";
import { useSavePage } from "@/app/admin/editor/hooks/useSavePage";
import { useResponsiveBlock } from "@/app/admin/editor/hooks/useResponsiveBlock";
import { useCanvasWidth } from "@/app/admin/editor/hooks/useCanvasWidth";
import { useEditorPanel, type PanelTab } from "@/app/admin/editor/hooks/useEditorPanel";
import dynamic from "next/dynamic";
const CodeEditor = dynamic(() => import("@/components/CodeEditor"), { ssr: false });
import type { VisualEditorProps } from "@/components/VisualEditor";

const VisualEditor = dynamic<VisualEditorProps>(
  () => import("@/components/VisualEditor"),
  { ssr: false },
);

interface EditorPageProps {
  id?: string;
  initialTitle?: string;
  initialSlug?: string;
  initialStatus?: "draft" | "published";
  initialBlocks?: EditorBlock[];
  initialHtml?: string;
  initialPageBgColor?: string;
  disabledBlocks?: string[];
}

interface SelectedBlock {
  id: string;
  name: string;
  data: Record<string, unknown>;
}

export default function EditorPage({
  id,
  initialTitle = "",
  initialSlug = "",
  initialStatus = "draft",
  initialBlocks = [],
  initialHtml = "",
  initialPageBgColor = "#ffffff",
}: EditorPageProps) {
  const [mainMode, setMainModeState] = useState<"visual" | "code" | "inject">("visual");
  const setMainMode = (mode: "visual" | "code" | "inject") => {
    setMainModeState(mode);
    if (mode !== "visual") setSelectedBlock(null);
  };
  const [injectFields, setInjectFields] = useState({
    tracking: "",
    head: "",
    beforeBody: "",
    afterBody: "",
  });
  const [selectedBlock, setSelectedBlock] = useState<SelectedBlock | null>(null);
  const router = useRouter();
  const initialParsedBlocks = initialHtml ? shortcodesToBlocks(initialHtml) : initialBlocks;
  const [codeText, setCodeText] = useState(initialHtml || blocksToShortcodes(initialParsedBlocks));
  const liveBlocks = useMemo(() => shortcodesToBlocks(codeText), [codeText]);

  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [status, setStatus] = useState<"draft" | "published">(initialStatus);
  const [pageBgColor, setPageBgColor] = useState(initialPageBgColor);
  const { saving, saved, handleSave } = useSavePage({
    id,
    title,
    slug,
    codeText,
    pageBgColor,
    onStatusChange: setStatus,
  });
  const { panelTab, setPanelTab, panelOpen, setPanelOpen } = useEditorPanel(mainMode);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const { canvasRef, canvasWidth } = useCanvasWidth();

  const editorViewportContextValue = useMemo(
    () => ({ viewport, canvasWidth }),
    [viewport, canvasWidth],
  );

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!id || slug === autoSlug(title)) setSlug(autoSlug(value));
  }

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
    [setPanelTab],
  );

  const [activeColIdx, setActiveColIdx] = useState<number | null>(null);
  const handleColSelect = useCallback((_blockId: string, colIdx: number | null) => {
    setActiveColIdx(colIdx);
  }, []);

  const { isSectionEnabled, toggleSection, controlsDisplayData, handleControlsChange } =
    useResponsiveBlock({
      selectedBlock,
      viewport,
      updateBlock: (blockId, data) => { updateBlockHandlerRef.current?.(blockId, data); },
      setSelectedBlock,
    });

  return (
    <EditorViewportContext.Provider value={editorViewportContextValue}>
    <div className="flex h-full flex-col">
      <EditorToolbar
        mainMode={mainMode}
        setMainMode={setMainMode}
        panelOpen={panelOpen}
        setPanelOpen={setPanelOpen}
        saving={saving}
        saved={saved}
        slug={slug}
        status={status}
        onSave={handleSave}
        router={router}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Editor canvas */}
        <div ref={canvasRef} className="flex-1 overflow-y-auto bg-zinc-100">
          <div className="py-10">
            <div
              className="text-zinc-900 bg-white rounded-lg shadow-sm mx-auto"
              style={{
                maxWidth: "var(--content-max-width, 48rem)",
                padding: "2.5rem var(--content-padding-x, 1.5rem)",
                background: pageBgColor || "#fff",
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
                  <ViewportContext.Provider value={{ viewport, isSectionEnabled, toggleSection }}>
                    <VisualEditor
                      initialBlocks={liveBlocks}
                      onChange={(newCode) => setCodeText(newCode)}
                      onSelectBlock={handleSelectBlock}
                      selectedBlockId={selectedBlock?.id ?? null}
                      registerUpdateHandler={registerUpdateHandler}
                      onColSelect={handleColSelect}
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
              {(mainMode === "visual" ? ["page", "block"] : ["page"]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPanelTab(tab as PanelTab)}
                  className={`flex-1 py-2.5 text-xs font-semibold capitalize tracking-wide transition ${panelTab === tab ? "border-b-2 border-zinc-900 text-zinc-900" : "text-zinc-400 hover:text-zinc-700"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="space-y-6 px-4 py-5">
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
                  onViewportChange={setViewport}
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
    </div>
    </EditorViewportContext.Provider>
  );
}

