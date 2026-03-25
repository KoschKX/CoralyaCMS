// Type stubs for Editor.js packages that lack proper declaration file exports
declare module "@editorjs/embed" {
  const Embed: unknown;
  export default Embed;
}

declare module "@calumk/editorjs-columns" {
  const Columns: unknown;
  export default Columns;
}

// Global used to sync the active editor breakpoint into layout components
interface Window {
  __EDITOR_VIEWPORT__?: string;
}
