import type { BlockDefinition } from "@/lib/block-types";
import DelimiterLayout from "./layout";

const delimiter: BlockDefinition = {
  name: "delimiter",
  label: "Divider",
  icon: "—",
  supportsBreakpoints: true,
  Layout: DelimiterLayout,
  async getEditorTool() {
    const { default: Delimiter } = await import("@editorjs/delimiter");
    return { class: Delimiter };
  },
};

export default delimiter;
