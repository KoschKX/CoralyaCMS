/**
 * Small SVG icons used in the block editor toolbar.
 * Extracted here to avoid duplicating inline SVGs inside BlockItem.
 * Stroke colors are hardcoded so these icons are immune to CSS color inheritance
 * from block content (e.g. a heading block with a custom text color).
 */

const ICON_COLOR = "#71717a";
const TRASH_COLOR = "#a1a1aa";

export function ChevronUpIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

export function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function TrashIcon({ hovered }: { hovered?: boolean } = {}) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke={hovered ? "#ef4444" : TRASH_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}
