"use client";

import { useState, useRef, useCallback } from "react";

export interface DropState {
  afterId: string;
  lineY: number;
}

/**
 * Encapsulates top-level drag-and-drop logic for the block canvas.
 *
 * Handles `dragover`, `drop`, and `dragleave` events on a container element.
 * Only responds to drag data with the `application/x-coralya-block` MIME type
 * so accidental drags (files, text selections) are ignored.
 *
 * ContainerDropZone children stop propagation so nested drops are handled
 * locally and don't trigger the top-level indicator here.
 */
export function useDragDrop(onDrop: (afterId: string, type: string) => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropState, setDropState] = useState<DropState | null>(null);

  const getDropPosition = useCallback((clientY: number): DropState => {
    const container = containerRef.current;
    if (!container) return { afterId: "TOP", lineY: 0 };
    const containerRect = container.getBoundingClientRect();

    // Only consider top-level block elements; ContainerDropZone handles nested drops.
    const all = Array.from(container.querySelectorAll<HTMLElement>("[data-block-id]"));
    const topLevel = all.filter((el) => {
      let parent = el.parentElement;
      while (parent && parent !== container) {
        if (parent.hasAttribute("data-block-id")) return false;
        parent = parent.parentElement;
      }
      return true;
    });

    if (topLevel.length === 0) return { afterId: "TOP", lineY: 0 };

    let afterId = "TOP";
    let lineY = topLevel[0].getBoundingClientRect().top - containerRect.top;

    for (const el of topLevel) {
      const rect = el.getBoundingClientRect();
      if (clientY > rect.top + rect.height / 2) {
        afterId = el.dataset.blockId!;
        lineY = rect.bottom - containerRect.top;
      }
    }

    return { afterId, lineY };
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!e.dataTransfer.types.includes("application/x-coralya-block")) return;
      // Nested ContainerDropZone handles its own indicator and calls preventDefault.
      if ((e.target as Element).closest("[data-container-drop-zone]")) {
        setDropState(null);
        return;
      }
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setDropState(getDropPosition(e.clientY));
    },
    [getDropPosition],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/x-coralya-block");
      if (type) onDrop(getDropPosition(e.clientY).afterId, type);
      setDropState(null);
    },
    [getDropPosition, onDrop],
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setDropState(null);
    }
  }, []);

  return { containerRef, dropState, handleDragOver, handleDrop, handleDragLeave };
}
