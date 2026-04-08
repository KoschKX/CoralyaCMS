"use client";

import { useRef, useState, useEffect } from "react";

/** Tracks the pixel width of an element via ResizeObserver. */
export function useCanvasWidth() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(1280);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setCanvasWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { canvasRef, canvasWidth };
}
