import type { BlockDefinition } from "@/lib/block-types";
import ColumnsLayout from "./layout";
import ColumnsPanelControls from "./PanelControls";

const columns: BlockDefinition = {
  name: "columns",
  label: "Columns",
  icon: "⊟",
  supportsBreakpoints: true,
  Layout: ColumnsLayout,

  PanelControls: ColumnsPanelControls,

  // Columns needs EditorJS + baseTools injected at runtime — handled in BlockEditor
  async getEditorTool(deps) {
    const Columns = await import("@calumk/editorjs-columns").then(
      (m) => m.default ?? m,
    );
    return {
      class: Columns,
      config: {
        EditorJsLibrary: deps?.EditorJS,
        tools: deps?.baseTools ?? {},
      },
    };
  },
};

export default columns;

