"use client";
import { useEffect } from "react";
import { buildResponsiveCSS } from "@/lib/responsive-css";
import type { EditorBlock } from "@/lib/pages-db";

export function ResponsiveStyleInjector({ blocks, tabletBp, mobileBp }: {
  blocks: EditorBlock[];
  tabletBp: string;
  mobileBp: string;
}) {
  useEffect(() => {
    const styleId = "editor-responsive-css";
    const css = buildResponsiveCSS(blocks, tabletBp, mobileBp);
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleTag && css) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    if (styleTag) styleTag.textContent = css;
    if (styleTag && !css) styleTag.remove();
    return () => { if (styleTag) styleTag.remove(); };
  }, [blocks, tabletBp, mobileBp]);
  return null;
}
