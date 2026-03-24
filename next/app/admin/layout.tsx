import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Admin — CORALYA",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-zinc-950 text-zinc-100">
        <div className="px-5 py-5">
          <Link
            href="/admin"
            className="text-lg font-semibold tracking-tight hover:text-white"
          >
            ✦ CORALYA
          </Link>
        </div>
        <nav className="flex-1 px-3 pb-6">
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Content
          </p>
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            <span className="w-5 h-5 inline-flex items-center justify-center"><img src="/icons/pages.svg" alt="" className="w-5 h-5" /></span> Pages
          </Link>
          <Link
            href="/admin/editor/new"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            <span>＋</span> New page
          </Link>

          <p className="mb-1 mt-5 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Settings
          </p>
          {[
            { href: "/admin/settings/site",       icon: "/icons/site.svg", label: "Site" },
            { href: "/admin/settings/navigation",  icon: "/icons/navigation.svg", label: "Navigation" },
            { href: "/admin/settings/theme",       icon: "/icons/theme.svg", label: "Theme" },
            { href: "/admin/settings/blocks",      icon: "/icons/blocks.svg", label: "Blocks" },
            { href: "/admin/settings/plugins",     icon: "/icons/plugins.svg", label: "Plugins" },
            { href: "/admin/settings/users",       icon: "/icons/users.svg", label: "Users" },
          ].map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              <span className="w-5 h-5 inline-flex items-center justify-center"><img src={icon} alt="" className="w-5 h-5" /></span> {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-zinc-800 px-5 py-4 text-xs text-zinc-600">
          <Link href="/" className="hover:text-zinc-400">
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-zinc-50">{children}</main>
    </div>
  );
}
