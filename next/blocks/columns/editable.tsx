"use client";

import type { EditorBlock } from "@/lib/pages-db";
import { useEditorViewport } from "@/components/editor/EditorHooks";
import { resolveColWidthForDisplay } from "@/lib/editor/col-width";
import type { EditableProps } from "@/lib/block-types";

/**
 * ColumnsEditable
 * ───────────────
 * Renders N resizable columns in editor mode. Child block rendering is
 * delegated entirely to the `renderChildBlocks` prop, which is always
 * provided by `BlockItem` when this component is rendered inside the editor.
 *
 * The previous fallback that used a module-level `EditableBlockComponent`
 * ref (to break a circular import) has been removed — it was dead code
 * because `BlockItem` unconditionally passes `renderChildBlocks` for
 * columns blocks.
 */
export function ColumnsEditable({
  data,
  onUpdate,
  activeColIdx,
  onActiveColChange,
  onSelect,
  renderChildBlocks,
}: EditableProps) {
  const mediaViewport = useEditorViewport();
  const cols = (data.cols as Array<{ blocks: EditorBlock[]; width?: string }>) ?? [];
  const colsResponsive = (data.responsive as Record<string, Record<string, unknown>>) ?? {};

  return (
    <div className="block-columns-wrapper">
      <div className="block-columns-inline-row" style={{ width: "100%", whiteSpace: "normal", fontSize: 0 }}>
        {cols.map((col, colIdx) => {
          const isColSelected = (activeColIdx ?? null) === colIdx;
          const colClass = `block-columns__col-wrapper${isColSelected ? " is-selected" : ""}`;
          const paddingLeft = cols.length > 1 && colIdx === 0 ? "0" : "0.75rem";
          const width = resolveColWidthForDisplay(col, colIdx, colsResponsive, mediaViewport, cols.length, !!(data.stack));

          return (
            <div
              key={colIdx}
              style={{
                display: "inline-block",
                verticalAlign: "top",
                width,
                minHeight: 1,
                minWidth: 0,
                paddingLeft,
                paddingRight: "0.75rem",
                boxSizing: "border-box",
                fontSize: "initial",
              }}
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
    </div>
  );
}
