"use client";

import { InlineCodeEditor } from "@/components/editor/InlineCodeEditor";
import type { EditableProps } from "@/lib/block-types";

export function CodeEditable({ data, onUpdate }: EditableProps) {
  const code = (data.code as string) ?? "";
  return (
    <pre className="block-code overflow-x-auto rounded-lg bg-zinc-900 px-5 py-4 text-sm text-zinc-100">
      <InlineCodeEditor code={code} onSave={(val) => onUpdate({ ...data, code: val })} />
    </pre>
  );
}
