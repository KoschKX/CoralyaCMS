"use client";

import { useState } from "react";
import { PanelSection } from "@/components/block-shared";
import type { EditorBlock } from "@/lib/pages-db";



// Helper for per-column responsive width
function getColWidth(data: Record<string, any>, colIdx: number) {
  // Responsive: look for responsive[viewport][`col-${colIdx}-width`]
  if (data.responsive && typeof data.responsive === "object") {
    const viewport = typeof window !== "undefined" && window.__EDITOR_VIEWPORT__;
    if (viewport && viewport !== "desktop") {
      const overrides = data.responsive[viewport] || {};
      const key = `col-${colIdx}-width`;
      if (key in overrides) return overrides[key];
    }
  }
  // Fallback to cols[colIdx].width
  const cols = (data.cols as Col[]) ?? [];
  return cols[colIdx]?.width ?? "";
}

// Helper to get the correct value for a field, considering responsive overrides
function getResponsiveValue(data: Record<string, any>, field: string) {
  if (data.responsive && typeof data.responsive === "object") {
    const viewport = typeof window !== "undefined" && window.__EDITOR_VIEWPORT__;
    if (viewport && viewport !== "desktop") {
      const overrides = data.responsive[viewport] || {};
      if (field in overrides) return overrides[field];
    }
  }
  return data[field];
}

const FRACTION_PRESETS = [
  { label: "Auto", value: "" },
  { label: "1/6",  value: "16.667%" },
  { label: "1/5",  value: "20%" },
  { label: "1/4",  value: "25%" },
  { label: "1/3",  value: "33.333%" },
  { label: "2/5",  value: "40%" },
  { label: "1/2",  value: "50%" },
  { label: "3/5",  value: "60%" },
  { label: "2/3",  value: "66.667%" },
  { label: "3/4",  value: "75%" },
  { label: "5/6",  value: "83.333%" },
  { label: "Full", value: "100%" },
];

type Col = { blocks: EditorBlock[]; width?: string };

interface Props {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export default function ColumnsPanelControls({ data, onChange }: Props) {
  const cols = (data.cols as Col[]) ?? [];
  const [customWidths, setCustomWidths] = useState<string[]>(
    cols.map((c) => c.width ?? "")
  );

  function updateCols(newCols: Col[]) {
    onChange({ ...data, cols: newCols });
  }

  function setWidth(colIdx: number, w: string) {
    const newCols = cols.map((c, ci) =>
      ci === colIdx ? { ...c, width: w || undefined } : c
    );
    updateCols(newCols);
  }

  function addCol() {
    updateCols([...cols, { blocks: [], width: undefined }]);
    setCustomWidths((prev) => [...prev, ""]);
  }

  function removeCol(colIdx: number) {
    if (cols.length <= 1) return;
    updateCols(cols.filter((_, ci) => ci !== colIdx));
    setCustomWidths((prev) => prev.filter((_, ci) => ci !== colIdx));
  }


  return (
    <div className="space-y-5">
      <PanelSection title="Columns">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            {cols.length} column{cols.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={addCol}
            className="rounded border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-50"
          >
            + Add column
          </button>
        </div>
      </PanelSection>
      <PanelSection title="Stack columns" fields={["stack"]}>
        <div className="flex items-center">
          <label className="text-xs text-zinc-500 mr-2">Stack columns</label>
          <input
            type="checkbox"
            checked={!!getResponsiveValue(data, "stack")}
            onChange={e => onChange({ ...data, stack: e.target.checked })}
            className="h-4 w-4"
          />
        </div>
      </PanelSection>

      {cols.map((col, colIdx) => (
        <PanelSection
          key={colIdx}
          title={`Column ${colIdx + 1}`}
          fields={[`col-${colIdx}-width`]}
        >
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {FRACTION_PRESETS.map((p) => (
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
                    getColWidth(data, colIdx) === p.value
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                type="text"
                value={customWidths[colIdx] ?? getColWidth(data, colIdx) ?? ""}
                onChange={(e) =>
                  setCustomWidths((prev) => {
                    const next = [...prev];
                    next[colIdx] = e.target.value;
                    return next;
                  })
                }
                placeholder="e.g. 40% or 2fr"
                className="flex-1 rounded border border-zinc-200 px-2 py-1 text-xs focus:outline-none focus:border-zinc-400"
              />
              <button
                onClick={() => setWidth(colIdx, customWidths[colIdx] ?? "")}
                className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
              >
                OK
              </button>
            </div>
            {cols.length > 1 && (
              <button
                onClick={() => removeCol(colIdx)}
                className="rounded border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 transition"
              >
                Remove column
              </button>
            )}
          </div>
        </PanelSection>
      ))}
    </div>
  );
}
