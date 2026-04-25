import type { BlockDefinition } from "@/lib/block-types";
import EmbedLayout from "./layout";
import { EmbedEditable } from "./editable";

/**
 * Embed block — an iframe embed (YouTube, maps, etc.) identified by URL.
 *
 * @example data
 * { embed: "https://www.youtube.com/embed/dQw4w9WgXcQ" }
 */
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
