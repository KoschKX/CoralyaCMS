"use client";

import { useState, useEffect, useRef } from "react";
import { FRACTION_PRESETS } from "@/blocks/columns/fraction-presets";

export { FRACTION_PRESETS };

export function ColToolbar({
  colIdx,
  total,
  width,
  onMove,
  onDelete,
  onAddCol,
  onResize,
}: {
  colIdx: number;
  total: number;
  width?: string;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
  onAddCol: () => void;
  onResize: (w: string) => void;
}) {
  const [sizeOpen, setSizeOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sizeOpen) return;
    function handler(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setSizeOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sizeOpen]);

  return (
    <>
      <span className="flex items-center px-2 font-mono text-xs font-semibold text-zinc-500">{colIdx + 1}</span>
      <div className="w-px self-stretch bg-zinc-200" />
      {/* Size picker */}
      <div ref={popRef}>
        <button
          title="Resize column"
          onClick={() => setSizeOpen((o) => !o)}
          className="flex items-center px-2 text-xs text-zinc-500 hover:bg-zinc-100 transition h-full"
        >
          {FRACTION_PRESETS.find((p) => p.value === (width ?? ""))?.label ?? (width || "auto")}
        </button>
        {sizeOpen && (
          <div className="absolute top-full inset-x-0 z-40 mt-1 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-6 gap-px">
              {FRACTION_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { onResize(p.value); setSizeOpen(false); }}
                  className={`rounded py-1.5 text-sm transition text-center font-medium ${
                    (width ?? "") === p.value
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="w-px self-stretch bg-zinc-200" />
      <button
        title="Move column left"
        disabled={colIdx === 0}
        onClick={() => onMove(-1)}
        className="flex w-8 items-center justify-center text-zinc-500 hover:bg-zinc-100 transition disabled:opacity-25 disabled:cursor-not-allowed"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <button
        title="Move column right"
        disabled={colIdx === total - 1}
        onClick={() => onMove(1)}
        className="flex w-8 items-center justify-center text-zinc-500 hover:bg-zinc-100 transition disabled:opacity-25 disabled:cursor-not-allowed"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
      </button>
      <div className="w-px self-stretch bg-zinc-200" />
      <button
        title="Add column after"
        onClick={onAddCol}
        className="flex w-8 items-center justify-center text-zinc-500 hover:bg-zinc-100 transition"
      >
        +
      </button>
      <button
        title="Delete column"
        disabled={total <= 1}
        onClick={onDelete}
        className="flex w-8 items-center justify-center text-zinc-400 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-25 disabled:cursor-not-allowed"
      >
        ✕
      </button>
    </>
  );
}
