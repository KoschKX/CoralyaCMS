import { AlignButtons, FontSizeButtons } from "@/components/block-shared";
import { ColorPicker } from "@/components/ColorPicker";
import type { BlockDefinition } from "@/lib/block-types";
import ParagraphLayout from "./layout";
import { ParagraphEditable } from "./editable";

const paragraph: BlockDefinition = {
  name: "paragraph",
  label: "Paragraph",
  icon: "¶",
  supportsBreakpoints: true,
  defaultData: { text: "New paragraph" },
  Layout: ParagraphLayout,
  Editable: ParagraphEditable,
  PanelControls({ data, onChange }) {
    return (
      <div className="space-y-5">
        <FontSizeButtons data={data} onChange={onChange} />
        <AlignButtons data={data} onChange={onChange} />
        <ColorPicker data={data} onChange={onChange} />
      </div>
    );
  },
};

export default paragraph;
