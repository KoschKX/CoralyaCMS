
"use client";

// Helper to get column width, supporting responsive overrides
function getColWidth(colIdx: number, vp: string, colWidths: string[], responsive: Record<string, Record<string, string>>): string {
  if (vp !== "desktop") {
    const key = `col-${colIdx}-width`;
    const vpOverrides = responsive[vp];
    if (vpOverrides && key in vpOverrides) return vpOverrides[key] || "1fr";
  }
  return colWidths[colIdx] || "1fr";
}


import { useState, useEffect } from "react";

import type { ReactNode } from "react";

interface ColumnsGridProps {
  colWidths: string[];
  responsive: Record<string, Record<string, string>>;
  children: ReactNode;
  selectedColIdx?: number;
  stack?: boolean;
}

export default function ColumnsGrid({ colWidths, responsive, children, selectedColIdx, stack }: ColumnsGridProps) {

  // Detect if we're in the editor by checking for window.__EDITOR_VIEWPORT__
  const [editorViewport, setEditorViewport] = useState<string>(
    typeof window !== "undefined" && window.__EDITOR_VIEWPORT__
      ? window.__EDITOR_VIEWPORT__
      : "desktop"
  );

  useEffect(() => {
    function onViewportChange(e: Event) {
      setEditorViewport((e as CustomEvent<string>).detail ?? "desktop");
    }
    window.addEventListener("editor-viewport-change", onViewportChange);
    return () => window.removeEventListener("editor-viewport-change", onViewportChange);
  }, []);

  // Render all columns in a single inline-block container for natural wrapping
  const childArray = Array.isArray(children) ? children : [children];
  // Check if stack is enabled: desktop uses top-level stack prop; other viewports check responsive overrides first
  const stackActive = (() => {
    if (editorViewport !== "desktop") {
      const vpOverrides = responsive[editorViewport];
      if (vpOverrides && "stack" in vpOverrides) return !!vpOverrides["stack"];
    }
    return !!stack;
  })();
  const widths = stackActive
    ? childArray.map(() => "100%")
    : colWidths.map((_, i) => getColWidth(i, editorViewport, colWidths, responsive));
  return (
    <div className="block-columns-wrapper">
      <div className="block-columns-inline-row" style={{ width: '100%', whiteSpace: 'normal', fontSize: 0 }}>
        {childArray.map((child, i) => (
          <div
            key={i}
            style={{
              display: 'inline-block',
              verticalAlign: 'top',
              width: widths[i],
              minHeight: 1,
              minWidth: 0,
              paddingLeft: i === 0 ? 0 : '0.75rem',
              paddingRight: i === childArray.length - 1 ? 0 : '0.75rem',
              boxSizing: 'border-box',
              fontSize: 'initial',
            }}
            className={
              'block-columns__col-wrapper' +
              (selectedColIdx === i ? ' is-selected' : '')
            }
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
