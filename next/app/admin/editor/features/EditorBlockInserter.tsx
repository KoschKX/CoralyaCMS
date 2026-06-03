"use client";

/**
 * EditorBlockInserter
 * ────────────────────
 * The left-side slide-in panel that lists available block types.
 * Shared between page and post editors.
 */

import { BlocksPanel } from "@/components/editor/BlocksPanel";

interface EditorBlockInserterProps {
  /** Whether the inserter is open (panel is fully visible). */
  open: boolean;
  /** The editor's current mode — inserter is hidden in code/inject modes. */
  mainMode: string;
  /** Called when the user picks a block type to insert. */
  onAdd: (type: string) => void;
}

export function EditorBlockInserter({ open, mainMode, onAdd }: EditorBlockInserterProps) {
  return (
    <aside
      aria-label="Block inserter"
      className={`shrink-0 overflow-hidden border-r border-zinc-200 bg-white transition-[width] duration-200 ease-in-out ${
        open && mainMode === "visual" ? "w-64" : "w-0"
      }`}
    >
      <div className="w-64">
        <BlocksPanel onAdd={onAdd} />
      </div>
    </aside>
  );
}
