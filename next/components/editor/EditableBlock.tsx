"use client";

import { blockMap } from "@/blocks/index";
import BlockRenderer from "@/components/BlockRenderer";
import type { EditorBlock } from "@/lib/pages-db";
import type { EditableProps } from "@/lib/block-types";
import { setEditableBlockComponent } from "@/blocks/columns/editable";

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
  if (!def) return null;

  if (def.Editable) {
    return (
      <def.Editable
        data={block.data as Record<string, unknown>}
        onUpdate={onUpdate}
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
        data={block.data as Record<string, unknown>}
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

