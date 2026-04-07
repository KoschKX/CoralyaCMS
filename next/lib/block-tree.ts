import type { EditorBlock } from "@/lib/pages-db";

/** Recursively update a block anywhere in the tree by id. */
export function deepUpdateBlock(
  blocks: EditorBlock[],
  id: string,
  newData: Record<string, unknown>,
): EditorBlock[] {
  return blocks.map((b) => {
    if (b.id === id) return { ...b, data: newData };
    if (b.type === "columns") {
      const cols = (b.data.cols as Array<{ blocks: EditorBlock[]; width?: string }>) ?? [];
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
    if (b.type === "columns") {
      const cols = (b.data.cols as Array<{ blocks: EditorBlock[] }>) ?? [];
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
  if (block.type === "columns") {
    const cols = (block.data.cols as Array<{ blocks: EditorBlock[] }>) ?? [];
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
