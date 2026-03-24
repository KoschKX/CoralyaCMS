import { PanelSection } from "@/components/block-shared";
import type { BlockDefinition } from "@/lib/block-types";
import TableLayout from "./layout";

const table: BlockDefinition = {
  name: "table",
  label: "Table",
  icon: "⊞",
  supportsBreakpoints: true,
  Layout: TableLayout,
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
  async getEditorTool() {
    const { default: Table } = await import("@editorjs/table");
    return { class: Table, inlineToolbar: true };
  },
};

export default table;
