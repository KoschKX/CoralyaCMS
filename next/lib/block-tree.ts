import type { EditorBlock } from "@/lib/pages-db";

/**
 * Returns the child-block arrays for any container block (e.g. columns),
 * or null for non-container blocks.
 *
 * Add new container block types here when introduced; this is the single place
 * that needs updating in this file.
 */
function getContainerChildren(block: EditorBlock): Array<{ blocks: EditorBlock[] }> | null {
  if (block.type === "columns") {
    return (block.data.cols as Array<{ blocks: EditorBlock[] }>) ?? [];
  }
  return null;
}

/** Recursively update a block anywhere in the tree by id. */
export function deepUpdateBlock(
  blocks: EditorBlock[],
  id: string,
  newData: Record<string, unknown>,
): EditorBlock[] {
  return blocks.map((b) => {
    if (b.id === id) return { ...b, data: newData };
    const cols = getContainerChildren(b);
    if (cols !== null) {
      return {
        ...b,
        data: {
          ...b.data,
          cols: cols.map((col) => ({
            ...col,
            blocks: deepUpdateBlock(col.blocks ?? [], id, newData),
          })),
        },
      };
    }
    return b;
  });
}

/** Find a block anywhere in the tree by id. */
export function findBlockById(blocks: EditorBlock[], id: string): EditorBlock | undefined {
  for (const b of blocks) {
    if (b.id === id) return b;
    const cols = getContainerChildren(b);
    if (cols !== null) {
      for (const col of cols) {
        const found = findBlockById(col.blocks ?? [], id);
        if (found) return found;
      }
    }
  }
  return undefined;
}

/** Returns true if targetId is a descendant of block (at any depth). */
export function isDescendant(block: EditorBlock, targetId: string): boolean {
  const cols = getContainerChildren(block);
  if (cols !== null) {
    for (const col of cols) {
      for (const child of col.blocks ?? []) {
        if (child.id === targetId || isDescendant(child, targetId)) return true;
      }
    }
  }
  return false;
}

/** Insert newBlock after the block with afterId, or at the start if afterId is "TOP". */
export function insertBlockAfter(
  blocks: EditorBlock[],
  afterId: string | "TOP",
  newBlock: EditorBlock,
): EditorBlock[] {
  if (afterId === "TOP") return [newBlock, ...blocks];
  const idx = blocks.findIndex((b) => b.id === afterId);
  return [...blocks.slice(0, idx + 1), newBlock, ...blocks.slice(idx + 1)];
}

