"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";

interface ContainerDropZoneProps {
  children: ReactNode;
  onAdd: (afterId: string | "TOP", type: string) => void;
}

/**
 * Wraps the child blocks inside a container (column, table cell, etc.) and
 * handles drag-and-drop locally. Shows its own blue indicator line and
 * stopPropagation so the top-level VisualEditor drop handler doesn't interfere.
 */
export function ContainerDropZone({ children, onAdd }: ContainerDropZoneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [lineY, setLineY] = useState<number | null>(null);

  /** Find [data-block-id] elements that are direct (non-nested) children of this container. */
  const getDirectBlocks = useCallback((): HTMLElement[] => {
    const el = ref.current;
    if (!el) return [];
    const all = Array.from(el.querySelectorAll<HTMLElement>("[data-block-id]"));
    return all.filter((blockEl) => {
      let parent = blockEl.parentElement;
      while (parent && parent !== el) {
        if (parent.hasAttribute("data-block-id")) return false;
        parent = parent.parentElement;
      }
      return true;
    });
  }, []);

  const getDropInfo = useCallback((clientY: number): { afterId: string | "TOP"; lineY: number } => {
    const el = ref.current;
    if (!el) return { afterId: "TOP", lineY: 0 };
    const rect = el.getBoundingClientRect();
    const directBlocks = getDirectBlocks();

    if (directBlocks.length === 0) return { afterId: "TOP", lineY: 0 };

    let afterId: string | "TOP" = "TOP";
    let ly = directBlocks[0].getBoundingClientRect().top - rect.top;

    for (const blockEl of directBlocks) {
      const bRect = blockEl.getBoundingClientRect();
      if (clientY > bRect.top + bRect.height / 2) {
        afterId = blockEl.dataset.blockId!;
        ly = bRect.bottom - rect.top;
      }
    }
    return { afterId, lineY: ly };
  }, [getDirectBlocks]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes("application/x-coralya-block")) return;
    e.preventDefault();
    // Do NOT stopPropagation — let it bubble so VisualEditor can clear its top-level indicator
    e.dataTransfer.dropEffect = "copy";
    const { lineY: ly } = getDropInfo(e.clientY);
    setLineY(ly);
  }, [getDropInfo]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const type = e.dataTransfer.getData("application/x-coralya-block");
    if (!type) return;
    e.preventDefault();
    e.stopPropagation();
    const { afterId } = getDropInfo(e.clientY);
    setLineY(null);
    onAdd(afterId, type);
  }, [getDropInfo, onAdd]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!e.relatedTarget || !ref.current?.contains(e.relatedTarget as Node)) {
      setLineY(null);
    }
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      data-container-drop-zone
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
    >
      {children}
      {lineY !== null && (
        <div
          className="pointer-events-none absolute inset-x-1 z-20 flex items-center gap-1"
          style={{ top: lineY - 1 }}
        >
          <div className="h-2 w-2 shrink-0 rounded-full border-2 border-blue-500 bg-white" />
          <div className="h-0.5 flex-1 bg-blue-500" />
        </div>
      )}
    </div>
  );
}
