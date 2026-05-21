"use client";

import { useState } from "react";

export type PanelTab = "page" | "block" | "post";

/**
 * Manages the right-panel tab + open/close state.
 *
 * @param mainMode    - Current editor mode ("visual" | "code" | "inject").
 * @param defaultTab  - Tab shown by default. Defaults to "page".
 *                      Pass "post" for the post editor.
 */
export function useEditorPanel(
  mainMode: string,
  defaultTab: "page" | "post" = "page",
) {
  const [panelTab, setPanelTab] = useState<PanelTab>(defaultTab);
  const [panelOpen, setPanelOpen] = useState(true);

  // Force the default tab when leaving visual mode — block settings don't
  // apply in code / inject views so showing the block tab would be confusing.
  const activeTab: PanelTab = mainMode !== "visual" ? defaultTab : panelTab;

  return { panelTab: activeTab, setPanelTab, panelOpen, setPanelOpen };
}
