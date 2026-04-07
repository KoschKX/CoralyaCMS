import type { BlockDefinition } from "@/lib/block-types";
import ColumnsLayout from "./layout";
import ColumnsPanelControls from "./PanelControls";
import { ColumnsEditable } from "./editable";

const columns: BlockDefinition = {
  name: "columns",
  label: "Columns",
  icon: "⊟",
  supportsBreakpoints: true,
  defaultData: { cols: [{ blocks: [], width: "50%" }, { blocks: [], width: "50%" }] },
  Layout: ColumnsLayout,
  Editable: ColumnsEditable,
  PanelControls: ColumnsPanelControls,
};

export default columns;
