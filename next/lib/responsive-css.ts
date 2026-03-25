import type { EditorBlock } from "@/lib/pages-db";


function rulesFor(overrides: Record<string, unknown>): string {
  const color    = (overrides.color    as string | undefined) || "";
  const align    = (overrides.align    as string | undefined) || "";
  const fontSize = (overrides.fontSize as string | undefined) || "";
  return [
    color    && `color: ${color} !important;`,
    align    && `text-align: ${align} !important;`,
    fontSize && `font-size: var(--font-size-${fontSize}) !important;`,
  ].filter(Boolean).join(" ");
}

function gridTemplateColumnsCSS(cols: any[], responsive: Record<string, any> | undefined, breakpoint: string): string | null {
  if (!Array.isArray(cols)) return null;
  // For each col, get width for this breakpoint (or fallback)
  const widths = cols.map((col, i) => {
    let w = col.width;
    if (responsive && responsive[breakpoint]) {
      const key = `col-${i}-width`;
      if (responsive[breakpoint][key]) w = responsive[breakpoint][key];
    }
    return w || "1fr";
  });
  if (widths.every(w => w === "1fr")) return null;
  // Use percent as-is, only use fr for fr units
  const grid = widths.map(w => {
    if (!w) return "1fr";
    if (w.endsWith("%")) return w;
    return w;
  }).join(" ");
  return `grid-template-columns: ${grid} !important;`;
}

/** Recursively build @media override CSS for blocks that have data.responsive set.
 *  The generated rules target [data-block-id="..."] which BlockRenderer places on every block wrapper. */
export function buildResponsiveCSS(
  blocks: EditorBlock[],
  tabletBp: string,
  mobileBp: string,
): string {
  let css = "";
  for (const block of blocks) {
    const data = block.data as Record<string, unknown>;
    const responsive = data?.responsive as Record<string, Record<string, unknown>> | undefined;


    if (block.type === "columns" && Array.isArray(data.cols)) {
      const sel = `[data-block-id=\"${block.id}\"] > .block-columns`;
      // Desktop (default): handled by inline style, but add for SSR fallback
      const desktopGrid = gridTemplateColumnsCSS(data.cols, responsive, "desktop");
      if (desktopGrid) css += `${sel} { ${desktopGrid} }\n`;
      // Tablet
      const tabletGrid = gridTemplateColumnsCSS(data.cols, responsive, "tablet");
      if (tabletGrid) css += `@media (max-width: ${tabletBp}) { ${sel} { ${tabletGrid} } }\n`;
      // Mobile
      const mobileGrid = gridTemplateColumnsCSS(data.cols, responsive, "mobile");
      if (mobileGrid) css += `@media (max-width: ${mobileBp}) { ${sel} { ${mobileGrid} } }\n`;
    }

    if (responsive) {
      const sel = `[data-block-id=\"${block.id}\"], [data-block-id=\"${block.id}\"] *`;
      const tabletRules = responsive.tablet ? rulesFor(responsive.tablet) : "";
      const mobileRules = responsive.mobile ? rulesFor(responsive.mobile) : "";
      if (tabletRules) css += `@media (max-width: ${tabletBp}) { ${sel} { ${tabletRules} } }\n`;
      if (mobileRules) css += `@media (max-width: ${mobileBp}) { ${sel} { ${mobileRules} } }\n`;
    }

    // Recurse into columns
    if (block.type === "columns" && Array.isArray(data.cols)) {
      for (const col of data.cols as Array<{ blocks?: EditorBlock[] }>) {
        css += buildResponsiveCSS(col.blocks ?? [], tabletBp, mobileBp);
      }
    }
  }
  return css;
}
