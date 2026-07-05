/**
 * Per-block UI translations
 * ──────────────────────────
 * Resolves the non-editable UI strings (block label, panel section titles,
 * placeholders, button captions, etc.) that ship inside each block folder as
 * per-locale JSON files.
 *
 * Convention:
 *   blocks/<name>/lang/<locale>.json  →  { "<key>": "<string>" }
 *   (e.g. blocks/image/lang/en.json, blocks/image/lang/de.json)
 *
 * The codegen step (lib/codegen.mjs) discovers every `lang/*.json` and generates
 * `.generated/blocks/messages.ts`, from which the `blockMessages` map below is
 * imported. This module is isomorphic (no React, no Node built-ins) so it can
 * be used from both server and client code.
 *
 * These strings are the block *chrome* — they are never user content and are
 * therefore never serialized into a page's shortcodes.
 */

import { blockMessages } from "@/blocks/messages";

/** Per-locale string maps for a single block, keyed by locale code. */
export type BlockMessageBundle = Record<string, Record<string, string>>;

/** The ultimate fallback locale when a string is missing for the active one. */
const FALLBACK_LOCALE = "en";

/**
 * Translate a single block UI string.
 *
 * Resolution order:
 *   1. the requested `locale`
 *   2. the fallback locale ("en")
 *   3. the caller-supplied `fallback` (the hardcoded source string)
 *   4. the raw `key` (last resort — signals a missing translation)
 */
export function tBlock(
  name: string,
  locale: string,
  key: string,
  fallback?: string,
): string {
  const bundle = blockMessages[name];
  const value = bundle?.[locale]?.[key] ?? bundle?.[FALLBACK_LOCALE]?.[key];
  return value ?? fallback ?? key;
}

/**
 * Resolve a block's display label for the given locale, falling back to the
 * label defined in the block's `config.tsx`.
 */
export function getBlockLabel(
  def: { name: string; label: string },
  locale: string,
): string {
  return tBlock(def.name, locale, "label", def.label);
}
