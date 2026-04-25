"use client";

/**
 * Zustand editor store
 * ─────────────────────
 * Single source of truth for block editor state:
 *   - Block tree with full undo/redo history (50 levels each direction)
 *   - Block selection
 *   - Column selection
 *   - Block picker open state
 *
 * Performance benefit: components (BlockItem) can subscribe to narrow slices
 * of this store (e.g. `isSelected = useEditorStore(s => s.selectedBlockId === id)`)
 * so only the affected block re-renders on selection change, not the entire tree.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { EditorBlock } from "@/lib/pages-db";
import { blockMap } from "@/blocks/index";
import {
  deepUpdateBlock,
  deepDeleteBlock,
  deepMoveBlock,
  findBlockById,
  insertBlockAfter,
} from "@/lib/block-tree";
import { blocksToShortcodes } from "@/lib/shortcodes";

const MAX_HISTORY = 50;

export interface ActiveColInfo {
  blockId: string;
  colIdx: number;
}

export interface EditorStore {
  // ── History ──────────────────────────────────────────────────────────────
  past: EditorBlock[][];
  present: EditorBlock[];
  future: EditorBlock[][];

  // ── Selection ────────────────────────────────────────────────────────────
  selectedBlockId: string | null;
  activeColInfo: ActiveColInfo | null;
  anyPickerOpen: boolean;

  // ── Derived helper ───────────────────────────────────────────────────────
  /** Returns current blocks (alias for `present`). */
  blocks: () => EditorBlock[];

  // ── Actions ──────────────────────────────────────────────────────────────
  init: (
    initialBlocks: EditorBlock[],
    onChange: (code: string, blocks: EditorBlock[]) => void,
    onSelectBlock: (id: string | null, data: Record<string, unknown>, type: string) => void,
    onColSelect?: (blockId: string, colIdx: number | null) => void,
  ) => void;

  publish: (newBlocks: EditorBlock[]) => void;
  undo: () => void;
  redo: () => void;

  selectBlock: (id: string | null, data: Record<string, unknown>, type: string) => void;
  setActiveColInfo: (info: ActiveColInfo | null) => void;
  setAnyPickerOpen: (open: boolean) => void;

  updateBlock: (id: string, newData: Record<string, unknown>) => void;
  deleteBlock: (id: string) => void;
  moveBlock: (id: string, dir: -1 | 1) => void;
  addBlockAfter: (afterId: string | "TOP", type: string) => void;
  makeNewBlock: (type: string) => EditorBlock;

  /** Called by the panel to push an update for the currently selected block. */
  panelUpdateBlock: (id: string, newData: Record<string, unknown>) => void;
}

/** Factory so each VisualEditor instance gets its own store. */
export function createEditorStore() {
  // External callbacks are kept in a plain closure object rather than inside
  // Immer-managed state. Immer proxies functions unpredictably, and callbacks
  // don't benefit from reactive state tracking.
  const cb: {
    onChange: ((code: string, blocks: EditorBlock[]) => void) | null;
    onSelectBlock: ((id: string | null, data: Record<string, unknown>, type: string) => void) | null;
    onColSelect: ((blockId: string, colIdx: number | null) => void) | null;
  } = { onChange: null, onSelectBlock: null, onColSelect: null };

  // Debounce timer for the onChange callback inside publish().
  // History commits are immediate (cheap array push via Immer), but the
  // expensive blocksToShortcodes() serialization + onChange notification is
  // deferred so rapid typing doesn't serialize on every keystroke.
  let publishDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  function cancelPublishDebounce() {
    if (publishDebounceTimer !== null) {
      clearTimeout(publishDebounceTimer);
      publishDebounceTimer = null;
    }
  }

  function scheduleOnChange(blocks: EditorBlock[]) {
    cancelPublishDebounce();
    publishDebounceTimer = setTimeout(() => {
      publishDebounceTimer = null;
      cb.onChange?.(blocksToShortcodes(blocks), blocks);
    }, 150);
  }

  return create<EditorStore>()(
    immer((set, get) => ({
      past: [],
      present: [],
      future: [],

      selectedBlockId: null,
      activeColInfo: null,
      anyPickerOpen: false,

      blocks() {
        return get().present;
      },

      init(initialBlocks, onChange, onSelectBlock, onColSelect) {
        cb.onChange = onChange;
        cb.onSelectBlock = onSelectBlock;
        cb.onColSelect = onColSelect ?? null;
        set((s) => {
          s.present = initialBlocks;
          s.past = [];
          s.future = [];
        });
      },

      publish(newBlocks) {
        set((s) => {
          s.past = [...s.past.slice(-MAX_HISTORY), s.present];
          s.present = newBlocks;
          s.future = [];
        });
        // Debounce onChange so rapid block updates (e.g. typing in a text field)
        // don't trigger a full blocksToShortcodes() serialization on every keystroke.
        scheduleOnChange(newBlocks);
      },

      undo() {
        // Cancel any pending debounced onChange so undo always fires immediately
        // and doesn't race with a stale debounced update from before the undo.
        cancelPublishDebounce();
        set((s) => {
          if (s.past.length === 0) return;
          const prev = s.past[s.past.length - 1];
          s.future = [s.present, ...s.future.slice(0, MAX_HISTORY)];
          s.present = prev;
          s.past = s.past.slice(0, -1);
        });
        const current = get().present;
        cb.onChange?.(blocksToShortcodes(current), current);
      },

      redo() {
        // Cancel any pending debounced onChange for the same reason as undo.
        cancelPublishDebounce();
        set((s) => {
          if (s.future.length === 0) return;
          const next = s.future[0];
          s.past = [...s.past.slice(-MAX_HISTORY), s.present];
          s.present = next;
          s.future = s.future.slice(1);
        });
        const current = get().present;
        cb.onChange?.(blocksToShortcodes(current), current);
      },

      selectBlock(id, data, type) {
        set((s) => { s.selectedBlockId = id; });
        cb.onSelectBlock?.(id, data, type);
      },

      setActiveColInfo(info) {
        set((s) => { s.activeColInfo = info; });
      },

      setAnyPickerOpen(open) {
        set((s) => { s.anyPickerOpen = open; });
      },

      makeNewBlock(type) {
        const def = blockMap[type];
        return {
          id: crypto.randomUUID(),
          type,
          data: { ...(def?.defaultData ?? {}) },
        };
      },

      updateBlock(id, newData) {
        // Validate new data against the block's schema before applying.
        const block = findBlockById(get().present, id);
        if (block) {
          const def = blockMap[block.type];
          if (def?.validate && !def.validate(newData)) {
            console.warn(`[editor] updateBlock: validation failed for block "${id}" (type "${block.type}"). Update ignored.`);
            return;
          }
        }
        // Use deepUpdateBlock so updates work on blocks nested inside containers.
        const updated = deepUpdateBlock(get().present, id, newData);
        get().publish(updated);
        if (id === get().selectedBlockId) {
          const found = findBlockById(updated, id);
          cb.onSelectBlock?.(id, newData, found?.type ?? "");
        }
      },

      deleteBlock(id) {
        // Use deepDeleteBlock so removals work on blocks nested inside containers.
        get().publish(deepDeleteBlock(get().present, id));
        if (id === get().selectedBlockId) {
          get().selectBlock(null, {}, "");
        }
      },

      moveBlock(id, dir) {
        // Use deepMoveBlock so reordering works on blocks nested inside containers.
        get().publish(deepMoveBlock(get().present, id, dir));
      },

      addBlockAfter(afterId, type) {
        const newBlock = get().makeNewBlock(type);
        get().publish(insertBlockAfter(get().present, afterId, newBlock));
        get().selectBlock(newBlock.id, newBlock.data as Record<string, unknown>, type);
      },

      panelUpdateBlock(id, newData) {
        const updated = deepUpdateBlock(get().present, id, newData);
        get().publish(updated);
        const found = findBlockById(updated, id);
        cb.onSelectBlock?.(id, newData, found?.type ?? "");
      },
    })),
  );
}

export type EditorStoreInstance = ReturnType<typeof createEditorStore>;
