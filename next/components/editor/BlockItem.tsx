"use client";

import React, { memo, useCallback, useRef, type ReactNode } from "react";
import type { EditorBlock } from "@/lib/pages-db";
import { blockMap } from "@/blocks/index";
import { isDescendant, insertBlockAfter } from "@/lib/block-tree";
import { resolveColWidth } from "@/lib/editor/col-width";
import { ColToolbar } from "@/components/editor/ColToolbar";
import { EditableBlock } from "@/components/editor/EditableBlock";
import { AddZone } from "@/components/editor/BlockPickerAndAddZone";
import { BlockToolbar } from "@/components/editor/BlockToolbar";
import { ContainerDropZone } from "@/components/editor/ContainerDropZone";
import { useBlockEditor, type BlockOps } from "@/components/editor/BlockEditorContext";
import { useEditorViewport } from "@/components/editor/EditorHooks";
import { getBlockWrapperProps } from "@/lib/block-advanced-css";
import { mergeViewportOverrides } from "@/lib/responsive-css";

interface ColViewportToolbarProps {
  blockId: string;
  ci: number;
  cols: Array<{ blocks: EditorBlock[]; width?: string; responsive?: Record<string, { width?: string }> }>;
  colData: Record<string, unknown>;
  colResp: Record<string, Record<string, unknown>>;
  ops: BlockOps;
  setActiveColInfo: (info: { blockId: string; colIdx: number } | null) => void;
}

/**
 * Isolated component so only it subscribes to EditorViewportContext.
 * Rendered only when a column is actively selected — never causes other blocks to re-render.
 */
function ColViewportToolbar({ blockId, ci, cols, colData, colResp, ops, setActiveColInfo }: ColViewportToolbarProps) {
  const editorViewport = useEditorViewport();
  const col = cols[ci];
  const effectiveColWidth = resolveColWidth(col ?? {}, editorViewport);
  return (
    <div
      className="absolute bottom-full right-0 z-20 mb-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="flex items-stretch rounded-md border border-zinc-300 bg-white shadow-md"
        style={{ minHeight: 36 }}
      >
        <ColToolbar
          colIdx={ci}
          total={cols.length}
          width={effectiveColWidth}
          onMove={(dir) => {
            const ni = ci + dir;
            if (ni < 0 || ni >= cols.length) return;
            const nc = [...cols]; [nc[ci], nc[ni]] = [nc[ni], nc[ci]];
            ops.update(blockId, { ...colData, cols: nc });
            setActiveColInfo({ blockId, colIdx: ni });
          }}
          onDelete={() => {
            if (cols.length <= 1) return;
            ops.update(blockId, { ...colData, cols: cols.filter((_, i) => i !== ci) });
            setActiveColInfo(null);
          }}
          onAddCol={() => {
            const nc = [...cols.slice(0, ci + 1), { blocks: [], width: undefined }, ...cols.slice(ci + 1)];
            ops.update(blockId, { ...colData, cols: nc });
          }}
          onResize={(w) => {
            if (editorViewport === "desktop") {
              ops.update(blockId, { ...colData, cols: cols.map((c, i) => i === ci ? { ...c, width: w || undefined } : c) });
            } else {
              const newCols = cols.map((c, i) => {
                if (i !== ci) return c;
                const resp = { ...(c.responsive ?? {}) };
                resp[editorViewport] = { ...(resp[editorViewport] ?? {}), width: w || undefined };
                return { ...c, responsive: resp };
              });
              ops.update(blockId, { ...colData, cols: newCols });
            }
          }}
        />
      </div>
    </div>
  );
}

interface BlockItemProps {
  block: EditorBlock;
  idx: number;
  listLength: number;
  ops: BlockOps;
  isInColumn?: boolean;
  parentInfo?: { type: string; label: string; onSelect: () => void };
}

function makeColOps(
  colBlocks: EditorBlock[],
  onUpdateAll: (newBlocks: EditorBlock[]) => void,
  selectedBlockId: string | null,
  onSelectBlock: (id: string | null, data: Record<string, unknown>, type: string) => void,
  makeNewBlock: (type: string) => EditorBlock,
): BlockOps {
  return {
    update: (id, newData) => {
      onUpdateAll(colBlocks.map((b) => (b.id === id ? { ...b, data: newData } : b)));
      if (id === selectedBlockId) {
        onSelectBlock(id, newData, colBlocks.find((b) => b.id === id)?.type ?? "");
      }
    },
    remove: (id) => {
      onUpdateAll(colBlocks.filter((b) => b.id !== id));
      if (id === selectedBlockId) onSelectBlock(null, {}, "");
    },
    move: (id, dir) => {
      const i = colBlocks.findIndex((b) => b.id === id);
      if (i < 0) return;
      const ni = i + dir;
      if (ni < 0 || ni >= colBlocks.length) return;
      const u = [...colBlocks];
      [u[i], u[ni]] = [u[ni], u[i]];
      onUpdateAll(u);
    },
    addAfter: (afterId, type) => {
      const nb = makeNewBlock(type);
      onUpdateAll(insertBlockAfter(colBlocks, afterId, nb));
      onSelectBlock(nb.id, nb.data as Record<string, unknown>, type);
    },
  };
}

function BlockItem({
  block,
  idx,
  listLength,
  ops,
  isInColumn = false,
  parentInfo,
}: BlockItemProps) {
  const {
    selectedBlockId,
    activeColInfo,
    setActiveColInfo,
    setAnyPickerOpen,
    onSelectBlock,
    onColSelect,
    makeNewBlock,
    disabledBlocks,
  } = useBlockEditor();

  // Keep a ref to the current block so renderChildBlocks doesn't need block.data /
  // block.type in its dependency array. Without this, Immer would cause
  // renderChildBlocks to be recreated on every publish (even unrelated ones),
  // forcing all column children to remount.
  const blockRef = useRef(block);
  blockRef.current = block;

  // Keep a ref to selectedBlockId so renderChildBlocks doesn't need it as a dep.
  // Without this, any selection change would recreate renderChildBlocks and force
  // all column children to re-render even when the columns block itself didn't change.
  const selectedBlockIdRef = useRef(selectedBlockId);
  selectedBlockIdRef.current = selectedBlockId;

  const def = blockMap[block.type];
  const isUnavailable = !def || disabledBlocks.includes(block.type);

  // Warn once in development when an unregistered block type is encountered,
  // so authors know they have broken content rather than silently seeing a placeholder.
  if (!def && process.env.NODE_ENV !== "production") {
    console.warn(`[editor] BlockItem: unregistered block type "${block.type}" (id: ${block.id}). Check that all plugins are loaded.`);
  }

  const isSelected = block.id === selectedBlockId;
  const isColBlock = block.type === "columns";
  const isContainerBlock = !!(def?.isContainer);
  const descendantSelected =
    !isSelected && !!selectedBlockId && isDescendant(block, selectedBlockId);
  const showOverlay = !isSelected && !descendantSelected && !isContainerBlock;

  // Only recreated when selection or stable actions change — not on every block.data update.
  const renderChildBlocks = useCallback((
    colBlocks: EditorBlock[],
    onUpdateAll: (newBlocks: EditorBlock[]) => void,
    colIdx?: number,
  ): ReactNode => {
    // Read from refs so the closure sees the latest values without adding them
    // to the dependency array. This prevents renderChildBlocks from being
    // recreated on every selection change, which would cause all column
    // children to re-render unnecessarily.
    const { id: blockId, data: blockData, type: blockType } = blockRef.current;
    const colOps = makeColOps(colBlocks, onUpdateAll, selectedBlockIdRef.current, onSelectBlock, makeNewBlock);
    const parentLabel = blockType === "table" && colIdx !== undefined
      ? `Cell ${colIdx + 1}`
      : `Column ${colIdx !== undefined ? colIdx + 1 : ""}`;
    return (
      <ContainerDropZone onAdd={(afterId, type) => colOps.addAfter(afterId, type)}>
        {colBlocks.length === 0 ? (
          <AddZone
            onAdd={(type) => colOps.addAfter("TOP", type)}
            variant="col-empty"
            onOpenChange={setAnyPickerOpen}
          />
        ) : (
          <>
            <AddZone onAdd={(type) => colOps.addAfter("TOP", type)} onOpenChange={setAnyPickerOpen} />
            {colBlocks.map((childBlock, childIdx) => (
              <BlockItem
                key={childBlock.id}
                block={childBlock}
                idx={childIdx}
                listLength={colBlocks.length}
                ops={colOps}
                isInColumn
                parentInfo={{
                  type: blockType,
                  label: parentLabel,
                  onSelect: () => {
                    if (colIdx !== undefined) {
                      setActiveColInfo({ blockId, colIdx });
                      onColSelect?.(blockId, colIdx);
                    } else {
                      setActiveColInfo(null);
                      onColSelect?.(blockId, null);
                    }
                    onSelectBlock(blockId, blockData as Record<string, unknown>, blockType);
                  },
                }}
              />
            ))}
          </>
        )}
      </ContainerDropZone>
    );
  // block.id / block.data / block.type intentionally omitted — read from blockRef.current.
  // selectedBlockId intentionally omitted — read from selectedBlockIdRef.current.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSelectBlock, makeNewBlock, setAnyPickerOpen, setActiveColInfo, onColSelect]);

  const isLast = idx === listLength - 1;
  const colBlockParentSelected = isSelected && isContainerBlock && activeColInfo?.blockId !== block.id;

  const editorViewport = useEditorViewport();
  const wrapperDisplayData = mergeViewportOverrides(block.data as Record<string, unknown>, editorViewport);
  const { style: wrapperStyle, extraClass: wrapperExtraClass, id: wrapperId } = getBlockWrapperProps(wrapperDisplayData);

  const ringClass =
    (isSelected && !isContainerBlock) || colBlockParentSelected ? "ring-2 ring-blue-500"
    : (isSelected && isContainerBlock) || descendantSelected    ? "outline-2 outline-dashed outline-blue-200"
    : "ring-1 ring-transparent";

  return (
    <div
      key={block.id}
      data-block-id={block.id}
      className={`relative transition ${ringClass}`}
      style={{ paddingBottom: isUnavailable ? 0 : "var(--block-spacing, 1.5rem)" }}
      onClick={(e) => {
        if (isSelected) { e.stopPropagation(); return; }
        if (isContainerBlock) { e.stopPropagation(); onSelectBlock(block.id, block.data as Record<string, unknown>, block.type); }
      }}
    >
      <div
        className={`group/block relative${wrapperExtraClass ? ` ${wrapperExtraClass}` : ""}`}
        id={wrapperId}
        style={Object.keys(wrapperStyle).length ? wrapperStyle : undefined}
      >
        <EditableBlock
          block={block}
          onUpdate={(newData) => ops.update(block.id, newData)}
          isSelected={isSelected}
          onSelect={() => {
            if (!isContainerBlock) setActiveColInfo(null);
            onSelectBlock(block.id, block.data as Record<string, unknown>, block.type);
          }}
          activeColIdx={activeColInfo?.blockId === block.id ? activeColInfo.colIdx : null}
          onActiveColChange={(ci) => {
            if (ci !== null) {
              setActiveColInfo({ blockId: block.id, colIdx: ci });
              onColSelect?.(block.id, ci);
            } else {
              setActiveColInfo(null);
              onColSelect?.(block.id, null);
            }
          }}
          renderChildBlocks={isContainerBlock ? renderChildBlocks : undefined}
        />

        {showOverlay && (
          <div
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (!isContainerBlock) setActiveColInfo(null);
              onSelectBlock(block.id, block.data as Record<string, unknown>, block.type);
            }}
          />
        )}

        {isSelected && (
          <>
            <BlockToolbar
              block={block}
              def={def}
              idx={idx}
              listLength={listLength}
              ops={ops}
              isColBlock={isColBlock}
              activeColInfo={activeColInfo}
              parentInfo={parentInfo}
              onDeselectCol={() => {
                setActiveColInfo(null);
                onColSelect?.(block.id, null);
              }}
            />

            {/* Col toolbar pill — right */}
            {block.type === "columns" && activeColInfo?.blockId === block.id && (() => {
              const ci = activeColInfo.colIdx;
              const cols = ((block.data as Record<string, unknown>).cols as Array<{ blocks: EditorBlock[]; width?: string; responsive?: Record<string, { width?: string }> }>) ?? [];
              const colData = block.data as Record<string, unknown>;
              const colResp = (colData.responsive as Record<string, Record<string, unknown>>) ?? {};
              return (
                <ColViewportToolbar
                  key={`coltoolbar-${ci}`}
                  blockId={block.id}
                  ci={ci}
                  cols={cols}
                  colData={colData}
                  colResp={colResp}
                  ops={ops}
                  setActiveColInfo={setActiveColInfo}
                />
              );
            })()}
          </>
        )}
      </div>

      {(!isLast || isInColumn || isSelected) && (
        <AddZone
          onAdd={(type) => ops.addAfter(block.id, type)}
          variant={isInColumn && isLast ? "col-last" : "inline"}
          isSelected={isSelected}
          onOpenChange={setAnyPickerOpen}
        />
      )}
    </div>
  );
}

export default memo(BlockItem);
