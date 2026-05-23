"use client";

import { useState, useEffect } from "react";

export default function IntegrationsPage() {
  // ── Instagram ─────────────────────────────────────────────────────────────
  const [token, setToken]   = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // ── Flickr ────────────────────────────────────────────────────────────────
  const [flickrKey, setFlickrKey]         = useState("");
  const [flickrSaving, setFlickrSaving]   = useState(false);
  const [flickrSaved, setFlickrSaved]     = useState(false);
  const [flickrTesting, setFlickrTesting] = useState(false);
  const [flickrResult, setFlickrResult]   = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        if (s.instagramAccessToken) setToken(s.instagramAccessToken);
        if (s.flickrApiKey)         setFlickrKey(s.flickrApiKey);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTestResult(null);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instagramAccessToken: token }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await fetch("/api/instagram/media?limit=1");
      const d = await r.json() as { posts?: unknown[]; error?: string };
      if (d.error) {
        setTestResult({ ok: false, message: d.error });
      } else {
        setTestResult({ ok: true, message: `Connected! ${d.posts?.length ?? 0} post(s) fetched.` });
      }
    } catch {
      setTestResult({ ok: false, message: "Network error — could not reach the API." });
    } finally {
      setTesting(false);
    }
  }

  async function handleFlickrSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFlickrSaving(true);
    setFlickrResult(null);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flickrApiKey: flickrKey }),
    });
    setFlickrSaving(false);
    setFlickrSaved(true);
    setTimeout(() => setFlickrSaved(false), 2500);
  }

  async function handleFlickrTest() {
    setFlickrTesting(true);
    setFlickrResult(null);
    try {
      // Test with a well-known public account (Flickr's own account: 62021851@N07)
      const r = await fetch("/api/flickr/photos?type=photostream&userId=62021851%40N07&limit=1");
      const d = await r.json() as { photos?: unknown[]; error?: string };
      if (d.error) {
        setFlickrResult({ ok: false, message: d.error });
      } else {
        setFlickrResult({ ok: true, message: `API key works! ${d.photos?.length ?? 0} photo(s) fetched.` });
      }
    } catch {
      setFlickrResult({ ok: false, message: "Network error — could not reach the Flickr API." });
    } finally {
      setFlickrTesting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-zinc-900">Integrations</h1>
      <p className="mb-8 text-sm text-zinc-500">Connect third-party services used by blocks.</p>

      {/* ── Instagram ──────────────────────────────────────────────── */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="5"/>
            <circle cx="12" cy="12" r="4"/>
            <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/>
          </svg>
          <h2 className="text-base font-semibold text-zinc-900">Instagram</h2>
          {token && (
            <span className="ml-auto rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              Token saved
            </span>
          )}
        </div>

        <p className="mb-4 text-sm text-zinc-600">
          Paste a long-lived Instagram access token to enable the Instagram feed block.
          Tokens are stored securely on the server and never exposed to visitors.
        </p>

        {/* How-to steps */}
        <details className="mb-5 rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-xs text-zinc-600">
          <summary className="cursor-pointer font-medium text-zinc-700 hover:text-zinc-900">
            How to get an access token
          </summary>
          <ol className="mt-3 list-decimal space-y-1.5 pl-4">
            <li>Go to <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Meta for Developers</a> and create an app (Consumer type).</li>
            <li>Add the <strong>Instagram</strong> product to your app.</li>
            <li>Under <em>Instagram → API Setup with Instagram Login</em>, add your Instagram account as a test user.</li>
            <li>Use the <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Graph API Explorer</a> to generate a short-lived token, then exchange it for a long-lived one (60-day expiry).</li>
            <li>Paste the long-lived token below and save.</li>
          </ol>
        </details>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700" htmlFor="ig-token">
              Access token
            </label>
            <input
              id="ig-token"
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="EAA…"
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-800 focus:border-zinc-400 focus:outline-none"
            />
          </div>

          {testResult && (
            <p className={`rounded-lg border px-3 py-2 text-sm ${
              testResult.ok
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}>
              {testResult.ok ? "✓ " : "✗ "}{testResult.message}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : saved ? "Saved!" : "Save"}
            </button>
            <button
              type="button"
              disabled={!token || testing}
              onClick={handleTest}
              className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 disabled:opacity-40"
            >
              {testing ? "Testing…" : "Test connection"}
            </button>
          </div>
        </form>
      </section>

      {/* ── Flickr ─────────────────────────────────────────────────── */}
      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <circle cx="7.5"  cy="12" r="5" fill="currentColor" opacity="0.4"/>
            <circle cx="16.5" cy="12" r="5" fill="currentColor"/>
          </svg>
          <h2 className="text-base font-semibold text-zinc-900">Flickr</h2>
          {flickrKey && (
            <span className="ml-auto rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              Key saved
            </span>
          )}
        </div>

        <p className="mb-4 text-sm text-zinc-600">
          Enter a Flickr API key to enable the Flickr feed block. Keys are stored on the server
          and never sent to visitors.
        </p>

        <details className="mb-5 rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-xs text-zinc-600">
          <summary className="cursor-pointer font-medium text-zinc-700 hover:text-zinc-900">
            How to get a Flickr API key
          </summary>
          <ol className="mt-3 list-decimal space-y-1.5 pl-4">
            <li>Sign in to Flickr, then go to the <a href="https://www.flickr.com/services/apps/create/apply/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Flickr App Garden</a>.</li>
            <li>Click <strong>Apply for a Non-Commercial Key</strong> (for personal sites) or the commercial option.</li>
            <li>Fill in the form — the app name and description can be anything.</li>
            <li>Copy the <strong>Key</strong> (not the Secret) and paste it below.</li>
            <li>In each Flickr block, enter the Flickr user NSID — find it at <a href="https://www.flickr.com/services/api/explore/flickr.people.findByUrl" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">idGettr</a> or similar tools.</li>
          </ol>
        </details>

        <form className="space-y-4" onSubmit={handleFlickrSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700" htmlFor="flickr-key">
              API key
            </label>
            <input
              id="flickr-key"
              type="password"
              autoComplete="off"
              value={flickrKey}
              onChange={(e) => setFlickrKey(e.target.value)}
              placeholder="c9d2c2fda03a…"
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-800 focus:border-zinc-400 focus:outline-none"
            />
          </div>

          {flickrResult && (
            <p className={`rounded-lg border px-3 py-2 text-sm ${
              flickrResult.ok
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}>
              {flickrResult.ok ? "✓ " : "✗ "}{flickrResult.message}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={flickrSaving}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
            >
              {flickrSaving ? "Saving…" : flickrSaved ? "Saved!" : "Save"}
            </button>
            <button
              type="button"
              disabled={!flickrKey || flickrTesting}
              onClick={handleFlickrTest}
              className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 disabled:opacity-40"
            >
              {flickrTesting ? "Testing…" : "Test connection"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
