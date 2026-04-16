"use client";

import { useState } from "react";

type PanelTab = "page" | "block";
export type { PanelTab };

/** Manages the right-panel tab + open/close state. */
export function useEditorPanel(mainMode: string) {
  const [panelTab, setPanelTab] = useState<PanelTab>("page");
  const [panelOpen, setPanelOpen] = useState(true);

  // Derive the active tab: force "page" when not in visual mode
  const activeTab: PanelTab = mainMode !== "visual" && panelTab !== "page" ? "page" : panelTab;

  return { panelTab: activeTab, setPanelTab, panelOpen, setPanelOpen };
}
