import type { BlockDefinition, BlockData } from "@/lib/block-types";
import type { EditorBlock } from "@/lib/pages-db";
import ColumnsLayout from "./layout";
import ColumnsPanelControls from "./PanelControls";
import { ColumnsEditable } from "./editable";

type ColEntry = { blocks: EditorBlock[]; width?: string };

const columns: BlockDefinition = {
  name: "columns",
  label: "Columns",
  icon: "⊟",
  supportsBreakpoints: true,
  defaultData: { cols: [{ blocks: [], width: "50%" }, { blocks: [], width: "50%" }] },
  isContainer: true,
  getChildBlocks: (data: BlockData) => {
    const cols = (data.cols as ColEntry[]) ?? [];
    return cols.map((col) => col.blocks ?? []);
  },
  setChildBlocks: (data: BlockData, arrays: EditorBlock[][]) => {
    const cols = (data.cols as ColEntry[]) ?? [];
    return {
      ...data,
      cols: cols.map((col, i) => ({ ...col, blocks: arrays[i] ?? [] })),
    };
  },
  Layout: ColumnsLayout,
  Editable: ColumnsEditable,
  PanelControls: ColumnsPanelControls,
};

export default columns;
