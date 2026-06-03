import type { BlockDefinition } from "@/lib/block-types";
import DelimiterLayout from "./layout";

/**
 * Delimiter block — a visual horizontal rule with no configurable content.
 *
 * @example data
 * {}
 */
const delimiter: BlockDefinition = {
  name: "delimiter",
  label: "Divider",
  icon: "—",
  category: "design",
  supportsBreakpoints: true,
  defaultData: {},
  Layout: DelimiterLayout,
};

export default delimiter;
