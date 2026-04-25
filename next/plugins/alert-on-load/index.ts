import type { PluginDefinition } from "@/lib/plugin-types";
import { onPageHtml } from "@/filters/page-html";
import SettingsPage from "./SettingsPage";
import fs from "fs";
import path from "path";

const SETTINGS_FILE = path.join(process.cwd(), "data", "plugin-settings", "alert-on-load.json");

function readMessage(): string {
  try {
    const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8")) as { message?: unknown };
    return typeof data.message === "string" ? data.message : "";
  } catch {
    return "";
  }
}

const alertOnLoad: PluginDefinition = {
  name: "alert-on-load",
  version: "1.0.0",
  description: "Shows a browser alert box on every public page when it loads.",
  filters: [
    onPageHtml((html) => {
      const message = readMessage();
      if (!message) return html;
      // JSON.stringify safely escapes the message so it can't break out of the string literal.
      return html + `<script>alert(${JSON.stringify(message)})</script>`;
    }),
  ],
  adminPages: [
    {
      slug: "alert-on-load",
      label: "Alert on Load",
      component: SettingsPage,
    },
  ],
};

export default alertOnLoad;
