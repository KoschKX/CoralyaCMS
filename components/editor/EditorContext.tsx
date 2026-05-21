"use client";

import { createContext, useContext } from "react";

interface EditorViewportContextValue {
  /** Viewport selected in the editor toolbar (desktop / tablet / mobile). */
  viewport: string;
}

export const EditorViewportContext = createContext<EditorViewportContextValue>({
  viewport: "desktop",
});

/**
 * Returns the editor toolbar viewport selection (desktop / tablet / mobile).
 * Must be used inside an EditorViewportContext.Provider.
 *
 * This is the *manually selected* viewport from the toolbar buttons — it is
 * NOT derived from canvas width. Responsive layout in the editor is handled
 * by CSS @container rules on the canvas element, not by JS.
 */
export function useEditorViewport(): string {
  return useContext(EditorViewportContext).viewport;
}

/**
 * Alias kept for backward compatibility with blocks that call useMediaViewport().
 * Returns the toolbar-selected viewport — blocks should use this only when
 * they genuinely need to branch logic, not just for CSS styling.
 */
export function useMediaViewportFromContext(): string {
  return useContext(EditorViewportContext).viewport;
}
