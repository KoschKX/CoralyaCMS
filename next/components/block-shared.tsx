"use client";

import { createContext, useContext, useRef, useEffect, type ReactNode } from "react";
import type { BlockData } from "@/lib/block-types";

// ── Responsive viewport context ─────────────────────────────────────────────
export type Viewport = "desktop" | "tablet" | "mobile";

export interface ViewportContextValue {
  viewport: Viewport;
  isSectionEnabled: (fields: string[]) => boolean;
  toggleSection: (title: string, fields: string[]) => void;
}

export const ViewportContext = createContext<ViewportContextValue>({
  viewport: "desktop",
  isSectionEnabled: () => true,
  toggleSection: () => {},
});

// ── PanelSection ────────────────────────────────────────────────────────────
export function PanelSection({
  title,
  fields = [],
  children,
}: {
  title: string;
  /** Data keys this section controls — used to clear overrides when switch turns off. */
  fields?: string[];
  children: ReactNode;
}) {
  const { viewport, isSectionEnabled, toggleSection } = useContext(ViewportContext);
  const isResponsiveMode = viewport !== "desktop";
  const isEnabled = isSectionEnabled(fields);

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
        <button
          role="switch"
          aria-checked={isEnabled}
          onClick={() => isResponsiveMode && toggleSection(title, fields)}
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
      <div className={isResponsiveMode && !isEnabled ? "pointer-events-none select-none opacity-35" : ""}>
        {children}
      </div>
    </div>
  );
}

export function AlignButtons({
  data,
  onChange,
}: {
  data: BlockData;
  onChange: (d: BlockData) => void;
}) {
  const options: { value: string; label: string }[] = [
    { value: "left",    label: "L" },
    { value: "center",  label: "C" },
    { value: "right",   label: "R" },
    { value: "justify", label: "J" },
  ];
  return (
    <PanelSection title="Alignment" fields={["align"]}>
      <div className="flex gap-1">
        {options.map(({ value, label }) => (
          <button
            key={value}
            title={value}
            onClick={() => onChange({ align: value })}
            className={`flex h-8 flex-1 items-center justify-center rounded border text-xs font-medium transition ${
              (data.align ?? "left") === value
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </PanelSection>
  );
}

export function FontSizeButtons({
  data,
  onChange,
}: {
  data: BlockData;
  onChange: (d: BlockData) => void;
}) {
  const sizes: { value: string; label: string }[] = [
    { value: "sm",   label: "S" },
    { value: "base", label: "M" },
    { value: "lg",   label: "L" },
    { value: "xl",   label: "XL" },
  ];
  return (
    <PanelSection title="Font size" fields={["fontSize"]}>
      <div className="flex gap-1">
        {sizes.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onChange({ fontSize: value })}
            className={`flex-1 rounded border py-1.5 text-xs font-medium transition ${
              (data.fontSize ?? "base") === value
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </PanelSection>
  );
}
