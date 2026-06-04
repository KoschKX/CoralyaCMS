"use client";

import type { EditorBlock } from "@/lib/pages-db";
import type { EditableProps } from "@/lib/block-types";

type CellEntry = { blocks: EditorBlock[] };

export function TableEditable({ data, onUpdate, renderChildBlocks }: EditableProps) {
  const cells = (data.cells as CellEntry[][]) ?? [[]];
  const withHeadings = !!(data.withHeadings);
  const colCount = cells[0]?.length ?? 0;

  function updateCells(newCells: CellEntry[][]) {
    onUpdate({ ...data, cells: newCells });
  }

  return (
    <div className="block-table overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {cells.map((row, ri) => (
            <tr
              key={ri}
              className={ri === 0 && withHeadings ? "bg-zinc-100 font-semibold" : "even:bg-zinc-50"}
            >
              {row.map((cell, ci) => {
                const Tag = ri === 0 && withHeadings ? "th" : "td";
                const flatIdx = ri * colCount + ci;
                return (
                  <Tag
                    key={ci}
                    className="border border-zinc-300 px-3 py-2 align-top"
                  >
                    {renderChildBlocks?.(
                      cell.blocks ?? [],
                      (newBlocks) =>
                        updateCells(
                          cells.map((r, rri) =>
                            r.map((c, cci) =>
                              rri === ri && cci === ci ? { ...c, blocks: newBlocks } : c,
                            ),
                          ),
                        ),
                      flatIdx,
                    )}
                  </Tag>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-1 flex gap-3 text-xs text-zinc-400">
        <button
          className="hover:text-zinc-700"
          onClick={() =>
            updateCells([
              ...cells,
              Array(colCount)
                .fill(null)
                .map(() => ({ blocks: [] as EditorBlock[] })),
            ])
          }
        >
          + row
        </button>
        <button
          className="hover:text-zinc-700"
          onClick={() =>
            updateCells(cells.map((row) => [...row, { blocks: [] as EditorBlock[] }]))
          }
        >
          + col
        </button>
      </div>
    </div>
  );
}
