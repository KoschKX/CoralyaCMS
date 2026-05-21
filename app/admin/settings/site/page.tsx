
"use client";

import React, { useState, useEffect } from "react";

export default function SiteSettingsPage() {
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        if (s.title !== undefined) setTitle(s.title);
        if (s.tagline !== undefined) setTagline(s.tagline);
        if (s.siteUrl !== undefined) setSiteUrl(s.siteUrl);
        if (s.description !== undefined) setDescription(s.description);
        if (s.logoUrl !== undefined) setLogoUrl(s.logoUrl);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, tagline, siteUrl, description, logoUrl }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-zinc-900">Site Settings</h1>
      <p className="mb-8 text-sm text-zinc-500">General information about your site.</p>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Field label="Site title" hint="Shown in the browser tab and search results.">
          <input
            type="text"
            placeholder="My Awesome Site"
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
            value={title}
            onChange={e => { setTitle(e.target.value); setSaved(false); }}
          />
        </Field>

        <Field label="Tagline" hint="A short description of your site.">
          <input
            type="text"
            placeholder="Just another great website"
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
            value={tagline}
            onChange={e => { setTagline(e.target.value); setSaved(false); }}
          />
        </Field>

        <Field label="Site URL" hint="The public URL of your site.">
          <input
            type="url"
            placeholder="https://example.com"
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
            value={siteUrl}
            onChange={e => { setSiteUrl(e.target.value); setSaved(false); }}
          />
        </Field>

        <Field label="Description" hint="Used for SEO meta description.">
          <textarea
            rows={3}
            placeholder="Describe your site…"
            className="w-full resize-none rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
            value={description}
            onChange={e => { setDescription(e.target.value); setSaved(false); }}
          />
        </Field>

        <Field label="Logo URL" hint="Absolute URL to your logo image.">
          <input
            type="url"
            placeholder="https://example.com/logo.png"
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
            value={logoUrl}
            onChange={e => { setLogoUrl(e.target.value); setSaved(false); }}
          />
        </Field>

        <div className="flex justify-end pt-2">
          <SaveButton saving={saving} saved={saved} />
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-800">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-zinc-400">{hint}</p>}
      {children}
    </div>
  );
}

function SaveButton({ saving, saved }: { saving?: boolean; saved?: boolean }) {
  return (
    <button
      type="submit"
      className="rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60"
      disabled={saving}
    >
      {saving ? "Saving..." : saved ? "Saved!" : "Save changes"}
    </button>
  );
}
