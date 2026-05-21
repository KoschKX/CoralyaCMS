"use client";

import dynamic from "next/dynamic";
import type { EditableProps } from "@/lib/block-types";

// InlineCodeEditor pulls in the Monaco-style contentEditable with Prism styling.
// Lazy-load it so the code block's editing UI is excluded from the main admin chunk.
const InlineCodeEditor = dynamic(
  () => import("@/components/editor/InlineCodeEditor").then((m) => ({ default: m.InlineCodeEditor })),
  { ssr: false },
);

export function CodeEditable({ data, onUpdate }: EditableProps) {
  const code = (data.code as string) ?? "";
  return (
    <pre className="block-code overflow-x-auto rounded-lg bg-zinc-900 px-5 py-4 text-sm text-zinc-100">
      <InlineCodeEditor code={code} onSave={(val) => onUpdate({ ...data, code: val })} />
    </pre>
  );
}

