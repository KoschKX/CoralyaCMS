"use client";

import { useState, useEffect, useCallback } from "react";
import type { SiteSettings } from "@/lib/settings-types";

let cachedSettings: SiteSettings | null = null;
const listeners = new Set<() => void>();

async function fetchSettings(): Promise<SiteSettings> {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error(`Failed to load settings (HTTP ${res.status})`);
  const data: SiteSettings = await res.json();
  cachedSettings = data;
  listeners.forEach((l) => l());
  return data;
}

export interface UseSettingsResult {
  data: SiteSettings | null;
  /** Non-null when the last fetch failed. Use `.message` for a human-readable reason. */
  error: Error | null;
  /** Clears the cache and re-fetches settings from the server. */
  refetch: () => void;
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<SiteSettings | null>(cachedSettings);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(() => {
    cachedSettings = null;
    setSettings(null);
    setError(null);
    fetchSettings()
      .then((data) => { setSettings(data); setError(null); })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err : new Error(String(err)));
      });
  }, []);

  useEffect(() => {
    if (cachedSettings) {
      setSettings(cachedSettings);
      return;
    }
    let cancelled = false;
    fetchSettings()
      .then((data) => {
        if (!cancelled) { setSettings(data); setError(null); }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handler = () => setSettings(cachedSettings);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  return { data: settings, error, refetch };
}

