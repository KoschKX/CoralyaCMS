import { notFound } from "next/navigation";
import { listPosts, getPostBySlug } from "@/lib/posts-db";
import { listTaxonomies } from "@/lib/taxonomies-db";
import { getSettings } from "@/lib/settings-db";
import { ResponsiveStyleInjector } from "@/components/ResponsiveStyleInjector";
import { buildResponsiveCSS } from "@/lib/responsive-css";
import { tokenise, buildBlocks } from "@/lib/shortcodes";
import BlockRenderer from "@/components/BlockRenderer";
import HTMLRenderer from "@/components/HTMLRenderer";
import { PluginPageInjections } from "@/components/PluginPageInjections";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateStaticParams() {
  return listPosts()
    .filter((p) => p.status === "published" && p.slug)
    .map((p) => ({ slug: p.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const settings = getSettings();
  const post = getPostBySlug(slug);
  let title = settings.title || "Site Title";
  if (post?.title) title += ` — ${post.title}`;
  return {
    title,
    description: post?.excerpt ?? undefined,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || post.status !== "published") notFound();

  const { disabledBlocks, layout } = getSettings();
  const { tablet: tabletBp, mobile: mobileBp } = layout.breakpoints;

  const blocksForCSS = post.html
    ? buildBlocks(tokenise(post.html), 0).blocks
    : post.blocks;

  const responsiveCSS = buildResponsiveCSS(blocksForCSS, tabletBp, mobileBp);

  const taxonomies = listTaxonomies();
  const categories = taxonomies.filter(
    (t) => t.type === "category" && (post.categories ?? []).includes(t.id),
  );
  const tags = taxonomies.filter(
    (t) => t.type === "tag" && (post.tags ?? []).includes(t.id),
  );

  return (
    <main
      className="py-16"
      style={{
        width: "100%",
        maxWidth: "var(--content-max-width)",
        marginLeft: "auto",
        marginRight: "auto",
        paddingLeft: "var(--content-padding-x)",
        paddingRight: "var(--content-padding-x)",
        boxSizing: "border-box",
      }}
    >
      {responsiveCSS && (
        <style id="editor-responsive-css" dangerouslySetInnerHTML={{ __html: responsiveCSS }} />
      )}
      <ResponsiveStyleInjector blocks={blocksForCSS} tabletBp={tabletBp} mobileBp={mobileBp} />

      <p className="mb-3 text-sm text-zinc-400">
        <Link href="/posts" className="hover:underline">Posts</Link>
        {categories.length > 0 && (
          <>
            {" · "}
            {categories.map((c) => c.name).join(", ")}
          </>
        )}
      </p>

      <h1 className="mb-3 text-4xl font-bold text-zinc-900">{post.title}</h1>

      <p className="mb-8 text-sm text-zinc-400">
        {new Date(post.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      {post.excerpt && (
        <p className="mb-10 text-lg text-zinc-500 italic">{post.excerpt}</p>
      )}

      {post.html
        ? <HTMLRenderer html={post.html} disabledBlocks={disabledBlocks} />
        : <BlockRenderer blocks={post.blocks} disabledBlocks={disabledBlocks} />
      }

      {tags.length > 0 && (
        <div className="mt-12 flex flex-wrap gap-2 border-t border-zinc-100 pt-6">
          {tags.map((t) => (
            <span
              key={t.id}
              className="rounded bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600"
            >
              #{t.name}
            </span>
          ))}
        </div>
      )}

      <PluginPageInjections slug={`posts/${slug}`} />
    </main>
  );
}
