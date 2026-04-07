"use client";

import { useState, useEffect } from "react";
import type { SiteSettings } from "@/lib/settings-types";

let cachedSettings: SiteSettings | null = null;
const listeners = new Set<() => void>();

async function fetchSettings(): Promise<SiteSettings> {
  const res = await fetch("/api/settings");
  const data: SiteSettings = await res.json();
  cachedSettings = data;
  listeners.forEach((l) => l());
  return data;
}

export function useSettings(): SiteSettings | null {
  const [settings, setSettings] = useState<SiteSettings | null>(cachedSettings);

  useEffect(() => {
    if (cachedSettings) {
      setSettings(cachedSettings);
      return;
    }
    let cancelled = false;
    fetchSettings()
      .then((data) => { if (!cancelled) setSettings(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handler = () => setSettings(cachedSettings);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  return settings;
}
