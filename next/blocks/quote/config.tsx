import { AlignButtons } from "@/components/ui/AlignButtons";
import type { BlockDefinition } from "@/lib/block-types";
import QuoteLayout from "./layout";
import { QuoteEditable } from "./editable";

/**
 * Quote block — blockquote with optional caption and alignment.
 *
 * @example data
 * { text: "To be or not to be.", caption: "Shakespeare", align: "left" }
 */
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
