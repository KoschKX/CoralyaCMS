import type React from "react";
import "./styles.css";
import type { BlockLayoutProps } from "@/lib/block-types";

/** Only allow http/https URLs and root-relative paths. */
function sanitizeUrl(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) return "#";
  const val = raw.trim();
  if (val.startsWith("/") || val.startsWith("#")) return val;
  try {
    const url = new URL(val);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch {
    // fall through
  }
  return "#";
}

/**
 * Accept only simple color values — hex, rgb(), rgba(), hsl(), or a CSS
 * named color. Rejects anything that looks like it could be CSS injection.
 */
function sanitizeColor(raw: unknown): string | undefined {
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

export default function ButtonLayout({ data, blockId }: BlockLayoutProps) {
  const text         = (data.text         as string) || "Button";
  const url          = sanitizeUrl(data.url);
  const target       = (data.target       as string) === "_blank" ? "_blank" : "_self";
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
  const bg          = sanitizeColor(data.bgColor);
  const color       = sanitizeColor(data.textColor);
  const border      = sanitizeColor(data.borderColor);
  const hoverBg     = sanitizeColor(data.hoverBgColor);
  const hoverColor  = sanitizeColor(data.hoverTextColor);
  const hoverBorder = sanitizeColor(data.hoverBorderColor);
  if (bg)          cssVars["--btn-bg"]           = bg;
  if (color)       cssVars["--btn-color"]        = color;
  if (border)      cssVars["--btn-border"]       = border;
  if (hoverBg)     cssVars["--btn-hover-bg"]     = hoverBg;
  if (hoverColor)  cssVars["--btn-hover-color"]  = hoverColor;
  if (hoverBorder) cssVars["--btn-hover-border"] = hoverBorder;
  if (borderRadius) cssVars["--btn-radius"]      = borderRadius;

  const rel = target === "_blank" ? "noopener noreferrer" : undefined;

  const btnClasses = [
    "coralya-btn",
    `coralya-btn-${type}`,
    `coralya-btn-${size}`,
    stretch ? "coralya-btn-stretch" : "",
  ].filter(Boolean).join(" ");

  return (
    <div
      className={wrapperClass(align)}
      data-block-id={blockId}
    >
      <a
        href={url}
        target={target}
        rel={rel}
        className={btnClasses}
        style={cssVars as React.CSSProperties}
      >
        {icon && iconPosition === "left" && (
          <i className={icon} aria-hidden="true" />
        )}
        <span className="coralya-btn-text">{text}</span>
        {icon && iconPosition === "right" && (
          <i className={icon} aria-hidden="true" />
        )}
      </a>
    </div>
  );
}
