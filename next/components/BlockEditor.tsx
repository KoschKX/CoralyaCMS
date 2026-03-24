"use client";

import { useEffect, useRef } from "react";
import type { EditorBlock } from "@/lib/pages-db";

export type EditorAPI = {
  save: () => Promise<{ blocks: EditorBlock[] }>;
  destroy: () => void;
  blocks: {
    getCurrentBlockIndex: () => number;
    getBlockByIndex: (i: number) => { id: string; name: string } | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (id: string, data: Record<string, unknown>) => Promise<any>;
  };
};

interface BlockEditorProps {
  defaultBlocks?: EditorBlock[];
  disabledBlocks?: string[];
  onChange?: (blocks: EditorBlock[]) => void;
  onReady?: (editor: EditorAPI) => void;
}

type EditorInstance = EditorAPI;

type EditorJSCtor = new (config: unknown) => EditorInstance;

async function loadTools(disabledBlocks: string[] = []) {
  const EditorJS = await import("@editorjs/editorjs").then(
    (m) => m.default as unknown as EditorJSCtor,
  );

  const { blockRegistry } = await import("@/blocks/index");
  const activeRegistry = blockRegistry.filter((b) => !disabledBlocks.includes(b.name));

  // Build base tools first (everything except columns and paragraph)
  const baseEntries = await Promise.all(
    activeRegistry
      .filter((b) => b.name !== "paragraph" && b.name !== "columns")
      .map(async (b) => {
        const tool = await b.getEditorTool?.();
        return tool ? ([b.name, tool] as [string, unknown]) : null;
      }),
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseTools: Record<string, any> = Object.fromEntries(
    baseEntries.filter(Boolean) as [string, unknown][],
  );

  // Columns needs EditorJS + baseTools injected
  const columnsDef = activeRegistry.find((b) => b.name === "columns");
  const columnsTool = await columnsDef?.getEditorTool?.({ EditorJS, baseTools });

  const tools = {
    ...baseTools,
    ...(columnsTool ? { columns: columnsTool } : {}),
  };

  return { EditorJS, tools };
}

export default function BlockEditor({
  defaultBlocks = [],
  disabledBlocks = [],
  onChange,
  onReady,
}: BlockEditorProps) {
  const holderRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorInstance | null>(null);
  // Prevent React StrictMode from initialising the editor twice
  const initializedRef = useRef(false);
  // Becomes true once onReady fires — guards onChange from calling save() too early
  const isReadyRef = useRef(false);
  // Always-current ref so EditorJS's closed-over onChange calls the latest prop
  const onChangeRef = useRef(onChange);
  const onReadyRef = useRef(onReady);
  // Synchronous assignment (not useEffect) — guarantees the ref is current
  // before EditorJS fires, with no effect-timing gap
  onChangeRef.current = onChange;
  onReadyRef.current = onReady;

  useEffect(() => {
    if (initializedRef.current) return;

    let aborted = false;

    async function init() {
      if (!holderRef.current) return;

      const { EditorJS, tools } = await loadTools(disabledBlocks);

      // Bail out if cleanup fired while we were awaiting imports
      if (aborted || !holderRef.current) return;

      initializedRef.current = true;

      const editor = new EditorJS({
        holder: holderRef.current,
        placeholder: "Press Tab to choose a block type, or just start typing…",
        tools,
        data: defaultBlocks.length
          ? { time: Date.now(), blocks: defaultBlocks, version: "2.30.0" }
          : undefined,
        onReady: () => {
          isReadyRef.current = true;
          onReadyRef.current?.(editor as unknown as EditorAPI);
        },
        onChange: async () => {
          if (!isReadyRef.current) return;
          try {
            const output = await editor.save();
            onChangeRef.current?.(output.blocks);
          } catch (err) {
            console.error("[BlockEditor] editor.save() failed:", err);
          }
        },
      });

      editorRef.current = editor;
    }

    init();

    return () => {
      aborted = true;
      isReadyRef.current = false;
      if (editorRef.current?.destroy) {
        try {
          editorRef.current.destroy();
        } catch {
          /* ignore */
        }
      }
      editorRef.current = null;
      initializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={holderRef}
      className="editorjs-holder min-h-[400px] rounded-lg border border-zinc-200 bg-white px-8 py-6 text-sm leading-relaxed [&_.ce-block\_\_content]:max-w-full [&_.codex-editor\_\_redactor]:pb-32"
    />
  );
}
