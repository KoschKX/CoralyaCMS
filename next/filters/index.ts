/**
 * Filters — public entry point
 * ────────────────────────────
 * Re-exports all typed filter helpers. Import from here in plugin code.
 *
 *   import { onPageHtml } from "@/filters";
 *
 * For the low-level primitives (addFilter / applyFilters / removeFilter),
 * import directly from "@/lib/filters".
 */

export { applyPageHtml, onPageHtml } from "./page-html";
export type { PageHtmlContext }      from "./page-html";
