import { PanelSection } from "@/components/ui/PanelSection";
import type { BlockDefinition } from "@/lib/block-types";
import TableLayout from "./layout";
import { TableEditable } from "./editable";

/**
 * Table block — a grid of editable cells with an optional heading row.
 *
 * @example data
 * { content: [["Col A", "Col B"], ["Cell 1", "Cell 2"]], withHeadings: true }
 */
const table: BlockDefinition = {
  name: "table",
  label: "Table",
  icon: "⊞",
  category: "data",
  supportsBreakpoints: true,
  defaultData: { content: [["Heading 1", "Heading 2"], ["Cell 1", "Cell 2"]], withHeadings: true },
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
