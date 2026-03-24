import "./styles.css";
import type { EditorBlock } from "@/lib/pages-db";
import type { BlockLayoutProps } from "@/lib/block-types";

export default function ColumnsLayout({ data, renderBlocks }: BlockLayoutProps) {
  const cols = (data.cols as Array<{ blocks: EditorBlock[]; width?: string }>) ?? [];

  // Convert percentage widths to fr units so the gap doesn't cause overflow.
  // e.g. "50% 50%" + gap-6 would exceed 100%; "50fr 50fr" divides available space.
  const gridTemplateColumns = cols.every((c) => !c.width)
    ? `repeat(${cols.length || 2}, minmax(0, 1fr))`
    : cols.map((c) => {
        if (!c.width) return "1fr";
        const n = parseFloat(c.width);
        return isNaN(n) ? c.width : `${n}fr`;
      }).join(" ");

  return (
    <div
      className="block-columns grid gap-6"
      style={{ gridTemplateColumns }}
    >
      {cols.map((col, i) => (
        <div key={i} className="block-columns__col min-w-0">
          {renderBlocks?.(col.blocks ?? [])}
        </div>
      ))}
    </div>
  );
}
