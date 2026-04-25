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

import { registerBlock, blockRegistry, blockMap } from "@/lib/plugin-registry";

for (const block of [paragraph, header, list, code, quote, delimiter, table, embed, columns, html]) {
  registerBlock(block);
}

export { blockRegistry, blockMap };

