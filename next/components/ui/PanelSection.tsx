"use client";

import { useContext, useRef, useEffect, type ReactNode } from "react";
import { ViewportContext } from "./ViewportContext";

export function PanelSection({
  title,
  fields = [],
  isEnabledOverride,
  onToggleOverride,
  children,
}: {
  title: string;
  /** Data keys this section controls — used to clear overrides when switch turns off. */
  fields?: string[];
  /** Optional: override the enabled state instead of reading from ViewportContext. */
  isEnabledOverride?: boolean;
  /** Optional: override the toggle handler instead of using ViewportContext.toggleSection. */
  onToggleOverride?: () => void;
  children: ReactNode;
}) {
  const { viewport, isSectionEnabled, toggleSection } = useContext(ViewportContext);
  const isResponsiveMode = viewport !== "desktop";
  const isEnabled = isEnabledOverride !== undefined ? isEnabledOverride : isSectionEnabled(fields);

  // Only animate the toggle when the user actually clicks it, not when the
  // viewport selector changes (which would animate off→off or on→off spuriously).
  const prevViewportRef = useRef(viewport);
  const animate = prevViewportRef.current === viewport;
  useEffect(() => { prevViewportRef.current = viewport; });

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
          {title}
        </p>
        {/* Toggle is only meaningful (and visible) at non-desktop breakpoints.
            At desktop, aria-hidden prevents screen readers from announcing it. */}
        <button
          role="switch"
          aria-checked={isEnabled}
          aria-hidden={!isResponsiveMode}
          tabIndex={isResponsiveMode ? 0 : -1}
          aria-label={isEnabled ? `Remove ${title} override at this breakpoint` : `Override ${title} at this breakpoint`}
          onClick={() => isResponsiveMode && (onToggleOverride ? onToggleOverride() : toggleSection(title, fields))}
          title={isEnabled ? "Remove breakpoint override" : "Override at this breakpoint"}
          className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer items-center rounded-full focus:outline-none ${
            animate ? "transition-colors duration-150" : ""
          } ${isResponsiveMode ? "opacity-100" : "opacity-0 pointer-events-none"} ${
            isEnabled ? "bg-zinc-800" : "bg-zinc-200"
          }`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ${
              animate ? "transition-transform duration-150" : ""
            } ${isEnabled ? "translate-x-3.5" : "translate-x-0.5"}`}
          />
        </button>
      </div>
      {/* inert prevents keyboard focus and AT interaction with disabled controls.
          opacity-35 provides a visual disabled cue. */}
      <div
        className={isResponsiveMode && !isEnabled ? "pointer-events-none select-none opacity-35" : ""}
        {...(isResponsiveMode && !isEnabled ? { inert: true } : {})}
      >
        {children}
      </div>
    </div>
  );
}
