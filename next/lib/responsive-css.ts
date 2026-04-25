import type { EditorBlock } from "@/lib/pages-db";
import { resolveColWidth } from "@/lib/editor/col-width";
import { blockMap } from "@/blocks/index";

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
 *  The generated rules target [data-block-id="..."] which BlockRenderer places on every block wrapper.
 *
 *  @param forContainer   When true, emits @container rules (for the editor canvas) instead of
 *                        @media rules. This allows the editor to respond to canvas width instantly
 *                        in pure CSS without any JavaScript ResizeObserver state.
 *  @param forcedViewport When provided (panel-open mode), skips @container/@media wrappers entirely
 *                        and emits the chosen viewport's overrides as unconditional rules so the
 *                        selected breakpoint is always shown regardless of actual canvas width.
 */
export function buildResponsiveCSS(
  blocks: EditorBlock[],
  tabletBp: string,
  mobileBp: string,
  forContainer = false,
  forcedViewport?: "desktop" | "tablet" | "mobile",
): string {
  // In forced-viewport mode the container/media queries must not fire, because
  // the physical canvas width may not match the selected breakpoint.
  // Instead, emit the chosen viewport's overrides as plain unconditional rules.
  if (forcedViewport && forcedViewport !== "desktop") {
    let css = "";
    for (const block of blocks) {
      const data = block.data as Record<string, unknown>;
      const responsive = data?.responsive as Record<string, Record<string, unknown>> | undefined;

      // Cascade: mobile inherits from tablet, tablet inherits from desktop (base).
      // Merge parent overrides first, then child overrides win.
      const cascaded: Record<string, unknown> =
        forcedViewport === "mobile"
          ? { ...(responsive?.tablet ?? {}), ...(responsive?.mobile ?? {}) }
          : { ...(responsive?.tablet ?? {}) };

      if (block.type === "columns" && Array.isArray(data.cols)) {
        const sel = `[data-block-id="${block.id}"] > .block-columns`;
        // For columns grid, use the cascaded viewport (prefer exact, fall back to tablet)
        const effectiveVp =
          forcedViewport === "mobile" && responsive?.mobile && "cols" in responsive.mobile
            ? "mobile"
            : "tablet";
        const grid = gridTemplateColumnsCSS(data.cols, responsive, effectiveVp);
        if (grid) css += `${sel} { ${grid} }\n`;
        if (cascaded["stack"]) css += `${sel} { grid-template-columns: 1fr !important; }\n`;
      }

      if (Object.keys(cascaded).length > 0) {
        const rules = rulesFor(cascaded);
        if (rules) {
          const sel = `[data-block-id="${block.id}"], [data-block-id="${block.id}"] *`;
          css += `${sel} { ${rules} }\n`;
        }
      }

      const def = blockMap[block.type];
      if (def?.isContainer && def.getChildBlocks) {
        for (const childBlocks of def.getChildBlocks(data)) {
          css += buildResponsiveCSS(childBlocks, tabletBp, mobileBp, forContainer, forcedViewport);
        }
      }
    }
    return css;
  }

  // Normal mode: desktop shows no overrides (base styles apply), tablet/mobile
  // use container or media queries so CSS reacts to actual canvas width.
  if (forcedViewport === "desktop") return "";

  const tabletQuery = forContainer
    ? `@container (max-width: ${tabletBp})`
    : `@media (max-width: ${tabletBp})`;
  const mobileQuery = forContainer
    ? `@container (max-width: ${mobileBp})`
    : `@media (max-width: ${mobileBp})`;

  let css = "";
  for (const block of blocks) {
    const data = block.data as Record<string, unknown>;
    const responsive = data?.responsive as Record<string, Record<string, unknown>> | undefined;

    if (block.type === "columns" && Array.isArray(data.cols)) {
      const sel = `[data-block-id="${block.id}"] > .block-columns`;
      // Desktop (default): handled by inline style, but add for SSR fallback
      const desktopGrid = gridTemplateColumnsCSS(data.cols, responsive, "desktop");
      if (desktopGrid) css += `${sel} { ${desktopGrid} }\n`;
      // Tablet
      const tabletGrid = gridTemplateColumnsCSS(data.cols, responsive, "tablet");
      if (tabletGrid) css += `${tabletQuery} { ${sel} { ${tabletGrid} } }\n`;
      // Mobile
      const mobileGrid = gridTemplateColumnsCSS(data.cols, responsive, "mobile");
      if (mobileGrid) css += `${mobileQuery} { ${sel} { ${mobileGrid} } }\n`;

      // Stack columns: override grid-template-columns to a single column track
      // (ColumnsLayout uses inline gridTemplateColumns; !important overrides it)
      const tabletStack = responsive?.tablet && "stack" in responsive.tablet ? responsive.tablet.stack : undefined;
      const mobileStack = responsive?.mobile && "stack" in responsive.mobile ? responsive.mobile.stack : undefined;
      if (data.stack) css += `${sel} { grid-template-columns: 1fr !important; }\n`;
      if (tabletStack) css += `${tabletQuery} { ${sel} { grid-template-columns: 1fr !important; } }\n`;
      if (mobileStack) css += `${mobileQuery} { ${sel} { grid-template-columns: 1fr !important; } }\n`;
    }

    if (responsive) {
      const sel = `[data-block-id="${block.id}"], [data-block-id="${block.id}"] *`;
      const tabletRules = responsive.tablet ? rulesFor(responsive.tablet) : "";
      const mobileRules = responsive.mobile ? rulesFor(responsive.mobile) : "";
      if (tabletRules) css += `${tabletQuery} { ${sel} { ${tabletRules} } }\n`;
      if (mobileRules) css += `${mobileQuery} { ${sel} { ${mobileRules} } }\n`;
    }

    // Recurse into child blocks of container blocks (e.g. columns)
    const def = blockMap[block.type];
    if (def?.isContainer && def.getChildBlocks) {
      for (const childBlocks of def.getChildBlocks(data)) {
        css += buildResponsiveCSS(childBlocks, tabletBp, mobileBp, forContainer);
      }
    }
  }
  return css;
}
