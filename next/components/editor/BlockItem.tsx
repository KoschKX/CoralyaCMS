"use client";

import React, { memo, useCallback, type ReactNode } from "react";
import type { EditorBlock } from "@/lib/pages-db";
import { blockMap } from "@/blocks/index";
import { isDescendant, insertBlockAfter } from "@/lib/block-tree";
import { resolveColWidth } from "@/lib/editor/col-width";
import { BlockIcon } from "@/components/BlockIcon";
import { ColToolbar } from "@/components/editor/ColToolbar";
import { EditableBlock } from "@/components/editor/EditableBlock";
import { AddZone } from "@/components/editor/BlockPickerAndAddZone";
import { useBlockEditor, type BlockOps } from "@/components/editor/BlockEditorContext";

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
    editorViewport,
    onSelectBlock,
    onColSelect,
    makeNewBlock,
  } = useBlockEditor();

  const def = blockMap[block.type];
  if (!def) return null;

  const isSelected = block.id === selectedBlockId;
  const isColBlock = block.type === "columns";
  const descendantSelected =
    !isSelected && !!selectedBlockId && isDescendant(block, selectedBlockId);
  const showOverlay = !isSelected && !descendantSelected && !isColBlock;

  // Stable callback — deps change when selection changes, which is unavoidable
  // since the inner BlockItems need to reflect the current selectedBlockId.
  const renderChildBlocks = useCallback((
    colBlocks: EditorBlock[],
    onUpdateAll: (newBlocks: EditorBlock[]) => void,
    colIdx?: number,
  ): ReactNode => {
    const colOps = makeColOps(colBlocks, onUpdateAll, selectedBlockId, onSelectBlock, makeNewBlock);
    return (
      <>
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
                  type: "column",
                  label: `Column ${colIdx !== undefined ? colIdx + 1 : ""}`,
                  onSelect: () => {
                    if (colIdx !== undefined) {
                      setActiveColInfo({ blockId: block.id, colIdx });
                      onColSelect?.(block.id, colIdx);
                    } else {
                      setActiveColInfo(null);
                      onColSelect?.(block.id, null);
                    }
                    onSelectBlock(block.id, block.data as Record<string, unknown>, block.type);
                  },
                }}
              />
            ))}
          </>
        )}
      </>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBlockId, onSelectBlock, makeNewBlock, setAnyPickerOpen, setActiveColInfo, onColSelect, block.id, block.data, block.type]);

  const isLast = idx === listLength - 1;
  const colBlockParentSelected = isSelected && isColBlock && activeColInfo?.blockId !== block.id;

  let ringClass = "ring-1 ring-transparent";
  if (isSelected && !isColBlock) {
    ringClass = "ring-2 ring-blue-500";
  } else if (colBlockParentSelected) {
    ringClass = "ring-2 ring-blue-500";
  } else if (isSelected && isColBlock) {
    ringClass = "ring-2 ring-blue-200";
  } else if (descendantSelected) {
    ringClass = "ring-2 ring-blue-200";
  }

  return (
    <div
      key={block.id}
      data-block-id={block.id}
      className={`relative transition ${ringClass}`}
      style={{ paddingBottom: "var(--block-spacing, 1.5rem)" }}
      onClick={(e) => {
        if (isSelected) { e.stopPropagation(); return; }
        if (isColBlock) { e.stopPropagation(); onSelectBlock(block.id, block.data as Record<string, unknown>, block.type); }
      }}
    >
      <div className="group/block relative">
        <EditableBlock
          block={block}
          onUpdate={(newData) => ops.update(block.id, newData)}
          isSelected={isSelected}
          onSelect={() => {
            if (block.type !== "columns") setActiveColInfo(null);
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
          renderChildBlocks={block.type === "columns" ? renderChildBlocks : undefined}
        />

        {showOverlay && (
          <div
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (block.type !== "columns") setActiveColInfo(null);
              onSelectBlock(block.id, block.data as Record<string, unknown>, block.type);
            }}
          />
        )}

        {isSelected && (
          <>
            {/* Main block toolbar — left */}
            <div
              className="absolute bottom-full left-0 z-20 mb-1.5 flex items-end gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {(parentInfo || (isColBlock && activeColInfo?.blockId === block.id)) && (
                <button
                  title={parentInfo ? `Select parent (${parentInfo.label})` : "Select columns block"}
                  onClick={
                    parentInfo
                      ? parentInfo.onSelect
                      : () => { setActiveColInfo(null); onColSelect?.(block.id, null); }
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
                <button
                  title={isColBlock && activeColInfo?.blockId === block.id ? "Column" : def.label}
                  className="flex items-center justify-center w-9 text-lg text-zinc-700 rounded-l-md transition cursor-default"
                >
                  <BlockIcon
                    name={isColBlock && activeColInfo?.blockId === block.id ? "column" : block.type}
                    label={isColBlock && activeColInfo?.blockId === block.id ? "Column" : def.label}
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
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                </button>

                <button
                  onClick={() => ops.move(block.id, 1)}
                  disabled={idx === listLength - 1}
                  title="Move down"
                  aria-label="Move block down"
                  className="flex w-8 items-center justify-center text-zinc-500 hover:bg-zinc-100 transition disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>

                <div className="w-px self-stretch bg-zinc-200" />

                <button
                  onClick={() => ops.remove(block.id)}
                  title="Delete block"
                  aria-label="Delete block"
                  className="flex w-8 items-center justify-center text-zinc-400 hover:bg-red-50 hover:text-red-500 transition"
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>

            {/* Col toolbar pill — right */}
            {block.type === "columns" && activeColInfo?.blockId === block.id && (() => {
              const ci = activeColInfo.colIdx;
              const cols = ((block.data as Record<string, unknown>).cols as Array<{ blocks: EditorBlock[]; width?: string }>) ?? [];
              const col = cols[ci];
              const colData = block.data as Record<string, unknown>;
              const colResp = (colData.responsive as Record<string, Record<string, unknown>>) ?? {};
              const vpWidthKey = `col-${ci}-width`;
              const effectiveColWidth = resolveColWidth(col ?? {}, ci, colResp, editorViewport);
              return (
                <div
                  key={`coltoolbar-${ci}`}
                  className="absolute bottom-full right-0 z-20 mb-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="flex items-stretch rounded-md border border-zinc-200 bg-white shadow-md"
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
                        ops.update(block.id, { ...colData, cols: nc });
                        setActiveColInfo({ blockId: block.id, colIdx: ni });
                      }}
                      onDelete={() => {
                        if (cols.length <= 1) return;
                        ops.update(block.id, { ...colData, cols: cols.filter((_, i) => i !== ci) });
                        setActiveColInfo(null);
                      }}
                      onAddCol={() => {
                        const nc = [...cols.slice(0, ci + 1), { blocks: [], width: undefined }, ...cols.slice(ci + 1)];
                        ops.update(block.id, { ...colData, cols: nc });
                      }}
                      onResize={(w) => {
                        if (editorViewport === "desktop") {
                          ops.update(block.id, { ...colData, cols: cols.map((c, i) => i === ci ? { ...c, width: w || undefined } : c) });
                        } else {
                          const vpOverrides = { ...((colResp[editorViewport] as Record<string, unknown>) ?? {}), [vpWidthKey]: w || null };
                          ops.update(block.id, { ...colData, responsive: { ...colResp, [editorViewport]: vpOverrides } });
                        }
                      }}
                    />
                  </div>
                </div>
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
