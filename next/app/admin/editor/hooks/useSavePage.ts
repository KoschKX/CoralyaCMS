"use client";

import type { InjectCode } from "@/lib/types";
import type { EditorBlock } from "@/lib/types";
import { useSave } from "@/app/admin/editor/hooks/useSave";

interface UseSavePageOptions {
  id?: string;
  title: string;
  slug: string;
  codeText: string;
  liveBlocks?: EditorBlock[];
  pageBgColor: string;
  injectCode?: InjectCode;
  onStatusChange: (s: "draft" | "published") => void;
  /** Called after a successful save — used to clear the sessionStorage draft. */
  onSaveSuccess?: () => void;
}

export function useSavePage({ id, title, slug, codeText, liveBlocks, pageBgColor, injectCode, onStatusChange, onSaveSuccess }: UseSavePageOptions) {
  return useSave({
    id,
    title,
    slug,
    codeText,
    liveBlocks,
    extraPayload: { pageBgColor, injectCode },
    collectionEndpoint: "/api/pages",
    redirectOnCreate: (newId) => `/admin/editor/${newId}`,
    onStatusChange,
    onSaveSuccess,
  });
}
