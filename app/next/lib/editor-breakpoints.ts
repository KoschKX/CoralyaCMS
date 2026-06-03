import { DEFAULT_LAYOUT } from "@/lib/settings-types";

/**
 * Returns the tablet and mobile breakpoints for the editor.
 *
 * On the server the DEFAULT_LAYOUT fallback is used (server-side callers that
 * need actual settings should call getSettings() directly).
 *
 * On the client, breakpoints are read from the CSS custom properties that
 * layout.tsx injects onto :root (--breakpoint-tablet, --breakpoint-mobile).
 * This avoids importing the Node-only `settings-db` module into client bundles.
 */
export function getEditorBreakpoints(): { tablet: string; mobile: string } {
  if (typeof window !== "undefined") {
    const style = getComputedStyle(document.documentElement);
    const tablet = style.getPropertyValue("--breakpoint-tablet").trim();
    const mobile = style.getPropertyValue("--breakpoint-mobile").trim();
    return {
      tablet: tablet || DEFAULT_LAYOUT.breakpoints.tablet,
      mobile: mobile || DEFAULT_LAYOUT.breakpoints.mobile,
    };
  }

  return {
    tablet: DEFAULT_LAYOUT.breakpoints.tablet,
    mobile: DEFAULT_LAYOUT.breakpoints.mobile,
  };
}
