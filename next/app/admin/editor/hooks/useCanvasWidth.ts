"use client";

import { useRef, useState, useEffect } from "react";
import type { Viewport } from "@/components/ui/ViewportContext";

function parseBreakpointPx(bp: string): number {
  if (bp.endsWith("rem")) return parseFloat(bp) * 16;
  return parseInt(bp, 10);
}

/**
 * Attaches a ResizeObserver to the editor canvas element.
 * Automatically derives the active viewport (desktop / tablet / mobile)
 * from the canvas width vs. the configured breakpoints, so the editor
 * responds to window resize instead of requiring manual button clicks.
 */
export function useCanvasWidth(tabletBp: string, mobileBp: string) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<Viewport>("desktop");

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const tabletPx = parseBreakpointPx(tabletBp);
    const mobilePx = parseBreakpointPx(mobileBp);

    const observer = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w <= mobilePx) setViewport("mobile");
      else if (w <= tabletPx) setViewport("tablet");
      else setViewport("desktop");
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [tabletBp, mobileBp]);

  return { canvasRef, viewport };
}
