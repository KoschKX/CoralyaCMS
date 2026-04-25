import { notFound } from "next/navigation";
import "@/plugins/index";
import { pluginAdminPages } from "@/lib/plugin-registry";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PluginSettingsPage({ params }: Props) {
  const { slug } = await params;
  const page = pluginAdminPages[slug];

  if (!page) notFound();

  const Component = page.component;
  return <Component />;
}
