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

/**
 * Walk every block in the tree, calling fn on each.
 * Return a replacement block to keep it (with its children re-walked),
 * or null to remove it from the tree.
 */
function walkBlocks(blocks: EditorBlock[], fn: (b: EditorBlock) => EditorBlock | null): EditorBlock[] {
  return blocks.flatMap((b) => {
    const result = fn(b);
    if (result === null) return [];
    const childArrays = getChildArrays(result);
    if (childArrays !== null) {
      return [applyChildArrays(result, childArrays.map((arr) => walkBlocks(arr, fn)))];
    }
    return [result];
  });
}

/** Recursively update a block anywhere in the tree by id. */
export function deepUpdateBlock(
  blocks: EditorBlock[],
  id: string,
  newData: Record<string, unknown>,
): EditorBlock[] {
  return walkBlocks(blocks, (b) => (b.id === id ? { ...b, data: newData } : b));
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

/** Recursively delete a block anywhere in the tree by id. */
export function deepDeleteBlock(blocks: EditorBlock[], id: string): EditorBlock[] {
  return walkBlocks(blocks, (b) => (b.id === id ? null : b));
}

/**
 * Recursively move a block up or down within its sibling list at any depth.
 * Only the list that directly contains the block is reordered.
 */
export function deepMoveBlock(blocks: EditorBlock[], id: string, dir: -1 | 1): EditorBlock[] {
  const idx = blocks.findIndex((b) => b.id === id);
  if (idx >= 0) {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= blocks.length) return blocks;
    const updated = [...blocks];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    return updated;
  }
  return blocks.map((b) => {
    const childArrays = getChildArrays(b);
    if (childArrays !== null) {
      const updated = childArrays.map((arr) => deepMoveBlock(arr, id, dir));
      if (updated.some((arr, i) => arr !== childArrays[i])) {
        return applyChildArrays(b, updated);
      }
    }
    return b;
  });
}

/**
 * Recursively applies any pending data migrations to a block tree.
 * Should be called when pages are loaded from storage to ensure block data
 * matches the current schema version defined in each block's BlockDefinition.
 */
export function applyMigrations(blocks: EditorBlock[]): EditorBlock[] {
  return blocks.map((block) => {
    const def = blockMap[block.type];
    let current = block;
    if (def?.migrate && def.version !== undefined) {
      const blockVersion = block.version ?? 1;
      if (blockVersion < def.version) {
        current = { ...block, data: def.migrate(block.data, blockVersion), version: def.version };
      }
    }
    const childArrays = getChildArrays(current);
    if (childArrays !== null) {
      return applyChildArrays(current, childArrays.map(applyMigrations));
    }
    return current;
  });
}
