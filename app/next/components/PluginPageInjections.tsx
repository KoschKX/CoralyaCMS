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

import "@/plugins";
import { applyPageHtml } from "@/filters/page-html";
import { ScriptInjector } from "@/components/ScriptInjector";

interface Props {
  /** The page slug (e.g. "about", "" for home). Forwarded to filter callbacks. */
  slug: string;
}

export function PluginPageInjections({ slug }: Props) {
  const injected = applyPageHtml("", { slug });
  if (!injected) return null;

  // Extract <script> bodies and pass them to ScriptInjector (a Client Component
  // that uses useEffect + document.createElement to run them).  React never
  // executes scripts — not via dangerouslySetInnerHTML, not even on a <script>
  // element — during client-side navigation.  ScriptInjector fires on every
  // page mount so scripts run on both SSR-driven initial loads and client-side
  // route transitions.
  const scripts: string[] = [];
  const rest = injected.replace(
    /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
    (_, content: string) => { scripts.push(content); return ""; },
  );

  return (
    <>
      {rest && <div dangerouslySetInnerHTML={{ __html: rest }} />}
      {scripts.length > 0 && <ScriptInjector key={slug} scripts={scripts} />}
    </>
  );
}
