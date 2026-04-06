import { AlignButtons, FontSizeButtons } from "@/components/block-shared";
import { ColorPicker } from "@/components/ColorPicker";
import type { BlockDefinition } from "@/lib/block-types";
import ParagraphLayout from "./layout";

const paragraph: BlockDefinition = {
  name: "paragraph",
  label: "Paragraph",
  icon: "¶",
  supportsBreakpoints: true,
  Layout: ParagraphLayout,
  PanelControls({ data, onChange }) {
    return (
      <div className="space-y-5">
        <FontSizeButtons data={data} onChange={onChange} />
        <AlignButtons data={data} onChange={onChange} />
        <ColorPicker data={data} onChange={onChange} />
      </div>
    );
  },
  // paragraph is the default Editor.js block — no tool registration needed
  async getEditorTool() {
    return null;
  },
};

export default paragraph;
