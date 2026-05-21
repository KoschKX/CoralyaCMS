import type { ReactNode } from "react";

/**
 * Editor layout — takes over the full viewport so the admin sidebar is hidden.
 * Both the block-inserter panel and the admin-nav drawer are rendered as
 * fixed overlays inside the editor pages themselves.
 */
export default function EditorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-white">
      {children}
    </div>
  );
}
