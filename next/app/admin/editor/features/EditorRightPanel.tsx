"use client";

/**
 * EditorRightPanel
 * ──────────────────
 * The animated right-side settings panel wrapper.
 * Accepts children rendered inside the sticky scroll container.
 * Shared between page and post editors.
 */

import type { ReactNode } from "react";

interface EditorRightPanelProps {
  /** Whether the panel is open (visible). */
  open: boolean;
  children: ReactNode;
}

export function EditorRightPanel({ open, children }: EditorRightPanelProps) {
  return (
    <aside
      aria-label="Editor settings"
      className={`shrink-0 overflow-hidden border-l border-zinc-200 bg-white transition-[width] duration-200 ease-in-out ${
        open ? "w-72" : "w-0"
      }`}
    >
      <div className="sticky top-0 h-[calc(100vh-3rem)] w-72 overflow-y-auto">
        {children}
      </div>
    </aside>
  );
}
