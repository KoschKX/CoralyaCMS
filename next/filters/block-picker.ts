/**
 * Filter: block.picker.blocks
 * ────────────────────────────
 * Lets plugins modify the list of block types shown in the block picker UI.
 * Use it to hide, reorder, or inject custom block types into the picker.
 *
 * ── CMS usage (inside the block picker component): ───────────────────────────
 *
 *   import { applyBlockPickerBlocks } from "@/filters/block-picker";
 *   const visible = applyBlockPickerBlocks(blockRegistry);
 *
 * ── Plugin usage (inline): ───────────────────────────────────────────────────
 *
 *   import { onBlockPickerBlocks } from "@/filters/block-picker";
 *
 *   const myPlugin: PluginDefinition = {
 *     filters: [
 *       // Remove the embed block from the picker
 *       onBlockPickerBlocks((blocks) => blocks.filter((b) => b.name !== "embed")),
 *
 *       // Push a custom block to the end of the list (registered separately)
 *       onBlockPickerBlocks((blocks) => [...blocks, myCustomBlockDef], 20),
 *     ],
 *   };
 */

import { applyFilters } from "@/lib/filters";
import type { PluginFilter } from "@/lib/plugin-types";
import type { BlockDefinition } from "@/lib/block-types";

const HOOK = "block.picker.blocks";

type BlockPickerCallback = (blocks: BlockDefinition[]) => BlockDefinition[];

/**
 * Apply the "block.picker.blocks" filter chain to `blocks`.
 * Call this in the block picker to get the final list of blocks to display.
 */
export function applyBlockPickerBlocks(blocks: BlockDefinition[]): BlockDefinition[] {
  return applyFilters<BlockDefinition[]>(HOOK, blocks);
}

/**
 * Returns a `PluginFilter` entry for the "block.picker.blocks" hook.
 * Drop the result into `PluginDefinition.filters[]`.
 */
export function onBlockPickerBlocks(
  callback: BlockPickerCallback,
  priority?: number,
): PluginFilter {
  return {
    hook: HOOK,
    callback: callback as PluginFilter["callback"],
    priority,
  };
}
