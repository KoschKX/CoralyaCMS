"use client";

/**
 * EditorStoreContext
 * ──────────────────
 * Provides a per-editor Zustand store instance via React context.
 * Using context (rather than a module singleton) allows multiple
 * independent editors on the same page without state collision.
 */

import { createContext, useContext, useRef, type ReactNode } from "react";
import { createEditorStore, type EditorStoreInstance } from "@/lib/editor/store";
import { useStore } from "zustand";
import type { EditorStore } from "@/lib/editor/store";

const EditorStoreContext = createContext<EditorStoreInstance | null>(null);

export function EditorStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<EditorStoreInstance | null>(null);
  if (!storeRef.current) {
    storeRef.current = createEditorStore();
  }
  return (
    <EditorStoreContext.Provider value={storeRef.current}>
      {children}
    </EditorStoreContext.Provider>
  );
}

function useEditorStoreInstance(): EditorStoreInstance {
  const store = useContext(EditorStoreContext);
  if (!store) throw new Error("useEditorStore must be used within EditorStoreProvider");
  return store;
}

/** Subscribe to a slice of the editor store. Only re-renders when the selected slice changes. */
export function useEditorStore<T>(selector: (state: EditorStore) => T): T {
  const store = useEditorStoreInstance();
  return useStore(store, selector);
}

/** Returns the full store with all actions (does NOT subscribe — use for dispatching only). */
export function useEditorActions(): EditorStore {
  return useEditorStoreInstance().getState();
}
