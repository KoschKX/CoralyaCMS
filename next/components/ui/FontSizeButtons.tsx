"use client";

import { useContext } from "react";
import type { BlockData } from "@/lib/block-types";
import { PanelSection } from "./PanelSection";
import { ViewportContext } from "./ViewportContext";

export function FontSizeButtons({
  data,
  onChange,
}: {
  data: BlockData;
  onChange: (d: BlockData) => void;
}) {
  const { viewport, inheritedData } = useContext(ViewportContext);
  const isResponsive = viewport !== "desktop";
  const inheritedFontSize = (inheritedData.fontSize as string) ?? "base";
  const sizes: { value: string; label: string }[] = [
    { value: "sm",   label: "S" },
    { value: "base", label: "M" },
    { value: "lg",   label: "L" },
    { value: "xl",   label: "XL" },
  ];
  return (
    <PanelSection title="Font size" fields={["fontSize"]}>
      <div className="flex gap-1">
        {sizes.map(({ value, label }) => {
          const isSelected = (data.fontSize ?? "base") === value;
          const isBlue = isResponsive && value === inheritedFontSize;
          return (
            <button
              key={value}
              onClick={() => onChange({ fontSize: value })}
              className={`flex-1 rounded border py-1.5 text-xs font-medium transition ${
                isBlue
                  ? "border-blue-400 border-dashed bg-white text-blue-500"
                  : isSelected
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 text-zinc-500 hover:border-zinc-400"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </PanelSection>
  );
}
