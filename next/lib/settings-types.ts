/** Shared types and defaults for site settings.
 *  This file must NOT import 'fs' or 'path' — it is used by both
 *  server code (settings-db.ts) and client components. */

import { COLOR_PALETTE, type PaletteColor } from "@/lib/color-palette";

export interface HeadingStyle {
  size: string;
  weight: string;
  lineHeight: string;
}

export interface TypographySettings {
  fontSizes: { sm: string; base: string; lg: string; xl: string };
  headings: { h1: HeadingStyle; h2: HeadingStyle; h3: HeadingStyle; h4: HeadingStyle };
}

export interface LayoutSettings {
  contentMaxWidth: string;
  contentPaddingX: string;
  blockSpacing: string;

  breakpoints: {
    mobile:  string; // max-width for mobile  (e.g. "640px")
    tablet:  string; // max-width for tablet  (e.g. "1024px")
    desktop: string; // min-width for desktop (e.g. "1280px")
  };
}

export interface SiteSettings {
  // General site info
  title?: string;
  tagline?: string;
  description?: string;
  siteUrl?: string;
  logoUrl?: string;
  // Integrations
  instagramAccessToken?: string;
  flickrApiKey?: string;
  // Existing settings
  disabledBlocks: string[];
  paletteColors: PaletteColor[];
  typography: TypographySettings;
  layout: LayoutSettings;
  // Language / i18n
  /** Active locale codes, e.g. ["en", "nl", "fr"]. First entry is the default. */
  languages: string[];
}

export const DEFAULT_TYPOGRAPHY: TypographySettings = {
  fontSizes: { sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem" },
  headings: {
    h1: { size: "2.25rem",  weight: "700", lineHeight: "1.2"  },
    h2: { size: "1.875rem", weight: "700", lineHeight: "1.25" },
    h3: { size: "1.5rem",   weight: "600", lineHeight: "1.3"  },
    h4: { size: "1.25rem",  weight: "600", lineHeight: "1.35" },
  },
};


export const DEFAULT_LAYOUT: LayoutSettings = {
  contentMaxWidth: "48rem",
  contentPaddingX: "1.5rem",
  blockSpacing:    "1.5rem",
  breakpoints: {
    mobile:  "640px",
    tablet:  "1024px",
    desktop: "1280px",
  },
};

export const DEFAULT_SETTINGS: SiteSettings = {
  title: "My Awesome Site",
  tagline: "Just another great website",
  description: "Describe your site…",
  siteUrl: "https://example.com",
  logoUrl: "https://example.com/logo.png",
  disabledBlocks: [],
  paletteColors: COLOR_PALETTE,
  typography: DEFAULT_TYPOGRAPHY,
  layout: DEFAULT_LAYOUT,
  languages: ["en"],
};
