/**
 * HTMLRenderer
 *
 * Renders a shortcode document (as saved by the HTML/code view) on the front end.
 * Supports self-closing shortcodes and container blocks:
 *
 *   [header text="Hello" level="2"]
 *   [columns]
 *   [column width="50%"][paragraph text="Left"][/column]
 *   [column width="50%"][paragraph text="Right"][/column]
 *   [/columns]
 *
 * Plain text / raw HTML between shortcodes is rendered verbatim.
 */

import type { ReactNode } from "react";
import "@/blocks/index"; // side-effect: populates plugin-registry blockMap used by shortcodes.ts
import { publicBlockMap } from "@/blocks/layout-registry";
import { tokenise, buildBlocks } from "@/lib/shortcodes";
import { getBlockWrapperProps } from "@/lib/block-advanced-css";
import type { EditorBlock } from "@/lib/pages-db";

interface Props {
  html: string;
  disabledBlocks?: string[];
}

function RenderBlocks({
  blocks,
  disabledBlocks,
}: {
  blocks: EditorBlock[];
  disabledBlocks: string[];
}): ReactNode {
  return (
    <div
      className="text-zinc-800"
      style={{ display: "flex", flexDirection: "column", gap: "var(--block-spacing, 1.5rem)" }}
    >
      {blocks.map((block) => {
        if (disabledBlocks.includes(block.type)) return null;
        const def = publicBlockMap[block.type];
        if (!def) {
          return (
            <span key={block.id} className="font-mono text-xs text-red-400">
              {`[${block.type}]`}
            </span>
          );
        }
        const { style: wrapperStyle, extraClass, id: wrapperId } = getBlockWrapperProps(block.data as Record<string, unknown>);
        return (
          <div
            key={block.id}
            data-block-id={block.id}
            id={wrapperId}
            className={extraClass || undefined}
            style={Object.keys(wrapperStyle).length ? wrapperStyle : undefined}
          >
            <def.Layout
              data={block.data as Record<string, unknown>}
              blockId={block.id}
              renderBlocks={
                def.isContainer
                  ? (children) => (
                      <RenderBlocks blocks={children} disabledBlocks={disabledBlocks} />
                    )
                  : undefined
              }
            />
          </div>
        );
      })}
    </div>
  );
}

export default function HTMLRenderer({ html, disabledBlocks = [] }: Props) {
  const blocks = buildBlocks(tokenise(html), 0).blocks;
  return <RenderBlocks blocks={blocks} disabledBlocks={disabledBlocks} />;
}

