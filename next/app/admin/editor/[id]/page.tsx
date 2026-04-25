import { notFound } from "next/navigation";
import { getPage } from "@/lib/pages-db";
import { getSettings } from "@/lib/settings-db";
import EditorPage from "../EditorPage";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const page = getPage(id);
  return { title: page ? `${page.title} — Admin` : "Edit Page — Admin" };
}

export default async function EditPage({ params }: Props) {
  const { id } = await params;
  const page = getPage(id);
  if (!page) notFound();
  const { disabledBlocks } = getSettings();

  return (
    <EditorPage
      id={page.id}
      initialTitle={page.title}
      initialSlug={page.slug}
      initialStatus={page.status}
      initialBlocks={page.blocks}
      initialHtml={page.html ?? ""}
      initialPageBgColor={page.pageBgColor ?? "#ffffff"}
      initialInjectCode={page.injectCode}
      disabledBlocks={disabledBlocks}
    />
  );
}
