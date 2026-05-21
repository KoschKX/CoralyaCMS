"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { EditorBlock } from "@/lib/pages-db";
import type { SelectedBlock } from "@/lib/types";
import { blocksToShortcodes, shortcodesToBlocks } from "@/lib/shortcodes";

interface UseEditorPageStateOptions {
  id?: string;
  initialBlocks: EditorBlock[];
  initialHtml: string;
}

/**
 * Encapsulates the editor's three-mode state machine (visual / code / inject),
 * the block tree that backs each mode, draft crash-recovery via sessionStorage,
 * and the debounced code→block parse used by the code view live preview.
 *
 * Keeping this logic here lets EditorPage.tsx focus on layout and wiring, not
 * on the mechanics of mode switching and draft persistence.
 */
export function useEditorPageState({
  id,
  initialBlocks,
  initialHtml,
}: UseEditorPageStateOptions) {
  // ── Mode ────────────────────────────────────────────────────────────────────
  const [mainMode, setMainModeRaw] = useState<"visual" | "code" | "inject">("visual");
  const [selectedBlock, setSelectedBlock] = useState<SelectedBlock | null>(null);

  const setMainMode = useCallback((mode: "visual" | "code" | "inject") => {
    setMainModeRaw(mode);
    // Clear block selection when leaving visual mode — panel state would be stale.
    if (mode !== "visual") setSelectedBlock(null);
  }, []);

  // ── Draft recovery ──────────────────────────────────────────────────────────
  // sessionStorage key is page-specific so new-page drafts don't collide.
  const draftKey = `editor-draft-${id ?? "new"}`;

  // Derive the canonical initial blocks from whichever format the page provides.
  const initialParsedBlocks = useMemo(
    () => (initialHtml ? shortcodesToBlocks(initialHtml) : initialBlocks),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // intentionally stable — only computed once on mount
  );

  // Seed the code text from a saved draft first, then from the page data.
  const [codeText, setCodeText] = useState<string>(() => {
    try {
      return (
        sessionStorage.getItem(draftKey) ??
        (initialHtml || blocksToShortcodes(initialParsedBlocks))
      );
    } catch {
      return initialHtml || blocksToShortcodes(initialParsedBlocks);
    }
  });

  // Debounce code→block parsing so the parser doesn't run on every keystroke.
  // 150ms is fast enough to feel live without hammering the tokenizer.
  const [debouncedCode, setDebouncedCode] = useState(codeText);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedCode(codeText), 150);
    return () => clearTimeout(t);
  }, [codeText]);

  // Persist draft to sessionStorage with a 1 s debounce for crash recovery.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem(draftKey, codeText);
      } catch (err) {
        // Storage quota exceeded or private-browsing restrictions — non-fatal.
        console.warn("[editor] Could not persist draft to sessionStorage:", err);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [codeText, draftKey]);

  // ── Block trees ─────────────────────────────────────────────────────────────
  // In visual mode, the Zustand store owns the block tree. We receive parsed blocks
  // from the store's onChange callback to avoid a redundant shortcode→blocks round-trip.
  const [visualBlocks, setVisualBlocks] = useState<EditorBlock[]>(initialParsedBlocks);
  const parsedCodeBlocks = useMemo(() => shortcodesToBlocks(debouncedCode), [debouncedCode]);
  const liveBlocks = mainMode === "visual" ? visualBlocks : parsedCodeBlocks;

  // ── Draft cleanup ───────────────────────────────────────────────────────────
  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(draftKey);
    } catch {}
  }, [draftKey]);

  return {
    mainMode,
    setMainMode,
    selectedBlock,
    setSelectedBlock,
    codeText,
    setCodeText,
    visualBlocks,
    setVisualBlocks,
    liveBlocks,
    clearDraft,
  };
}
