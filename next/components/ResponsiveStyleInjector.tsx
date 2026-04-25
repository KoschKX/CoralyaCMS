"use client";
import { useEffect } from "react";
import { buildResponsiveCSS } from "@/lib/responsive-css";
import type { EditorBlock } from "@/lib/pages-db";

export function ResponsiveStyleInjector({ blocks, tabletBp, mobileBp, forContainer = false, forcedViewport }: {
  blocks: EditorBlock[];
  tabletBp: string;
  mobileBp: string;
  /** When true, emits @container rules for the editor canvas instead of @media rules. */
  forContainer?: boolean;
  /**
   * When the options panel is open, pass the selected viewport here.
   * This bypasses container/media queries entirely and emits the chosen
   * viewport's overrides as unconditional rules, so styles match the
   * selected button regardless of the canvas's actual pixel width.
   */
  forcedViewport?: "desktop" | "tablet" | "mobile";
}) {
  useEffect(() => {
    const styleId = forContainer ? "editor-container-css" : "editor-responsive-css";
    const css = buildResponsiveCSS(blocks, tabletBp, mobileBp, forContainer, forcedViewport);
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleTag && css) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    if (styleTag) styleTag.textContent = css;
    if (styleTag && !css) styleTag.remove();
    return () => { if (styleTag) styleTag.remove(); };
  }, [blocks, tabletBp, mobileBp, forContainer, forcedViewport]);
  return null;
}
