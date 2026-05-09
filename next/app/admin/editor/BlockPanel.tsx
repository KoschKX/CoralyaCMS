"use client";

import { blockMap } from "@/blocks/index";
import { ViewportContext, type Viewport } from "@/components/ui/ViewportContext";
import type { SelectedBlock } from "@/lib/types";

interface BlockPanelProps {
  selectedBlock: SelectedBlock | null;
  viewport: Viewport;
  setViewport: (vp: Viewport) => void;
  isSectionEnabled: (fields: string[]) => boolean;
  toggleSection: (title: string, fields: string[]) => void;
  controlsDisplayData: (data: Record<string, unknown>) => Record<string, unknown>;
  onControlsChange: (newData: Record<string, unknown>) => void;
  activeColIdx: number | null;
}

// ── Viewport icons (extracted to avoid recreation on every render) ────────────

const DesktopIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);

const TabletIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

const MobileIcon = (
  <svg width="12" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

const VIEWPORT_OPTIONS: { vp: Viewport; label: string; icon: React.ReactNode }[] = [
  { vp: "desktop", label: "Desktop", icon: DesktopIcon },
  { vp: "tablet",  label: "Tablet",  icon: TabletIcon  },
  { vp: "mobile",  label: "Mobile",  icon: MobileIcon  },
];

export default function BlockPanel({
  selectedBlock,
  viewport,
  setViewport,
  isSectionEnabled,
  toggleSection,
  controlsDisplayData,
  onControlsChange,
  activeColIdx,
}: BlockPanelProps) {
  if (!selectedBlock) {
    return <p className="text-xs text-zinc-400">Click a block to see its settings.</p>;
  }

  const supportsBreakpoints = !!blockMap[selectedBlock.name]?.supportsBreakpoints;
  const activeViewport: Viewport = supportsBreakpoints ? viewport : "desktop";
  const Controls = blockMap[selectedBlock.name]?.PanelControls;

  return (
    <>
      <div className="flex items-center">
        <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[11px] text-zinc-600">
          {selectedBlock.name}
        </span>
      </div>
      {Controls ? (
        <ViewportContext.Provider value={{ viewport: activeViewport, isSectionEnabled, toggleSection }}>
          <p className={`-mt-1 text-[10px] transition-opacity ${supportsBreakpoints && activeViewport !== "desktop" ? "text-zinc-400 opacity-100" : "select-none opacity-0"}`}>
            Viewport: <strong>{activeViewport}</strong>. Toggle switches to override at this breakpoint.
          </p>
          <Controls
            data={{
              ...controlsDisplayData(selectedBlock.data),
              ...(selectedBlock.name === "columns" && activeColIdx !== null
                ? { __selectedColIdx: activeColIdx }
                : {}),
            }}
            onChange={onControlsChange}
          />
        </ViewportContext.Provider>
      ) : (
        <p className="text-xs text-zinc-400">No extra settings for this block type.</p>
      )}
    </>
  );
}
