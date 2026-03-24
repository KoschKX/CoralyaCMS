import { AlignButtons } from "@/components/block-shared";
import type { BlockDefinition } from "@/lib/block-types";
import QuoteLayout from "./layout";

const quote: BlockDefinition = {
  name: "quote",
  label: "Quote",
  icon: "❝",
  supportsBreakpoints: true,
  Layout: QuoteLayout,
  PanelControls({ data, onChange }) {
    return <AlignButtons data={data} onChange={onChange} />;
  },
  async getEditorTool() {
    const { default: Quote } = await import("@editorjs/quote");
    return { class: Quote, inlineToolbar: true };
  },
};

export default quote;
