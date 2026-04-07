"use client";

import { CE } from "@/components/editor/ContentEditable";
import type { EditableProps } from "@/lib/block-types";

function updateCell(rows: string[][], ri: number, ci: number, val: string): string[][] {
  return rows.map((r, rowIdx) =>
    rowIdx === ri ? r.map((c, colIdx) => (colIdx === ci ? val : c)) : r,
  );
}

export function TableEditable({ data, onUpdate }: EditableProps) {
  const rows = (data.content as string[][]) ?? [[""]];
  const withHeadings = !!(data.withHeadings);

  return (
    <div className="block-table overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className={ri === 0 && withHeadings ? "bg-zinc-100 font-semibold" : "even:bg-zinc-50"}
            >
              {row.map((cell, ci) =>
                ri === 0 && withHeadings ? (
                  <CE
                    key={ci}
                    as="th"
                    html={cell}
                    onSave={(val) => onUpdate({ ...data, content: updateCell(rows, ri, ci, val) })}
                    className="border border-zinc-200 px-3 py-2 text-left focus:outline-none focus:bg-blue-50"
                  />
                ) : (
                  <CE
                    key={ci}
                    as="td"
                    html={cell}
                    onSave={(val) => onUpdate({ ...data, content: updateCell(rows, ri, ci, val) })}
                    className="border border-zinc-200 px-3 py-2 focus:outline-none focus:bg-blue-50"
                  />
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-1 flex gap-3 text-xs text-zinc-400">
        <button
          className="hover:text-zinc-700"
          onClick={() => {
            const w = rows[0]?.length ?? 1;
            onUpdate({ ...data, content: [...rows, Array(w).fill("")] });
          }}
        >
          + row
        </button>
        <button
          className="hover:text-zinc-700"
          onClick={() => onUpdate({ ...data, content: rows.map((r) => [...r, ""]) })}
        >
          + col
        </button>
      </div>
    </div>
  );
}
