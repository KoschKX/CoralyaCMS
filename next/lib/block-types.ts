import type { ReactNode } from "react";
import type React from "react";
import type { EditorBlock } from "@/lib/types";

export type BlockData = Record<string, unknown>;

export interface BlockLayoutProps {
  data: BlockData;
  /** Passed for blocks that need recursive rendering (e.g. columns) */
  renderBlocks?: (blocks: EditorBlock[]) => ReactNode;
  /** Unique block id for responsive and targeting */
  blockId: string;
  /**
   * Active locale for fixed text a block renders in its output. Client-side
   * layouts can instead read it via the `useBlockT` hook; server-component
   * layouts (which cannot use hooks) receive it through this prop.
   */
  locale?: string;
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
  /** Category for grouping in the block inserter panel (e.g. "text", "media", "design", "data", "code"). */
  category?: string;
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
  /**
   * Custom shortcode serializer for container blocks.
   * Called by `blocksToShortcodes` instead of the default attribute serializer.
   * Receives a helper to recursively serialize child block arrays and a helper
   * to serialize individual attribute key-value pairs.
   *
   * When omitted, the default self-closing `[type key="value"]` format is used.
   */
  serializeShortcode?: (
    data: BlockData,
    depth: number,
    blocksToShortcodes: (blocks: EditorBlock[], depth: number) => string,
    serializeAttr: (key: string, value: unknown) => string,
  ) => string;
  Layout: (props: BlockLayoutProps) => ReactNode;
  PanelControls?: (props: PanelControlProps) => ReactNode;
  /** Editor-mode render. When omitted, EditableBlock falls back to the read-only Layout. */
  Editable?: (props: EditableProps) => ReactNode;
  /**
   * Optional data validator called before saving a block.
   * Return false to reject the save and signal corrupted/invalid block data.
   * When omitted, all data is considered valid.
   */
  validate?: (data: BlockData) => boolean;
  /**
   * Schema version number for this block type's data format.
   * Increment when the data shape changes in a breaking way.
   * When omitted, version is assumed to be 1.
   */
  version?: number;
  /**
   * Migrates block data from an older schema version to the current one.
   * Called automatically when loading pages whose blocks have a lower version.
   */
  migrate?: (data: BlockData, fromVersion: number) => BlockData;
  /**
   * Ordered list of deprecated schema versions, each with an incremental
   * migration function. Migrations are applied in ascending `version` order,
   * so each step only needs to handle one version bump.
   *
   * Example:
   *   deprecated: [
   *     { version: 1, migrate: (d) => ({ ...d, align: d.alignment ?? "left" }) },
   *     { version: 2, migrate: (d) => ({ ...d, level: d.level ?? 2 }) },
   *   ]
   */
  deprecated?: Array<{
    version: number;
    migrate: (data: BlockData) => BlockData;
  }>;

  /**
   * Optional admin settings page for this block type.
   * When provided, a gear icon appears next to the block in
   * Settings → Blocks, linking to `/admin/settings/blocks/{name}`.
   *
   * Example:
   *   settingsPage: MyBlockSettingsPage,
   */
  settingsPage?: React.ComponentType;
}
