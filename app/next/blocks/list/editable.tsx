"use client";

import { CE } from "@/components/editor/ContentEditable";
import type { EditableProps } from "@/lib/block-types";

export function ListEditable({ data, onUpdate }: EditableProps) {
  const items = (data.items as string[]) ?? [];
  const ordered = data.style === "ordered";
  const ListTag = ordered ? "ol" : "ul";

  function handleKeyDown(e: React.KeyboardEvent<HTMLElement>, i: number) {
    if (e.key === "Enter") {
      e.preventDefault();
      const newItems = [...items.slice(0, i + 1), "", ...items.slice(i + 1)];
      onUpdate({ ...data, items: newItems });
      requestAnimationFrame(() => {
        const li = (e.currentTarget.parentElement as HTMLElement)?.querySelectorAll("li")[i + 1];
        (li as HTMLElement | null)?.focus();
      });
    } else if (e.key === "Backspace" && e.currentTarget.innerHTML === "" && items.length > 1) {
      e.preventDefault();
      const newItems = items.filter((_, j) => j !== i);
      onUpdate({ ...data, items: newItems });
      requestAnimationFrame(() => {
        const prevIdx = Math.max(0, i - 1);
        const li = (e.currentTarget.parentElement as HTMLElement)?.querySelectorAll("li")[prevIdx];
        (li as HTMLElement | null)?.focus();
      });
    }
  }

  return (
    <ListTag className={`block-list ${ordered ? "list-decimal pl-6 space-y-1" : "list-disc pl-6 space-y-1"}`}>
      {items.map((item, i) => (
        <CE
          key={i}
          as="li"
          html={item}
          onSave={(val) => {
            const newItems = [...items];
            newItems[i] = val;
            onUpdate({ ...data, items: newItems });
          }}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="focus:outline-none"
        />
      ))}
    </ListTag>
  );
}
