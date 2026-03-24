import Link from "next/link";
import { listPages } from "@/lib/pages-db";
import DeleteButton from "./DeleteButton";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const pages = listPages().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return (
    <div className="max-w-4xl px-8 py-10 mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Pages</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {pages.length} page{pages.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/editor/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          + New page
        </Link>
      </div>

      {pages.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-white py-20 text-center">
          <p className="text-zinc-400">No pages yet.</p>
          <Link
            href="/admin/editor/new"
            className="mt-3 inline-block text-sm font-medium text-zinc-600 underline hover:text-zinc-900"
          >
            Create your first page →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left">
                <th className="px-4 py-3 font-medium text-zinc-600">Title</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Slug</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Status</th>
                <th className="px-4 py-3 font-medium text-zinc-600">
                  Updated
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {pages.map((page) => (
                <tr key={page.id} className="group hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    <Link
                      href={`/admin/editor/${page.id}`}
                      className="hover:underline"
                    >
                      {page.title || <span className="text-zinc-400">Untitled</span>}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    /{page.slug || <span className="italic">no-slug</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        page.status === "published"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {page.status === "published" ? "● Published" : "○ Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                      <Link
                        href={`/admin/editor/${page.id}`}
                        className="rounded px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
                      >
                        Edit
                      </Link>
                      <DeleteButton id={page.id} />
                    </div>
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
