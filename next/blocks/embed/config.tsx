import type { BlockDefinition } from "@/lib/block-types";
import EmbedLayout from "./layout";
import { EmbedEditable } from "./editable";

const embed: BlockDefinition = {
  name: "embed",
  label: "Embed",
  icon: "◫",
  supportsBreakpoints: true,
  defaultData: { embed: "" },
  Layout: EmbedLayout,
  Editable: EmbedEditable,
};

export default embed;
