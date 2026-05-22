/**
 * Public block layout registry
 * ──────────────────────────────
 * A lightweight subset of the full block registry containing only what the
 * public-facing BlockRenderer needs: the Layout component plus container
 * metadata (isContainer / getChildBlocks) for blocks that hold child blocks.
 *
 * This module intentionally does NOT import Editable or PanelControls
 * components, keeping them out of the public page bundle. The full registry
 * (including all editor components) lives in blocks/index.ts and is used
 * only by the admin editor.
 *
 * Plugin authors can call registerPublicLayout() to make their custom blocks
 * renderable on public pages without pulling in editor-only code.
 */

import type { ReactNode } from "react";
import type { EditorBlock } from "@/lib/types";
import type { BlockLayoutProps } from "@/lib/block-types";

import ParagraphLayout from "./paragraph/layout";
import HeaderLayout    from "./header/layout";
import ListLayout      from "./list/layout";
import CodeLayout      from "./code/layout";
import QuoteLayout     from "./quote/layout";
import DelimiterLayout from "./delimiter/layout";
import TableLayout     from "./table/layout";
import EmbedLayout     from "./embed/layout";
import ColumnsLayout, { columnsIsContainer, columnsGetChildBlocks } from "./columns/layout";
import HtmlLayout      from "./html/layout";
import ImageLayout     from "./image/layout";
import ButtonLayout    from "./button/layout";
import CounterLayout   from "./counter/layout";
import CarouselLayout  from "./carousel/layout";
import CountdownLayout from "./countdown/layout";

export interface PublicBlockDef {
  Layout: (props: BlockLayoutProps) => ReactNode;
  isContainer?: boolean;
  getChildBlocks?: (data: Record<string, unknown>) => EditorBlock[][];
}

export const publicBlockMap: Record<string, PublicBlockDef> = {
  paragraph: { Layout: ParagraphLayout },
  header:    { Layout: HeaderLayout },
  list:      { Layout: ListLayout },
  code:      { Layout: CodeLayout },
  quote:     { Layout: QuoteLayout },
  delimiter: { Layout: DelimiterLayout },
  table:     { Layout: TableLayout },
  embed:     { Layout: EmbedLayout },
  html:      { Layout: HtmlLayout },
  image:     { Layout: ImageLayout },
  button:    { Layout: ButtonLayout },
  counter:   { Layout: CounterLayout },
  carousel:  { Layout: CarouselLayout },
  countdown: { Layout: CountdownLayout },
  columns: {
    Layout: ColumnsLayout,
    isContainer: columnsIsContainer,
    getChildBlocks: columnsGetChildBlocks,
  },
};

/**
 * Register a custom block's Layout in the public renderer.
 * Call this in plugin code to make plugin-defined blocks visible on public
 * pages without importing editor-only Editable / PanelControls components.
 */
export function registerPublicLayout(name: string, def: PublicBlockDef): void {
  publicBlockMap[name] = def;
}
