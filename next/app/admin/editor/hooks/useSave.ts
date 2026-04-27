"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { shortcodesToBlocks } from "@/lib/shortcodes";
import type { EditorBlock } from "@/lib/types";

interface UseSaveOptions {
  id?: string;
  title: string;
  slug: string;
  codeText: string;
  /**
   * Pre-computed block tree. When provided, this is sent directly to the API
   * instead of parsing `codeText` with `shortcodesToBlocks()`.
   * Pass `liveBlocks` from `useEditorPageState` so visual-mode saves skip the
   * redundant round-trip parse.
   */
  liveBlocks?: EditorBlock[];
  extraPayload: Record<string, unknown>;
  /** Collection endpoint, e.g. "/api/pages" or "/api/posts". */
  collectionEndpoint: string;
  /** Returns the redirect path after a successful create. */
  redirectOnCreate: (id: string) => string;
  onStatusChange: (s: "draft" | "published") => void;
  onSaveSuccess?: () => void;
}

/** Core save logic shared between the page editor and post editor. */
export function useSave({
  id,
  title,
  slug,
  codeText,
  liveBlocks,
  extraPayload,
  collectionEndpoint,
  redirectOnCreate,
  onStatusChange,
  onSaveSuccess,
}: UseSaveOptions) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave(targetStatus: "draft" | "published") {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      // Use pre-computed blocks when available (avoids re-parsing in visual mode).
      const blocks = liveBlocks ?? shortcodesToBlocks(codeText);
      const payload = { title, slug, status: targetStatus, blocks, html: codeText, ...extraPayload };
      if (id) {
        const res = await fetch(`${collectionEndpoint}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        onStatusChange(targetStatus);
      } else {
        const res = await fetch(collectionEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const created: { id: string } = await res.json();
        router.replace(redirectOnCreate(created.id));
      }
      setSaved(true);
      onSaveSuccess?.();
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
