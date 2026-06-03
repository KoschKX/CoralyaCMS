import "./styles.css";
import type { EditorBlock } from "@/lib/pages-db";
import type { BlockLayoutProps } from "@/lib/block-types";

type CellEntry = { blocks: EditorBlock[] };

export default function TableLayout({ data, blockId, renderBlocks }: BlockLayoutProps & { blockId: string }) {
  const cells = (data.cells as CellEntry[][]) ?? [];
  const withHeadings = data.withHeadings as boolean;
  return (
    <div data-block-id={blockId} className={`block-table overflow-x-auto block-${blockId}`}>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {cells.map((row, ri) => (
            <tr
              key={ri}
              className={
                ri === 0 && withHeadings
                  ? "bg-zinc-100 font-semibold"
                  : "even:bg-zinc-50"
              }
            >
              {row.map((cell, ci) =>
                ri === 0 && withHeadings ? (
                  <th key={ci} className="border border-zinc-200 px-3 py-2 text-left align-top">
                    {renderBlocks ? renderBlocks(cell.blocks ?? []) : null}
                  </th>
                ) : (
                  <td key={ci} className="border border-zinc-200 px-3 py-2 align-top">
                    {renderBlocks ? renderBlocks(cell.blocks ?? []) : null}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
