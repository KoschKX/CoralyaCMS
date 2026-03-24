import type { BlockDefinition } from "@/lib/block-types";
import HtmlLayout from "./layout";

const htmlBlock: BlockDefinition = {
  name: "html",
  label: "Raw HTML",
  icon: "</>",
  Layout: HtmlLayout,
  PanelControls({ data, onChange }) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide">HTML</label>
        <textarea
          value={(data.content as string) ?? ""}
          onChange={(e) => onChange({ ...data, content: e.target.value })}
          rows={10}
          spellCheck={false}
          className="w-full rounded border border-zinc-200 bg-zinc-50 p-2 font-mono text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-y"
          placeholder="<div>Raw HTML…</div>"
        />
      </div>
    );
  },
  async getEditorTool() {
    const { default: HtmlTool } = await import("./editor-tool");
    return { class: HtmlTool, inlineToolbar: false };
  },
};

export default htmlBlock;
