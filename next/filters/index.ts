/**
 * Filters & Hooks — public entry point
 * ──────────────────────────────────────
 * Single import for everything filter-related. Import from here in plugin code
 * — you should never need to reach into @/lib/filters or individual filter
 * modules directly.
 *
 * Quick reference:
 *
 *   // Register a filter in your PluginDefinition.filters array:
 *   import { onPageHtml, onBlockHtml, onBlockTypeHtml, onBlockPickerBlocks } from "@/filters";
 *
 *   // Register a completely custom hook ad-hoc:
 *   import { addFilter, removeFilter } from "@/filters";
 *   addFilter("my.custom.hook", (value) => transform(value));
 *
 *   // Check whether any callbacks are registered for a hook:
 *   import { hasFilters } from "@/filters";
 *
 * Built-in hooks:
 *
 *   "page.html"              Full rendered page HTML (string)
 *   "block.html"             Any block's HTML output (string, BlockHtmlContext)
 *   "block.{type}.html"      One block type's HTML output (string, BlockHtmlContext)
 *   "block.picker.blocks"    Block list shown in the block picker (BlockDefinition[])
 */

// ── Low-level primitives ──────────────────────────────────────────────────────
// Use these when you need a custom hook not covered by the typed helpers below.
export { addFilter, removeFilter, hasFilters } from "@/lib/filters";

// ── Types ─────────────────────────────────────────────────────────────────────
export type { PluginFilter } from "@/lib/plugin-types";

// ── Typed filter helpers ──────────────────────────────────────────────────────

/** page.html — transform the full HTML output of a rendered page. */
export { applyPageHtml, onPageHtml }      from "./page-html";
export type { PageHtmlContext }           from "./page-html";

/** block.html / block.{type}.html — transform individual block HTML output. */
export { applyBlockHtml, onBlockHtml, onBlockTypeHtml } from "./block-html";
export type { BlockHtmlContext }                        from "./block-html";

/** block.picker.blocks — filter the block list shown in the editor picker. */
export { applyBlockPickerBlocks, onBlockPickerBlocks } from "./block-picker";
