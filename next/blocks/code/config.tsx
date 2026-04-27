import type { BlockDefinition } from "@/lib/block-types";
import CodeLayout from "./layout";
import { CodeEditable } from "./editable";

/**
 * Code block — syntax-highlighted code snippet with language label.
 *
 * @example data
 * { code: "console.log('hello');" }
 */
const code: BlockDefinition = {
  name: "code",
  label: "Code",
  icon: "</>",
  category: "code",
  supportsBreakpoints: true,
  defaultData: { code: "" },
  Layout: CodeLayout,
  Editable: CodeEditable,
};

export default code;
