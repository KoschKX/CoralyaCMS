"use client";

import type { BlockData } from "@/lib/block-types";
import { PanelSection } from "./PanelSection";

export function FontSizeButtons({
  data,
  onChange,
}: {
  data: BlockData;
  onChange: (d: BlockData) => void;
}) {
  const sizes: { value: string; label: string }[] = [
    { value: "sm",   label: "S" },
    { value: "base", label: "M" },
    { value: "lg",   label: "L" },
    { value: "xl",   label: "XL" },
  ];
  return (
    <PanelSection title="Font size" fields={["fontSize"]}>
      <div className="flex gap-1">
        {sizes.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onChange({ fontSize: value })}
            className={`flex-1 rounded border py-1.5 text-xs font-medium transition ${
              (data.fontSize ?? "base") === value
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </PanelSection>
  );
}
