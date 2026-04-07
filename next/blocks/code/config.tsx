import type { BlockDefinition } from "@/lib/block-types";
import CodeLayout from "./layout";
import { CodeEditable } from "./editable";

const code: BlockDefinition = {
  name: "code",
  label: "Code",
  icon: "</>",
  supportsBreakpoints: true,
  defaultData: { code: "" },
  Layout: CodeLayout,
  Editable: CodeEditable,
};

export default code;
