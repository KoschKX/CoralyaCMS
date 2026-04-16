"use client";

import type { EditorBlock } from "@/lib/pages-db";
import { useMediaViewport } from "@/components/editor/EditorHooks";
import { resolveColWidthForDisplay } from "@/lib/editor/col-width";
import type { EditableProps } from "@/lib/block-types";

// Forward-declared to avoid a circular import — EditableBlock imports this
// file, and this file needs EditableBlock for the renderChildBlocks fallback.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let EditableBlockComponent: React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setEditableBlockComponent(c: React.ComponentType<any>) {
  EditableBlockComponent = c;
}

export function ColumnsEditable({
  data,
  onUpdate,
  activeColIdx,
  onActiveColChange,
  onSelect,
  renderChildBlocks,
}: EditableProps) {
  const mediaViewport = useMediaViewport();
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
                {renderChildBlocks
                  ? renderChildBlocks(
                      col.blocks ?? [],
                      (newBlocks) => {
                        onUpdate({ ...data, cols: cols.map((c, ci) => ci === colIdx ? { ...c, blocks: newBlocks } : c) });
                      },
                      colIdx,
                    )
                  : (col.blocks ?? []).map((childBlock) =>
                      EditableBlockComponent ? (
                        <EditableBlockComponent
                          key={childBlock.id}
                          block={childBlock}
                          onUpdate={(newData: Record<string, unknown>) => {
                            onUpdate({
                              ...data,
                              cols: cols.map((c, ci) =>
                                ci === colIdx
                                  ? { ...c, blocks: c.blocks.map((b) => b.id === childBlock.id ? { ...b, data: newData } : b) }
                                  : c,
                              ),
                            });
                          }}
                          activeColIdx={isColSelected ? null : undefined}
                        />
                      ) : null,
                    )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
