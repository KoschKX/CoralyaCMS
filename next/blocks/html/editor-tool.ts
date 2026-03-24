/**
 * EditorJS tool for raw HTML blocks.
 * Display-only preview in the canvas — editing happens in the right panel textarea.
 */
export default class HtmlTool {
  private data: { content: string };

  static get toolbox() {
    return { title: "HTML", icon: "</>" };
  }

  static get isReadOnlySupported() { return true; }

  constructor({ data }: { data: { content?: string } }) {
    this.data = { content: data?.content ?? "" };
  }

  render() {
    const el = document.createElement("div");
    el.className = "cdx-block html-tool-preview";
    el.innerHTML = this.data.content;
    return el;
  }

  save() {
    return { content: this.data.content };
  }
}

