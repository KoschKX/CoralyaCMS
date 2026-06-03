"use client";

import type { EditorBlock } from "@/lib/pages-db";
import type { EditableProps } from "@/lib/block-types";

export function ColumnsEditable({
  data,
  onUpdate,
  activeColIdx,
  onActiveColChange,
  onSelect,
  renderChildBlocks,
}: EditableProps) {
  const cols = (data.cols as Array<{ blocks: EditorBlock[]; width?: string; responsive?: Record<string, { width?: string }> }>) ?? [];

  return (
    <div
      className="block-columns"
      style={{ display: "flex", flexWrap: "wrap", alignItems: "stretch" }}
    >
      {cols.map((col, colIdx) => {
        const isColSelected = (activeColIdx ?? null) === colIdx;
        const colClass = `block-columns__col-wrapper${isColSelected ? " is-selected" : ""}`;
        const paddingLeft = cols.length > 1 && colIdx === 0 ? "0" : "0.75rem";
        const width = col.width || `${100 / (cols.length || 1)}%`;

        return (
          <div
            key={colIdx}
            style={{ width, minHeight: 1, minWidth: 0, paddingLeft, paddingRight: "0.75rem", boxSizing: "border-box" }}
            className={colClass}
            onClick={(e) => { e.stopPropagation(); onActiveColChange?.(colIdx); onSelect?.(); }}
          >
            <div className="block-columns__col min-w-0 relative rounded transition cursor-pointer">
              {renderChildBlocks?.(
                col.blocks ?? [],
                (newBlocks) => {
                  onUpdate({ ...data, cols: cols.map((c, ci) => ci === colIdx ? { ...c, blocks: newBlocks } : c) });
                },
                colIdx,
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
