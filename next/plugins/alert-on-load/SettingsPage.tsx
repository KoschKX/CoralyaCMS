"use client";

import React, { useState, useEffect } from "react";

export default function AlertOnLoadSettingsPage() {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/plugins/alert-on-load")
      .then((r) => r.json())
      .then((data: { message?: string }) => {
        if (typeof data.message === "string") setMessage(data.message);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/plugins/alert-on-load", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-zinc-900">Alert on Load</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Shows a browser alert box on every public page when it loads.
        Leave blank to disable.
      </p>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Alert message
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
            value={message}
            onChange={(e) => { setMessage(e.target.value); setSaved(false); }}
            placeholder="Hello, world!"
          />
          <p className="mt-1.5 text-xs text-zinc-400">Leave blank to disable the alert.</p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : saved ? "Saved!" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
