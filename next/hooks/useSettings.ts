"use client";

import { useState, useEffect } from "react";
import type { SiteSettings } from "@/lib/settings-types";

let cachedSettings: SiteSettings | null = null;
const listeners = new Set<() => void>();

async function fetchSettings(): Promise<SiteSettings> {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: SiteSettings = await res.json();
  cachedSettings = data;
  listeners.forEach((l) => l());
  return data;
}

export interface UseSettingsResult {
  data: SiteSettings | null;
  error: boolean;
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<SiteSettings | null>(cachedSettings);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (cachedSettings) {
      setSettings(cachedSettings);
      return;
    }
    let cancelled = false;
    fetchSettings()
      .then((data) => {
        if (!cancelled) { setSettings(data); setError(false); }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handler = () => setSettings(cachedSettings);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  return { data: settings, error };
}

