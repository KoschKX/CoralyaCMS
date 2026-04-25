import { memo, useMemo } from "react";
import type { EditorBlock } from "@/lib/pages-db";
import { blockMap } from "@/blocks/index";
import { parseShortcode } from "@/lib/shortcodes";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface Props {
  blocks: EditorBlock[];
  disabledBlocks?: string[];
}

/**
 * Resolve shortcode paragraphs once per render cycle rather than inside the
 * map loop. This avoids re-parsing the same strings on every React reconcile.
 */
function resolveBlocks(
  blocks: EditorBlock[],
  disabledBlocks: string[],
): Array<{ id: string; resolvedType: string; resolvedData: Record<string, unknown> }> {
  return blocks
    .filter((block) => !disabledBlocks.includes(block.type))
    .map((block) => {
      // If a paragraph's entire text is a shortcode like [header text="Hi" level="2"],
      // render it as that block type instead of a paragraph.
      if (block.type === "paragraph") {
        const text = (block.data.text as string) ?? "";
        const sc = parseShortcode(text);
        if (sc && blockMap[sc.name] && !disabledBlocks.includes(sc.name)) {
          return { id: block.id, resolvedType: sc.name, resolvedData: sc.attrs };
        }
      }
      return { id: block.id, resolvedType: block.type, resolvedData: block.data as Record<string, unknown> };
    });
}

function BlockRenderer({ blocks, disabledBlocks = [] }: Props) {
  const resolved = useMemo(
    () => resolveBlocks(blocks, disabledBlocks),
    [blocks, disabledBlocks],
  );

  return (
    <div className="text-zinc-800" style={{ display: "flex", flexDirection: "column", gap: "var(--block-spacing, 1.5rem)" }}>
      {resolved.map(({ id, resolvedType, resolvedData }) => {
          const def = blockMap[resolvedType];
          if (!def) return null;

          return (
            <ErrorBoundary key={id}>
              <div data-block-id={id}>
                <def.Layout
                  data={resolvedData}
                  blockId={id}
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

