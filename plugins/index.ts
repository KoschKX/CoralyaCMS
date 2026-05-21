/**
 * Plugin Entry Point
 * ──────────────────
 * Import this file as a side-effect wherever plugins need to be active.
 * It calls `installPlugin()` for each installed plugin, which registers
 * their filters and admin settings pages.
 *
 * The admin layout imports this automatically — you don't need to import
 * it anywhere else unless you also need plugins active on the public site.
 *
 * How to install a plugin:
 *   1. Create a folder under `plugins/` (e.g. `plugins/my-plugin/`)
 *   2. Export a `PluginDefinition` as the default export from its `index.ts`
 *   3. Import it here and call `installPlugin(myPlugin)`
 *
 * Example:
 *
 *   import { installPlugin } from "@/lib/plugin-registry";
 *   import myPlugin from "./my-plugin";
 *   installPlugin(myPlugin);
 */

import fs from "fs";
import path from "path";
import { installPlugin, disabledPlugins } from "@/lib/plugin-registry";
import alertOnLoad from "./alert-on-load";

// Seed disabled set from persisted states so filters are bypassed on startup.
try {
  const file = path.join(process.cwd(), "data", "plugin-settings", "plugin-states.json");
  const states = JSON.parse(fs.readFileSync(file, "utf-8")) as Record<string, boolean>;
  for (const [name, enabled] of Object.entries(states)) {
    if (!enabled) disabledPlugins.add(name);
  }
} catch {
  // No states file yet — disable the example plugin by default so a fresh
  // install does not pop an alert on every visitor's browser.
  disabledPlugins.add("alert-on-load");
}

installPlugin(alertOnLoad);

