"use client";

import { createContext } from "react";

export type Viewport = "desktop" | "tablet" | "mobile";

export interface ViewportContextValue {
  viewport: Viewport;
  /** Merged data for the parent viewport — used to show the inherited value in panel controls. */
  inheritedData: Record<string, unknown>;
  /** Returns true if the field has an explicit override at the current viewport. */
  isFieldOverridden: (field: string) => boolean;
  /** @deprecated kept for backwards compatibility, will be removed */
  isSectionEnabled: (fields: string[]) => boolean;
  /** @deprecated kept for backwards compatibility, will be removed */
  toggleSection: (title: string, fields: string[]) => void;
}

export const ViewportContext = createContext<ViewportContextValue>({
  viewport: "desktop",
  inheritedData: {},
  isFieldOverridden: () => false,
  isSectionEnabled: () => true,
  toggleSection: () => {},
});
