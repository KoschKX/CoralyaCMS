"use client";

/**
 * VisualEditor
 * ────────────
 * A custom React visual block editor. The source of truth is a hidden
 * <textarea> whose content is a shortcode/HTML string; the visual mode
 * renders interactive, directly-editable blocks derived from parsing that string.
 *
 * When a block is selected, its content becomes directly editable in-place
 * (no separate editing box). Un-selected blocks are rendered read-only.
 *
 * Data flow:
 *   hidden textarea ──parse──► blocks (internal state) ──edit──► serialize ──► textarea
 *
 * Undo / Redo:
 *   Cmd+Z (Mac) / Ctrl+Z (Win/Linux) — undo
 *   Cmd+Shift+Z / Ctrl+Shift+Z or Ctrl+Y — redo
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import type { EditorBlock } from "@/lib/pages-db";
import { blockMap } from "@/blocks/index";
import { blocksToShortcodes } from "@/lib/shortcodes";
import { deepUpdateBlock, findBlockById, insertBlockAfter } from "@/lib/block-tree";
import { useEditorViewport } from "@/components/editor/EditorHooks";
import { AddZone } from "@/components/editor/BlockPickerAndAddZone";
import { BlockEditorContext } from "@/components/editor/BlockEditorContext";
import BlockList from "@/components/editor/BlockList";

function makeNewBlock(type: string): EditorBlock {
  const def = blockMap[type];
  return {
    id: crypto.randomUUID(),
    type,
    data: { ...(def?.defaultData ?? {}) },
  };
}

export interface VisualEditorProps {
  initialBlocks: EditorBlock[];
  onChange: (code: string, blocks: EditorBlock[]) => void;
  onSelectBlock: (id: string | null, data: Record<string, unknown>, type: string) => void;
  selectedBlockId: string | null;
  registerUpdateHandler: (fn: ((id: string, newData: Record<string, unknown>) => void) | null) => void;
  /** Called when a column within a columns block is focused or cleared. */
  onColSelect?: (blockId: string, colIdx: number | null) => void;
}

// ── History state ─────────────────────────────────────────────────────────────

interface EditorHistory {
  past: EditorBlock[][];
  present: EditorBlock[];
  future: EditorBlock[][];
}

export default function VisualEditor({
  initialBlocks,
  onChange,
  onSelectBlock,
  selectedBlockId,
  registerUpdateHandler,
  onColSelect,
}: VisualEditorProps) {
  const [history, setHistory] = useState<EditorHistory>({
    past: [],
    present: initialBlocks,
    future: [],
  });
  const blocks = history.present;

  const [activeColInfo, setActiveColInfo] = useState<{ blockId: string; colIdx: number } | null>(null);
  const [anyPickerOpen, setAnyPickerOpen] = useState(false);
  const editorViewport = useEditorViewport();

  // Stable refs to avoid stale closures in useCallback
  const blocksRef = useRef(blocks);
  const onChangeRef = useRef(onChange);
  const onSelectBlockRef = useRef(onSelectBlock);
  const selectedBlockIdRef = useRef(selectedBlockId);
  blocksRef.current = blocks;
  onChangeRef.current = onChange;
  onSelectBlockRef.current = onSelectBlock;
  selectedBlockIdRef.current = selectedBlockId;

  // ── Core publish (adds to history) ────────────────────────────────────────

  const publish = useCallback((newBlocks: EditorBlock[]) => {
    setHistory((prev) => ({
      past: [...prev.past.slice(-49), prev.present],
      present: newBlocks,
      future: [],
    }));
    onChangeRef.current(blocksToShortcodes(newBlocks), newBlocks);
  }, []);

  // ── Undo / Redo ───────────────────────────────────────────────────────────

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const prevBlocks = prev.past[prev.past.length - 1];
      onChangeRef.current(blocksToShortcodes(prevBlocks), prevBlocks);
      return {
        past: prev.past.slice(0, -1),
        present: prevBlocks,
        future: [prev.present, ...prev.future.slice(0, 49)],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const nextBlocks = prev.future[0];
      onChangeRef.current(blocksToShortcodes(nextBlocks), nextBlocks);
      return {
        past: [...prev.past.slice(-49), prev.present],
        present: nextBlocks,
        future: prev.future.slice(1),
      };
    });
  }, []);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        redo();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // ── Panel update handler registration ─────────────────────────────────────

  useEffect(() => {
    registerUpdateHandler((id, newData) => {
      const updated = deepUpdateBlock(blocksRef.current, id, newData);
      publish(updated);
      const found = findBlockById(blocksRef.current, id);
      onSelectBlockRef.current(id, newData, found?.type ?? "");
    });
    return () => registerUpdateHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Block operations (stable — use refs to read current state) ────────────

  const updateBlock = useCallback((id: string, newData: Record<string, unknown>) => {
    const current = blocksRef.current;
    publish(current.map((b) => (b.id === id ? { ...b, data: newData } : b)));
    if (id === selectedBlockIdRef.current) {
      onSelectBlockRef.current(id, newData, current.find((b) => b.id === id)?.type ?? "");
    }
  }, [publish]);

  const deleteBlock = useCallback((id: string) => {
    publish(blocksRef.current.filter((b) => b.id !== id));
    if (id === selectedBlockIdRef.current) onSelectBlockRef.current(null, {}, "");
  }, [publish]);

  const moveBlock = useCallback((id: string, dir: -1 | 1) => {
    const current = blocksRef.current;
    const idx = current.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= current.length) return;
    const updated = [...current];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    publish(updated);
  }, [publish]);

  const addBlockAfter = useCallback((afterId: string | "TOP", type: string) => {
    const newBlock = makeNewBlock(type);
    publish(insertBlockAfter(blocksRef.current, afterId, newBlock));
    onSelectBlockRef.current(newBlock.id, newBlock.data as Record<string, unknown>, type);
  }, [publish]);

  // Stable ops object — only changes if a block op function changes (i.e. never after mount)
  const topOps = useMemo(() => ({
    update: updateBlock,
    remove: deleteBlock,
    move: moveBlock,
    addAfter: addBlockAfter,
  }), [updateBlock, deleteBlock, moveBlock, addBlockAfter]);

  const contextValue = useMemo(() => ({
    selectedBlockId,
    activeColInfo,
    setActiveColInfo,
    anyPickerOpen,
    setAnyPickerOpen,
    editorViewport,
    onSelectBlock,
    onColSelect,
    makeNewBlock,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [selectedBlockId, activeColInfo, anyPickerOpen, editorViewport, onSelectBlock, onColSelect]);

  return (
    <BlockEditorContext.Provider value={contextValue}>
      <div className="relative text-zinc-800" style={{ display: "flex", flexDirection: "column" }}>
        {anyPickerOpen && <div className="absolute inset-0 cursor-default" style={{ zIndex: 15 }} />}
        <AddZone onAdd={(type) => addBlockAfter("TOP", type)} onOpenChange={setAnyPickerOpen} />

        {blocks.length === 0 && (
          <div className="my-4 flex min-h-[160px] items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 text-sm text-zinc-400">
            Click + to add your first block
          </div>
        )}

        <BlockList list={blocks} ops={topOps} />

        <AddZone
          onAdd={(type) => addBlockAfter(blocks[blocks.length - 1]?.id ?? "TOP", type)}
          variant="footer"
          onOpenChange={setAnyPickerOpen}
        />
      </div>
    </BlockEditorContext.Provider>
  );
}

