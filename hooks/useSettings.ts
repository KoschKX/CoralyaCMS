"use client";

import { useEffect, useCallback } from "react";
import { create } from "zustand";
import type { SiteSettings } from "@/lib/settings-types";

// ── Zustand store ─────────────────────────────────────────────────────────────
// Replaces the previous manual module-level cache + listeners Set pattern.
// Zustand automatically notifies all subscribers when state changes, so there
// is no need for a hand-rolled listener registry.
//
// `_fetched` acts as a mutex: the first component to mount triggers the fetch;
// subsequent mounts see `_fetched: true` and skip the request. On error,
// `_fetched` is reset to false so the next refetch() can retry.

interface SettingsState {
  data: SiteSettings | null;
  error: Error | null;
  _fetched: boolean;
  _fetch: () => Promise<void>;
  _reset: () => void;
}

const useSettingsStore = create<SettingsState>((set, get) => ({
  data: null,
  error: null,
  _fetched: false,

  _fetch: async () => {
    if (get()._fetched) return; // already in-flight or completed
    set({ _fetched: true });
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error(`Failed to load settings (HTTP ${res.status})`);
      const data: SiteSettings = await res.json();
      set({ data, error: null });
    } catch (err) {
      set({
        error: err instanceof Error ? err : new Error(String(err)),
        _fetched: false, // allow a retry on the next refetch() call
      });
    }
  },

  _reset: () => set({ data: null, error: null, _fetched: false }),
}));

// ── Public hook ───────────────────────────────────────────────────────────────

export interface UseSettingsResult {
  data: SiteSettings | null;
  /** Non-null when the last fetch failed. Use `.message` for a human-readable reason. */
  error: Error | null;
  /** Clears the cache and re-fetches settings from the server. */
  refetch: () => void;
}

export function useSettings(): UseSettingsResult {
  const { data, error, _fetch, _reset } = useSettingsStore();

  // Trigger the fetch on first mount. Subsequent mounts are no-ops because
  // _fetched is true and _fetch returns immediately.
  useEffect(() => {
    _fetch();
  }, [_fetch]);

  // Memoized so consumers can safely put refetch in a dependency array without
  // triggering infinite loops.
  const refetch = useCallback(() => {
    // Reset synchronously so _fetched becomes false, then kick off a new fetch.
    _reset();
    useSettingsStore.getState()._fetch();
  }, [_reset]);

  return { data, error, refetch };
}

