import type { BlockDefinition, BlockData } from "@/lib/block-types";
import type { EditorBlock } from "@/lib/pages-db";
import ColumnsLayout from "./layout";
import ColumnsPanelControls from "./PanelControls";
import { ColumnsEditable } from "./editable";

type ColEntry = { blocks: EditorBlock[]; width?: string; responsive?: Record<string, string> };

const INDENT = "  ";

/**
 * Columns block — a container with N resizable columns, each holding child blocks.
 * Implements `isContainer` so the block tree utilities recurse into child blocks.
 * Implements `serializeShortcode` so the shortcode serializer delegates to this
 * definition instead of maintaining a hardcoded special case.
 *
 * @example data
 * {
 *   cols: [
 *     { blocks: [], width: "50%" },
 *     { blocks: [], width: "50%" },
 *   ],
 *   responsive: {
 *     mobile: { "col-0-width": "100%", "col-1-width": "100%" }
 *   }
 * }
 */
const columns: BlockDefinition = {
  name: "columns",
  label: "Columns",
  icon: "⊟",
  supportsBreakpoints: true,
  defaultData: { cols: [{ blocks: [], width: "50%" }, { blocks: [], width: "50%" }] },
  isContainer: true,
  getChildBlocks: (data: BlockData) => {
    const cols = (data.cols as ColEntry[]) ?? [];
    return cols.map((col) => col.blocks ?? []);
  },
  setChildBlocks: (data: BlockData, arrays: EditorBlock[][]) => {
    const cols = (data.cols as ColEntry[]) ?? [];
    return {
      ...data,
      cols: cols.map((col, i) => ({ ...col, blocks: arrays[i] ?? [] })),
    };
  },
  serializeShortcode(data, depth, blocksToShortcodes, serializeAttr) {
    const pad = INDENT.repeat(depth);
    const childPad = INDENT.repeat(depth + 1);
    const cols = (data.cols as ColEntry[]) ?? [];
    const responsiveAttr = data.responsive ? ` ${serializeAttr("responsive", data.responsive)}` : "";
    const inner = cols.map((col) => {
      const widthAttr = col.width ? ` ${serializeAttr("width", col.width)}` : "";
      let responsiveAttrs = "";
      if (col.responsive) {
        for (const [bp, val] of Object.entries(col.responsive)) {
          if (val) responsiveAttrs += ` width_${bp}='${val}'`;
        }
      }
      const colInner = blocksToShortcodes(col.blocks ?? [], depth + 2);
      return colInner
        ? `${childPad}[column${widthAttr}${responsiveAttrs}]\n${colInner}\n${childPad}[/column]`
        : `${childPad}[column${widthAttr}${responsiveAttrs}][/column]`;
    }).join("\n");
    return `${pad}[columns${responsiveAttr}]\n${inner}\n${pad}[/columns]`;
  },
  Layout: ColumnsLayout,
  Editable: ColumnsEditable,
  PanelControls: ColumnsPanelControls,
};

export default columns;
