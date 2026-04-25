import { notFound } from "next/navigation";
import { getPost } from "@/lib/posts-db";
import { getSettings } from "@/lib/settings-db";
import PostEditorPage from "../../PostEditorPage";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const post = getPost(id);
  return { title: post ? `${post.title} — Admin` : "Edit Post — Admin" };
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const post = getPost(id);
  if (!post) notFound();
  const { disabledBlocks } = getSettings();

  return (
    <PostEditorPage
      id={post.id}
      initialTitle={post.title}
      initialSlug={post.slug}
      initialStatus={post.status}
      initialBlocks={post.blocks}
      initialHtml={post.html ?? ""}
      initialExcerpt={post.excerpt ?? ""}
      initialTags={post.tags ?? []}
      initialCategories={post.categories ?? []}
      disabledBlocks={disabledBlocks}
    />
  );
}
