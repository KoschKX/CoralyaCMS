import type React from "react";
import type { addFilter } from "@/lib/filters";
import type { BlockDefinition } from "@/lib/block-types";

/**
 * A single filter registration declared inside a PluginDefinition.
 * Equivalent to calling `addFilter(hook, callback, priority)` manually.
 */
export interface PluginFilter {
  /** Hook name, e.g. `"page.html"`. */
  hook: string;
  /** Receives the current value and returns the (possibly modified) value. */
  callback: Parameters<typeof addFilter>[1];
  /** Execution order — lower runs first. Defaults to `10`. */
  priority?: number;
}

/**
 * A settings page a plugin adds to the admin sidebar.
 *
 * The page is rendered at `/admin/settings/plugins/{slug}`.
 * The link appears in the admin sidebar under Settings.
 */
export interface PluginAdminPage {
  /** URL segment — must be unique across all plugins. Use kebab-case. */
  slug: string;
  /** Label shown in the admin sidebar nav. */
  label: string;
  /**
   * Path to an icon under `/public/icons/`, e.g. `"/icons/my-plugin.svg"`.
   * Falls back to a generic plugin icon when omitted.
   */
  icon?: string;
  /** The React component rendered as the settings page body. */
  component: React.ComponentType;
}

/**
 * PluginDefinition
 * ────────────────
 * The shape every plugin must export as its default export.
 *
 * Minimal plugin:
 *
 *   import type { PluginDefinition } from "@/lib/plugin-types";
 *   const myPlugin: PluginDefinition = {
 *     name: "my-plugin",
 *     version: "1.0.0",
 *   };
 *   export default myPlugin;
 *
 * Then register it in `plugins/index.ts`:
 *
 *   import { installPlugin } from "@/lib/plugin-registry";
 *   import myPlugin from "./my-plugin";
 *   installPlugin(myPlugin);
 */
export interface PluginDefinition {
  /** Unique identifier. Use kebab-case, e.g. "my-analytics-plugin". */
  name: string;

  /** Semver string, e.g. "1.0.0". */
  version: string;

  description?: string;
  author?: string;

  /**
   * Filters this plugin registers.
   * Applied to the live page output and other content hooks.
   *
   * Example:
   *   filters: [
   *     onPageHtml((html, ctx) => html + `<!-- ${ctx.slug} -->`),
   *   ]
   */
  filters?: PluginFilter[];

  /**
   * Settings pages to add to the admin sidebar.
   * Each page appears under Settings → (plugin name) in the nav.
   *
   * Example:
   *   adminPages: [
   *     { slug: "my-plugin", label: "My Plugin", component: MySettingsPage },
   *   ]
   */
  adminPages?: PluginAdminPage[];
}


/**
 * PluginDefinition
 * ────────────────
 * The shape every plugin must export as its default export.
 *
 * Minimal plugin:
 *
 *   import type { PluginDefinition } from "@/lib/plugin-types";
 *   const myPlugin: PluginDefinition = {
 *     name: "my-plugin",
 *     version: "1.0.0",
 *     blocks: [myBlockDefinition],
 *   };
 *   export default myPlugin;
 *
 * Then add it to `plugins/index.ts`:
 *
 *   import myPlugin from "./my-plugin";
 *   const plugins = [myPlugin];
 */
export interface PluginDefinition {
  /** Unique identifier. Use kebab-case, e.g. "my-callout-plugin". */
  name: string;

  /** Semver string, e.g. "1.0.0". */
  version: string;

  description?: string;
  author?: string;

  /**
   * Block types provided by this plugin.
   * Each entry follows the same shape as the built-in blocks.
   */
  blocks?: BlockDefinition[];

  /**
   * Custom block icons.
   * Keys are block type names; values are React SVG components.
   * These appear in the block picker and toolbar.
   *
   * Example:
   *   icons: { callout: CalloutIconComponent }
   */
  icons?: Record<string, React.FC<React.SVGProps<SVGSVGElement>>>;

  /**
   * Filters this plugin registers.
   * Each entry is equivalent to calling `addFilter(hook, callback, priority)`.
   *
   * Example:
   *   filters: [
   *     { hook: "page.html", callback: (html) => html + "<!-- via my-plugin -->" },
   *     { hook: "block.picker.blocks", callback: (blocks) => blocks.filter(b => b.name !== "embed"), priority: 5 },
   *   ]
   */
  filters?: PluginFilter[];
}
