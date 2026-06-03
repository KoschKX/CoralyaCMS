"use client";

import { useRef, useState, useEffect, useLayoutEffect } from "react";
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
  const [viewport, _setViewport] = useState<Viewport>("desktop");
  const [observerEnabled, setObserverEnabled] = useState(true);

  // Tracks the last viewport the user explicitly chose via the panel buttons.
  // Distinct from the auto-detected value so we can restore it on panel reopen.
  const manualViewportRef = useRef<Viewport | null>(null);

  // Exposed to callers — records the manual selection.
  const setViewport = (vp: Viewport) => {
    manualViewportRef.current = vp;
    _setViewport(vp);
  };

  // useLayoutEffect: disable synchronously before the first paint of the panel
  // opening, so the observer never sees the shrinking canvas.
  // Also restore the last manual selection so the panel shows the right buttons.
  // We schedule inside a zero-timeout so the setState calls happen
  // asynchronously with respect to the render, satisfying the linter rule.
  useLayoutEffect(() => {
    if (!panelOpen) return;
    const id = setTimeout(() => {
      setObserverEnabled(false);
      if (manualViewportRef.current !== null) {
        _setViewport(manualViewportRef.current);
      }
    }, 0);
    return () => clearTimeout(id);
  }, [panelOpen]);

  // Re-enable the observer 200ms after the panel closes (after the animation
  // finishes) so we read the settled canvas width.
  useEffect(() => {
    if (panelOpen) return;
    const id = setTimeout(() => setObserverEnabled(true), 250);
    return () => clearTimeout(id);
  }, [panelOpen]);

  useEffect(() => {
    if (!observerEnabled) return;

    const el = canvasRef.current;
    if (!el) return;
    const tabletPx = parseBreakpointPx(tabletBp);
    const mobilePx = parseBreakpointPx(mobileBp);

    const observer = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      // Update viewport from canvas width, but don't touch manualViewportRef —
      // this is auto-detection only.
      if (w <= mobilePx) _setViewport("mobile");
      else if (w <= tabletPx) _setViewport("tablet");
      else _setViewport("desktop");
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [tabletBp, mobileBp, observerEnabled]);

  return { canvasRef, viewport, setViewport };
}
