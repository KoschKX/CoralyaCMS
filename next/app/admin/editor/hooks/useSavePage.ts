"use client";

import type { InjectCode, PageTranslation } from "@/lib/types";
import type { EditorBlock } from "@/lib/types";
import { useSave } from "@/app/admin/editor/hooks/useSave";

interface UseSavePageOptions {
  id?: string;
  title: string;
  slug: string;
  codeText: string;
  liveBlocks?: EditorBlock[];
  mainMode?: "visual" | "code" | "inject";
  pageBgColor: string;
  injectCode?: InjectCode;
  translations?: Record<string, PageTranslation>;
  onStatusChange: (s: "draft" | "published") => void;
  /** Called after a successful save — used to clear the sessionStorage draft. */
  onSaveSuccess?: () => void;
}

export function useSavePage({ id, title, slug, codeText, liveBlocks, mainMode, pageBgColor, injectCode, translations, onStatusChange, onSaveSuccess }: UseSavePageOptions) {
  return useSave({
    id,
    title,
    slug,
    codeText,
    liveBlocks,
    mainMode,
    extraPayload: { pageBgColor, injectCode, translations },
    collectionEndpoint: "/api/pages",
    redirectOnCreate: (newId) => `/admin/editor/${newId}`,
    onStatusChange,
    onSaveSuccess,
  });
}
