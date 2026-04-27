import { AlignButtons } from "@/components/ui/AlignButtons";
import { PanelSection } from "@/components/ui/PanelSection";
import { ColorPicker } from "@/components/ColorPicker";
import type { BlockDefinition } from "@/lib/block-types";
import HeaderLayout from "./layout";
import { HeaderEditable } from "./editable";

/**
 * Header block — heading element (H1–H4) with alignment and color.
 *
 * @example data
 * { text: "My Heading", level: 2, align: "left", color: "" }
 */
const header: BlockDefinition = {
  name: "header",
  label: "Heading",
  icon: "heading",
  category: "text",
  supportsBreakpoints: true,
  defaultData: { text: "New heading", level: 2 },
  Layout: HeaderLayout,
  Editable: HeaderEditable,
  PanelControls({ data, onChange }) {
    return (
      <div className="space-y-5">
        <PanelSection title="Heading level" fields={["level"]}>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((lvl) => (
              <button
                key={lvl}
                onClick={() => onChange({ level: lvl })}
                className={`flex h-8 w-8 items-center justify-center rounded border text-xs font-bold transition ${
                  (data.level ?? 2) === lvl
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                }`}
              >
                H{lvl}
              </button>
            ))}
          </div>
        </PanelSection>
        <AlignButtons data={data} onChange={onChange} />
        <ColorPicker data={data} onChange={onChange} />
      </div>
    );
  },
};

export default header;
