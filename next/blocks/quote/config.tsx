import { AlignButtons } from "@/components/block-shared";
import type { BlockDefinition } from "@/lib/block-types";
import QuoteLayout from "./layout";
import { QuoteEditable } from "./editable";

const quote: BlockDefinition = {
  name: "quote",
  label: "Quote",
  icon: "❝",
  supportsBreakpoints: true,
  defaultData: { text: "Quote text", caption: "" },
  Layout: QuoteLayout,
  Editable: QuoteEditable,
  PanelControls({ data, onChange }) {
    return <AlignButtons data={data} onChange={onChange} />;
  },
};

export default quote;
