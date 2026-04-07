"use client";

import { createContext } from "react";

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
