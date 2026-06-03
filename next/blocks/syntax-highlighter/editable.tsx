"use client";

import type { EditableProps } from "@/lib/block-types";
import SyntaxHighlighterLayout from "./layout";

export function SyntaxHighlighterEditable({ data, blockId }: EditableProps) {
  return <SyntaxHighlighterLayout data={data} blockId={blockId} />;
}
