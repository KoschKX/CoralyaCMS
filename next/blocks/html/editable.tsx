"use client";

import { closeUnclosedTags } from "@/lib/close-unclosed-tags";
import type { EditableProps } from "@/lib/block-types";

export function HtmlEditable({ data, onUpdate, isSelected }: EditableProps) {
  const rawContent = (data.content as string) ?? "";
  const content = closeUnclosedTags(rawContent);

  if (!isSelected) {
    return (
      <div className="block-html">
        <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    );
  }

  return (
    <div className="block-html">
      <textarea
        className="w-full resize-y rounded border border-zinc-300 bg-zinc-50 p-2 font-mono text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-300"
        rows={Math.max(3, content.split("\n").length)}
        defaultValue={content}
        onBlur={(e) => onUpdate({ ...data, content: e.target.value })}
        spellCheck={false}
      />
    </div>
  );
}
