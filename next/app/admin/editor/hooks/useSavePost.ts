"use client";

import type { EditorBlock } from "@/lib/types";
import { useSave } from "@/app/admin/editor/hooks/useSave";

interface UseSavePostOptions {
  id?: string;
  title: string;
  slug: string;
  codeText: string;
  liveBlocks?: EditorBlock[];
  excerpt: string;
  tags: string[];
  categories: string[];
  onStatusChange: (s: "draft" | "published") => void;
  /** Called after a successful save — used to clear the sessionStorage draft. */
  onSaveSuccess?: () => void;
}

export function useSavePost({ id, title, slug, codeText, liveBlocks, excerpt, tags, categories, onStatusChange, onSaveSuccess }: UseSavePostOptions) {
  return useSave({
    id,
    title,
    slug,
    codeText,
    liveBlocks,
    extraPayload: { excerpt, tags, categories },
    collectionEndpoint: "/api/posts",
    redirectOnCreate: (newId) => `/admin/editor/posts/${newId}`,
    onStatusChange,
    onSaveSuccess,
  });
}
