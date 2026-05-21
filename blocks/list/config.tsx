import { useContext } from "react";
import { PanelSection } from "@/components/ui/PanelSection";
import { ViewportContext } from "@/components/ui/ViewportContext";
import type { BlockDefinition } from "@/lib/block-types";
import ListLayout from "./layout";
import { ListEditable } from "./editable";

/**
 * List block — ordered or unordered list of plain-text items.
 *
 * @example data
 * { items: ["First", "Second"], style: "unordered" }
 */
const list: BlockDefinition = {
  name: "list",
  label: "List",
  icon: "≡",
  category: "text",
  supportsBreakpoints: true,
  defaultData: { items: ["Item 1", "Item 2"], style: "unordered" },
  Layout: ListLayout,
  Editable: ListEditable,
  PanelControls({ data, onChange }) {
    const { viewport, inheritedData } = useContext(ViewportContext);
    const isResponsive = viewport !== "desktop";
    const inheritedStyle = (inheritedData.style as string) ?? "unordered";
    return (
      <PanelSection title="List style" fields={["style"]}>
        <div className="flex gap-2">
          {(["unordered", "ordered"] as const).map((style) => {
            const isSelected = (data.style ?? "unordered") === style;
            const isBlue = isResponsive && isSelected;
            return (
              <button
                key={style}
                onClick={() => onChange({ style })}
                className={`flex-1 rounded-md border py-1.5 text-xs font-medium transition ${
                  isBlue
                    ? "border-blue-400 border-dashed bg-white text-blue-500"
                    : isSelected
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                }`}
              >
                {style === "unordered" ? "• Bullet" : "1. Ordered"}
              </button>
            );
          })}
        </div>
      </PanelSection>
    );
  },
};

export default list;
