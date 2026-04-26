import type { BlockDefinition } from "@/lib/block-types";
import EmbedLayout from "./layout";
import { EmbedEditable } from "./editable";

/**
 * Embed block — an iframe embed (YouTube, maps, etc.) identified by URL.
 *
 * @example data
 * { embed: "https://www.youtube.com/embed/dQw4w9WgXcQ" }
 */
/** Only http/https embed URLs are valid. */
function validateEmbed(data: import("@/lib/block-types").BlockData): boolean {
  const url = data.embed;
  if (typeof url !== "string" || url === "") return true; // empty is allowed
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const embed: BlockDefinition = {
  name: "embed",
  label: "Embed",
  icon: "◫",
  supportsBreakpoints: true,
  defaultData: { embed: "" },
  validate: validateEmbed,
  Layout: EmbedLayout,
  Editable: EmbedEditable,
};

export default embed;
