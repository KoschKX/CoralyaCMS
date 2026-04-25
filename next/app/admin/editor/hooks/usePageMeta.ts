"use client";

import { useState } from "react";
import { autoSlug } from "@/lib/utils/slug";

interface UsePageMetaOptions {
  id?: string;
  initialTitle?: string;
  initialSlug?: string;
  initialStatus?: "draft" | "published";
  initialPageBgColor?: string;
}

/**
 * Manages editable page metadata: title, slug, status, and background color.
 * Auto-syncs the slug from the title for new pages (or when the slug has not
 * been manually diverged from the auto-generated value).
 */
export function usePageMeta({
  id,
  initialTitle = "",
  initialSlug = "",
  initialStatus = "draft",
  initialPageBgColor = "#ffffff",
}: UsePageMetaOptions) {
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [status, setStatus] = useState<"draft" | "published">(initialStatus);
  const [pageBgColor, setPageBgColor] = useState(initialPageBgColor);

  function handleTitleChange(value: string) {
    setTitle(value);
    // Auto-sync slug for new pages or when slug still matches the auto-value
    if (!id || slug === autoSlug(title)) setSlug(autoSlug(value));
  }

  return {
    title,
    setTitle,
    slug,
    setSlug,
    status,
    setStatus,
    pageBgColor,
    setPageBgColor,
    handleTitleChange,
  };
}
