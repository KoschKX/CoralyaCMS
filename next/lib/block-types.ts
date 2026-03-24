import type { ReactNode } from "react";
import type { EditorBlock } from "@/lib/pages-db";

export type BlockData = Record<string, unknown>;

export interface BlockLayoutProps {
  data: BlockData;
  /** Passed for blocks that need recursive rendering (e.g. columns) */
  renderBlocks?: (blocks: EditorBlock[]) => ReactNode;
}

export interface PanelControlProps {
  data: BlockData;
  onChange: (newData: BlockData) => void;
}

export interface BlockDefinition {
  name: string;
  label: string;
  icon: string;
  /** When true the editor panel shows the desktop/tablet/mobile viewport picker. */
  supportsBreakpoints?: boolean;
  Layout: (props: BlockLayoutProps) => ReactNode;
  PanelControls?: (props: PanelControlProps) => ReactNode;
  /**
   * Returns the Editor.js tool config object.
   * Receives optional `deps` (e.g. EditorJS constructor, baseTools) for blocks
   * that need them (columns).
   * Return null for built-in tools (paragraph).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEditorTool?: (deps?: Record<string, any>) => Promise<Record<string, any> | null>;
}
