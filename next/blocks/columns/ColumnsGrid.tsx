"use client";

import { useState, useEffect } from "react";

function widthToFr(w: string): string {
  if (!w) return "1fr";
  if (w.endsWith("%")) {
    const n = parseFloat(w);
    return isNaN(n) ? w : `${n}fr`;
  }
  return w;
}

interface ColumnsGridProps {
  colWidths: string[];
  responsive: Record<string, Record<string, string>>;
  children: React.ReactNode;
}

export default function ColumnsGrid({ colWidths, responsive, children }: ColumnsGridProps) {
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

  return (
    <div className="block-columns grid gap-6" style={{ gridTemplateColumns }}>
      {children}
    </div>
  );
}
