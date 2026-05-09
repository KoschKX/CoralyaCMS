"use client";

import type { EditorBlock } from "@/lib/pages-db";
import type { EditableProps } from "@/lib/block-types";
import { getBlockWrapperProps } from "@/lib/block-advanced-css";
import { mergeViewportOverrides } from "@/lib/responsive-css";
import { useEditorViewport } from "@/components/editor/EditorHooks";

export function ColumnsEditable({
  data,
  onUpdate,
  activeColIdx,
  onActiveColChange,
  onSelect,
  renderChildBlocks,
}: EditableProps) {
  const cols = (data.cols as Array<{ blocks: EditorBlock[]; width?: string; responsive?: Record<string, { width?: string }> }>) ?? [];
  const editorViewport = useEditorViewport();

  return (
    <div
      className="block-columns"
      style={{ display: "flex", flexWrap: "wrap", alignItems: "stretch" }}
    >
      {cols.map((col, colIdx) => {
        const isColSelected = (activeColIdx ?? null) === colIdx;
        const colClass = `block-columns__col-wrapper${isColSelected ? " is-selected" : ""}`;
        const paddingLeft = cols.length > 1 && colIdx === 0 ? "0" : "0.75rem";
        const mergedCol = mergeViewportOverrides(col as Record<string, unknown>, editorViewport);
        const width = (mergedCol.width as string | undefined) || `${100 / (cols.length || 1)}%`;
        const { style: colStyle, extraClass: colExtraClass } = getBlockWrapperProps(mergedCol);

        return (
          <div
            key={colIdx}
            style={{ width, minHeight: 1, minWidth: 0, paddingLeft, paddingRight: "0.75rem", boxSizing: "border-box", ...colStyle }}
            className={`${colClass}${colExtraClass ? ` ${colExtraClass}` : ""}`}
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
