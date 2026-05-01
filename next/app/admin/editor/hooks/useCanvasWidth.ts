"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { Viewport } from "@/components/ui/ViewportContext";

function parseBreakpointPx(bp: string): number {
  if (bp.endsWith("rem")) return parseFloat(bp) * 16;
  return parseInt(bp, 10);
}

function viewportRank(vp: Viewport): number {
  return vp === "mobile" ? 0 : vp === "tablet" ? 1 : 2;
}

/** The outer constraint max-width for each viewport (must mirror the style in EditorPage/PostEditorPage). */
function viewportConstraintWidth(vp: Viewport): string {
  return vp === "mobile" ? "390px" : vp === "tablet" ? "768px" : "9999px";
}

type ExpandPhase = "idle" | "outer" | "inner";

/**
 * Manages the editor canvas viewport state.
 *
 * Responsive styles always respond naturally to the canvas's actual width via
 * @container queries — no forced overrides. Container queries are suppressed
 * only during transitions so intermediate widths don't trigger layout changes.
 *
 * When expanding to a larger viewport, two phases enforce background-first:
 *  "outer" (0–160ms): outer wrapper transitions to new width;
 *    inner card is locked to the old width via innerExpandStyle.
 *  "inner" (160–320ms): inner card transitions to var(--content-max-width).
 *  "idle": no transition; inner card uses its natural max-width.
 *
 * suppressContainer is true during any in-flight transition so @container
 * rules don't fire at intermediate widths.
 */
export function useCanvasWidth(
  tabletBp: string,
  mobileBp: string,
  panelOpen: boolean,
) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewportState] = useState<Viewport>("desktop");
  const viewportRef = useRef<Viewport>("desktop");
  const panelOpenRef = useRef(panelOpen);
  panelOpenRef.current = panelOpen;

  // ── Panel transition guard ─────────────────────────────────────────────────
  const [panelTransitioning, setPanelTransitioning] = useState(false);
  const panelTransTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitioningRef = useRef(false); // ref mirror for ResizeObserver callback

  useEffect(() => {
    transitioningRef.current = true;
    setPanelTransitioning(true);
    if (panelTransTimerRef.current) clearTimeout(panelTransTimerRef.current);
    panelTransTimerRef.current = setTimeout(() => {
      transitioningRef.current = false;
      setPanelTransitioning(false);
    }, 110);
    return () => { if (panelTransTimerRef.current) clearTimeout(panelTransTimerRef.current); };
  }, [panelOpen]);

  // ── Two-phase expand state ─────────────────────────────────────────────────
  const [expandPhase, setExpandPhase] = useState<ExpandPhase>("idle");
  const lockedWidthRef = useRef<string>("9999px");
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setViewport = useCallback((newVp: Viewport) => {
    const currentVp = viewportRef.current;
    if (panelOpenRef.current && viewportRank(newVp) > viewportRank(currentVp)) {
      lockedWidthRef.current = viewportConstraintWidth(currentVp);
      setExpandPhase("outer");
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = setTimeout(() => {
        setExpandPhase("inner");
        phaseTimerRef.current = setTimeout(() => {
          setExpandPhase("idle");
        }, 160);
      }, 160);
    } else {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      setExpandPhase("idle");
    }
    viewportRef.current = newVp;
    setViewportState(newVp);
  }, []);

  // ── ResizeObserver (panel closed only) ────────────────────────────────────
  useEffect(() => {
    if (panelOpen) return;
    const el = canvasRef.current;
    if (!el) return;
    const tabletPx = parseBreakpointPx(tabletBp);
    const mobilePx = parseBreakpointPx(mobileBp);
    const observer = new ResizeObserver(([entry]) => {
      if (transitioningRef.current) return;
      const w = entry.contentRect.width;
      const newVp: Viewport = w <= mobilePx ? "mobile" : w <= tabletPx ? "tablet" : "desktop";
      viewportRef.current = newVp;
      setViewportState(newVp);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [tabletBp, mobileBp, panelOpen]);

  // ── Derived values for consumers ──────────────────────────────────────────
  const innerExpandStyle: { maxWidth?: string; transition?: string } =
    expandPhase === "outer"
      ? { maxWidth: lockedWidthRef.current, transition: "none" }
      : expandPhase === "inner"
      ? { maxWidth: "var(--content-max-width, 48rem)", transition: "max-width 150ms ease-in-out" }
      : {};

  const suppressContainer = expandPhase !== "idle" || panelTransitioning;

  return { canvasRef, viewport, setViewport, innerExpandStyle, suppressContainer };
}
