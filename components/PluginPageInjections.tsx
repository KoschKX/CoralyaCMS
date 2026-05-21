/**
 * PluginPageInjections (Server Component)
 * ───────────────────────────────────────
 * Runs the "page.html" filter chain on each public page render and injects
 * the resulting HTML (e.g. <script> tags added by plugins) into the page.
 *
 * Designed for injection-style plugins (analytics snippets, alert scripts,
 * tracking pixels, etc.).  The filter receives an empty string as its
 * starting value; callbacks that append to it produce the injected content.
 *
 * This is a Server Component — it must NOT be used inside a Client Component.
 */

import "@/plugins/index";
import { applyPageHtml } from "@/filters/page-html";

interface Props {
  /** The page slug (e.g. "about", "" for home). Forwarded to filter callbacks. */
  slug: string;
}

export function PluginPageInjections({ slug }: Props) {
  const injected = applyPageHtml("", { slug });
  if (!injected) return null;
  return <div dangerouslySetInnerHTML={{ __html: injected }} />;
}
