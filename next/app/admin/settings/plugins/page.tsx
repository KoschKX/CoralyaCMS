// Side-effect import: ensures plugins are registered before reading them.
import "@/plugins/index";
import { installedPlugins } from "@/lib/plugin-registry";

export const metadata = { title: "Plugins — CMS" };

export default function PluginsPage() {
  const plugins = installedPlugins;

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
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {plugins.map((plugin, i) => (
            <div
              key={plugin.name}
              className={`px-5 py-4 ${i !== plugins.length - 1 ? "border-b border-zinc-100" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-zinc-900">{plugin.name}</p>
                  {plugin.description && (
                    <p className="mt-0.5 text-sm text-zinc-500">{plugin.description}</p>
                  )}
                  {plugin.author && (
                    <p className="mt-0.5 text-xs text-zinc-400">by {plugin.author}</p>
                  )}
                </div>
                <span className="shrink-0 rounded bg-zinc-100 px-2 py-0.5 font-mono text-[11px] text-zinc-500">
                  v{plugin.version}
                </span>
              </div>
              {plugin.adminPages && plugin.adminPages.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {plugin.adminPages.map((page) => (
                    <a
                      key={page.slug}
                      href={`/admin/settings/plugins/${page.slug}`}
                      className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[11px] text-zinc-600 hover:bg-zinc-100"
                    >
                      {page.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

