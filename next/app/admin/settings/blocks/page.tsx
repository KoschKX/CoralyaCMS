"use client";

import { BlockIcon } from "@/components/BlockIcon";
import { useEffect, useState } from "react";
import { blockRegistry } from "@/blocks/index";

export default function BlocksPage() {
  const [disabled, setDisabled] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => setDisabled(new Set(s.disabledBlocks ?? [])));
  }, []);

  function toggle(name: string) {
    setDisabled((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disabledBlocks: [...disabled] }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-zinc-900">Blocks</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Enable or disable blocks in the editor. Disabled blocks cannot be added to pages.
      </p>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {blockRegistry.map((block, i) => {
          const enabled = !disabled.has(block.name);
          return (
            <div
              key={block.name}
              className={`flex items-center gap-4 px-5 py-3.5 ${
                i !== blockRegistry.length - 1 ? "border-b border-zinc-100" : ""
              }`}
            >
              <span className="text-xl">
                <BlockIcon name={block.name} label={block.label} size={22} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-800">{block.label}</p>
                <p className="font-mono text-[11px] text-zinc-400">{block.name}</p>
              </div>
              {/* Toggle */}
              <button
                role="switch"
                aria-checked={enabled}
                onClick={() => toggle(block.name)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                  enabled ? "bg-zinc-900" : "bg-zinc-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    enabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        {saved && <span className="text-xs text-green-600">Saved!</span>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
