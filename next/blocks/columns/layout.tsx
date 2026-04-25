import "./styles.css";
import type { EditorBlock } from "@/lib/pages-db";
import type { BlockLayoutProps } from "@/lib/block-types";

type ColEntry = { blocks: EditorBlock[]; width?: string };

// Pure server component — no JS needed for layout.
// Widths are set via inline gridTemplateColumns; responsive stacking is handled
// entirely by the @media CSS injected by buildResponsiveCSS.
export default function ColumnsLayout({ data, renderBlocks, blockId }: BlockLayoutProps & { blockId: string }) {
  const cols = (data.cols as ColEntry[]) ?? [];
  const colWidths = cols.map((col) => col.width || "1fr").join(" ");

  return (
    <div
      data-block-id={blockId}
      className={`block-columns block-${blockId}`}
      style={{ display: "grid", gridTemplateColumns: colWidths, gap: "0.75rem" }}
    >
      {cols.map((col, i) => (
        <div key={i} className="block-columns__col-wrapper min-w-0">
          {renderBlocks ? renderBlocks(col.blocks ?? []) : null}
        </div>
      ))}
    </div>
  );
}
