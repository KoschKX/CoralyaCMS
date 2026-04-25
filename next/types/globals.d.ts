// Global used to sync the active editor breakpoint into layout components
interface Window {
  __EDITOR_VIEWPORT__?: string;
  /** Width of the editor canvas in px, set by a ResizeObserver in EditorPage */
  __EDITOR_CANVAS_WIDTH__?: number;
}
