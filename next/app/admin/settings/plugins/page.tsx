// Side-effect import: ensures plugins are registered before reading them.
import "@/plugins";
import Link from "next/link";
import { installedPlugins } from "@/lib/plugin-registry";
import { PluginToggle } from "./PluginToggle";
import fs from "fs";
import path from "path";

export const metadata = { title: "Plugins — CMS" };

function GearIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

function readPluginStates(): Record<string, boolean> {
  try {
    const file = path.join(process.cwd(), "data", "plugin-settings", "plugin-states.json");
    return JSON.parse(fs.readFileSync(file, "utf-8")) as Record<string, boolean>;
  } catch {
    return {};
  }
}

export default function PluginsPage() {
  const plugins = installedPlugins;
  const states = readPluginStates();

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-zinc-900">Plugins</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Plugins extend the CMS with page filters and admin settings pages.
        Register plugins in <code className="font-mono text-xs">plugins/index.ts</code>.
      </p>

      {plugins.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-500">No plugins installed.</p>
          <p className="mt-2 text-sm text-zinc-400">
            Create a folder under <code className="font-mono text-xs">plugins/</code> and
            register it in <code className="font-mono text-xs">plugins/index.ts</code>.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {plugins.map((plugin) => (
            <div key={plugin.name} className="flex items-stretch gap-1.5">
              {/* Info box — rounded on the left side only */}
              <div className="flex-1 min-w-0 rounded-l-lg border border-zinc-200 bg-white px-5 py-4">
                <p className="font-medium text-zinc-900">{plugin.name}</p>
                {plugin.description && (
                  <p className="mt-0.5 text-sm text-zinc-500">{plugin.description}</p>
                )}
                {plugin.author && (
                  <p className="mt-0.5 text-xs text-zinc-400">by {plugin.author}</p>
                )}
              </div>

              {/* Controls box — rounded on the right side only */}
              <div className="flex shrink-0 items-center gap-2 rounded-r-lg border border-zinc-200 bg-white px-4 py-4">
                <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[11px] text-zinc-500">
                  v{plugin.version}
                </span>

                {/* Gear icon(s) — one per admin page declared by the plugin */}
                {(plugin.adminPages ?? []).map((page) => (
                  <Link
                    key={page.slug}
                    href={`/admin/settings/plugins/${page.slug}`}
                    aria-label={`${page.label} settings`}
                    title={page.label}
                    className="flex h-8 w-8 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                  >
                    <GearIcon />
                  </Link>
                ))}

                <PluginToggle
                  name={plugin.name}
                  initialEnabled={states[plugin.name] !== false}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
