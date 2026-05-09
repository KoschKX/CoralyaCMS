"use client";

import type { ReactNode } from "react";

export function PanelSection({
  title,
  children,
}: {
  title: string;
  /** @deprecated no longer used */
  fields?: string[];
  /** @deprecated no longer used */
  isEnabledOverride?: boolean;
  /** @deprecated no longer used */
  onToggleOverride?: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}
