"use client";

import { createContext, useContext } from "react";
import type { EditorBlock } from "@/lib/pages-db";

export type BlockOps = {
  update: (id: string, newData: Record<string, unknown>) => void;
  remove: (id: string) => void;
  move: (id: string, dir: -1 | 1) => void;
  addAfter: (afterId: string | "TOP", type: string) => void;
};

export interface BlockEditorContextValue {
  selectedBlockId: string | null;
  activeColInfo: { blockId: string; colIdx: number } | null;
  setActiveColInfo: (info: { blockId: string; colIdx: number } | null) => void;
  setAnyPickerOpen: (open: boolean) => void;
  onSelectBlock: (id: string | null, data: Record<string, unknown>, type: string) => void;
  onColSelect?: (blockId: string, colIdx: number | null) => void;
  makeNewBlock: (type: string) => EditorBlock;
  disabledBlocks: string[];
}

export const BlockEditorContext = createContext<BlockEditorContextValue | null>(null);

export function useBlockEditor(): BlockEditorContextValue {
  const ctx = useContext(BlockEditorContext);
  if (!ctx) throw new Error("useBlockEditor must be used within BlockEditorContext.Provider");
  return ctx;
}
