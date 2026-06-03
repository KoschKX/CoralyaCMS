import { memo, useMemo } from "react";
import type { EditorBlock } from "@/lib/pages-db";
import { publicBlockMap } from "@/blocks/layout-registry";
import { parseShortcode } from "@/lib/shortcodes";
import { getBlockWrapperProps } from "@/lib/block-advanced-css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface Props {
  blocks: EditorBlock[];
  disabledBlocks?: string[];
}

interface ResolvedBlock {
  id: string;
  resolvedType: string;
  resolvedData: Record<string, unknown>;
  unavailable: false;
}
interface UnavailableBlock {
  id: string;
  originalType: string;
  reason: "disabled" | "unknown";
  unavailable: true;
}
type ResolvedEntry = ResolvedBlock | UnavailableBlock;

/**
 * Resolve shortcode paragraphs once per render cycle rather than inside the
 * map loop. This avoids re-parsing the same strings on every React reconcile.
 *
 * Uses a Set for O(1) disabled-block lookups instead of Array.includes().
 */
function resolveBlocks(
  blocks: EditorBlock[],
  disabledBlocks: string[],
): ResolvedEntry[] {
  const disabledSet = new Set(disabledBlocks);
  return blocks.map((block) => {
    if (disabledSet.has(block.type)) {
      return { id: block.id, originalType: block.type, reason: "disabled", unavailable: true };
    }
    // If a paragraph's entire text is a shortcode like [header text="Hi" level="2"],
    // render it as that block type instead of a paragraph.
    if (block.type === "paragraph") {
      const text = (block.data.text as string) ?? "";
      const sc = parseShortcode(text);
      if (sc) {
        if (disabledSet.has(sc.name)) {
          return { id: block.id, originalType: sc.name, reason: "disabled", unavailable: true };
        }
        if (publicBlockMap[sc.name]) {
          return { id: block.id, resolvedType: sc.name, resolvedData: sc.attrs, unavailable: false };
        }
      }
    }
    if (!publicBlockMap[block.type]) {
      return { id: block.id, originalType: block.type, reason: "unknown", unavailable: true };
    }
    return { id: block.id, resolvedType: block.type, resolvedData: block.data as Record<string, unknown>, unavailable: false };
  });
}

function UnavailablePlaceholder({ type, reason }: { type: string; reason: "disabled" | "unknown" }) {
  const message = reason === "disabled"
    ? `Block "${type}" is disabled and cannot be displayed.`
    : `Block "${type}" is no longer available.`;
  return (
    <div
      role="note"
      aria-label={message}
      style={{
        border: "1px dashed #d4d4d8",
        borderRadius: "0.375rem",
        color: "#a1a1aa",
        fontSize: "0.8125rem",
        fontFamily: "monospace",
        background: "#fafafa",
        padding: "0.25rem 0.5rem",
      }}
    >
      {message}
    </div>
  );
}

function BlockRenderer({ blocks, disabledBlocks = [] }: Props) {
  const resolved = useMemo(
    () => resolveBlocks(blocks, disabledBlocks),
    [blocks, disabledBlocks],
  );

  return (
    <div className="cms-block-list">
      {resolved.map((entry) => {
          if (entry.unavailable) {
            return (
              <div key={entry.id} data-block-id={entry.id}>
                <UnavailablePlaceholder type={entry.originalType} reason={entry.reason} />
              </div>
            );
          }
          const def = publicBlockMap[entry.resolvedType];
          if (!def) return null;

          const { style: wrapperStyle, extraClass, id: wrapperId } = getBlockWrapperProps(entry.resolvedData);
          return (
            <ErrorBoundary key={entry.id}>
              <div
                data-block-id={entry.id}
                id={wrapperId}
                className={extraClass || undefined}
                style={Object.keys(wrapperStyle).length ? wrapperStyle : undefined}
              >
                <def.Layout
                  data={entry.resolvedData}
                  blockId={entry.id}
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

