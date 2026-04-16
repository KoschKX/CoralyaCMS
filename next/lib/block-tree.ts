import type { EditorBlock } from "@/lib/pages-db";
import { blockMap } from "@/blocks/index";

/**
 * Returns the child-block arrays for a container block by delegating to the
 * block registry's getChildBlocks/setChildBlocks hooks.
 * Returns null for non-container blocks.
 *
 * To add a new container block type, set isContainer + getChildBlocks +
 * setChildBlocks in its BlockDefinition — no changes needed here.
 */
function getChildArrays(block: EditorBlock): EditorBlock[][] | null {
  const def = blockMap[block.type];
  if (!def?.isContainer || !def.getChildBlocks) return null;
  return def.getChildBlocks(block.data);
}

function applyChildArrays(block: EditorBlock, arrays: EditorBlock[][]): EditorBlock {
  const def = blockMap[block.type];
  if (!def?.setChildBlocks) return block;
  return { ...block, data: def.setChildBlocks(block.data, arrays) };
}

/** Recursively update a block anywhere in the tree by id. */
export function deepUpdateBlock(
  blocks: EditorBlock[],
  id: string,
  newData: Record<string, unknown>,
): EditorBlock[] {
  return blocks.map((b) => {
    if (b.id === id) return { ...b, data: newData };
    const childArrays = getChildArrays(b);
    if (childArrays !== null) {
      const updated = childArrays.map((arr) => deepUpdateBlock(arr, id, newData));
      return applyChildArrays(b, updated);
    }
    return b;
  });
}

/** Find a block anywhere in the tree by id. */
export function findBlockById(blocks: EditorBlock[], id: string): EditorBlock | undefined {
  for (const b of blocks) {
    if (b.id === id) return b;
    const childArrays = getChildArrays(b);
    if (childArrays !== null) {
      for (const arr of childArrays) {
        const found = findBlockById(arr, id);
        if (found) return found;
      }
    }
  }
  return undefined;
}

/** Returns true if targetId is a descendant of block (at any depth). */
export function isDescendant(block: EditorBlock, targetId: string): boolean {
  const childArrays = getChildArrays(block);
  if (childArrays !== null) {
    for (const arr of childArrays) {
      for (const child of arr) {
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

