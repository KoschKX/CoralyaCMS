"use client";

/**
 * VisualEditor
 * ────────────
 * A custom React visual block editor backed by a Zustand store.
 *
 * The source of truth is a hidden <textarea> whose content is a shortcode/HTML
 * string; the visual mode renders interactive, directly-editable blocks
 * derived from parsing that string.
 *
 * Data flow:
 *   initialBlocks ──init──► store.present ──edit──► serialize ──► onChange callback
 *
 * Undo / Redo:
 *   Cmd+Z (Mac) / Ctrl+Z (Win/Linux) — undo
 *   Cmd+Shift+Z / Ctrl+Shift+Z or Ctrl+Y — redo
 */

import {
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import type { EditorBlock } from "@/lib/pages-db";
import { EditorStoreProvider, useEditorStore, useEditorActions } from "@/lib/editor/EditorStoreContext";
import { AddZone } from "@/components/editor/BlockPickerAndAddZone";
import { BlockEditorContext } from "@/components/editor/BlockEditorContext";
import BlockList from "@/components/editor/BlockList";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export interface VisualEditorProps {
  initialBlocks: EditorBlock[];
  onChange: (code: string, blocks: EditorBlock[]) => void;
  onSelectBlock: (id: string | null, data: Record<string, unknown>, type: string) => void;
  selectedBlockId: string | null;
  registerUpdateHandler: (fn: ((id: string, newData: Record<string, unknown>) => void) | null) => void;
  /** Called when a column within a columns block is focused or cleared. */
  onColSelect?: (blockId: string, colIdx: number | null) => void;
  /** Block types to hide from the picker and exclude from rendering. */
  disabledBlocks?: string[];
}

/** Inner component — has access to the store provided by EditorStoreProvider. */
function VisualEditorInner({
  initialBlocks,
  onChange,
  onSelectBlock,
  selectedBlockId,
  registerUpdateHandler,
  onColSelect,
  disabledBlocks = [],
}: VisualEditorProps) {
  // Stable refs for callbacks — updated every render, but never cause re-init
  const onChangeRef = useRef(onChange);
  const onSelectBlockRef = useRef(onSelectBlock);
  const onColSelectRef = useRef(onColSelect);
  onChangeRef.current = onChange;
  onSelectBlockRef.current = onSelectBlock;
  onColSelectRef.current = onColSelect;

  // Get stable action references from the store (actions don't change identity)
  const actions = useEditorActions();

  // anyPickerOpen is local React state — keeping it out of the global Zustand
  // store prevents all store subscribers from re-rendering when a picker opens.
  const [anyPickerOpen, setAnyPickerOpen] = useState(false);

  // One-time init: load initial blocks + wire up external callbacks
  const isInitialized = useRef(false);
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    actions.init(
      initialBlocks,
      (code, blocks) => onChangeRef.current(code, blocks),
      (id, data, type) => onSelectBlockRef.current(id, data, type),
      (blockId, colIdx) => onColSelectRef.current?.(blockId, colIdx),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Register the panel update handler (allows right-panel controls to push block updates)
  useEffect(() => {
    registerUpdateHandler((id, newData) => actions.panelUpdateBlock(id, newData));
    return () => registerUpdateHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts for undo / redo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        actions.undo();
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        actions.redo();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to store slices — each selector is narrow to minimise re-renders
  const blocks = useEditorStore((s) => s.present);
  const activeColInfo = useEditorStore((s) => s.activeColInfo);

  // Stable ops object — Zustand actions have stable identity across renders
  const topOps = useMemo(() => ({
    update: actions.updateBlock,
    remove: actions.deleteBlock,
    move: actions.moveBlock,
    addAfter: actions.addBlockAfter,
  }), [actions]);

  const contextValue = useMemo(() => ({
    selectedBlockId,
    activeColInfo,
    setActiveColInfo: actions.setActiveColInfo,
    setAnyPickerOpen,
    onSelectBlock,
    onColSelect,
    makeNewBlock: actions.makeNewBlock,
    disabledBlocks,
  }), [selectedBlockId, activeColInfo, setAnyPickerOpen, onSelectBlock, onColSelect, actions, disabledBlocks]);

  return (
    <BlockEditorContext.Provider value={contextValue}>
      <ErrorBoundary>
        <div className="relative text-zinc-800" style={{ display: "flex", flexDirection: "column" }}>
          {anyPickerOpen && <div className="absolute inset-0 cursor-default" style={{ zIndex: 15 }} />}
          <AddZone onAdd={(type) => actions.addBlockAfter("TOP", type)} onOpenChange={setAnyPickerOpen} />

          {blocks.length === 0 && (
            <div className="my-4 flex min-h-[160px] items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 text-sm text-zinc-400">
              Click + to add your first block
            </div>
          )}

          <BlockList list={blocks} ops={topOps} />

          <AddZone
            onAdd={(type) => actions.addBlockAfter(blocks[blocks.length - 1]?.id ?? "TOP", type)}
            variant="footer"
            onOpenChange={setAnyPickerOpen}
          />
        </div>
      </ErrorBoundary>
    </BlockEditorContext.Provider>
  );
}

/** Public export — wraps the inner editor with its own Zustand store instance. */
export default function VisualEditor(props: VisualEditorProps) {
  return (
    <EditorStoreProvider>
      <VisualEditorInner {...props} />
    </EditorStoreProvider>
  );
}

