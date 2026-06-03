/**
 * Plugin Registry
 * ───────────────
 * Central registry for blocks, block icons, and installed plugins.
 *
 * Blocks and plugins are separate systems:
 *   - Blocks are registered directly via `registerBlock()` in `blocks/index.ts`.
 *   - Plugins are installed via `installPlugin()` in `plugins/index.ts`.
 *     They add filters and admin settings pages — not blocks.
 */

import type React from "react";
import type { BlockDefinition } from "@/lib/block-types";
import type { PluginDefinition, PluginAdminPage } from "@/lib/plugin-types";
import { addFilter } from "@/lib/filters";

// ── Block registry ────────────────────────────────────────────────────────────

/** Ordered list of all registered block definitions. Core blocks appear first. */
export const blockRegistry: BlockDefinition[] = [];

/** O(1) block lookup by type name. Same objects as in `blockRegistry`. */
export const blockMap: Record<string, BlockDefinition> = {};

/**
 * Register a block definition.
 * If a block with the same name is already registered, it is overwritten.
 */
export function registerBlock(def: BlockDefinition): void {
  if (def.name in blockMap) {
    const idx = blockRegistry.findIndex((b) => b.name === def.name);
    if (idx >= 0) blockRegistry[idx] = def;
  } else {
    blockRegistry.push(def);
  }
  blockMap[def.name] = def;
}

/**
 * Remove a block definition from the registry.
 */
export function unregisterBlock(name: string): void {
  const idx = blockRegistry.findIndex((b) => b.name === name);
  if (idx >= 0) blockRegistry.splice(idx, 1);
  delete blockMap[name];
}

// ── Icon registry ─────────────────────────────────────────────────────────────

const _iconMap: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {};

/** Register a custom SVG icon component for use in the block picker. */
export function registerIcon(
  name: string,
  component: React.FC<React.SVGProps<SVGSVGElement>>,
): void {
  _iconMap[name] = component;
}

/** Look up a registered icon by name. Falls back to built-in icons if not found. */
export function getPluginIcon(
  name: string,
): React.FC<React.SVGProps<SVGSVGElement>> | undefined {
  return _iconMap[name];
}

// ── Plugin registry ───────────────────────────────────────────────────────────

/** All installed plugin manifests, in installation order. */
export const installedPlugins: PluginDefinition[] = [];

/**
 * Names of plugins that have been disabled via the admin UI.
 * Used by the generated plugin installer to seed initial state and by the
 * admin API to update in-process state.
 */
export const disabledPlugins = new Set<string>();

// ── Pluggable disabled checker ────────────────────────────────────────────────
// This module is imported by both Server Components and Client Components, so
// it must not contain any Node.js built-ins.  Server-only code (the generated
// plugin installer) calls `setDisabledChecker()` to install a file-reading
// implementation.  Until then the check falls back to the in-memory Set.

let _disabledChecker: (name: string) => boolean = (name) => disabledPlugins.has(name);

/**
 * Override the plugin-disabled check with a custom function.
 * Call this once from server-only code (e.g. the generated plugin installer)
 * to install a persistent, file-backed check that works across separate
 * module contexts (RSC vs Route Handler).
 */
export function setDisabledChecker(fn: (name: string) => boolean): void {
  _disabledChecker = fn;
}

/**
 * All admin pages contributed by plugins, keyed by slug for O(1) lookup.
 * Used by the dynamic `/admin/settings/plugins/[slug]` route.
 */
export const pluginAdminPages: Record<string, PluginAdminPage> = {};

/**
 * Install a plugin.
 * Registers its filters and admin pages, then records it in `installedPlugins`.
 */
export function installPlugin(plugin: PluginDefinition): void {
  for (const { hook, callback, priority } of plugin.filters ?? []) {
    // Wrap so the disabled check is evaluated at call time, not install time.
    const pluginName = plugin.name;
    const guarded = (value: unknown, ...args: unknown[]) => {
      if (_disabledChecker(pluginName)) return value;
      return (callback as (v: unknown, ...a: unknown[]) => unknown)(value, ...args);
    };
    addFilter(hook, guarded, priority);
  }
  for (const page of plugin.adminPages ?? []) {
    pluginAdminPages[page.slug] = page;
  }
  installedPlugins.push(plugin);
}

