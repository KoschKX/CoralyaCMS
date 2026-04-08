"use client";

import { useState, useEffect } from "react";

type PanelTab = "page" | "block";
export type { PanelTab };

/** Manages the right-panel tab + open/close state. */
export function useEditorPanel(mainMode: string) {
  const [panelTab, setPanelTab] = useState<PanelTab>("page");
  const [panelOpen, setPanelOpen] = useState(true);

  // When switching away from visual mode, reset to the page tab
  useEffect(() => {
    if (mainMode !== "visual" && panelTab !== "page") {
      setPanelTab("page");
    }
  }, [mainMode, panelTab]);

  return { panelTab, setPanelTab, panelOpen, setPanelOpen };
}
