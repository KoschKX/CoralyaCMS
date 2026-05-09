import type { CSSProperties } from "react";

/** Stored as `background` on block data. */
export interface BackgroundBlockData {
  bgColor?: string;
  bgImage?: string;       // URL
  bgSize?: string;        // cover | contain | auto | custom
  bgPosition?: string;    // center | top | bottom | left | right | custom
  bgRepeat?: string;      // no-repeat | repeat | repeat-x | repeat-y
}

/** Stored as `spacing` on block data. */
export interface SpacingBlockData {
  pt?: string; pr?: string; pb?: string; pl?: string;
  mt?: string; mr?: string; mb?: string; ml?: string;
}

/** Stored as `border` on block data. */
export interface BorderBlockData {
  color?: string; width?: string; style?: string; radius?: string;
}

/** Stored as `advanced` on block data. */
export interface AdvancedBlockData {
  cssClass?: string;
  cssId?: string;
}

/** Stored as `display` on block data. */
export interface DisplayBlockData {
  display?: string;
  // flex
  flexDirection?: string;
  flexWrap?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: string;
  // grid
  gridTemplateColumns?: string;
  gridGap?: string;
}

export function getBackgroundData(data: Record<string, unknown>): BackgroundBlockData {
  return (data.background as BackgroundBlockData) ?? {};
}
export function getSpacingData(data: Record<string, unknown>): SpacingBlockData {
  return (data.spacing as SpacingBlockData) ?? {};
}
export function getBorderData(data: Record<string, unknown>): BorderBlockData {
  return (data.border as BorderBlockData) ?? {};
}
export function getAdvancedData(data: Record<string, unknown>): AdvancedBlockData {
  return (data.advanced as AdvancedBlockData) ?? {};
}
export function getDisplayData(data: Record<string, unknown>): DisplayBlockData {
  return (data.display as DisplayBlockData) ?? {};
}

/**
 * Returns wrapper element props derived from the four sub-objects.
 * Called in BlockRenderer (frontend) and BlockItem (editor).
 */
export function getBlockWrapperProps(data: Record<string, unknown>): {
  style: CSSProperties;
  /** Space-separated extra class names, or empty string. */
  extraClass: string;
  /** HTML id attribute value, or undefined when not set. */
  id: string | undefined;
} {
  const background = getBackgroundData(data);
  const spacing    = getSpacingData(data);
  const border     = getBorderData(data);
  const display    = getDisplayData(data);
  const adv        = getAdvancedData(data);
  const style: CSSProperties = {};

  if (background.bgColor) style.backgroundColor = background.bgColor;
  if (background.bgImage === "none") {
    style.backgroundImage = "none";
  } else if (background.bgImage) {
    style.backgroundImage = `url(${background.bgImage})`;
    style.backgroundSize     = background.bgSize     || "cover";
    style.backgroundPosition = background.bgPosition || "center";
    style.backgroundRepeat   = (background.bgRepeat  || "no-repeat") as CSSProperties["backgroundRepeat"];
  }

  if (spacing.pt) style.paddingTop    = spacing.pt;
  if (spacing.pr) style.paddingRight  = spacing.pr;
  if (spacing.pb) style.paddingBottom = spacing.pb;
  if (spacing.pl) style.paddingLeft   = spacing.pl;

  if (spacing.mt) style.marginTop    = spacing.mt;
  if (spacing.mr) style.marginRight  = spacing.mr;
  if (spacing.mb) style.marginBottom = spacing.mb;
  if (spacing.ml) style.marginLeft   = spacing.ml;

  const hasBorder = border.color || border.width || border.style;
  if (hasBorder) {
    style.borderWidth = border.width || "1px";
    style.borderStyle = (border.style || "solid") as CSSProperties["borderStyle"];
    style.borderColor = border.color || "currentColor";
  }
  if (border.radius) style.borderRadius = border.radius;

  if (display.display) style.display = display.display as CSSProperties["display"];
  if (display.display === "flex" || display.display === "inline-flex") {
    if (display.flexDirection)  style.flexDirection  = display.flexDirection  as CSSProperties["flexDirection"];
    if (display.flexWrap)       style.flexWrap       = display.flexWrap       as CSSProperties["flexWrap"];
    if (display.justifyContent) style.justifyContent = display.justifyContent as CSSProperties["justifyContent"];
    if (display.alignItems)     style.alignItems     = display.alignItems     as CSSProperties["alignItems"];
    if (display.gap)            style.gap            = display.gap;
  }
  if (display.display === "grid" || display.display === "inline-grid") {
    if (display.gridTemplateColumns) style.gridTemplateColumns = display.gridTemplateColumns;
    if (display.gridGap)             style.gap                = display.gridGap;
  }

  return {
    style,
    extraClass: adv.cssClass ?? "",
    id: adv.cssId || undefined,
  };
}

/** Returns true when any block-level CSS override is set. */
export function hasAdvancedStyles(data: Record<string, unknown>): boolean {
  return [
    ...Object.values(getBackgroundData(data)),
    ...Object.values(getSpacingData(data)),
    ...Object.values(getBorderData(data)),
    ...Object.values(getDisplayData(data)),
    ...Object.values(getAdvancedData(data)),
  ].some((v) => !!v);
}
