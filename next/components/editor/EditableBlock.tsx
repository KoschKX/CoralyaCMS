"use client";

import { useCallback } from "react";
import { blockMap } from "@/blocks/index";
import BlockRenderer from "@/components/BlockRenderer";
import type { EditorBlock } from "@/lib/pages-db";
import type { EditableProps } from "@/lib/block-types";
import { setEditableBlockComponent } from "@/blocks/columns/editable";
import { useEditorViewport } from "@/components/editor/EditorHooks";
import { mergeViewportOverrides } from "@/lib/responsive-css";

export interface EditableBlockProps {
  block: EditorBlock;
  onUpdate: (newData: Record<string, unknown>) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  activeColIdx?: number | null;
  onActiveColChange?: (ci: number | null) => void;
  renderChildBlocks?: EditableProps["renderChildBlocks"];
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
  const def = blockMap[block.type];
  const viewport = useEditorViewport();

  const blockData = block.data as Record<string, unknown>;
  const displayData = mergeViewportOverrides(blockData, viewport);

  // Wrap onUpdate: restore the original desktop values for any fields that were
  // injected by the viewport merge, so inline content edits (e.g. typing text)
  // don't accidentally overwrite desktop style values with responsive ones.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewport, blockData, onUpdate],
  );

  if (!def) return null;

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

// Break the circular dependency: ColumnsEditable needs EditableBlock for its
// renderChildBlocks fallback, but can't import it directly (circular). We
// register the component after both modules have loaded.
setEditableBlockComponent(EditableBlock);

