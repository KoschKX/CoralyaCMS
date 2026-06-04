"use client";

import { BlockIcon } from "@/components/BlockIcon";
import { useEffect, useState } from "react";
import { blockRegistry } from "@/blocks/index";

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

// ── Instagram settings panel ──────────────────────────────────────────────────
function InstagramSettings() {
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(s => {
      if (s.instagramAccessToken) setToken(s.instagramAccessToken);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setResult(null);
    await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ instagramAccessToken: token }) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleTest() {
    setTesting(true); setResult(null);
    try {
      const r = await fetch("/api/instagram/media?limit=1");
      const d = await r.json() as { posts?: unknown[]; error?: string };
      setResult(d.error ? { ok: false, message: d.error } : { ok: true, message: `Connected! ${d.posts?.length ?? 0} post(s) fetched.` });
    } catch { setResult({ ok: false, message: "Network error." }); }
    finally { setTesting(false); }
  }

  return (
    <form className="space-y-3" onSubmit={handleSave}>
      <p className="text-xs text-zinc-500">Paste a long-lived Instagram access token to enable the feed block.</p>
      <details className="rounded border border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-600">
        <summary className="cursor-pointer font-medium text-zinc-700 hover:text-zinc-900">How to get an access token</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Go to <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Meta for Developers</a> and create a Consumer app.</li>
          <li>Add the Instagram product, add your account as a test user.</li>
          <li>Use the <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Graph API Explorer</a> to generate then exchange for a long-lived token.</li>
          <li>Paste it below.</li>
        </ol>
      </details>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-700" htmlFor="ig-token">Access token</label>
        <input id="ig-token" type="password" autoComplete="off" value={token} onChange={e => setToken(e.target.value)} placeholder="EAA…"
          className="w-full rounded border border-zinc-300 bg-white px-3 py-1.5 font-mono text-xs text-zinc-800 focus:border-zinc-400 focus:outline-none" />
      </div>
      {result && (
        <p className={`rounded border px-3 py-2 text-xs ${result.ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {result.ok ? "✓ " : "✗ "}{result.message}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50">
          {saving ? "Saving…" : saved ? "Saved!" : "Save"}
        </button>
        <button type="button" disabled={!token || testing} onClick={handleTest} className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400 disabled:opacity-40">
          {testing ? "Testing…" : "Test connection"}
        </button>
      </div>
    </form>
  );
}

// ── Flickr settings panel ─────────────────────────────────────────────────────
function FlickrSettings() {
  const [key, setKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(s => {
      if (s.flickrApiKey) setKey(s.flickrApiKey);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setResult(null);
    await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ flickrApiKey: key }) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleTest() {
    setTesting(true); setResult(null);
    try {
      const r = await fetch("/api/flickr/photos?type=photostream&userId=62021851%40N07&limit=1");
      const d = await r.json() as { photos?: unknown[]; error?: string };
      setResult(d.error ? { ok: false, message: d.error } : { ok: true, message: `API key works! ${d.photos?.length ?? 0} photo(s) fetched.` });
    } catch { setResult({ ok: false, message: "Network error." }); }
    finally { setTesting(false); }
  }

  return (
    <form className="space-y-3" onSubmit={handleSave}>
      <p className="text-xs text-zinc-500">Enter a Flickr API key to enable the Flickr feed block.</p>
      <details className="rounded border border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-600">
        <summary className="cursor-pointer font-medium text-zinc-700 hover:text-zinc-900">How to get a Flickr API key</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Sign in to Flickr, go to the <a href="https://www.flickr.com/services/apps/create/apply/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">App Garden</a>.</li>
          <li>Apply for a Non-Commercial Key, fill in the form.</li>
          <li>Copy the <strong>Key</strong> (not Secret) and paste below.</li>
        </ol>
      </details>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-700" htmlFor="flickr-key">API key</label>
        <input id="flickr-key" type="password" autoComplete="off" value={key} onChange={e => setKey(e.target.value)} placeholder="c9d2c2fda03a…"
          className="w-full rounded border border-zinc-300 bg-white px-3 py-1.5 font-mono text-xs text-zinc-800 focus:border-zinc-400 focus:outline-none" />
      </div>
      {result && (
        <p className={`rounded border px-3 py-2 text-xs ${result.ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {result.ok ? "✓ " : "✗ "}{result.message}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50">
          {saving ? "Saving…" : saved ? "Saved!" : "Save"}
        </button>
        <button type="button" disabled={!key || testing} onClick={handleTest} className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400 disabled:opacity-40">
          {testing ? "Testing…" : "Test connection"}
        </button>
      </div>
    </form>
  );
}

// Map block name → inline settings panel
const BLOCK_SETTINGS: Record<string, React.ComponentType> = {
  instagram: InstagramSettings,
  flickr: FlickrSettings,
};

export default function BlocksPage() {
  const [disabled, setDisabled] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openSettings, setOpenSettings] = useState<string | null>(null);

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
          const SettingsPanel = BLOCK_SETTINGS[block.name];
          const settingsOpen = openSettings === block.name;
          return (
            <div key={block.name}>
              <div className="flex items-stretch gap-1.5">
                {/* Info box */}
                <div className="flex flex-1 items-center gap-4 rounded-l-lg border border-zinc-300 bg-white px-5 py-3.5">
                  <span className="text-xl">
                    <BlockIcon name={block.name} label={block.label} size={22} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{block.label}</p>
                    <p className="font-mono text-[11px] text-zinc-400">{block.name}</p>
                  </div>
                </div>

                {/* Controls box */}
                <div className="flex shrink-0 items-center gap-1.5 rounded-r-lg border border-zinc-300 bg-white px-4 py-3.5">
                  {SettingsPanel && (
                    <button
                      onClick={() => setOpenSettings(settingsOpen ? null : block.name)}
                      aria-label={`Settings for ${block.label} block`}
                      aria-expanded={settingsOpen}
                      className={`flex h-7 w-7 items-center justify-center rounded transition ${
                        settingsOpen ? "bg-zinc-900 text-white" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                      }`}
                    >
                      <GearIcon />
                    </button>
                  )}
                  <button
                    role="switch"
                    aria-checked={enabled}
                    aria-label={`${enabled ? "Disable" : "Enable"} ${block.label} block`}
                    onClick={() => toggle(block.name)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                      enabled ? "bg-zinc-900" : "bg-zinc-200"
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>

              {/* Inline settings accordion */}
              {SettingsPanel && settingsOpen && (
                <div className="rounded-b-lg border border-t-0 border-zinc-300 bg-zinc-50 px-5 py-4">
                  <SettingsPanel />
                </div>
              )}
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
