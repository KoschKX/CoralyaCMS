import Link from "next/link";
import { listPosts } from "@/lib/posts-db";
import { listTaxonomies } from "@/lib/taxonomies-db";
import { getSettings } from "@/lib/settings-db";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings();
  return {
    title: `Posts${settings.title ? ` — ${settings.title}` : ""}`,
  };
}

export default function PostsArchivePage() {
  const posts = listPosts()
    .filter((p) => p.status === "published")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const taxonomies = listTaxonomies();
  const categoryMap = Object.fromEntries(
    taxonomies.filter((t) => t.type === "category").map((t) => [t.id, t.name]),
  );
  const tagMap = Object.fromEntries(
    taxonomies.filter((t) => t.type === "tag").map((t) => [t.id, t.name]),
  );

  return (
    <main
      style={{
        maxWidth: "var(--content-max-width)",
        marginLeft: "auto",
        marginRight: "auto",
        paddingLeft: "var(--content-padding-x)",
        paddingRight: "var(--content-padding-x)",
        boxSizing: "border-box",
      }}
      className="py-16"
    >
      <h1 className="mb-10 text-4xl font-bold text-zinc-900">Posts</h1>

      {posts.length === 0 ? (
        <p className="text-zinc-500">No posts published yet.</p>
      ) : (
        <div className="flex flex-col gap-10">
          {posts.map((post) => (
            <article key={post.id} className="border-b border-zinc-300 pb-10">
              <Link
                href={`/posts/${post.slug}`}
                className="group block"
              >
                <h2 className="text-2xl font-semibold text-zinc-900 group-hover:underline">
                  {post.title}
                </h2>
              </Link>
              <p className="mt-1 text-sm text-zinc-400">
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {post.excerpt && (
                <p className="mt-3 text-zinc-600">{post.excerpt}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {(post.categories ?? []).map((cid) =>
                  categoryMap[cid] ? (
                    <span
                      key={cid}
                      className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                    >
                      {categoryMap[cid]}
                    </span>
                  ) : null,
                )}
                {(post.tags ?? []).map((tid) =>
                  tagMap[tid] ? (
                    <span
                      key={tid}
                      className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
                    >
                      #{tagMap[tid]}
                    </span>
                  ) : null,
                )}
              </div>
              <Link
                href={`/posts/${post.slug}`}
                className="mt-4 inline-block text-sm font-medium text-zinc-700 underline hover:text-zinc-900"
              >
                Read more →
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
