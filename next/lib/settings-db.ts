import fs from "fs";
import path from "path";
import {
  DEFAULT_SETTINGS,
  type SiteSettings,
} from "@/lib/settings-types";

// Re-export types so existing server imports still work
export type { HeadingStyle, TypographySettings, LayoutSettings, SiteSettings } from "@/lib/settings-types";
export { DEFAULT_TYPOGRAPHY, DEFAULT_LAYOUT } from "@/lib/settings-types";

const SETTINGS_FILE = path.join(process.cwd(), "data", "settings.json");

const defaults: SiteSettings = DEFAULT_SETTINGS;

/** Module-level cache — invalidated on every write so reads are always consistent. */
let settingsCache: SiteSettings | null = null;

/** Write-queue mutex — serialises concurrent settings saves. */
let writeQueue: Promise<unknown> = Promise.resolve();

function serialise<T>(fn: () => T): Promise<T> {
  const p = writeQueue.then(fn);
  writeQueue = p.then(
    () => undefined,
    () => undefined,
  );
  return p;
}

export function getSettings(): SiteSettings {
  if (settingsCache !== null) return settingsCache;
  if (!fs.existsSync(SETTINGS_FILE)) return (settingsCache = structuredClone(defaults));
  try {
    const saved = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8")) as Partial<SiteSettings>;
    settingsCache = {
      ...defaults,
      ...saved,
      // Deep-merge nested objects so new fields added to defaults are never missing
      typography: {
        ...defaults.typography,
        ...saved.typography,
        fontSizes: { ...defaults.typography.fontSizes, ...saved.typography?.fontSizes },
        headings:  { ...defaults.typography.headings,  ...saved.typography?.headings  },
      },
      layout: {
        ...defaults.layout,
        ...saved.layout,
        breakpoints: { ...defaults.layout.breakpoints, ...saved.layout?.breakpoints },
      },
    };
    return settingsCache;
  } catch {
    return (settingsCache = structuredClone(defaults));
  }
}

export function saveSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  return serialise(() => {
    const current = getSettings();
    const updated: SiteSettings = { ...current, ...settings };
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    const tmp = SETTINGS_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(updated, null, 2));
    fs.renameSync(tmp, SETTINGS_FILE);
    settingsCache = updated;
    return updated;
  });
}

/** Consistent page description across all metadata functions. */
export function buildPageDescription(settings: SiteSettings): string {
  return settings.description || settings.tagline || "Website description";
}
