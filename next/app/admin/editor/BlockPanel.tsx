"use client";

import { blockMap } from "@/blocks/index";
import { ViewportContext, type Viewport } from "@/components/block-shared";

interface SelectedBlock {
  id: string;
  name: string;
  data: Record<string, unknown>;
}

interface BlockPanelProps {
  selectedBlock: SelectedBlock | null;
  viewport: Viewport;
  onViewportChange: (vp: Viewport) => void;
  isSectionEnabled: (fields: string[]) => boolean;
  toggleSection: (title: string, fields: string[]) => void;
  controlsDisplayData: (data: Record<string, unknown>) => Record<string, unknown>;
  onControlsChange: (newData: Record<string, unknown>) => void;
  activeColIdx: number | null;
}

export default function BlockPanel({
  selectedBlock,
  viewport,
  onViewportChange,
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
      <div className="flex items-center justify-between">
        <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[11px] text-zinc-600">
          {selectedBlock.name}
        </span>
        {supportsBreakpoints && (
          <div className="flex items-center gap-0.5">
            {([
              {
                vp: "desktop" as Viewport,
                title: "Desktop",
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                ),
              },
              {
                vp: "tablet" as Viewport,
                title: "Tablet",
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/>
                  </svg>
                ),
              },
              {
                vp: "mobile" as Viewport,
                title: "Mobile",
                icon: (
                  <svg width="12" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/>
                  </svg>
                ),
              },
            ]).map(({ vp, title, icon }) => (
              <button
                key={vp}
                title={title}
                onClick={() => onViewportChange(vp)}
                className={`flex h-6 w-6 items-center justify-center rounded transition ${viewport === vp ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-700"}`}
              >
                {icon}
              </button>
            ))}
          </div>
        )}
      </div>
      {Controls ? (
        <ViewportContext.Provider value={{ viewport: activeViewport, isSectionEnabled, toggleSection }}>
          <p className={`-mt-1 text-[10px] transition-opacity ${supportsBreakpoints && activeViewport !== "desktop" ? "text-zinc-400 opacity-100" : "select-none opacity-0"}`}>
            Toggle switches to override at this breakpoint.
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
