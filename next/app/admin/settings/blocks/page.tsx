"use client";

import Link from "next/link";
import { BlockIcon } from "@/components/BlockIcon";
import { useEffect, useState } from "react";
import { blockRegistry } from "@/blocks/index";

function GearIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

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

      <div className="space-y-3">
        {blockRegistry.map((block) => {
          const enabled = !disabled.has(block.name);
          return (
            <div key={block.name} className="flex items-stretch gap-1.5">
              {/* Info box — rounded on the left side only */}
              <div className="flex flex-1 items-center gap-4 rounded-l-lg border border-zinc-200 bg-white px-5 py-3.5">
                <span className="text-xl">
                  <BlockIcon name={block.name} label={block.label} size={22} />
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-800">{block.label}</p>
                  <p className="font-mono text-[11px] text-zinc-400">{block.name}</p>
                </div>
              </div>

              {/* Controls box — rounded on the right side only */}
              <div className="flex shrink-0 items-center gap-1.5 rounded-r-lg border border-zinc-200 bg-white px-4 py-3.5">
                {/* Gear icon — only rendered when the block declares a settingsPage */}
                {block.settingsPage && (
                  <Link
                    href={`/admin/settings/blocks/${block.name}`}
                    aria-label={`Settings for ${block.label} block`}
                    className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                  >
                    <GearIcon />
                  </Link>
                )}
                {/* Enable / disable toggle */}
                <button
                  role="switch"
                  aria-checked={enabled}
                  aria-label={`${enabled ? "Disable" : "Enable"} ${block.label} block`}
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
