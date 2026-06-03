"use client";

import type { EditableProps } from "@/lib/block-types";
import CounterLayout from "./layout";

/**
 * Editor-mode counter block.
 * All editing is done through the panel, so the editable is just the
 * read-only layout — no inline interactions needed.
 */
export function CounterEditable({ data, blockId }: EditableProps) {
  return <CounterLayout data={data} blockId={blockId} />;
}
