"use client";

import Link from "next/link";

interface SubItem {
  href: string;
  label: string;
}

interface ContentNavItem {
  href: string;
  icon: string;
  label: string;
  sub: SubItem[];
}

const ITEMS: ContentNavItem[] = [
  {
    href: "/admin",
    icon: "/icons/pages.svg",
    label: "Pages",
    sub: [
      { href: "/admin", label: "All Pages" },
      { href: "/admin/editor/new", label: "New Page" },
    ],
  },
  {
    href: "/admin/posts",
    icon: "/icons/post-list.svg",
    label: "Posts",
    sub: [
      { href: "/admin/posts", label: "All Posts" },
      { href: "/admin/editor/posts/new", label: "New Post" },
    ],
  },
];

export function SidebarContentNav() {
  return (
    <div className="flex flex-col">
      {ITEMS.map((item) => (
        <div key={item.label} className="group relative">
          <Link
            href={item.href}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center">
              <img src={item.icon} alt="" className="h-5 w-5" />
            </span>
            {item.label}
          </Link>

          {/* Invisible bridge — keeps group hovered across the gap */}
          <div className="absolute left-full top-0 h-full w-1.5" />

          {/* Popup — shown on group hover */}
          <div className="pointer-events-none absolute left-full top-0 z-50 ml-1.5 min-w-[11rem] rounded-lg border border-zinc-700 bg-zinc-900 py-1 opacity-0 shadow-xl transition-opacity duration-100 group-hover:pointer-events-auto group-hover:opacity-100">
            {item.sub.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="block px-3.5 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

