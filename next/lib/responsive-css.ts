import type { EditorBlock } from "@/lib/pages-db";
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

/**
 * Generate per-column-wrapper width CSS rules for the flex-based ColumnsLayout.
 * Targets .block-columns__col-wrapper:nth-child(N) with width overrides.
 * For stacking, sets all wrappers to 100% width.
 */
function colWidthCSS(
  blockId: string,
  cols: Array<{ width?: string; responsive?: Record<string, { width?: string }> }>,
  viewport: string,
  query: string,
): string {
  // Target both live DOM (`[data-block-id] > .block-columns`) and editor DOM
  // (`[data-block-id] > div > .block-columns`) where BlockItem inserts a wrapper div.
  const colSelBase = (nth: string) =>
    `[data-block-id="${blockId}"] > .block-columns > .block-columns__col-wrapper${nth},` +
    `[data-block-id="${blockId}"] > div > .block-columns > .block-columns__col-wrapper${nth}`;
  let css = "";
  for (let i = 0; i < cols.length; i++) {
    const w = cols[i].responsive?.[viewport]?.width;
    if (w) {
      css += `${query} { ${colSelBase(`:nth-child(${i + 1})`)} { width: ${w} !important; } }\n`;
    }
  }
  return css;
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
        const colSelBase = (nth: string) =>
          `[data-block-id="${block.id}"] > .block-columns > .block-columns__col-wrapper${nth},` +
          `[data-block-id="${block.id}"] > div > .block-columns > .block-columns__col-wrapper${nth}`;
        const colSel = colSelBase("");
        if (cascaded["stack"]) {
          css += `${colSel} { width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; }\n`;
        } else {
          (data.cols as Array<{ width?: string; responsive?: Record<string, { width?: string }> }>).forEach((col, i) => {
            const w = forcedViewport === "mobile"
              ? (col.responsive?.mobile?.width ?? col.responsive?.tablet?.width)
              : col.responsive?.tablet?.width;
            if (w) {
              css += `${colSelBase(`:nth-child(${i + 1})`)} { width: ${w} !important; }\n`;
            }
          });
        }
      }

      if (Object.keys(cascaded).length > 0) {
        const rules = rulesFor(cascaded);
        if (rules) {
          // Exclude editor UI overlays (toolbars, pickers) so responsive color
          // overrides don't tint editor chrome. :not([data-editor-ui] *) requires
          // CSS4 :not() with complex selectors — supported in all modern browsers.
          const sel = `[data-block-id="${block.id}"], [data-block-id="${block.id}"] *:not([data-editor-ui]):not([data-editor-ui] *)`;
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
      const cols = data.cols as Array<{ width?: string; responsive?: Record<string, { width?: string }> }>;
      const colSelBase = (nth: string) =>
        `[data-block-id="${block.id}"] > .block-columns > .block-columns__col-wrapper${nth},` +
        `[data-block-id="${block.id}"] > div > .block-columns > .block-columns__col-wrapper${nth}`;
      const colSel = colSelBase("");
      const tabletOverrides = responsive?.tablet ?? {};
      const mobileOverrides = responsive?.mobile ?? {};

      // Desktop stacking (uncommon, but supported)
      if (data.stack) {
        css += `${colSel} { width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; }\n`;
      }
      // Tablet: stack takes priority over per-column widths
      if (tabletOverrides["stack"]) {
        css += `${tabletQuery} { ${colSel} { width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; } }\n`;
      } else {
        css += colWidthCSS(block.id, cols, "tablet", tabletQuery);
      }
      // Mobile
      if (mobileOverrides["stack"]) {
        css += `${mobileQuery} { ${colSel} { width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; } }\n`;
      } else {
        css += colWidthCSS(block.id, cols, "mobile", mobileQuery);
      }
    }

    if (responsive) {
      // Exclude editor UI overlays (toolbars, pickers) so responsive color
      // overrides don't tint editor chrome.
      const sel = `[data-block-id="${block.id}"], [data-block-id="${block.id}"] *:not([data-editor-ui]):not([data-editor-ui] *)`;
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
