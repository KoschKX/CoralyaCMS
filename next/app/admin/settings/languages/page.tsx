"use client";

import React, { useState, useEffect } from "react";

// Locale → { label, flagCode } — flagCode is the filename in /flags/ (without .svg)
// "en" maps to the GB flag; add more entries as needed.
const KNOWN_LOCALES: Record<string, { label: string; flag: string }> = {
  en: { label: "English",    flag: "gb" },
  nl: { label: "Dutch",      flag: "nl" },
  fr: { label: "French",     flag: "fr" },
  de: { label: "German",     flag: "de" },
  es: { label: "Spanish",    flag: "es" },
  it: { label: "Italian",    flag: "it" },
  pt: { label: "Portuguese", flag: "pt" },
  pl: { label: "Polish",     flag: "pl" },
  ru: { label: "Russian",    flag: "ru" },
  zh: { label: "Chinese",    flag: "cn" },
  ja: { label: "Japanese",   flag: "jp" },
  ko: { label: "Korean",     flag: "kr" },
  ar: { label: "Arabic",     flag: "sa" },
  tr: { label: "Turkish",    flag: "tr" },
  sv: { label: "Swedish",    flag: "se" },
  da: { label: "Danish",     flag: "dk" },
  fi: { label: "Finnish",    flag: "fi" },
  nb: { label: "Norwegian",  flag: "no" },
};

function Flag({ code, size = 20 }: { code: string; flag: string; size?: number }) {
  return (
    <img
      src={`/flags/${code}.svg`}
      alt=""
      width={size}
      height={Math.round(size * 0.75)}
      className="rounded-sm object-cover"
      style={{ width: size, height: Math.round(size * 0.75) }}
    />
  );
}

export default function LanguagesSettingsPage() {
  const [languages, setLanguages] = useState<string[]>(["en"]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [customCode, setCustomCode] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        if (Array.isArray(s.languages) && s.languages.length > 0) {
          setLanguages(s.languages);
        }
      });
  }, []);

  async function save(next: string[]) {
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ languages: next }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggle(code: string) {
    // Default locale (first) cannot be removed
    if (code === languages[0]) return;
    const next = languages.includes(code)
      ? languages.filter((l) => l !== code)
      : [...languages, code];
    setLanguages(next);
    save(next);
  }

  function setDefault(code: string) {
    if (code === languages[0]) return;
    const next = [code, ...languages.filter((l) => l !== code)];
    setLanguages(next);
    save(next);
  }

  function addCustom() {
    const code = customCode.trim().toLowerCase();
    if (!code || languages.includes(code)) { setCustomCode(""); return; }
    const next = [...languages, code];
    setLanguages(next);
    setCustomCode("");
    save(next);
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-zinc-900">Languages</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Choose which languages your site supports. The first language is the default.
        In the editor you can switch between languages and edit each block&apos;s content per language.
      </p>

      {/* Active languages */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Active languages</h2>
        <div className="space-y-2">
          {languages.map((code, i) => {
            const known = KNOWN_LOCALES[code];
            const flagCode = known?.flag ?? code;
            const label = known?.label ?? code.toUpperCase();
            return (
              <div key={code} className="flex items-center gap-3 rounded-lg border border-zinc-300 bg-white px-4 py-3">
                <Flag code={flagCode} flag={flagCode} size={24} />
                <span className="flex-1 text-sm font-medium text-zinc-800">
                  {label}
                  <span className="ml-2 text-xs text-zinc-400 font-mono">{code}</span>
                </span>
                {i === 0 ? (
                  <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wide">
                    Default
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDefault(code)}
                      className="text-xs text-zinc-400 hover:text-zinc-700 transition"
                      title="Make default"
                    >
                      Set default
                    </button>
                    <button
                      onClick={() => toggle(code)}
                      className="text-xs text-red-400 hover:text-red-600 transition"
                      title="Remove language"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add known languages */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Add language</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(KNOWN_LOCALES)
            .filter(([code]) => !languages.includes(code))
            .map(([code, { label, flag }]) => (
              <button
                key={code}
                onClick={() => toggle(code)}
                className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 transition"
              >
                <Flag code={flag} flag={flag} size={18} />
                {label}
              </button>
            ))}
        </div>
      </div>

      {/* Custom locale code */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Custom locale code</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder="e.g. zh-TW"
            className="w-40 rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
            maxLength={10}
          />
          <button
            onClick={addCustom}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition"
          >
            Add
          </button>
        </div>
      </div>

      {saving && <p className="mt-6 text-xs text-zinc-400">Saving…</p>}
      {saved  && <p className="mt-6 text-xs text-green-600">Saved!</p>}
    </div>
  );
}
