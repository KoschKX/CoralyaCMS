"use client";

import { useRef, useCallback } from "react";
import type { Viewport } from "@/components/ui/ViewportContext";

/**
 * Crossfade transition when the editor viewport changes.
 *
 * Fades the card out at its current size, then calls setViewport so React
 * reflows the new width, then fades back in. Neither stretching nor visible
 * text reflow occurs because the content is invisible during the resize.
 */
export function useViewportFlip(
  _viewport: Viewport,
  setViewport: (vp: Viewport) => void,
) {
  const cardRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSetViewport = useCallback(
    (vp: Viewport) => {
      const el = cardRef.current;
      if (!el) { setViewport(vp); return; }

      // Cancel any in-flight fade so rapid clicks don't stack.
      if (pendingRef.current !== null) {
        clearTimeout(pendingRef.current);
        pendingRef.current = null;
      }

      // Fade out.
      el.style.transition = "opacity 120ms ease-out";
      el.style.opacity = "0";

      pendingRef.current = setTimeout(() => {
        // Resize happens while invisible — no visible reflow.
        setViewport(vp);

        requestAnimationFrame(() => {
          if (!cardRef.current) return;
          cardRef.current.style.transition = "opacity 150ms ease-in";
          cardRef.current.style.opacity = "1";

          pendingRef.current = setTimeout(() => {
            if (cardRef.current) {
              cardRef.current.style.transition = "";
              cardRef.current.style.opacity = "";
            }
            pendingRef.current = null;
          }, 155);
        });
      }, 125);
    },
    [setViewport],
  );

  return { cardRef, handleSetViewport };
}
