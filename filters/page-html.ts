/**
 * Filter: page.html
 * ─────────────────
 * Applied to the full HTML string of a rendered page before it is returned
 * by the public route. Use this to inject scripts, rewrite links, add
 * analytics snippets, etc.
 *
 * CMS usage (in the page renderer):
 *
 *   import { applyPageHtml } from "@/filters/page-html";
 *   const output = applyPageHtml(rawHtml, { slug, page });
 *
 * Plugin usage (inline):
 *
 *   import { onPageHtml } from "@/filters/page-html";
 *   const myPlugin: PluginDefinition = {
 *     filters: [
 *       onPageHtml((html, ctx) => html + `<!-- rendered ${ctx.slug} -->`),
 *     ],
 *   };
 */

import { applyFilters } from "@/lib/filters";
import type { PluginFilter } from "@/lib/plugin-types";

const HOOK = "page.html";

export interface PageHtmlContext {
  /** The page slug, e.g. "about" or "/" for the home page. */
  slug: string;
}

type PageHtmlCallback = (html: string, ctx: PageHtmlContext) => string;

/**
 * Apply the "page.html" filter chain to `html`.
 * Call this inside the page renderer after converting blocks to HTML.
 */
export function applyPageHtml(html: string, ctx: PageHtmlContext): string {
  return applyFilters<string>(HOOK, html, ctx);
}

/**
 * Returns a `PluginFilter` entry for the "page.html" hook.
 * Drop the result into `PluginDefinition.filters[]`.
 */
export function onPageHtml(callback: PageHtmlCallback, priority?: number): PluginFilter {
  return { hook: HOOK, callback: callback as PluginFilter["callback"], priority };
}
