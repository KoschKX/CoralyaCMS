"use client";

import type { SelectedBlock } from "@/lib/types";
import type { Viewport } from "@/components/ui/ViewportContext";
import { mergeViewportOverrides } from "@/lib/responsive-css";

interface UseResponsiveBlockOptions {
  selectedBlock: SelectedBlock | null;
  viewport: Viewport;
  updateBlock: (id: string, data: Record<string, unknown>) => void;
  setSelectedBlock: (fn: (prev: SelectedBlock | null) => SelectedBlock | null) => void;
}

export function useResponsiveBlock({
  selectedBlock,
  viewport,
  updateBlock,
  setSelectedBlock,
}: UseResponsiveBlockOptions) {
  function isSectionEnabled(fields: string[]): boolean {
    if (viewport === "desktop" || !selectedBlock) return true;
    const responsive = (selectedBlock.data.responsive as Record<string, Record<string, unknown>>) ?? {};
    const overrides = responsive[viewport] ?? {};
    return fields.some((f) => f in overrides);
  }

  function toggleSection(_title: string, fields: string[]) {
    if (!selectedBlock) return;
    const current = selectedBlock.data;
    const responsive = { ...((current.responsive as Record<string, Record<string, unknown>>) ?? {}) };
    const overrides = { ...(responsive[viewport] ?? {}) };
    const currently = fields.some((f) => f in overrides);
    for (const f of fields) {
      if (currently) {
        delete overrides[f];
      } else {
        overrides[f] = current[f] !== undefined ? current[f] : null;
      }
    }
    responsive[viewport] = overrides;
    const newData = { ...current, responsive };
    updateBlock(selectedBlock.id, newData);
    setSelectedBlock((prev) => prev && { ...prev, data: newData });
  }

  function controlsDisplayData(data: Record<string, unknown>): Record<string, unknown> {
    return mergeViewportOverrides(data, viewport, true);
  }

  function handleControlsChange(newData: Record<string, unknown>) {
    if (!selectedBlock) return;
    let finalData: Record<string, unknown>;
    if (viewport === "desktop" || "cols" in newData) {
      // Full block data replacement: desktop always, or when columns PanelControls
      // updates cols (which now carry their own per-column responsive widths).
      finalData = { ...selectedBlock.data, ...newData };
    } else {
      const current = selectedBlock.data;
      const responsive = { ...((current.responsive as Record<string, Record<string, unknown>>) ?? {}) };
      const overrides = { ...(responsive[viewport] ?? {}) };
      responsive[viewport] = { ...overrides, ...newData };
      finalData = { ...current, responsive };
    }
    updateBlock(selectedBlock.id, finalData);
    setSelectedBlock((prev) => prev && { ...prev, data: finalData });
  }

  return { isSectionEnabled, toggleSection, controlsDisplayData, handleControlsChange };
}
