"use client";

import { useRouter } from "next/navigation";
import type { PageMeta } from "@/lib/pages-db";

export default function CloneButton({ page }: { page: PageMeta }) {
  const router = useRouter();

  async function handleClone() {
    const cloneData = {
      ...page,
      id: undefined,
      title: page.title + " (Copy)",
      slug: page.slug + "-copy",
      status: "draft",
      createdAt: undefined,
      updatedAt: undefined,
    };
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cloneData),
    });
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleClone}
      className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
      title="Clone page"
    >
      Clone
    </button>
  );
}
