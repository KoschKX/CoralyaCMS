"use client";

import { useRouter } from "next/navigation";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this page? This cannot be undone.")) return;
    await fetch(`/api/pages/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
    >
      Delete
    </button>
  );
}
