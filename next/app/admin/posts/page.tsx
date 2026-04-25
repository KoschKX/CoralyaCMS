import Link from "next/link";
import { listPostsMeta } from "@/lib/posts-db";
import { listTaxonomies } from "@/lib/taxonomies-db";
import DeletePostButton from "./DeleteButton";

export const dynamic = "force-dynamic";

export default function PostsPage() {
  const posts = listPostsMeta().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const taxonomies = listTaxonomies();
  const categoryMap = Object.fromEntries(
    taxonomies.filter((t) => t.type === "category").map((t) => [t.id, t.name]),
  );
  const tagMap = Object.fromEntries(
    taxonomies.filter((t) => t.type === "tag").map((t) => [t.id, t.name]),
  );

  return (
    <div className="max-w-4xl px-8 py-10 mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Posts</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {posts.length} post{posts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/editor/posts/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          + New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-white py-20 text-center">
          <p className="text-zinc-400">No posts yet.</p>
          <Link
            href="/admin/editor/posts/new"
            className="mt-3 inline-block text-sm font-medium text-zinc-600 underline hover:text-zinc-900"
          >
            Create your first post →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left">
                <th className="px-4 py-3 font-medium text-zinc-600">Title</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Categories</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Tags</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Status</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {posts.map((post) => (
                <tr key={post.id} className="group hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    <Link
                      href={`/admin/editor/posts/${post.id}`}
                      className="hover:underline"
                    >
                      {post.title || <span className="text-zinc-400">Untitled</span>}
                    </Link>
                    {post.excerpt && (
                      <p className="mt-0.5 text-xs text-zinc-400 line-clamp-1">{post.excerpt}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(post.categories ?? []).map((cid) =>
                        categoryMap[cid] ? (
                          <span
                            key={cid}
                            className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] text-blue-700"
                          >
                            {categoryMap[cid]}
                          </span>
                        ) : null,
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(post.tags ?? []).map((tid) =>
                        tagMap[tid] ? (
                          <span
                            key={tid}
                            className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600"
                          >
                            #{tagMap[tid]}
                          </span>
                        ) : null,
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        post.status === "published"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {post.status === "published" ? "● Published" : "○ Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(post.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <DeletePostButton id={post.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
