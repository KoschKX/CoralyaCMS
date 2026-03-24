import type { BlockDefinition } from "@/lib/block-types";
import paragraph from "./paragraph/config";
import header    from "./header/config";
import list      from "./list/config";
import code      from "./code/config";
import quote     from "./quote/config";
import delimiter from "./delimiter/config";
import table     from "./table/config";
import embed     from "./embed/config";
import columns   from "./columns/config";
import html      from "./html/config";

export const blockRegistry: BlockDefinition[] = [
  paragraph,
  header,
  list,
  code,
  quote,
  delimiter,
  table,
  embed,
  columns,
  html,
];

/** Keyed by block type name for O(1) lookup */
export const blockMap: Record<string, BlockDefinition> = Object.fromEntries(
  blockRegistry.map((b) => [b.name, b]),
);
