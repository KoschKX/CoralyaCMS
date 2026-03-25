import { PanelSection } from "@/components/block-shared";
import type { BlockDefinition } from "@/lib/block-types";
import ListLayout from "./layout";

const list: BlockDefinition = {
  name: "list",
  label: "List",
  icon: "≡",
  supportsBreakpoints: true,
  Layout: ListLayout,
  PanelControls({ data, onChange }) {
    return (
      <PanelSection title="List style" fields={["style"]}>
        <div className="flex gap-2">
          {(["unordered", "ordered"] as const).map((style) => (
            <button
              key={style}
              onClick={() => onChange({ style })}
              className={`flex-1 rounded-md border py-1.5 text-xs font-medium transition ${
                (data.style ?? "unordered") === style
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
              }`}
            >
              {style === "unordered" ? "• Bullet" : "1. Ordered"}
            </button>
          ))}
        </div>
      </PanelSection>
    );
  },
  async getEditorTool() {
    const m = await import("@editorjs/list");
    const List = (m as unknown as { default: unknown }).default ?? m;
    return { class: List, inlineToolbar: true };
  },
};

export default list;
