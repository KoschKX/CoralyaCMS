import { notFound } from "next/navigation";
import Link from "next/link";
// Ensure blocks are registered before we look them up.
import { blockMap } from "@/blocks/index";

interface Props {
  params: Promise<{ name: string }>;
}

export default async function BlockSettingsPage({ params }: Props) {
  const { name } = await params;
  const block = blockMap[name];

  // 404 when the block doesn't exist or has no settings page declared.
  if (!block?.settingsPage) notFound();

  const Component = block.settingsPage;
  return (
    <div>
      {/* Back-link breadcrumb */}
      <div className="border-b border-zinc-200 bg-white px-8 py-3">
        <Link
          href="/admin/settings/blocks"
          className="text-xs text-zinc-400 hover:text-zinc-700"
        >
          ← Blocks
        </Link>
        <span className="mx-2 text-xs text-zinc-300">/</span>
        <span className="text-xs font-medium text-zinc-700">{block.label}</span>
      </div>
      <Component />
    </div>
  );
}
