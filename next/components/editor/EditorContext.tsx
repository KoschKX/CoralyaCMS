"use client";

import { createContext, useContext } from "react";
import { getEditorBreakpoints } from "@/lib/editor-breakpoints";

interface EditorViewportContextValue {
  /** Viewport selected in the editor toolbar (desktop / tablet / mobile). */
  viewport: string;
  /** Current pixel width of the editor canvas (not the full window). */
  canvasWidth: number;
}

export const EditorViewportContext = createContext<EditorViewportContextValue>({
  viewport: "desktop",
  canvasWidth: typeof window !== "undefined" ? window.innerWidth : 1280,
});

function parsePx(val: string): number {
  return parseInt(val, 10) || 0;
}

/**
 * Returns the editor toolbar viewport selection (desktop / tablet / mobile).
 * Must be used inside an EditorViewportContext.Provider.
 */
export function useEditorViewport(): string {
  return useContext(EditorViewportContext).viewport;
}

/**
 * Derives the current responsive breakpoint from the editor canvas width.
 * Works without a provider (falls back to window.innerWidth) so it is safe
 * to call in block layout components rendered on the public site.
 */
export function useMediaViewportFromContext(): string {
  const { canvasWidth } = useContext(EditorViewportContext);
  const { tablet: tabletBp, mobile: mobileBp } = getEditorBreakpoints();
  if (canvasWidth <= parsePx(mobileBp)) return "mobile";
  if (canvasWidth <= parsePx(tabletBp)) return "tablet";
  return "desktop";
}
