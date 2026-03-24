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

import { type ReactNode } from "react";
import { blockMap } from "@/blocks/index";
import { tokenise, buildBlocks } from "@/lib/shortcodes";
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
        const def = blockMap[block.type];
        if (!def) {
          return (
            <span key={block.id} className="font-mono text-xs text-red-400">
              {`[${block.type}]`}
            </span>
          );
        }
        return (
          <div key={block.id}>
            <def.Layout
              data={block.data as Record<string, unknown>}
              renderBlocks={(children) => (
                <RenderBlocks blocks={children} disabledBlocks={disabledBlocks} />
              )}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function HTMLRenderer({ html, disabledBlocks = [] }: Props) {
  const tokens = tokenise(html);
  const { blocks } = buildBlocks(tokens, 0);
  return <RenderBlocks blocks={blocks} disabledBlocks={disabledBlocks} />;
}

