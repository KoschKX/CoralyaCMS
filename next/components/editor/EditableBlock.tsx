"use client";

import { useCallback, useContext } from "react";
import { blockMap } from "@/blocks/index";
import BlockRenderer from "@/components/BlockRenderer";
import type { EditorBlock } from "@/lib/pages-db";
import type { EditableProps } from "@/lib/block-types";
import { useEditorViewport } from "@/components/editor/EditorHooks";
import { mergeViewportOverrides } from "@/lib/responsive-css";
import { BlockEditorContext } from "@/components/editor/BlockEditorContext";

export interface EditableBlockProps {
  block: EditorBlock;
  onUpdate: (newData: Record<string, unknown>) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  activeColIdx?: number | null;
  onActiveColChange?: (ci: number | null) => void;
  renderChildBlocks?: EditableProps["renderChildBlocks"];
}

function UnavailablePlaceholder({ type, reason }: { type: string; reason: "disabled" | "unknown" }) {
  const message = reason === "disabled"
    ? `Block "${type}" is disabled.`
    : `Block "${type}" is no longer available.`;
  return (
    <div
      role="note"
      aria-label={message}
      className="flex items-center gap-2 rounded border border-dashed border-zinc-300 bg-zinc-50 px-2 py-1 text-xs text-zinc-400"
      style={{ fontFamily: "monospace" }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
        <circle cx="12" cy="12" r="10"/>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
      </svg>
      {message}
    </div>
  );
}

/**
 * Thin dispatcher: delegates rendering to each block's own Editable component.
 * Falls back to the read-only Layout when no Editable is registered.
 *
 * Merges responsive viewport overrides into the data before passing it to the
 * Editable, so that JS-driven properties (like heading level, list style, column
 * widths) reflect the current breakpoint in the editor preview.
 *
 * The onUpdate wrapper strips back any top-level fields that were injected by
 * the viewport merge, preventing responsive overrides from corrupting the
 * desktop base values when the Editable saves content edits.
 */
export function EditableBlock({
  block,
  onUpdate,
  isSelected,
  onSelect,
  activeColIdx,
  onActiveColChange,
  renderChildBlocks,
}: EditableBlockProps) {
  const ctx = useContext(BlockEditorContext);
  const disabledBlocks = ctx?.disabledBlocks ?? [];
  const def = blockMap[block.type];
  const viewport = useEditorViewport();

  const blockData = block.data as Record<string, unknown>;

  // Wrap onUpdate: restore the original desktop values for any fields that were
  // injected by the viewport merge, so inline content edits (e.g. typing text)
  // don't accidentally overwrite desktop style values with responsive ones.
  // Must be declared before any conditional return to satisfy rules-of-hooks.
  const safeOnUpdate = useCallback(
    (newData: Record<string, unknown>) => {
      if (viewport === "desktop") {
        onUpdate(newData);
        return;
      }
      const responsive = (blockData.responsive as Record<string, Record<string, unknown>>) ?? {};
      const viewportOverrides = responsive[viewport] ?? {};
      const restored: Record<string, unknown> = { ...newData };
      for (const key of Object.keys(viewportOverrides)) {
        if (key in restored) {
          if (key in blockData) {
            restored[key] = blockData[key];
          } else {
            delete restored[key];
          }
        }
      }
      onUpdate(restored);
    },
    // blockData changes identity on every Immer update; using block.data
    // (same reference) instead to keep the dep array stable for text typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewport, onUpdate, block.data],
  );

  // Show placeholder for disabled or unregistered block types.
  if (disabledBlocks.includes(block.type)) {
    return <UnavailablePlaceholder type={block.type} reason="disabled" />;
  }
  if (!def) {
    return <UnavailablePlaceholder type={block.type} reason="unknown" />;
  }

  const displayData = mergeViewportOverrides(blockData, viewport);

  if (def.Editable) {
    return (
      <def.Editable
        data={displayData}
        onUpdate={safeOnUpdate}
        blockId={block.id}
        isSelected={isSelected}
        onSelect={onSelect}
        activeColIdx={activeColIdx}
        onActiveColChange={onActiveColChange}
        renderChildBlocks={renderChildBlocks}
      />
    );
  }

  // Fallback: render the Layout read-only for block types without an Editable (e.g. delimiter).
  return (
    <div className="pointer-events-none select-none">
      <def.Layout
        data={displayData}
        renderBlocks={(children) => <BlockRenderer blocks={children} />}
        blockId={block.id}
      />
    </div>
  );
}

