"use client";

import { useContext } from "react";
import type { BlockData } from "@/lib/block-types";
import { PanelSection } from "./PanelSection";
import { ViewportContext } from "./ViewportContext";

export function AlignButtons({
  data,
  onChange,
}: {
  data: BlockData;
  onChange: (d: BlockData) => void;
}) {
  const { viewport, inheritedData } = useContext(ViewportContext);
  const isResponsive = viewport !== "desktop";
  const inheritedAlign = (inheritedData.align as string) ?? "left";
  const options: { value: string; label: string }[] = [
    { value: "left",    label: "L" },
    { value: "center",  label: "C" },
    { value: "right",   label: "R" },
    { value: "justify", label: "J" },
  ];
  return (
    <PanelSection title="Alignment" fields={["align"]}>
      <div className="flex gap-1">
        {options.map(({ value, label }) => {
          const isSelected = (data.align ?? "left") === value;
          const isBlue = isResponsive && value === inheritedAlign;
          return (
            <button
              key={value}
              title={value}
              onClick={() => onChange({ align: value })}
              className={`flex h-8 flex-1 items-center justify-center rounded border text-xs font-medium transition ${
                isBlue
                  ? "border-blue-400 border-dashed bg-white text-blue-500"
                  : isSelected
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
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
