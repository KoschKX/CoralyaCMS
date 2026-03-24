import type { BlockDefinition } from "@/lib/block-types";
import CodeLayout from "./layout";

const code: BlockDefinition = {
  name: "code",
  label: "Code",
  icon: "</>",
  supportsBreakpoints: true,
  Layout: CodeLayout,
  // No panel controls needed for code blocks
  async getEditorTool() {
    const { default: Code } = await import("@editorjs/code");
    return { class: Code };
  },
};

export default code;
