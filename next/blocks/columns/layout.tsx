import "./styles.css";
import type { EditorBlock } from "@/lib/pages-db";
import type { BlockLayoutProps } from "@/lib/block-types";
import { getBlockWrapperProps } from "@/lib/block-advanced-css";

type ColEntry = { blocks: EditorBlock[]; width?: string };

// Pure server component — no JS needed for layout.
// Widths are set via inline gridTemplateColumns; responsive stacking is handled
// entirely by the @media CSS injected by buildResponsiveCSS.
export default function ColumnsLayout({ data, renderBlocks, blockId }: BlockLayoutProps & { blockId: string }) {
  const cols = (data.cols as ColEntry[]) ?? [];

  return (
    <div
      data-block-id={blockId}
      className={`block-columns block-${blockId}`}
      style={{ display: "flex", flexWrap: "wrap", alignItems: "stretch" }}
    >
      {cols.map((col, i) => {
        const width = col.width || `${100 / (cols.length || 1)}%`;
        const paddingLeft = cols.length > 1 && i === 0 ? "0" : "0.75rem";
        const { style: colStyle, extraClass: colExtraClass } = getBlockWrapperProps(col as Record<string, unknown>);
        return (
          <div
            key={i}
            className={`block-columns__col-wrapper min-w-0${colExtraClass ? ` ${colExtraClass}` : ""}`}
            style={{ width, paddingLeft, paddingRight: "0.75rem", boxSizing: "border-box", ...colStyle }}
          >
            {renderBlocks ? renderBlocks(col.blocks ?? []) : null}
          </div>
        );
      })}
    </div>
  );
}
