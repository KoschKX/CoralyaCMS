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

export default function VisualEditor({
  initialBlocks,
  onChange,
  onSelectBlock,
  selectedBlockId,
  registerUpdateHandler,
  onColSelect,
}: VisualEditorProps) {
  const [blocks, setBlocks] = useState<EditorBlock[]>(initialBlocks);
  const [activeColInfo, setActiveColInfo] = useState<{ blockId: string; colIdx: number } | null>(null);
  const [anyPickerOpen, setAnyPickerOpen] = useState(false);
  const editorViewport = useEditorViewport();

  // Keep refs to avoid stale closures inside callbacks
  const blocksRef = useRef(blocks);
  const onChangeRef = useRef(onChange);
  const onSelectBlockRef = useRef(onSelectBlock);
  blocksRef.current = blocks;
  onChangeRef.current = onChange;
  onSelectBlockRef.current = onSelectBlock;

  const publish = useCallback((newBlocks: EditorBlock[]) => {
    setBlocks(newBlocks);
    onChangeRef.current(blocksToShortcodes(newBlocks), newBlocks);
  }, []);

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

  // ── Block operations ──────────────────────────────────────────────────────

  function updateBlock(id: string, newData: Record<string, unknown>) {
    const updated = blocks.map((b) => (b.id === id ? { ...b, data: newData } : b));
    publish(updated);
    if (id === selectedBlockId) {
      onSelectBlock(id, newData, blocks.find((b) => b.id === id)?.type ?? "");
    }
  }

  function deleteBlock(id: string) {
    const updated = blocks.filter((b) => b.id !== id);
    publish(updated);
    if (id === selectedBlockId) onSelectBlock(null, {}, "");
  }

  function moveBlock(id: string, dir: -1 | 1) {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    const updated = [...blocks];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    publish(updated);
  }

  function addBlockAfter(afterId: string | "TOP", type: string) {
    const newBlock = makeNewBlock(type);
    publish(insertBlockAfter(blocks, afterId, newBlock));
    onSelectBlock(newBlock.id, newBlock.data as Record<string, unknown>, type);
  }

  const topOps = {
    update: updateBlock,
    remove: deleteBlock,
    move: moveBlock,
    addAfter: addBlockAfter,
  };

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

