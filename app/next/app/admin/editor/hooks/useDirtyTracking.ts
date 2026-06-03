"use client";

import { useRef, useCallback, useEffect } from "react";

/**
 * Tracks whether the editor has unsaved changes and warns the user before
 * they navigate away. Returns `handleSaveSuccess` to call after a successful save.
 *
 * @param codeText  - The current editor code; changes here mark the editor as dirty.
 * @param clearDraft - Called on save success to remove the sessionStorage crash-recovery draft.
 */
export function useDirtyTracking(
  codeText: string,
  clearDraft: () => void,
): { handleSaveSuccess: () => void } {
  const isDirtyRef = useRef(false);
  const isFirstCodeRender = useRef(true);

  // Mark dirty on every code change, but skip the initial mount so that simply
  // opening the editor (without editing anything) does not trigger the warning.
  useEffect(() => {
    if (isFirstCodeRender.current) { isFirstCodeRender.current = false; return; }
    isDirtyRef.current = true;
  }, [codeText]);

  const handleSaveSuccess = useCallback(() => {
    isDirtyRef.current = false;
    clearDraft();
  }, [clearDraft]);

  // Warn before the user navigates away with unsaved changes.
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  return { handleSaveSuccess };
}
