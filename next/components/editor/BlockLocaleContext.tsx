"use client";

/**
 * Editor UI locale context
 * ─────────────────────────
 * Provides the current editor UI locale to every block chrome component
 * (block picker tiles, PanelControls, Editable views). The value follows the
 * language currently being edited (`activeLang` in EditorPage), so switching
 * the content language also switches the block chrome language.
 *
 * Consumers use the `useBlockT()` hook to translate their own block's strings,
 * or `useBlockLocale()` to read the active locale directly.
 */

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { tBlock } from "@/lib/i18n/block-messages";

/** Current editor UI locale. Defaults to "en" when no provider is present. */
export const BlockLocaleContext = createContext<string>("en");

export function BlockLocaleProvider({
  locale,
  children,
}: {
  locale: string;
  children: ReactNode;
}) {
  return (
    <BlockLocaleContext.Provider value={locale}>
      {children}
    </BlockLocaleContext.Provider>
  );
}

/** Read the active editor UI locale. */
export function useBlockLocale(): string {
  return useContext(BlockLocaleContext);
}

/**
 * Returns a translator bound to a single block and the current editor locale.
 *
 * @example
 *   const t = useBlockT("image");
 *   <PanelSection title={t("panel.altSection", "Alt text")} />
 */
export function useBlockT(blockName: string) {
  const locale = useContext(BlockLocaleContext);
  return useCallback(
    (key: string, fallback?: string) => tBlock(blockName, locale, key, fallback),
    [blockName, locale],
  );
}
