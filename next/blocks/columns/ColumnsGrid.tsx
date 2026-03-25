"use client";

import { useState, useEffect } from "react";

function widthToFr(w: string): string {
  if (!w) return "minmax(0, 1fr)";
  if (w.endsWith("%")) {
    return w; // Use percent as-is for gridTemplateColumns
  }
  if (w.endsWith("fr")) {
    // Use minmax(0, 1fr) for fr units to prevent overflow
    const n = parseFloat(w);
    return isNaN(n) ? "minmax(0, 1fr)" : `minmax(0, ${n}fr)`;
  }
  return w;
}

interface ColumnsGridProps {
  colWidths: string[];
  responsive: Record<string, Record<string, string>>;
  children: React.ReactNode;
}

export default function ColumnsGrid({ colWidths, responsive, children }: ColumnsGridProps) {
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

  function getColWidth(colIdx: number, vp: string): string {
    if (vp !== "desktop") {
      const key = `col-${colIdx}-width`;
      const vpOverrides = responsive[vp];
      if (vpOverrides && key in vpOverrides) return vpOverrides[key] || "1fr";
    }
    return colWidths[colIdx] || "1fr";
  }

  const gridTemplateColumns = colWidths
    .map((_, i) => widthToFr(getColWidth(i, editorViewport)))
    .join(" ");

  // Remove grid gap, add horizontal padding to columns for spacing
  return (
    <div className="block-columns grid" style={{ gridTemplateColumns }}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div key={i} style={{ paddingLeft: i === 0 ? 0 : '0.75rem', paddingRight: i === colWidths.length - 1 ? 0 : '0.75rem' }} className="block-columns__col-wrapper">
              {child}
            </div>
          ))
        : children}
    </div>
  );
}
