"use client";

import { useRef, useState, useEffect } from "react";
import type { Viewport } from "@/components/ui/ViewportContext";

function parseBreakpointPx(bp: string): number {
  if (bp.endsWith("rem")) return parseFloat(bp) * 16;
  return parseInt(bp, 10);
}

/**
 * Manages the editor canvas viewport state with two modes:
 *
 * - Panel **closed**: a ResizeObserver watches the canvas element and
 *   automatically derives the active viewport from its pixel width vs.
 *   the configured breakpoints. The user sees the layout the page will
 *   actually have at that window size.
 *
 * - Panel **open**: the ResizeObserver is disconnected and the viewport
 *   is controlled manually via `setViewport` (driven by the panel's
 *   viewport buttons). The canvas width is constrained to the selected
 *   breakpoint so responsive CSS fires correctly.
 */
export function useCanvasWidth(
  tabletBp: string,
  mobileBp: string,
  panelOpen: boolean,
) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<Viewport>("desktop");

  useEffect(() => {
    // When the panel is open the user controls viewport manually.
    if (panelOpen) return;

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
  }, [tabletBp, mobileBp, panelOpen]);

  return { canvasRef, viewport, setViewport };
}
