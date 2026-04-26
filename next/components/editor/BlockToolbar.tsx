"use client";

import { memo } from "react";
import type { EditorBlock } from "@/lib/pages-db";
import type { BlockDefinition } from "@/lib/block-types";
import { BlockIcon } from "@/components/BlockIcon";
import { ChevronUpIcon, ChevronDownIcon, TrashIcon } from "@/components/editor/ToolbarIcons";
import type { BlockOps } from "@/components/editor/BlockEditorContext";
import type { ActiveColInfo } from "@/lib/editor/store";

interface BlockToolbarProps {
  block: EditorBlock;
  def: BlockDefinition | undefined;
  idx: number;
  listLength: number;
  ops: BlockOps;
  isColBlock: boolean;
  activeColInfo: ActiveColInfo | null;
  parentInfo?: { type: string; label: string; onSelect: () => void };
  onDeselectCol: () => void;
}

/**
 * The floating toolbar that appears above a selected block.
 * Contains:
 *   - Optional parent breadcrumb button (when inside a column)
 *   - Block type icon
 *   - Move up / move down
 *   - Delete
 *
 * Extracted from BlockItem to keep it focused and independently testable.
 */
export const BlockToolbar = memo(function BlockToolbar({
  block,
  def,
  idx,
  listLength,
  ops,
  isColBlock,
  activeColInfo,
  parentInfo,
  onDeselectCol,
}: BlockToolbarProps) {
  const showParentBreadcrumb =
    parentInfo || (isColBlock && activeColInfo?.blockId === block.id);

  const activeColOnThisBlock = isColBlock && activeColInfo?.blockId === block.id;

  return (
    <div
      className="absolute bottom-full left-0 z-20 mb-1.5 flex items-end gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      {showParentBreadcrumb && (
        <button
          title={
            parentInfo
              ? `Select parent (${parentInfo.label})`
              : "Select columns block"
          }
          aria-label={
            parentInfo
              ? `Select parent (${parentInfo.label})`
              : "Select columns block"
          }
          onClick={
            parentInfo
              ? parentInfo.onSelect
              : onDeselectCol
          }
          className="flex items-center justify-center w-9 rounded-md border border-zinc-200 bg-white shadow-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition"
          style={{ minHeight: 36 }}
        >
          <BlockIcon
            name={parentInfo ? parentInfo.type : "columns"}
            label={parentInfo ? parentInfo.label : "Columns"}
            size={18}
          />
        </button>
      )}

      <div
        className="flex items-stretch overflow-hidden rounded-md border border-zinc-200 bg-white shadow-md"
        style={{ minHeight: 36 }}
      >
        {/* Block type identifier — non-interactive, screen-reader label via aria-label */}
        <button
          title={activeColOnThisBlock ? "Column" : (def?.label ?? block.type)}
          aria-label={activeColOnThisBlock ? "Column block" : (def?.label ?? block.type)}
          className="flex items-center justify-center w-9 text-lg text-zinc-700 rounded-l-md transition cursor-default"
          tabIndex={-1}
        >
          <BlockIcon
            name={activeColOnThisBlock ? "column" : block.type}
            label={activeColOnThisBlock ? "Column" : (def?.label ?? block.type)}
            size={20}
          />
        </button>

        <div className="w-px self-stretch bg-zinc-200" />

        <button
          onClick={() => ops.move(block.id, -1)}
          disabled={idx === 0}
          title="Move up"
          aria-label="Move block up"
          className="flex w-8 items-center justify-center text-zinc-500 hover:bg-zinc-100 transition disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronUpIcon />
        </button>

        <button
          onClick={() => ops.move(block.id, 1)}
          disabled={idx === listLength - 1}
          title="Move down"
          aria-label="Move block down"
          className="flex w-8 items-center justify-center text-zinc-500 hover:bg-zinc-100 transition disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronDownIcon />
        </button>

        <div className="w-px self-stretch bg-zinc-200" />

        <button
          onClick={() => ops.remove(block.id)}
          title="Delete block"
          aria-label="Delete block"
          className="flex w-8 items-center justify-center text-zinc-400 hover:bg-red-50 hover:text-red-500 transition"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
});
