"use client";

import type { EditorBlock } from "@/lib/pages-db";
import type { BlockOps } from "@/components/editor/BlockEditorContext";
import BlockItem from "@/components/editor/BlockItem";

interface BlockListProps {
  list: EditorBlock[];
  ops: BlockOps;
  isInColumn?: boolean;
  parentInfo?: { type: string; label: string; onSelect: () => void };
}

export default function BlockList({ list, ops, isInColumn = false, parentInfo }: BlockListProps) {
  return (
    <>
      {list.map((block, idx) => (
        <BlockItem
          key={block.id}
          block={block}
          idx={idx}
          listLength={list.length}
          ops={ops}
          isInColumn={isInColumn}
          parentInfo={parentInfo}
        />
      ))}
    </>
  );
}
