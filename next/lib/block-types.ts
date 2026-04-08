import type { ReactNode } from "react";
import type { EditorBlock } from "@/lib/pages-db";

export type BlockData = Record<string, unknown>;

export interface BlockLayoutProps {
  data: BlockData;
  /** Passed for blocks that need recursive rendering (e.g. columns) */
  renderBlocks?: (blocks: EditorBlock[]) => ReactNode;
  /** Unique block id for responsive and targeting */
  blockId: string;
}

export interface PanelControlProps {
  data: BlockData;
  onChange: (newData: BlockData) => void;
}

/** Props passed to each block's Editable component. */
export interface EditableProps {
  data: BlockData;
  onUpdate: (newData: BlockData) => void;
  blockId: string;
  isSelected?: boolean;
  onSelect?: () => void;
  activeColIdx?: number | null;
  onActiveColChange?: (ci: number | null) => void;
  renderChildBlocks?: (
    colBlocks: EditorBlock[],
    onUpdateAll: (newBlocks: EditorBlock[]) => void,
    colIdx?: number,
  ) => ReactNode;
}

export interface BlockDefinition {
  name: string;
  label: string;
  icon: string;
  /** When true the editor panel shows the desktop/tablet/mobile viewport picker. */
  supportsBreakpoints?: boolean;
  /** Initial data used when inserting a new block of this type. */
  defaultData?: BlockData;
  /**
   * True for blocks that contain arrays of child EditorBlocks (e.g. a columns layout).
   * When set, getChildBlocks and setChildBlocks must also be provided.
   */
  isContainer?: boolean;
  /** Returns the child-block arrays (one per column/slot) from the block's data. */
  getChildBlocks?: (data: BlockData) => EditorBlock[][];
  /** Returns updated data with the given child-block arrays written back. */
  setChildBlocks?: (data: BlockData, arrays: EditorBlock[][]) => BlockData;
  Layout: (props: BlockLayoutProps) => ReactNode;
  PanelControls?: (props: PanelControlProps) => ReactNode;
  /** Editor-mode render. When omitted, EditableBlock falls back to the read-only Layout. */
  Editable?: (props: EditableProps) => ReactNode;
}
