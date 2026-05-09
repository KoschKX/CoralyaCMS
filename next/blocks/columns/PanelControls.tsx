"use client";

import { useState, useContext } from "react";
import { PanelSection } from "@/components/ui/PanelSection";
import { ViewportContext } from "@/components/ui/ViewportContext";
import type { EditorBlock } from "@/lib/pages-db";
import { FRACTION_PRESETS } from "./fraction-presets";

type ColResponsive = Record<string, { width?: string }>;
type Col = { blocks: EditorBlock[]; width?: string; responsive?: ColResponsive };

function getColWidth(col: Col, viewport: string): string {
  if (viewport !== "desktop") {
    const override = col.responsive?.[viewport]?.width;
    if (override != null && override !== "") return override;
  }
  return col.width ?? "";
}

interface Props {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export default function ColumnsPanelControls({ data, onChange }: Props) {
  const { viewport } = useContext(ViewportContext);
  const isResponsive = viewport !== "desktop";
  const parentViewport = viewport === "mobile" ? "tablet" : "desktop";
  const cols = (data.cols as Col[]) ?? [];
  const selectedColIdx = typeof data.__selectedColIdx === "number" ? data.__selectedColIdx : null;
  const [customWidths, setCustomWidths] = useState<string[]>(
    cols.map((col) => getColWidth(col, viewport))
  );

  function setWidth(colIdx: number, w: string) {
    if (viewport === "desktop") {
      const newCols = cols.map((c, ci) =>
        ci === colIdx ? { ...c, width: w || undefined } : c
      );
      onChange({ ...data, cols: newCols });
    } else {
      const newCols = cols.map((c, ci) => {
        if (ci !== colIdx) return c;
        const resp = { ...(c.responsive ?? {}) };
        resp[viewport] = { ...(resp[viewport] ?? {}), width: w || undefined };
        return { ...c, responsive: resp };
      });
      onChange({ ...data, cols: newCols });
    }
  }

  function addCol() {
    const newCols = [...cols, { blocks: [], width: undefined }];
    onChange({ ...data, cols: newCols });
    setCustomWidths((prev) => [...prev, ""]);
  }

  function removeCol(colIdx: number) {
    if (cols.length <= 1) return;
    const newCols = cols.filter((_, ci) => ci !== colIdx);
    onChange({ ...data, cols: newCols });
    setCustomWidths((prev) => prev.filter((_, ci) => ci !== colIdx));
  }


  return (
    <div className="space-y-5">
      {selectedColIdx === null && (
        <>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Columns</p>
            <span className="text-xs text-zinc-500">
              {cols.length} column{cols.length !== 1 ? "s" : ""}
            </span>
          </div>
          <PanelSection title="Stack columns" fields={["stack"]}>
            <div className="flex items-center">
              <label className="text-xs text-zinc-500 mr-2">Stack columns</label>
              <input
                type="checkbox"
                checked={!!data.stack}
                onChange={e => {
                  if (viewport === "desktop") {
                    onChange({ ...data, stack: e.target.checked || undefined });
                  } else {
                    onChange({ stack: e.target.checked || null });
                  }
                }}
                className="h-4 w-4"
              />
            </div>
          </PanelSection>
        </>
      )}

      {selectedColIdx !== null && (() => {
        const colIdx = selectedColIdx;
        const col = cols[colIdx];
        const currentWidth = col ? getColWidth(col, viewport) : "";
        const inheritedWidth = col && isResponsive ? getColWidth(col, parentViewport) : null;
        const isWidthEnabled = !col ? true : !!col.responsive?.[viewport]?.width;
        function toggleColWidth() {
          if (!col) return;
          const newCols = cols.map((c, ci) => {
            if (ci !== colIdx) return c;
            const resp = { ...(c.responsive ?? {}) };
            if (resp[viewport]?.width) {
              const { width: _w, ...rest } = resp[viewport];
              resp[viewport] = rest;
            } else {
              resp[viewport] = { ...(resp[viewport] ?? {}), width: c.width ?? "" };
            }
            return { ...c, responsive: resp };
          });
          onChange({ ...data, cols: newCols });
        }
        return (
          <PanelSection
            key={colIdx}
            title={`Column ${colIdx + 1}`}
            isEnabledOverride={isWidthEnabled}
            onToggleOverride={toggleColWidth}
          >
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {FRACTION_PRESETS.map((p) => {
                  const isSelected = currentWidth === p.value;
                  const isBlue = inheritedWidth !== null && p.value === inheritedWidth;
                  return (
                    <button
                      key={p.label}
                      onClick={() => {
                        setWidth(colIdx, p.value);
                        setCustomWidths((prev) => {
                          const next = [...prev];
                          next[colIdx] = p.value;
                          return next;
                        });
                      }}
                      className={`rounded border px-2 py-0.5 text-xs transition ${
                        isBlue
                          ? "border-blue-400 border-dashed bg-white text-blue-500"
                          : isSelected
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={customWidths[colIdx] ?? currentWidth ?? ""}
                  onChange={(e) =>
                    setCustomWidths((prev) => {
                      const next = [...prev];
                      next[colIdx] = e.target.value;
                      return next;
                    })
                  }
                  placeholder={isResponsive && !col?.responsive?.[viewport]?.width ? "—" : "e.g. 40% or 2fr"}
                  className="flex-1 rounded border border-zinc-200 px-2 py-1 text-xs focus:outline-none focus:border-zinc-400"
                />
                <button
                  onClick={() => setWidth(colIdx, customWidths[colIdx] ?? "")}
                  className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
                >
                  OK
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addCol}
                  className="rounded border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-50"
                >
                  + Add column
                </button>
                {cols.length > 1 && (
                  <button
                    onClick={() => removeCol(colIdx)}
                    className="rounded border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 transition"
                  >
                    Remove column
                  </button>
                )}
              </div>
            </div>
          </PanelSection>
        );
      })()}
    </div>
  );
}
