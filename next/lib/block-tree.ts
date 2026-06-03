import type { EditorBlock } from "@/lib/types";
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

/**
 * Recursively insert newBlock after the block with afterId anywhere in the tree.
 * Falls back to appending at the top level if afterId is not found.
 */
export function deepInsertBlockAfter(
  blocks: EditorBlock[],
  afterId: string | "TOP",
  newBlock: EditorBlock,
): EditorBlock[] {
  if (afterId === "TOP") return [newBlock, ...blocks];
  // Try top-level first
  const idx = blocks.findIndex((b) => b.id === afterId);
  if (idx >= 0) {
    return [...blocks.slice(0, idx + 1), newBlock, ...blocks.slice(idx + 1)];
  }
  // Recurse into containers
  return blocks.map((b) => {
    const childArrays = getChildArrays(b);
    if (childArrays === null) return b;
    let found = false;
    const updated = childArrays.map((arr) => {
      if (found) return arr;
      const innerIdx = arr.findIndex((c) => c.id === afterId);
      if (innerIdx >= 0) {
        found = true;
        return [...arr.slice(0, innerIdx + 1), newBlock, ...arr.slice(innerIdx + 1)];
      }
      // Recurse deeper
      const deeper = deepInsertBlockAfter(arr, afterId, newBlock);
      if (deeper !== arr) { found = true; return deeper; }
      return arr;
    });
    return found ? applyChildArrays(b, updated) : b;
  });
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
    if (def && def.version !== undefined) {
      const blockVersion = block.version ?? 1;
      if (blockVersion < def.version) {
        let data = block.data;
        // Apply each deprecated step in ascending version order.
        // Each step covers one version bump so migrations stay simple.
        if (def.deprecated) {
          const steps = [...def.deprecated].sort((a, b) => a.version - b.version);
          for (const step of steps) {
            if (blockVersion <= step.version) {
              data = step.migrate(data);
            }
          }
        }
        // Fall back to the monolithic migrate() for any remaining gap.
        if (def.migrate) {
          data = def.migrate(data, blockVersion);
        }
        current = { ...block, data, version: def.version };
      }
    }
    // Run validate() after migration to catch bad data produced by a buggy migrate()
    // implementation. When validation fails, fall back to defaultData so the page can
    // still render rather than crashing or showing corrupted content.
    if (def?.validate && !def.validate(current.data)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[block-tree] Block ${current.id} (${current.type}) failed validation after migration — resetting to defaultData`,
        );
      }
      current = { ...current, data: def.defaultData ?? {} };
    }
    const childArrays = getChildArrays(current);
    if (childArrays !== null) {
      return applyChildArrays(current, childArrays.map(applyMigrations));
    }
    return current;
  });
}
