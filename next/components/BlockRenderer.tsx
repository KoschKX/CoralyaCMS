import { memo } from "react";
import type { EditorBlock } from "@/lib/pages-db";
import { blockMap } from "@/blocks/index";
import { parseShortcode } from "@/lib/shortcodes";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface Props {
  blocks: EditorBlock[];
  disabledBlocks?: string[];
}

function BlockRenderer({ blocks, disabledBlocks = [] }: Props) {
  return (
    <div className="text-zinc-800" style={{ display: "flex", flexDirection: "column", gap: "var(--block-spacing, 1.5rem)" }}>
      {blocks
        .filter((block) => !disabledBlocks.includes(block.type))
        .map((block) => {
          // ── Shortcode resolution ──────────────────────────────────────
          // If a paragraph's entire text is a shortcode like [header text="Hi" level="2"],
          // render it as that block type instead of a paragraph.
          let resolvedType = block.type;
          let resolvedData = block.data as Record<string, unknown>;

          if (block.type === "paragraph") {
            const text = (block.data.text as string) ?? "";
            const sc = parseShortcode(text);
            if (sc && blockMap[sc.name] && !disabledBlocks.includes(sc.name)) {
              resolvedType = sc.name;
              resolvedData = sc.attrs;
            }
          }

          const def = blockMap[resolvedType];
          if (!def) return null;

          return (
            <ErrorBoundary key={block.id}>
              <div data-block-id={block.id}>
                <def.Layout
                  data={resolvedData}
                  blockId={block.id}
                  renderBlocks={
                    def.isContainer
                      ? (children) => <BlockRenderer blocks={children} disabledBlocks={disabledBlocks} />
                      : undefined
                  }
                />
              </div>
            </ErrorBoundary>
          );
        })}
    </div>
  );
}

export default memo(BlockRenderer);

