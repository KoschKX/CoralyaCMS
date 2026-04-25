"use client";

import { useState } from "react";

interface PluginToggleProps {
  name: string;
  initialEnabled: boolean;
}

export function PluginToggle({ name, initialEnabled }: PluginToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await fetch("/api/plugins/states", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, enabled: !enabled }),
    });
    setEnabled((e) => !e);
    setBusy(false);
  }

  return (
    <button
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? "Disable plugin" : "Enable plugin"}
      disabled={busy}
      onClick={toggle}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
        enabled ? "bg-zinc-900" : "bg-zinc-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          enabled ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}
