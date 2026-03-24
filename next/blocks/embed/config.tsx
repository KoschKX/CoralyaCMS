import type { BlockDefinition } from "@/lib/block-types";
import EmbedLayout from "./layout";

const embed: BlockDefinition = {
  name: "embed",
  label: "Embed",
  icon: "◫",
  supportsBreakpoints: true,
  Layout: EmbedLayout,
  async getEditorTool() {
    const { default: Embed } = await import("@editorjs/embed");
    return { class: Embed };
  },
};

export default embed;
