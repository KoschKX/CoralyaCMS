import { PanelSection } from "@/components/ui/PanelSection";
import type { BlockDefinition, BlockData } from "@/lib/block-types";
import type { EditorBlock } from "@/lib/pages-db";
import TableLayout from "./layout";
import { TableEditable } from "./editable";

type CellEntry = { blocks: EditorBlock[] };

/**
 * Table block — a grid of cells, each holding child blocks.
 * Implements isContainer so the block-tree utilities recurse into cells.
 *
 * @example data
 * {
 *   cells: [[{ blocks: [] }, { blocks: [] }], [{ blocks: [] }, { blocks: [] }]],
 *   withHeadings: true
 * }
 */
const table: BlockDefinition = {
  name: "table",
  label: "Table",
  icon: "⊞",
  category: "data",
  supportsBreakpoints: true,
  isContainer: true,
  defaultData: {
    cells: [
      [{ blocks: [] }, { blocks: [] }],
      [{ blocks: [] }, { blocks: [] }],
    ],
    withHeadings: true,
  },
  getChildBlocks: (data: BlockData) =>
    ((data.cells as CellEntry[][]) ?? []).flat().map((cell) => cell.blocks ?? []),
  setChildBlocks: (data: BlockData, arrays: EditorBlock[][]) => {
    const cells = (data.cells as CellEntry[][]) ?? [];
    const colCount = cells[0]?.length ?? 0;
    return {
      ...data,
      cells: cells.map((row, ri) =>
        row.map((cell, ci) => ({ ...cell, blocks: arrays[ri * colCount + ci] ?? [] })),
      ),
    };
  },
  Layout: TableLayout,
  Editable: TableEditable,
  PanelControls({ data, onChange }) {
    return (
      <PanelSection title="Table options" fields={["withHeadings"]}>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-700">
          <input
            type="checkbox"
            checked={!!(data.withHeadings)}
            onChange={(e) => onChange({ ...data, withHeadings: e.target.checked })}
            className="accent-zinc-900"
          />
          First row as headings
        </label>
      </PanelSection>
    );
  },
};

export default table;
