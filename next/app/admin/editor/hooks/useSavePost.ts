"use client";

import { useSave } from "@/app/admin/editor/hooks/useSave";

interface UseSavePostOptions {
  id?: string;
  title: string;
  slug: string;
  codeText: string;
  excerpt: string;
  tags: string[];
  categories: string[];
  onStatusChange: (s: "draft" | "published") => void;
  /** Called after a successful save — used to clear the sessionStorage draft. */
  onSaveSuccess?: () => void;
}

export function useSavePost({ id, title, slug, codeText, excerpt, tags, categories, onStatusChange, onSaveSuccess }: UseSavePostOptions) {
  return useSave({
    id,
    title,
    slug,
    codeText,
    extraPayload: { excerpt, tags, categories },
    collectionEndpoint: "/api/posts",
    redirectOnCreate: (newId) => `/admin/editor/posts/${newId}`,
    onStatusChange,
    onSaveSuccess,
  });
}
