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
import { useEditorBlocks } from "@/lib/editor/selectors";
import { AddZone } from "@/components/editor/BlockPickerAndAddZone";
import { BlockEditorContext } from "@/components/editor/BlockEditorContext";
import BlockList from "@/components/editor/BlockList";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useDragDrop } from "@/components/editor/useDragDrop";

export interface VisualEditorProps {
  initialBlocks: EditorBlock[];
  onChange: (code: string, blocks: EditorBlock[]) => void;
  onSelectBlock: (id: string | null, data: Record<string, unknown>, type: string) => void;
  selectedBlockId: string | null;
  registerUpdateHandler: (fn: ((id: string, newData: Record<string, unknown>) => void) | null) => void;
  /**
   * Registers an external handler that inserts a block after the currently
   * selected block (or at the end when nothing is selected).
   * Used by the left-panel block inserter drawer.
   */
  registerAddBlockHandler?: (fn: ((type: string) => void) | null) => void;
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
  selectedBlockId: _selectedBlockId,
  registerUpdateHandler,
  registerAddBlockHandler,
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

  // Track selectedBlockId in a ref so keydown handler can read it without
  // re-subscribing to the store on every render.
  const selectedBlockIdRef = useRef<string | null>(null);
  const storeSelectedBlockId = useEditorStore((s) => s.selectedBlockId);
  selectedBlockIdRef.current = storeSelectedBlockId;

  // anyPickerOpen is local React state — keeping it out of the global Zustand
  // store prevents all store subscribers from re-rendering when a picker opens.
  const [anyPickerOpen, setAnyPickerOpen] = useState(false);

  // One-time init: load initial blocks + wire up external callbacks.
  // Empty deps array is intentional — this must run exactly once on mount.
  const isInitialized = useRef(false);
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    actions.init(
      initialBlocks,
      (code, blocks) => onChangeRef.current(code, [...blocks]),
      (id, data, type) => onSelectBlockRef.current(id, data, type),
      (blockId, colIdx) => onColSelectRef.current?.(blockId, colIdx),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-time init
  }, []);

  // Register the panel update handler so right-panel controls can push block updates.
  // Empty deps array is intentional — actions have stable identity across renders.
  useEffect(() => {
    registerUpdateHandler((id, newData) => actions.panelUpdateBlock(id, newData));
    return () => registerUpdateHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-time registration
  }, []);

  // Register the external add-block handler (used by the left-panel block inserter).
  // addBlockAfterSelected reads fresh store state internally, so no ref needed.
  useEffect(() => {
    if (!registerAddBlockHandler) return;
    registerAddBlockHandler((type) => actions.addBlockAfterSelected(type));
    return () => registerAddBlockHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-time registration
  }, []);

  // Keyboard shortcuts for undo / redo + block navigation.
  // Empty deps array is intentional — actions have stable identity and
  // selectedBlockIdRef lets the handler read current selection without re-subscribing.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          actions.undo();
        } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
          e.preventDefault();
          actions.redo();
        }
        return;
      }
      // Arrow-key block navigation — only when a block is selected and no
      // modifier is held (so browser shortcuts / text input are unaffected).
      if (!e.shiftKey && !e.altKey) {
        if (selectedBlockIdRef.current) {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            actions.navigateBlock(-1);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            actions.navigateBlock(1);
          } else if (e.key === "Escape") {
            actions.selectBlock(null, {}, "");
          }
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: actions are stable, selection read via ref
  }, []);

  // Subscribe to store slices — each selector is narrow to minimise re-renders
  const blocks = useEditorBlocks();

  // Drag-and-drop handling delegated to useDragDrop hook.
  const { containerRef: blocksContainerRef, dropState, handleDragOver, handleDrop, handleDragLeave } =
    useDragDrop((afterId, type) => actions.addBlockAfter(afterId, type));

  // Stable ops object — Zustand actions have stable identity across renders
  const topOps = useMemo(() => ({
    update: actions.updateBlock,
    remove: actions.deleteBlock,
    move: actions.moveBlock,
    addAfter: actions.addBlockAfter,
  }), [actions]);

  const contextValue = useMemo(() => ({
    setActiveColInfo: actions.setActiveColInfo,
    setAnyPickerOpen,
    onSelectBlock,
    onColSelect,
    makeNewBlock: actions.makeNewBlock,
    disabledBlocks,
  }), [setAnyPickerOpen, onSelectBlock, onColSelect, actions, disabledBlocks]);

  return (
    <BlockEditorContext.Provider value={contextValue}>
      <ErrorBoundary>
        <div
          ref={blocksContainerRef}
          className="relative text-zinc-800"
          style={{ display: "flex", flexDirection: "column" }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
        >
          {anyPickerOpen && <div className="absolute inset-0 cursor-default" style={{ zIndex: 15 }} />}

          {/* Blue drop indicator line */}
          {dropState && (
            <div
              className="pointer-events-none absolute left-0 right-0 z-50 flex items-center"
              style={{ top: dropState.lineY - 1 }}
            >
              <div className="h-3 w-3 shrink-0 rounded-full border-2 border-blue-500 bg-white" />
              <div className="h-0.5 flex-1 bg-blue-500" />
            </div>
          )}

          <AddZone onAdd={(type) => actions.addBlockAfter("TOP", type)} onOpenChange={setAnyPickerOpen} />

          {blocks.length === 0 && (
            <div className="my-4 flex min-h-[160px] items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 text-sm text-zinc-400">
              Click + to add your first block
            </div>
          )}

          <BlockList list={blocks} ops={topOps} />
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

