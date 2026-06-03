"use client";

/**
 * EditorCanvas
 * ─────────────
 * The scrollable editor content area that:
 *  - holds the `canvasRef` watched by the viewport ResizeObserver
 *  - constrains the inner width to the selected breakpoint when the panel is open
 *  - renders a white card container for the page/post content
 *
 * Shared between page and post editors.
 */

import type { ReactNode, RefObject } from "react";
import type { Viewport } from "@/components/ui/ViewportContext";

interface EditorCanvasProps {
  /** Ref forwarded to the ResizeObserver in `useCanvasWidth`. */
  canvasRef: RefObject<HTMLDivElement | null>;
  /** Whether the right-side settings panel is open. */
  panelOpen: boolean;
  /** Current editor mode — viewport constraint only applies in "visual" mode. */
  mainMode: string;
  /** Active breakpoint — drives the constrained canvas width. */
  viewport: Viewport;
  /** Background color of the page/post canvas card. */
  bgColor?: string;
  /** Inner content — title field, VisualEditor or CodeEditor, etc. */
  children: ReactNode;
  /** Extra padding class for the outer scroll container. Defaults to "". */
  outerPaddingClass?: string;
}

const VIEWPORT_MAX_WIDTHS: Record<Viewport, string> = {
  mobile: "390px",
  tablet: "768px",
  desktop: "100%",
};

export function EditorCanvas({
  canvasRef,
  panelOpen,
  mainMode,
  viewport,
  bgColor = "#ffffff",
  children,
  outerPaddingClass = "",
}: EditorCanvasProps) {
  const constrainWidth = panelOpen && mainMode !== "code";

  return (
    <div ref={canvasRef} className="flex-1 overflow-y-auto bg-zinc-100">
      <div className={outerPaddingClass}>
        {/* Constrain to the selected breakpoint when the panel is open so
            responsive CSS fires at the same pixel width as the preview. */}
        <div
          className="mx-auto"
          style={constrainWidth ? { maxWidth: VIEWPORT_MAX_WIDTHS[viewport] } : { maxWidth: "100%" }}
        >
          <div
            className="text-zinc-900 bg-white rounded-lg shadow-sm mx-auto"
            style={{
              minHeight: "calc(100vh - 48px)",
              maxWidth: "var(--content-max-width, 48rem)",
              padding: "2.5rem var(--content-padding-x, 1.5rem)",
              background: bgColor,
              containerType: "inline-size",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
