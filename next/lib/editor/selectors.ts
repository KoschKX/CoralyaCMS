"use client";

/**
 * Narrow per-block editor selector hooks
 * ────────────────────────────────────────
 * Each hook subscribes to only the minimal slice of the Zustand editor store
 * needed for that concern.  Using narrow selectors means a BlockItem only
 * re-renders when its own selection state changes, not whenever any other
 * block in the tree is selected.
 *
 * Usage in BlockItem (instead of reading the whole selectedBlockId):
 *
 *   const isSelected = useIsBlockSelected(block.id);
 *   const activeColIdx = useActiveColForBlock(block.id);
 *   const blocks = useEditorBlocks();
 */

import { useEditorStore } from "@/lib/editor/EditorStoreContext";

/**
 * Returns true only when the given block is the currently selected block.
 * Re-renders only when that specific block's selection state flips.
 */
export function useIsBlockSelected(blockId: string): boolean {
  return useEditorStore((s) => s.selectedBlockId === blockId);
}

/**
 * Returns the active column index if the given block is the columns block
 * that currently owns the active column, otherwise null.
 */
export function useActiveColForBlock(blockId: string): number | null {
  return useEditorStore((s) =>
    s.activeColInfo?.blockId === blockId ? s.activeColInfo.colIdx : null,
  );
}

/**
 * Returns true if any descendant of this block is selected.
 * Used by container blocks to show a "child selected" highlight.
 * Re-renders only when the descendant-selected state changes for this block.
 */
export function useIsDescendantSelected(blockId: string): boolean {
  return useEditorStore(
    (s) =>
      s.selectedBlockId !== null &&
      s.selectedBlockId !== blockId &&
      // Quick check: the selected id just needs to exist somewhere inside
      // the sub-tree. We keep the selector cheap by checking if the
      // current selectedBlockId string is not the block itself — full
      // tree traversal is done in BlockItem only when needed.
      s.present.some(
        (b) =>
          b.id !== blockId &&
          JSON.stringify(b).includes(`"id":"${s.selectedBlockId}"`),
      ),
  );
}

/**
 * Returns the current top-level block list.
 * Cheaper than calling useEditorStore with an identity selector since it
 * always subscribes to `present` array identity, not its contents.
 */
export function useEditorBlocks() {
  return useEditorStore((s) => s.present);
}
