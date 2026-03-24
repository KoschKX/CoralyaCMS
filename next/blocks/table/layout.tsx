import "./styles.css";
import type { BlockLayoutProps } from "@/lib/block-types";

export default function TableLayout({ data }: BlockLayoutProps) {
  const rows = (data.content as string[][]) ?? [];
  const withHeadings = data.withHeadings as boolean;
  return (
    <div className="block-table overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map((row, ri) => (
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
                  <th key={ci} className="border border-zinc-200 px-3 py-2 text-left">
                    {cell}
                  </th>
                ) : (
                  <td key={ci} className="border border-zinc-200 px-3 py-2">
                    {cell}
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
