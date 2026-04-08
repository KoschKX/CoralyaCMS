"use client";

import type { BlockData } from "@/lib/block-types";
import type { PaletteColor } from "@/lib/color-palette";
import { COLOR_PALETTE } from "@/lib/color-palette";
import { PanelSection } from "@/components/block-shared";
import { useSettings } from "@/hooks/useSettings";

export function ColorPicker({
  data,
  onChange,
}: {
  data: BlockData;
  onChange: (d: BlockData) => void;
}) {
  const { data: settings } = useSettings();
  const palette: PaletteColor[] = settings?.paletteColors?.length
    ? settings.paletteColors
    : COLOR_PALETTE;

  const current = (data.color as string) ?? "";
  const isCustom = current !== "" && !palette.some((c) => c.value === current);

  return (
    <PanelSection title="Text colour" fields={["color"]}>
      <div className="flex flex-wrap gap-1.5">
        {palette.map(({ label, value }) => (
          <button
            key={label}
            title={label}
            onClick={() => onChange({ color: value })}
            className={`h-6 w-6 rounded-full transition ${
              current === value
                ? "border-2 border-zinc-900 scale-110"
                : "hover:opacity-80"
            }`}
            style={{
              background:
                value === "" ? "linear-gradient(135deg,#e5e7eb 50%,#fff 50%)" : value,
              outline: value === "#ffffff" ? "1px solid #e5e7eb" : undefined,
            }}
          />
        ))}

        {/* Custom colour */}
        <label
          title="Custom colour"
          className={`relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full overflow-hidden transition ${
            isCustom ? "border-2 border-zinc-900 scale-110" : "hover:opacity-80"
          }`}
          style={{
            background: isCustom
              ? current
              : "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)",
          }}
        >
          <input
            type="color"
            value={isCustom ? current : "#000000"}
            onChange={(e) => onChange({ color: e.target.value })}
            className="absolute inset-0 cursor-pointer opacity-0 w-full h-full"
          />
        </label>
      </div>
    </PanelSection>
  );
}
