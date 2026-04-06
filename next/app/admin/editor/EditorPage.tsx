
"use client";

import { useRef, useState, useCallback, useEffect } from "react";

import { useRouter } from "next/navigation";
import type { EditorBlock } from "@/lib/pages-db";
import { blockMap } from "@/blocks/index";
import { PanelSection, ViewportContext, type Viewport } from "@/components/block-shared";
import { blocksToShortcodes, shortcodesToBlocks } from "@/lib/shortcodes";
import { COLOR_PALETTE } from "@/lib/color-palette";
import dynamic from "next/dynamic";
const CodeEditor = dynamic(() => import("@/components/CodeEditor"), { ssr: false });
import type { VisualEditorProps } from "@/components/VisualEditor";

// Disable SSR for VisualEditor — the admin editor has no SEO requirement and
// its complex interactive render (overlay divs, AddZone, contentEditable) can
// produce hydration mismatches when malformed HTML is present in block content.
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
  disabledBlocks?: string[];
}

type PanelTab = "page" | "block";

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
}: EditorPageProps) {
  // Modal state for code injection
  // Modes: 'visual', 'code', 'inject'
  const [mainMode, setMainModeState] = useState<'visual' | 'code' | 'inject'>('visual');
  // Wrap setMainMode to clear selectedBlock when leaving visual mode
  const setMainMode = (mode: 'visual' | 'code' | 'inject') => {
    setMainModeState(mode);
    if (mode !== 'visual') {
      setSelectedBlock(null);
    }
  };
  const [injectFields, setInjectFields] = useState({
    tracking: '',
    head: '',
    beforeBody: '',
    afterBody: '',
  });
  // Selected block state (restored)
  const [selectedBlock, setSelectedBlock] = useState<SelectedBlock | null>(null);
  // TODO: Load/save injectFields from persistent storage or API if needed
  // ...existing code...
  const router = useRouter();
  const initialParsedBlocks = initialHtml ? shortcodesToBlocks(initialHtml) : initialBlocks;
  // Parse blocks from codeText for live preview (unmerged, for CSS)
  const [codeText, setCodeText] = useState(initialHtml || blocksToShortcodes(initialParsedBlocks));
  const liveBlocks = shortcodesToBlocks(codeText);

  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [status, setStatus] = useState<"draft" | "published">(initialStatus);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [panelTab, setPanelTab] = useState<PanelTab>("page");
  // Always select 'page' tab in code/inject mode
  useEffect(() => {
    if (mainMode !== 'visual' && panelTab !== 'page') {
      setPanelTab('page');
    }
  }, [mainMode, panelTab]);
  const [panelOpen, setPanelOpen] = useState(true);
  const [viewport, setViewport] = useState<Viewport>("desktop");

  // Notify ColumnsLayout (and any other layout) when the editor viewport changes
  function setViewportAndNotify(vp: Viewport) {
    setViewport(vp);
    if (typeof window !== "undefined") {
      window.__EDITOR_VIEWPORT__ = vp;
      window.dispatchEvent(new CustomEvent("editor-viewport-change", { detail: vp }));
    }
  }
  const [pageBgColor, setPageBgColor] = useState("#ffffff");

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!id || slug === autoSlug(title)) setSlug(autoSlug(value));
  }

  const updateBlockHandlerRef = useRef<((id: string, newData: Record<string, unknown>) => void) | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Broadcast canvas width so breakpoint hooks can compare against the actual
  // editor canvas width rather than the full window width (which is wider when
  // the right panel is open).
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      window.__EDITOR_CANVAS_WIDTH__ = w;
      window.dispatchEvent(new CustomEvent("editor-canvas-resize", { detail: w }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

  function isSectionEnabled(fields: string[]): boolean {
    if (viewport === "desktop" || !selectedBlock) return true;
    const responsive = (selectedBlock.data.responsive as Record<string, Record<string, unknown>>) ?? {};
    const overrides = responsive[viewport] ?? {};
    return fields.some((f) => f in overrides);
  }

  function toggleSection(_title: string, fields: string[]) {
    if (!selectedBlock) return;
    const current = selectedBlock.data;
    const responsive = { ...((current.responsive as Record<string, Record<string, unknown>>) ?? {}) };
    const overrides = { ...(responsive[viewport] ?? {}) };
    const currently = fields.some((f) => f in overrides);
    for (const f of fields) {
      if (currently) {
        delete overrides[f];
      } else {
        // Always allow enabling, even if current[f] is undefined
        overrides[f] = current[f] !== undefined ? current[f] : null;
      }
    }
    responsive[viewport] = overrides;
    const newData = { ...current, responsive };
    updateBlockHandlerRef.current?.(selectedBlock.id, newData);
    setSelectedBlock((prev) => prev && { ...prev, data: newData });
  }

  function controlsDisplayData(data: Record<string, unknown>): Record<string, unknown> {
    if (viewport === "desktop") return data;
    const { responsive: _r, ...desktopData } = data as Record<string, unknown> & { responsive?: unknown };
    const responsive = (_r as Record<string, Record<string, unknown>>) ?? {};
    const overrides = responsive[viewport] ?? {};
    return { ...desktopData, ...overrides };
  }

  function handleControlsChange(newData: Record<string, unknown>) {
    if (!selectedBlock) return;
    let finalData: Record<string, unknown>;
    if (viewport === "desktop") {
      finalData = { ...selectedBlock.data, ...newData };
    } else {
      const current = selectedBlock.data;
      const responsive = { ...((current.responsive as Record<string, Record<string, unknown>>) ?? {}) };
      const overrides = { ...(responsive[viewport] ?? {}) };
      for (const f of Object.keys(newData)) {
        overrides[f] = newData[f];
      }
      responsive[viewport] = overrides;
      finalData = { ...current, responsive };
    }
    updateBlockHandlerRef.current?.(selectedBlock.id, finalData);
    setSelectedBlock((prev) => prev && { ...prev, data: finalData });
  }


  function autoSlug(raw: string) {
    return raw
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  async function handleSave(targetStatus: "draft" | "published") {
    setSaving(true); setSaved(false);
    try {
      const html = codeText;
      const blocks = shortcodesToBlocks(codeText);
      const payload = { title, slug, status: targetStatus, blocks, html, pageBgColor };
      if (id) {
        await fetch(`/api/pages/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setStatus(targetStatus);
      } else {
        const res = await fetch("/api/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const created = await res.json();
        router.replace(`/admin/editor/${created.id}`);
      }
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (err) { console.error("Save failed:", err); }
    finally { setSaving(false); }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top toolbar */}
      <div className="sticky top-0 z-20 flex h-12 items-center border-b border-zinc-200 bg-white px-4">
        <button onClick={() => router.push("/admin")} className="text-sm text-zinc-500 hover:text-zinc-800 mr-2">
          &larr; Pages
        </button>
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
            onClick={() => setMainMode(mainMode === 'inject' ? 'visual' : 'inject')}
            className={`rounded-md border px-2.5 py-1.5 text-sm transition border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 flex items-center justify-center ${mainMode === 'inject' ? 'border-zinc-900 bg-zinc-900 text-white' : ''}`}
            title="Show code injection fields"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 9h8M8 15h8"/></svg>
          </button>
          <button
            onClick={() => setMainMode(mainMode === 'code' ? 'visual' : 'code')}
            title={mainMode === 'code' ? "Back to visual editor" : "Code view"}
            className={`rounded-md border px-2.5 py-1.5 text-sm font-mono transition ${mainMode === 'code' ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"}`}
          >
            {mainMode === 'code' ? (
              // Visual mode icon (list-view)
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="currentColor">
                <path d="M3 6h11v1.5H3V6Zm3.5 5.5h11V13h-11v-1.5ZM21 17H10v1.5h11V17Z" />
              </svg>
            ) : (
              // Code icon
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="currentColor">
                <path d="M20.8 10.7l-4.3-4.3-1.1 1.1 4.3 4.3c.1.1.1.3 0 .4l-4.3 4.3 1.1 1.1 4.3-4.3c.7-.8.7-1.9 0-2.6zM4.2 11.8l4.3-4.3-1-1-4.3 4.3c-.7.7-.7 1.8 0 2.5l4.3 4.3 1.1-1.1-4.3-4.3c-.2-.1-.2-.3-.1-.4z"/>
              </svg>
            )}
          </button>
          <button onClick={() => setPanelOpen((o) => !o)} title="Toggle panel"
            className={`ml-1 rounded-md border px-2.5 py-1.5 text-sm transition ${panelOpen ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"}`}>
            &#8863;
          </button>
        </div>
      </div>
      {/* Floating Save/Update buttons */}
      <div className="fixed bottom-6 right-6 z-30 flex gap-3">
        <button onClick={() => handleSave('draft')} disabled={saving}
          className="rounded-md border border-zinc-200 bg-white px-5 py-2 text-base font-medium text-zinc-700 shadow-lg transition hover:bg-zinc-50 disabled:opacity-40">
          {saving ? 'Saving…' : 'Save draft'}
        </button>
        <button onClick={() => handleSave('published')} disabled={saving}
          className="rounded-md bg-zinc-900 px-5 py-2 text-base font-medium text-white shadow-lg transition hover:bg-zinc-700 disabled:opacity-40">
          {status === 'published' ? 'Update' : 'Publish'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor canvas */}
        <div ref={canvasRef} className="flex-1 overflow-y-auto bg-zinc-100">
                    {/* Inject Code Fields (main content area) */}
          <div className="py-10">
            {/* Single page card: same maxWidth/padding as live site, white bg */}
            <div
              className="text-zinc-900 bg-white rounded-lg shadow-sm mx-auto"
              style={{
                maxWidth: "var(--content-max-width, 48rem)",
                padding: "2.5rem var(--content-padding-x, 1.5rem)",
                background: pageBgColor || "#fff"
              }}
            >
              {mainMode === 'inject' ? (
                <div className="max-w-2xl mx-auto mt-8 mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base font-semibold text-zinc-700">Inject Code</h2>
                    <button onClick={() => setMainMode('visual')} className="text-xs text-zinc-500 hover:text-zinc-900 px-2 py-1 rounded border border-zinc-200">Back</button>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Tracking Code</label>
                      <textarea
                        className="w-full border rounded p-2 text-xs font-mono min-h-[60px]"
                        placeholder="Paste your tracking code here. This will be added into the header template of your theme. Place code inside <script> tags."
                        value={injectFields.tracking}
                        onChange={e => setInjectFields(f => ({ ...f, tracking: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Space Before &lt;head&gt;</label>
                      <textarea
                        className="w-full border rounded p-2 text-xs font-mono min-h-[60px]"
                        placeholder="Only accepts JavaScript code wrapped with <script> tags and HTML markup that is valid inside the <head> tag."
                        value={injectFields.head}
                        onChange={e => setInjectFields(f => ({ ...f, head: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Space After &lt;body&gt;</label>
                      <textarea
                        className="w-full border rounded p-2 text-xs font-mono min-h-[60px]"
                        placeholder="Only accepts JavaScript code, wrapped with <script> tags and valid HTML markup inside the <body> tag."
                        value={injectFields.afterBody}
                        onChange={e => setInjectFields(f => ({ ...f, afterBody: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Space Before &lt;/body&gt;</label>
                      <textarea
                        className="w-full border rounded p-2 text-xs font-mono min-h-[60px]"
                        placeholder="Only accepts JavaScript code and valid HTML markup inside the <body> tag."
                        value={injectFields.beforeBody}
                        onChange={e => setInjectFields(f => ({ ...f, beforeBody: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              ) : mainMode === 'code' ? (
                <>
                  <CodeEditor
                    value={codeText}
                    onValueChange={setCodeText}
                    minHeight="60vh"
                  />
                  <div className="overflow-hidden rounded-b-lg border border-t-0 border-zinc-700 bg-zinc-800 px-4 py-2">
                    <p className="text-[10px] text-zinc-500">
                      Shortcodes or raw HTML. Columns: {" "}
                      <span className="font-mono text-zinc-300">[columns][column width=&quot;50%&quot;]&hellip;[/column][/columns]</span>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <input type="text" placeholder="Page title" value={title} onChange={(e) => handleTitleChange(e.target.value)}
                    className="mb-10 w-full bg-transparent text-4xl font-bold text-zinc-900 placeholder:text-zinc-300 focus:outline-none" />
                  <textarea
                    value={codeText}
                    onChange={(e) => setCodeText(e.target.value)}
                    spellCheck={false}
                    wrap="off"
                    className="sr-only"
                  />
                  <>
                    <ViewportContext.Provider value={{ viewport, isSectionEnabled, toggleSection }}>
                      <VisualEditor
                        key={editorKey}
                        initialBlocks={liveBlocks}
                        onChange={(newCode) => setCodeText(newCode)}
                        onSelectBlock={handleSelectBlock}
                        selectedBlockId={selectedBlock?.id ?? null}
                        registerUpdateHandler={registerUpdateHandler}
                        onColSelect={handleColSelect}
                      />
                    </ViewportContext.Provider>
                  </>
                </>
              )}
            </div>{/* end page card */}
          </div>
        </div>
        {/* Right panel is always visible */}
        {panelOpen && (
          <aside className="sticky top-0 h-[calc(100vh-3rem)] w-72 shrink-0 overflow-y-auto border-l border-zinc-200 bg-white">
            <div className="flex border-b border-zinc-200">
              {(mainMode === 'visual' ? ["page", "block"] : ["page"]).map((tab) => (
                <button key={tab} onClick={() => setPanelTab(tab as PanelTab)}
                  className={`flex-1 py-2.5 text-xs font-semibold capitalize tracking-wide transition ${panelTab === tab ? "border-b-2 border-zinc-900 text-zinc-900" : "text-zinc-400 hover:text-zinc-700"}`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="space-y-6 px-4 py-5">
              {panelTab === "page" && (
                <>
                  <PanelSection title="Status">
                    <div className="flex gap-2">
                      {(["draft", "published"] as const).map((s) => (
                        <button key={s} onClick={() => setStatus(s)}
                          className={`flex-1 rounded-md border py-1.5 text-xs font-medium capitalize transition ${status === s ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-500 hover:border-zinc-400"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </PanelSection>
                  <PanelSection title="URL Slug">
                    <div className="flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1.5 text-sm focus-within:border-zinc-400">
                      <span className="text-zinc-400">/</span>
                      <input type="text" value={slug} onChange={(e) => setSlug(autoSlug(e.target.value))} placeholder="url-slug"
                        className="flex-1 bg-transparent text-xs text-zinc-800 focus:outline-none" />
                    </div>
                  </PanelSection>
                  <PanelSection title="Background Color">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {COLOR_PALETTE.map(({ label, value }) => (
                          <button
                            key={label}
                            title={label}
                            onClick={() => setPageBgColor(value || "#ffffff")}
                            className={`h-6 w-6 rounded-full transition ${pageBgColor === value || (!value && pageBgColor === "#ffffff") ? "border-2 border-zinc-900 scale-110" : "hover:opacity-80"}`}
                            style={{
                              background: value === "" ? "linear-gradient(135deg,#e5e7eb 50%,#fff 50%)" : value,
                              outline: value === "#ffffff" ? "1px solid #e5e7eb" : undefined,
                            }}
                          />
                        ))}
                        {/* Custom color */}
                        <label
                          title="Custom color"
                          className={`relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full overflow-hidden transition ${!COLOR_PALETTE.some((c) => c.value === pageBgColor) ? "border-2 border-zinc-900 scale-110" : "hover:opacity-80"}`}
                          style={{
                            background: !COLOR_PALETTE.some((c) => c.value === pageBgColor)
                              ? pageBgColor
                              : "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)",
                          }}
                        >
                          <input
                            type="color"
                            value={pageBgColor || "#ffffff"}
                            onChange={e => setPageBgColor(e.target.value)}
                            className="absolute inset-0 cursor-pointer opacity-0 w-full h-full"
                          />
                        </label>
                      </div>
                    </div>
                  </PanelSection>
                </>
              )}
              {panelTab === "block" && (
                <>
                  {!selectedBlock ? (
                    <p className="text-xs text-zinc-400">Click a block to see its settings.</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[11px] text-zinc-600">
                          {selectedBlock.name}
                        </span>
                        {blockMap[selectedBlock.name]?.supportsBreakpoints && (
                          <div className="flex items-center gap-0.5">
                            {([
                              { vp: "desktop" as Viewport, title: "Desktop", icon: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>) },
                              { vp: "tablet" as Viewport, title: "Tablet", icon: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/></svg>) },
                              { vp: "mobile" as Viewport, title: "Mobile", icon: (<svg width="12" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/></svg>) },
                            ]).map(({ vp, title, icon }) => (
                              <button key={vp} title={title} onClick={() => setViewportAndNotify(vp)}
                                className={`flex h-6 w-6 items-center justify-center rounded transition ${viewport === vp ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-700"}`}>
                                {icon}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {(() => {
                        const supportsBreakpoints = !!blockMap[selectedBlock.name]?.supportsBreakpoints;
                        const activeViewport: Viewport = supportsBreakpoints ? viewport : "desktop";
                        const Controls = blockMap[selectedBlock.name]?.PanelControls;
                        return Controls ? (
                          <ViewportContext.Provider value={{ viewport: activeViewport, isSectionEnabled, toggleSection }}>
                            <p className={`-mt-1 text-[10px] transition-opacity ${supportsBreakpoints && activeViewport !== "desktop" ? "text-zinc-400 opacity-100" : "select-none opacity-0"}`}>
                              Toggle switches to override at this breakpoint.
                            </p>
                            <Controls
                              data={{
                                ...controlsDisplayData(selectedBlock.data),
                                ...(selectedBlock.name === "columns" && activeColIdx !== null
                                  ? { __selectedColIdx: activeColIdx }
                                  : {}),
                              }}
                              onChange={handleControlsChange}
                            />
                          </ViewportContext.Provider>
                        ) : (
                          <p className="text-xs text-zinc-400">No extra settings for this block type.</p>
                        );
                      })()}
                    </>
                  )}
                </>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
