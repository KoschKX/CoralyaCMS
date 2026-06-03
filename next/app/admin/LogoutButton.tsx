"use client";

import { useRouter } from "next/navigation";
import { resetSettings } from "@/hooks/useSettings";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    // Clear the client-side settings cache so the next login fetches fresh data.
    resetSettings();
    router.push("/admin/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-zinc-500 hover:text-zinc-300 transition"
    >
      Sign out
    </button>
  );
}
