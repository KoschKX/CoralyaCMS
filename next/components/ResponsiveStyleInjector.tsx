"use client";
import { useEffect } from "react";
import { buildResponsiveCSS } from "@/lib/responsive-css";
import type { EditorBlock } from "@/lib/pages-db";

export function ResponsiveStyleInjector({ blocks, tabletBp, mobileBp, forContainer = false }: {
  blocks: EditorBlock[];
  tabletBp: string;
  mobileBp: string;
  /** When true, emits @container rules for the editor canvas instead of @media rules. */
  forContainer?: boolean;
}) {
  useEffect(() => {
    const styleId = forContainer ? "editor-container-css" : "editor-responsive-css";
    const css = buildResponsiveCSS(blocks, tabletBp, mobileBp, forContainer);
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleTag && css) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    if (styleTag) styleTag.textContent = css;
    if (styleTag && !css) styleTag.remove();
    return () => { if (styleTag) styleTag.remove(); };
  }, [blocks, tabletBp, mobileBp, forContainer]);
  return null;
}
