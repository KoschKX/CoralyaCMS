import fs from "fs";
import path from "path";
import {
  DEFAULT_SETTINGS,
  type SiteSettings,
} from "@/lib/settings-types";
import { createWriteQueue } from "@/lib/utils/write-queue";

// Re-export types so existing server imports still work
export type { HeadingStyle, TypographySettings, LayoutSettings, SiteSettings } from "@/lib/settings-types";
export { DEFAULT_TYPOGRAPHY, DEFAULT_LAYOUT } from "@/lib/settings-types";

const SETTINGS_FILE = path.join(process.cwd(), "data", "settings.json");

const defaults: SiteSettings = DEFAULT_SETTINGS;

// No in-memory cache: Next.js/Turbopack runs API routes and page renderers
// in separate worker contexts that each have their own module instance.
// Always reading from disk ensures all workers see the latest saved settings.

/** Write-queue mutex — serialises concurrent settings saves. */
const serialise = createWriteQueue();

export function getSettings(): SiteSettings {
  if (!fs.existsSync(SETTINGS_FILE)) return structuredClone(defaults);
  try {
    const saved = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8")) as Partial<SiteSettings>;
    return {
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
  } catch {
    return structuredClone(defaults);
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
    return updated;
  });
}

/** Consistent page description across all metadata functions. */
export function buildPageDescription(settings: SiteSettings): string {
  return settings.description || settings.tagline || "Website description";
}
