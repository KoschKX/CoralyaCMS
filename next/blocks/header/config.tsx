import { AlignButtons, PanelSection } from "@/components/block-shared";
import { ColorPicker } from "@/components/ColorPicker";
import type { BlockDefinition } from "@/lib/block-types";
import HeaderLayout from "./layout";

const header: BlockDefinition = {
  name: "header",
  label: "Heading",
  icon: "heading",
  supportsBreakpoints: true,
  Layout: HeaderLayout,
  PanelControls({ data, onChange }) {
    return (
      <div className="space-y-5">
        <PanelSection title="Heading level" fields={["level"]}>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((lvl) => (
              <button
                key={lvl}
                onClick={() => onChange({ ...data, level: lvl })}
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
  async getEditorTool() {
    const { default: Header } = await import("@editorjs/header");
    return { class: Header, config: { levels: [1, 2, 3, 4], defaultLevel: 2 } };
  },
};

export default header;
