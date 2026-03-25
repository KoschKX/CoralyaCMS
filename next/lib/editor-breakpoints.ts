// Helper to get breakpoints for the editor (fallback to defaults if not found)
export function getEditorBreakpoints() {
  // Default values (match your frontend if not set elsewhere)
  return {
    tablet: "1023px",
    mobile: "640px",
  };
}
