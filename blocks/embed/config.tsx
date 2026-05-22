import type { BlockDefinition } from "@/lib/block-types";
import EmbedLayout from "./layout";
import { EmbedEditable } from "./editable";
import { EmbedPanelControls } from "./panel";

const embed: BlockDefinition = {
  name: "embed",
  label: "Embed",
  icon: "◫",
  category: "media",
  defaultData: {
    code:      "",
    maxWidth:  "",
    alignment: "center",
  },
  Layout:        EmbedLayout,
  Editable:      EmbedEditable,
  PanelControls: EmbedPanelControls,
};

export default embed;
