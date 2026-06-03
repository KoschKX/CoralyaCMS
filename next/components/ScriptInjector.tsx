"use client";

import { useEffect } from "react";

interface Props {
  /** Inline script bodies to execute (no <script> wrapper). */
  scripts: string[];
}

/**
 * ScriptInjector (Client Component)
 * ──────────────────────────────────
 * Executes inline script strings on every page visit, including client-side
 * navigation.
 *
 * `<script dangerouslySetInnerHTML>` rendered by React (even in Server
 * Components) NEVER executes during client-side navigation — React does not
 * run scripts; only the initial full-page SSR HTML does.  This component
 * uses `useEffect` + `document.createElement("script")` so scripts fire on
 * mount, which happens on every page visit whether the page was server-
 * rendered or reached via Next.js client-side routing.
 */
export function ScriptInjector({ scripts }: Props) {
  useEffect(() => {
    for (const src of scripts) {
      const el = document.createElement("script");
      el.textContent = src;
      // Appending a <script> to the DOM triggers synchronous execution for
      // inline scripts, then we clean it up immediately.
      document.head.appendChild(el);
      el.remove();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
