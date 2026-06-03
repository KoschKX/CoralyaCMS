/**
 * Column width resolution utilities.
 *
 * Three callsites previously duplicated the logic for resolving the effective
 * width of a column: EditableBlock (inline style), VisualEditor (col-toolbar
 * display), and responsive-css (CSS generation). This module is the single
 * source of truth.
 */

type ResponsiveOverrides = Record<string, Record<string, unknown>>;

/**
 * Preset column width fractions shown in the column resize picker.
 * Centralised here so both ColToolbar (editor UI) and block PanelControls
 * reference the same list without depending on each other.
 */
export const FRACTION_PRESETS = [
  { label: "Auto",  value: "" },
  { label: "1/6",   value: "16.667%" },
  { label: "1/5",   value: "20%" },
  { label: "1/4",   value: "25%" },
  { label: "1/3",   value: "33.333%" },
  { label: "2/5",   value: "40%" },
  { label: "1/2",   value: "50%" },
  { label: "3/5",   value: "60%" },
  { label: "2/3",   value: "66.667%" },
  { label: "3/4",   value: "75%" },
  { label: "5/6",   value: "83.333%" },
  { label: "Full",  value: "100%" },
] as const;

export type FractionPreset = (typeof FRACTION_PRESETS)[number];

/**
 * Resolve the stored width for a single column at the given viewport.
 * Returns `undefined` when no width is set — the caller supplies its own
 * fallback (e.g. "1fr" for CSS generation, or a percentage for inline style).
 */
export function resolveColWidth(
  col: { width?: string; responsive?: Record<string, { width?: string }> },
  viewport: string,
): string | undefined {
  if (viewport !== "desktop") {
    const override = col.responsive?.[viewport]?.width;
    if (override != null) return override || undefined;
  }
  return col.width || undefined;
}

/**
 * Resolve the effective inline display width for a column, including:
 *   - responsive stacking (returns "100%" when stacked at the given viewport)
 *   - per-viewport width overrides
 *   - fallback to equally-divided percentages
 *
 * Used by EditableBlock (columns branch) for inline `width` style.
 */
export function resolveColWidthForDisplay(
  col: { width?: string; responsive?: Record<string, { width?: string }> },
  blockResponsive: ResponsiveOverrides | undefined,
  viewport: string,
  totalCols: number,
  desktopStack: boolean,
): string {
  let isStacked: boolean;
  if (viewport !== "desktop" && blockResponsive?.[viewport] && "stack" in blockResponsive[viewport]) {
    isStacked = !!blockResponsive[viewport]["stack"];
  } else {
    isStacked = desktopStack;
  }
  if (isStacked) return "100%";
  return resolveColWidth(col, viewport) ?? `${100 / (totalCols || 1)}%`;
}
