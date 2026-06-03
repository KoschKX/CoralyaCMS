/**
 * Filter System
 * ─────────────
 * WordPress-style filters let plugins intercept and transform values at
 * named hook points throughout the CMS.
 *
 * Usage (consuming side — inside the CMS):
 *
 *   import { applyFilters } from "@/lib/filters";
 *   const html = applyFilters("block.paragraph.html", rawHtml, block);
 *
 * Usage (plugin side):
 *
 *   import { addFilter } from "@/lib/filters";
 *   addFilter("block.paragraph.html", (html) => html.replace("foo", "bar"));
 *
 * Or declare them in your PluginDefinition so they are registered automatically:
 *
 *   const myPlugin: PluginDefinition = {
 *     name: "my-plugin",
 *     version: "1.0.0",
 *     filters: [
 *       { hook: "block.paragraph.html", callback: (html) => html + "<!-- via plugin -->" },
 *     ],
 *   };
 *
 * ── Built-in hooks ────────────────────────────────────────────────────────────
 *
 *   "page.html"              (value: string)            Full rendered page HTML
 *   "block.html"             (value: string, block)     Any block's HTML output
 *   "block.{type}.html"      (value: string, block)     Specific block type output
 *   "block.picker.blocks"    (value: BlockDefinition[]) Block list shown in picker
 *
 * Plugins may also define their own hooks.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FilterFn = (value: any, ...args: any[]) => any;

interface FilterEntry {
  callback: FilterFn;
  priority: number;
}

const _registry: Record<string, FilterEntry[]> = {};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Register a filter callback for a named hook.
 *
 * @param hook      Hook name, e.g. `"block.paragraph.html"`
 * @param callback  Function that receives the current value and returns the (possibly modified) value.
 * @param priority  Execution order — lower runs first. Defaults to `10`.
 */
export function addFilter<T = unknown>(
  hook: string,
  callback: (value: T, ...args: unknown[]) => T,
  priority = 10,
): void {
  if (!_registry[hook]) _registry[hook] = [];
  _registry[hook].push({ callback, priority });
  _registry[hook].sort((a, b) => a.priority - b.priority);
}

/**
 * Remove a previously registered filter callback.
 * The `callback` reference must be the same function instance that was passed to `addFilter`.
 */
export function removeFilter<T = unknown>(
  hook: string,
  callback: (value: T, ...args: unknown[]) => T,
): void {
  if (!_registry[hook]) return;
  _registry[hook] = _registry[hook].filter((e) => e.callback !== callback);
}

/**
 * Run all registered callbacks for a hook, passing the value through each in turn.
 * Returns the final transformed value. If no callbacks are registered, returns `value` unchanged.
 *
 * @param hook   Hook name.
 * @param value  The initial value to pass through the filter chain.
 * @param args   Additional read-only context arguments forwarded to every callback.
 */
export function applyFilters<T = unknown>(hook: string, value: T, ...args: unknown[]): T {
  const entries = _registry[hook];
  if (!entries || entries.length === 0) return value;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return entries.reduce<T>((val, entry) => entry.callback(val, ...args) as T, value);
}

/**
 * Returns how many callbacks are registered for a given hook.
 * Useful for debugging or conditional logic.
 */
export function hasFilters(hook: string): boolean {
  return (_registry[hook]?.length ?? 0) > 0;
}
