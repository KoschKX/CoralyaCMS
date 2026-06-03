import { notFound } from "next/navigation";
import Link from "next/link";
import "@/plugins";
import { pluginAdminPages } from "@/lib/plugin-registry";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PluginSettingsPage({ params }: Props) {
  const { slug } = await params;
  const page = pluginAdminPages[slug];

  if (!page) notFound();

  const Component = page.component;
  return (
    <div>
      {/* Back-link breadcrumb */}
      <div className="border-b border-zinc-200 bg-white px-8 py-3">
        <Link
          href="/admin/settings/plugins"
          className="text-xs text-zinc-400 hover:text-zinc-700"
        >
          ← Plugins
        </Link>
        <span className="mx-2 text-xs text-zinc-300">/</span>
        <span className="text-xs font-medium text-zinc-700">{page.label}</span>
      </div>
      <Component />
    </div>
  );
}
