/**
 * Filter: block.html / block.{type}.html
 * ─────────────────────────────────────────
 * Two complementary hooks let plugins transform the HTML output of rendered
 * blocks before it is included in the final page.
 *
 *   "block.html"          — fires for EVERY block type
 *   "block.{type}.html"   — fires for ONE specific block type (e.g. "block.paragraph.html")
 *
 * Both hooks receive the same arguments. For a given block the execution order
 * is: all "block.html" callbacks (sorted by priority) then all
 * "block.{type}.html" callbacks (sorted by priority).
 *
 * ── CMS usage (inside a block renderer that produces HTML strings): ──────────
 *
 *   import { applyBlockHtml } from "@/filters/block-html";
 *   const html = applyBlockHtml(rawHtml, block);
 *
 * ── Plugin usage (inline): ───────────────────────────────────────────────────
 *
 *   import { onBlockHtml, onBlockTypeHtml } from "@/filters/block-html";
 *
 *   const myPlugin: PluginDefinition = {
 *     filters: [
 *       // Wrap ALL blocks in a div.block-wrapper
 *       onBlockHtml((html) => `<div class="block-wrapper">${html}</div>`),
 *
 *       // Only transform paragraph blocks
 *       onBlockTypeHtml("paragraph", (html, ctx) =>
 *         ctx.block.data.highlight ? `<mark>${html}</mark>` : html
 *       ),
 *     ],
 *   };
 */

import { applyFilters } from "@/lib/filters";
import type { PluginFilter } from "@/lib/plugin-types";
import type { EditorBlock } from "@/lib/pages-db";

const HOOK_ALL = "block.html";

/** Context passed to every block.html callback as the second argument. */
export interface BlockHtmlContext {
  /** The full block object (type, id, data). */
  block: EditorBlock;
}

type BlockHtmlCallback = (html: string, ctx: BlockHtmlContext) => string;

/**
 * Apply the "block.html" and "block.{block.type}.html" filter chains to `html`.
 * Call this inside any renderer that converts a block to an HTML string.
 */
export function applyBlockHtml(html: string, block: EditorBlock): string {
  const ctx: BlockHtmlContext = { block };
  // First apply the generic hook, then the type-specific one.
  const after = applyFilters<string>(HOOK_ALL, html, ctx);
  return applyFilters<string>(`block.${block.type}.html`, after, ctx);
}

/**
 * Returns a `PluginFilter` entry for the "block.html" hook (all block types).
 * Drop the result into `PluginDefinition.filters[]`.
 */
export function onBlockHtml(
  callback: BlockHtmlCallback,
  priority?: number,
): PluginFilter {
  return {
    hook: HOOK_ALL,
    callback: callback as PluginFilter["callback"],
    priority,
  };
}

/**
 * Returns a `PluginFilter` entry for the "block.{type}.html" hook.
 * Only fires for blocks whose type matches `blockType`.
 * Drop the result into `PluginDefinition.filters[]`.
 *
 * @param blockType  The block type name, e.g. `"paragraph"`, `"header"`.
 */
export function onBlockTypeHtml(
  blockType: string,
  callback: BlockHtmlCallback,
  priority?: number,
): PluginFilter {
  return {
    hook: `block.${blockType}.html`,
    callback: callback as PluginFilter["callback"],
    priority,
  };
}
