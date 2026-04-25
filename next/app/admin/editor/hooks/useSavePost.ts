"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { shortcodesToBlocks } from "@/lib/shortcodes";

interface UseSavePostOptions {
  id?: string;
  title: string;
  slug: string;
  codeText: string;
  excerpt: string;
  tags: string[];
  categories: string[];
  onStatusChange: (s: "draft" | "published") => void;
}

export function useSavePost({
  id,
  title,
  slug,
  codeText,
  excerpt,
  tags,
  categories,
  onStatusChange,
}: UseSavePostOptions) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave(targetStatus: "draft" | "published") {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const html = codeText;
      const blocks = shortcodesToBlocks(codeText);
      const payload = { title, slug, status: targetStatus, blocks, html, excerpt, tags, categories };
      if (id) {
        const res = await fetch(`/api/posts/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        onStatusChange(targetStatus);
      } else {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const created: { id: string } = await res.json();
        router.replace(`/admin/editor/posts/${created.id}`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Save failed:", err);
      setSaveError("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return { saving, saved, saveError, handleSave };
}
