/**
 * Blocks — public entry point
 * ────────────────────────────
 * Single import for everything block-related. Use this in plugin code and
 * custom block definitions — you should never need to import from
 * @/lib/plugin-registry or @/lib/block-types directly.
 *
 * Quick reference:
 *
 *   // Define and register a custom block:
 *   import { registerBlock, type BlockDefinition } from "@/blocks";
 *
 *   // Look up a registered block at runtime:
 *   import { blockMap, blockRegistry } from "@/blocks";
 *
 *   // Register a custom icon for use in the block picker:
 *   import { registerIcon } from "@/blocks";
 *
 * Importing this module also registers all built-in core blocks as a side
 * effect — that is intentional and required before using blockMap / blockRegistry.
 */

import paragraph from "./paragraph/config";
import header    from "./header/config";
import list      from "./list/config";
import code      from "./code/config";
import quote     from "./quote/config";
import delimiter from "./delimiter/config";
import table     from "./table/config";
import embed     from "./embed/config";
import columns   from "./columns/config";
import html      from "./html/config";
import image     from "./image/config";
import button    from "./button/config";
import counter   from "./counter/config";
import carousel  from "./carousel/config";

import {
  registerBlock,
  unregisterBlock,
  blockRegistry,
  blockMap,
  registerIcon,
  getPluginIcon,
} from "@/lib/plugin-registry";

for (const block of [paragraph, header, list, code, quote, delimiter, table, embed, columns, html, image, button, counter, carousel]) {
  registerBlock(block);
}

// ── Block registry ────────────────────────────────────────────────────────────
export { blockRegistry, blockMap };

// ── Registration API ──────────────────────────────────────────────────────────
export { registerBlock, unregisterBlock, registerIcon, getPluginIcon };

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  BlockDefinition,
  BlockData,
  BlockLayoutProps,
  EditableProps,
  PanelControlProps,
} from "@/lib/block-types";

