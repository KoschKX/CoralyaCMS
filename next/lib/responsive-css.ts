import type { EditorBlock } from "@/lib/pages-db";
import { blockMap } from "@/blocks/index";

/**
 * Keys whose values are nested objects that must be deep-merged rather than
 * replaced wholesale when applying responsive overrides.
 */
const DEEP_MERGE_KEYS = new Set(["background", "spacing", "border", "display"]);

/** Merge two override objects, deep-merging known nested sub-objects. */
function mergeOverrides(
  base: Record<string, unknown>,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const [key, val] of Object.entries(overrides)) {
    if (
      DEEP_MERGE_KEYS.has(key) &&
      base[key] !== undefined &&
      typeof base[key] === "object" && base[key] !== null &&
      typeof val === "object" && val !== null
    ) {
      result[key] = { ...(base[key] as Record<string, unknown>), ...(val as Record<string, unknown>) };
    } else {
      result[key] = val;
    }
  }
  return result;
}

/**
 * Merge responsive overrides for the given viewport onto data.
 * - On desktop, returns data unchanged.
 * - On tablet/mobile, spreads responsive[viewport] on top of data,
 *   deep-merging known nested sub-objects (background, spacing, border, display)
 *   so a partial override (e.g. bgColor only) doesn't wipe sibling fields (e.g. bgImage).
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
  return mergeOverrides(stripResponsive ? rest : data, overrides);
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

/** CSS properties that apply only to the block wrapper (not cascaded to children). */
function wrapperRulesFor(overrides: Record<string, unknown>): string {
  const spacing    = (overrides.spacing    as Record<string, string> | undefined) ?? {};
  const background = (overrides.background as Record<string, string> | undefined) ?? {};
  const border     = (overrides.border     as Record<string, string> | undefined) ?? {};
  const rules: string[] = [];
  if (spacing.pt) rules.push(`padding-top: ${spacing.pt} !important;`);
  if (spacing.pr) rules.push(`padding-right: ${spacing.pr} !important;`);
  if (spacing.pb) rules.push(`padding-bottom: ${spacing.pb} !important;`);
  if (spacing.pl) rules.push(`padding-left: ${spacing.pl} !important;`);
  if (spacing.mt) rules.push(`margin-top: ${spacing.mt} !important;`);
  if (spacing.mr) rules.push(`margin-right: ${spacing.mr} !important;`);
  if (spacing.mb) rules.push(`margin-bottom: ${spacing.mb} !important;`);
  if (spacing.ml) rules.push(`margin-left: ${spacing.ml} !important;`);
  if (background.bgColor) rules.push(`background-color: ${background.bgColor} !important;`);
  if (background.bgImage === "none") {
    rules.push(`background-image: none !important;`);
  } else if (background.bgImage) {
    rules.push(`background-image: url(${background.bgImage}) !important;`);
    rules.push(`background-size: ${background.bgSize || "cover"} !important;`);
    rules.push(`background-position: ${background.bgPosition || "center"} !important;`);
    rules.push(`background-repeat: ${background.bgRepeat || "no-repeat"} !important;`);
  }
  const hasBorder = border.color || border.width || border.style;
  if (hasBorder) {
    rules.push(`border-width: ${border.width || "1px"} !important;`);
    rules.push(`border-style: ${border.style || "solid"} !important;`);
    rules.push(`border-color: ${border.color || "currentColor"} !important;`);
  }
  if (border.radius) rules.push(`border-radius: ${border.radius} !important;`);
  return rules.join(" ");
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
      // Deep-merge parent overrides first so child overrides win per-property.
      const cascaded: Record<string, unknown> =
        forcedViewport === "mobile"
          ? mergeOverrides(responsive?.tablet ?? {}, responsive?.mobile ?? {})
          : { ...(responsive?.tablet ?? {}) };

      if (block.type === "columns" && Array.isArray(data.cols)) {
        const colSelBase = (nth: string) =>
          `[data-block-id="${block.id}"] > .block-columns > .block-columns__col-wrapper${nth},` +
          `[data-block-id="${block.id}"] > div > .block-columns > .block-columns__col-wrapper${nth}`;
        const colSel = colSelBase("");
        if (cascaded["stack"]) {
          css += `${colSel} { width: 100% !important; padding-left: 0 !important; }\n`;
        } else {
          (data.cols as Array<{ width?: string; responsive?: Record<string, Record<string, unknown>> }>).forEach((col, i) => {
            const w = forcedViewport === "mobile"
              ? (col.responsive?.mobile?.width ?? col.responsive?.tablet?.width)
              : col.responsive?.tablet?.width;
            if (w) {
              css += `${colSelBase(`:nth-child(${i + 1})`)} { width: ${w} !important; }\n`;
            }
            // Per-column advanced CSS overrides (background, spacing, border, etc.)
            const colCascaded: Record<string, unknown> =
              forcedViewport === "mobile"
                ? mergeOverrides(col.responsive?.tablet ?? {}, col.responsive?.mobile ?? {})
                : { ...(col.responsive?.tablet ?? {}) };
            const colWrapperRules = wrapperRulesFor(colCascaded);
            if (colWrapperRules) {
              css += `${colSelBase(`:nth-child(${i + 1})`)} { ${colWrapperRules} }\n`;
            }
          });
        }
      }

      if (Object.keys(cascaded).length > 0) {
        const rules = rulesFor(cascaded);
        if (rules) {
          const sel = `[data-block-id="${block.id}"], [data-block-id="${block.id}"] *`;
          css += `${sel} { ${rules} }\n`;
        }
        const wrapperRules = wrapperRulesFor(cascaded);
        if (wrapperRules) {
          css += `[data-block-id="${block.id}"] { ${wrapperRules} }\n`;
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
      const cols = data.cols as Array<{ width?: string; responsive?: Record<string, Record<string, unknown>> }>;
      const colSelBase = (nth: string) =>
        `[data-block-id="${block.id}"] > .block-columns > .block-columns__col-wrapper${nth},` +
        `[data-block-id="${block.id}"] > div > .block-columns > .block-columns__col-wrapper${nth}`;
      const colSel = colSelBase("");
      const tabletOverrides = responsive?.tablet ?? {};
      const mobileOverrides = responsive?.mobile ?? {};

      // Desktop stacking (uncommon, but supported)
      if (data.stack) {
        css += `${colSel} { width: 100% !important; padding-left: 0 !important; }\n`;
      }
      // Tablet: stack takes priority over per-column widths
      if (tabletOverrides["stack"]) {
        css += `${tabletQuery} { ${colSel} { width: 100% !important; padding-left: 0 !important; } }\n`;
      } else {
        css += colWidthCSS(block.id, cols, "tablet", tabletQuery);
      }
      // Mobile
      if (mobileOverrides["stack"]) {
        css += `${mobileQuery} { ${colSel} { width: 100% !important; padding-left: 0 !important; } }\n`;
      } else {
        css += colWidthCSS(block.id, cols, "mobile", mobileQuery);
      }

      // Per-column advanced CSS overrides (background, spacing, border, etc.) at each breakpoint
      cols.forEach((col, i) => {
        const colResponsive = col.responsive as Record<string, Record<string, unknown>> | undefined;
        const tabletColRules = colResponsive?.tablet ? wrapperRulesFor(colResponsive.tablet) : "";
        const mobileColRules = colResponsive?.mobile ? wrapperRulesFor(colResponsive.mobile) : "";
        if (tabletColRules) css += `${tabletQuery} { ${colSelBase(`:nth-child(${i + 1})`)} { ${tabletColRules} } }\n`;
        if (mobileColRules) css += `${mobileQuery} { ${colSelBase(`:nth-child(${i + 1})`)} { ${mobileColRules} } }\n`;
      });
    }

    if (responsive) {
      const sel = `[data-block-id="${block.id}"], [data-block-id="${block.id}"] *`;
      const wrapperSel = `[data-block-id="${block.id}"]`;
      const tabletRules = responsive.tablet ? rulesFor(responsive.tablet) : "";
      const mobileRules = responsive.mobile ? rulesFor(responsive.mobile) : "";
      const tabletWrapperRules = responsive.tablet ? wrapperRulesFor(responsive.tablet) : "";
      const mobileWrapperRules = responsive.mobile ? wrapperRulesFor(responsive.mobile) : "";
      if (tabletRules) css += `${tabletQuery} { ${sel} { ${tabletRules} } }\n`;
      if (mobileRules) css += `${mobileQuery} { ${sel} { ${mobileRules} } }\n`;
      if (tabletWrapperRules) css += `${tabletQuery} { ${wrapperSel} { ${tabletWrapperRules} } }\n`;
      if (mobileWrapperRules) css += `${mobileQuery} { ${wrapperSel} { ${mobileWrapperRules} } }\n`;
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
