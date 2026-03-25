import "./styles.css";
import type { EditorBlock } from "@/lib/pages-db";
import type { BlockLayoutProps } from "@/lib/block-types";
import ColumnsGrid from "./ColumnsGrid";

export default function ColumnsLayout({ data, renderBlocks, blockId }: BlockLayoutProps & { blockId: string }) {
  const cols = (data.cols as Array<{ blocks: EditorBlock[]; width?: string }>) ?? [];
  const responsive = (data.responsive as Record<string, Record<string, string>>) ?? {};
  const colWidths = cols.map((col) => col.width || "1fr");

  return (
    <div data-block-id={blockId} className={`block-columns block-${blockId}`}>
      <ColumnsGrid colWidths={colWidths} responsive={responsive}>
        {cols.map((col, i) => (
          <div key={i} className="block-columns__col min-w-0">
            {renderBlocks ? renderBlocks(col.blocks ?? []) : null}
          </div>
        ))}
      </ColumnsGrid>
    </div>
  );
}
