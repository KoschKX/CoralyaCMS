"use client";

import type React from "react";
import { CE } from "@/components/editor/ContentEditable";
import type { EditableProps } from "@/lib/block-types";
import "./styles.css";

/** Mirrors the sanitizeColor logic from layout.tsx. */
function sanitizeCssColor(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const val = raw.trim();
  if (/^(#[0-9a-f]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|[a-z]+)$/i.test(val))
    return val;
  return undefined;
}

function wrapperClass(align: string): string {
  if (align === "center") return "block-button-wrap block-button-wrap-center";
  if (align === "right")  return "block-button-wrap block-button-wrap-right";
  return "block-button-wrap";
}

/**
 * Editor-mode button.
 * Renders the styled button using the same CSS as the layout but replaces
 * the text span with a ContentEditable so the label can be edited inline.
 * Uses a <span role="button"> wrapper instead of <a> to prevent navigation.
 */
export function ButtonEditable({ data, onUpdate, blockId }: EditableProps) {
  const text         = (data.text         as string) || "Button";
  const type         = (["flat", "outline", "transparent", "3d", "link"] as const)
    .includes(data.type as never) ? (data.type as string) : "flat";
  const size         = (["small", "medium", "large", "xlarge"] as const)
    .includes(data.size as never) ? (data.size as string) : "medium";
  const align        = (data.align        as string) || "left";
  const stretch      = Boolean(data.stretch);
  const icon         = typeof data.icon === "string" ? data.icon.trim() : "";
  const iconPosition = (data.iconPosition as string) === "right" ? "right" : "left";
  const borderRadius = typeof data.borderRadius === "string" && data.borderRadius.trim()
    ? data.borderRadius.trim() : undefined;

  const cssVars: Record<string, string> = {};
  const bg          = sanitizeCssColor(data.bgColor);
  const color       = sanitizeCssColor(data.textColor);
  const border      = sanitizeCssColor(data.borderColor);
  const hoverBg     = sanitizeCssColor(data.hoverBgColor);
  const hoverColor  = sanitizeCssColor(data.hoverTextColor);
  const hoverBorder = sanitizeCssColor(data.hoverBorderColor);
  if (bg)           cssVars["--btn-bg"]           = bg;
  if (color)        cssVars["--btn-color"]        = color;
  if (border)       cssVars["--btn-border"]       = border;
  if (hoverBg)      cssVars["--btn-hover-bg"]     = hoverBg;
  if (hoverColor)   cssVars["--btn-hover-color"]  = hoverColor;
  if (hoverBorder)  cssVars["--btn-hover-border"] = hoverBorder;
  if (borderRadius) cssVars["--btn-radius"]       = borderRadius;

  const btnClasses = [
    "coralya-btn",
    `coralya-btn-${type}`,
    `coralya-btn-${size}`,
    stretch ? "coralya-btn-stretch" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={wrapperClass(align)} data-block-id={blockId}>
      {/* span role="button" prevents real navigation in the editor */}
      <span
        role="button"
        className={btnClasses}
        style={cssVars as React.CSSProperties}
        tabIndex={-1}
      >
        {icon && iconPosition === "left" && (
          <i className={icon} aria-hidden="true" />
        )}
        <CE
          as="span"
          html={text}
          onSave={(val) => onUpdate({ ...data, text: val || "Button" })}
          className="coralya-btn-text focus:outline-none"
        />
        {icon && iconPosition === "right" && (
          <i className={icon} aria-hidden="true" />
        )}
      </span>
    </div>
  );
}
