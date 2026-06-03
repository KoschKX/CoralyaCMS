/**
 * Converts an array of EditorBlocks to a raw HTML string.
 * Uses React's renderToStaticMarkup so the output matches exactly what BlockRenderer produces.
 * Safe to call from client components — react-dom/server works in the browser.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BlockRenderer from "@/components/BlockRenderer";
import type { EditorBlock } from "@/lib/pages-db";

/**
 * Renders the given blocks to a static HTML string using the same
 * BlockRenderer used on the front end.
 */
export function blocksToHTML(blocks: EditorBlock[]): string {
  return renderToStaticMarkup(createElement(BlockRenderer, { blocks }));
}
