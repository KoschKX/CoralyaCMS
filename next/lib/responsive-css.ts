import type { EditorBlock } from "@/lib/pages-db";
import { resolveColWidth } from "@/lib/editor/col-width";

/**
 * Merge responsive overrides for the given viewport onto data.
 * - On desktop, returns data unchanged.
 * - On tablet/mobile, spreads responsive[viewport] on top of data.
 * - If stripResponsive is true, the `responsive` key is removed from the result
 *   (useful when passing data to panel controls that shouldn't see it).
 */
export function mergeViewportOverrides(
  data: Record<string, unknown>,
  viewport: string,
  stripResponsive = false,
): Record<string, unknown> {
  if (viewport === "desktop") return data;
  const { responsive: _r, ...rest } = data as Record<string, unknown> & { responsive?: unknown };
  const responsive = (_r as Record<string, Record<string, unknown>>) ?? {};
  const overrides = responsive[viewport];
  if (!overrides) return stripResponsive ? rest : data;
  return { ...(stripResponsive ? rest : data), ...overrides };
}

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

function gridTemplateColumnsCSS(
  cols: Array<{ width?: string }>,
  responsive: Record<string, Record<string, unknown>> | undefined,
  breakpoint: string,
): string | null {
  if (!Array.isArray(cols)) return null;
  const widths = cols.map((col, i) => resolveColWidth(col, i, responsive, breakpoint) ?? "1fr");
  if (widths.every((w) => w === "1fr")) return null;
  return `grid-template-columns: ${widths.join(" ")} !important;`;
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

      // Stack columns: force 100% width on col wrappers
      const stackSel = `[data-block-id=\"${block.id}\"] .block-columns__col-wrapper`;
      if (data.stack) css += `${stackSel} { width: 100% !important; }\n`;
      const tabletStack = responsive?.tablet && "stack" in responsive.tablet ? responsive.tablet.stack : undefined;
      const mobileStack = responsive?.mobile && "stack" in responsive.mobile ? responsive.mobile.stack : undefined;
      if (tabletStack) css += `@media (max-width: ${tabletBp}) { ${stackSel} { width: 100% !important; } }\n`;
      if (mobileStack) css += `@media (max-width: ${mobileBp}) { ${stackSel} { width: 100% !important; } }\n`;
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
