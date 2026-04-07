import type { BlockDefinition } from "@/lib/block-types";
import DelimiterLayout from "./layout";

const delimiter: BlockDefinition = {
  name: "delimiter",
  label: "Divider",
  icon: "—",
  supportsBreakpoints: true,
  defaultData: {},
  Layout: DelimiterLayout,
};

export default delimiter;
