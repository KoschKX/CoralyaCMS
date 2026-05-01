"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const SETTINGS_LINKS = [
  { href: "/admin/settings/site",       icon: "/icons/site.svg",       label: "Site" },
  { href: "/admin/settings/navigation", icon: "/icons/navigation.svg", label: "Navigation" },
  { href: "/admin/settings/theme",      icon: "/icons/theme.svg",      label: "Theme" },
  { href: "/admin/settings/blocks",     icon: "/icons/blocks.svg",     label: "Blocks" },
  { href: "/admin/settings/plugins",    icon: "/icons/plugins.svg",    label: "Plugins" },
  { href: "/admin/settings/users",      icon: "/icons/users.svg",      label: "Users" },
];

const CONTENT_LINKS = [
  { href: "/admin",       icon: "/icons/pages.svg",     label: "Pages" },
  { href: "/admin/posts", icon: "/icons/post-list.svg", label: "Posts" },
];

interface EditorNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function EditorNavDrawer({ open, onClose }: EditorNavDrawerProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <>
      {/* Backdrop — closes drawer on click */}
      {open && (
        <div
          className="fixed inset-0 z-[49] bg-black/30 backdrop-blur-sm"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <nav
        aria-label="Admin navigation"
        className={`fixed inset-y-0 left-0 z-[50] flex w-56 flex-col bg-zinc-950 text-zinc-100 shadow-2xl transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo / close */}
        <div className="flex items-center justify-between px-5 py-5">
          <Link
            href="/admin"
            onClick={onClose}
            className="text-lg font-semibold tracking-tight hover:text-white"
          >
            ✦ CORALYA
          </Link>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-7 w-7 items-center justify-center rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Content links */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Content
          </p>
          {CONTENT_LINKS.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center">
                <img src={icon} alt="" className="h-5 w-5" />
              </span>
              {label}
            </Link>
          ))}

          <p className="mb-1 mt-5 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Settings
          </p>
          {SETTINGS_LINKS.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center">
                <img src={icon} alt="" className="h-5 w-5" />
              </span>
              {label}
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 px-5 py-4 text-xs text-zinc-600 flex items-center justify-between">
          <Link href="/" className="hover:text-zinc-400">
            ← Back to site
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition"
          >
            Sign out
          </button>
        </div>
      </nav>
    </>
  );
}
