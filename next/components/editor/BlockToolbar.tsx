"use client";

import { memo, useState, useCallback } from "react";
import type { EditorBlock } from "@/lib/pages-db";
import type { BlockDefinition } from "@/lib/block-types";
import { BlockIcon } from "@/components/BlockIcon";
import { ChevronUpIcon, ChevronDownIcon, TrashIcon } from "@/components/editor/ToolbarIcons";
import { useBlockEditor, type BlockOps } from "@/components/editor/BlockEditorContext";
import type { ActiveColInfo } from "@/lib/editor/store";

const TRANSLATABLE_BLOCKS = new Set(["paragraph", "button", "news-ticker", "header", "quote", "testimonials", "list", "carousel"]);

/** Strip HTML tags to get plain text for translation. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

async function translateText(text: string, from: string, to: string): Promise<string> {
  const plain = stripHtml(text);
  if (!plain) return text;
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: plain, from, to }),
  });
  if (!res.ok) throw new Error("Translation failed");
  const data = await res.json() as { translated: string };
  return data.translated;
}

function TranslateButton({ block, ops }: { block: EditorBlock; ops: BlockOps }) {
  const { activeLang, defaultLang } = useBlockEditor();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = useCallback(async () => {
    if (loading || activeLang === defaultLang) return;
    setLoading(true);
    setError(null);
    try {
      const data = block.data as Record<string, unknown>;
      let updated: Record<string, unknown> = { ...data };

      if (block.type === "paragraph" || block.type === "button" || block.type === "header") {
        const src = (data.text as string) ?? "";
        if (stripHtml(src)) {
          updated.text = await translateText(src, defaultLang, activeLang);
        }
      } else if (block.type === "quote") {
        if (stripHtml(data.text as string ?? ""))
          updated.text = await translateText(data.text as string, defaultLang, activeLang);
        if (stripHtml(data.caption as string ?? ""))
          updated.caption = await translateText(data.caption as string, defaultLang, activeLang);
      } else if (block.type === "list") {
        const items = (data.items as string[]) ?? [];
        if (items.length)
          updated.items = await Promise.all(
            items.map((item) => item.trim() ? translateText(item, defaultLang, activeLang) : Promise.resolve(item))
          );
      } else if (block.type === "testimonials") {
        type TItem = { id?: string; name?: string; role?: string; company?: string; quote?: string; [k: string]: unknown };
        const items = (data.items as TItem[]) ?? [];
        if (items.length)
          updated.items = await Promise.all(
            items.map(async (item) => ({
              ...item,
              ...(item.quote?.trim()   ? { quote:   await translateText(item.quote,   defaultLang, activeLang) } : {}),
              ...(item.name?.trim()    ? { name:    await translateText(item.name,    defaultLang, activeLang) } : {}),
              ...(item.role?.trim()    ? { role:    await translateText(item.role,    defaultLang, activeLang) } : {}),
              ...(item.company?.trim() ? { company: await translateText(item.company, defaultLang, activeLang) } : {}),
            }))
          );
      } else if (block.type === "carousel") {
        type CSlide = { id?: string; src?: string; alt?: string; caption?: string; link?: string; linkTarget?: string; [k: string]: unknown };
        const slides = (data.slides as CSlide[]) ?? [];
        if (slides.length)
          updated.slides = await Promise.all(
            slides.map(async (slide) => ({
              ...slide,
              ...(slide.alt?.trim()     ? { alt:     await translateText(slide.alt,     defaultLang, activeLang) } : {}),
              ...(slide.caption?.trim() ? { caption: await translateText(slide.caption, defaultLang, activeLang) } : {}),
            }))
          );
      } else if (block.type === "news-ticker") {
        const title = (data.tickerTitle as string) ?? "";
        if (title.trim()) {
          updated.tickerTitle = await translateText(title, defaultLang, activeLang);
        }
        const items = (data.items as Array<{ id: string; text: string; url: string }>) ?? [];
        if (items.length) {
          const translated = await Promise.all(
            items.map(async (item) => ({
              ...item,
              text: item.text.trim() ? await translateText(item.text, defaultLang, activeLang) : item.text,
            }))
          );
          updated.items = translated;
        }
      }

      ops.update(block.id, updated);
    } catch {
      setError("Translation failed");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  }, [block, ops, activeLang, defaultLang, loading]);

  const isOnDefaultLang = activeLang === defaultLang;
  const titleText = isOnDefaultLang
    ? "Switch to a non-primary language to auto-translate"
    : error ?? `Auto-translate to ${activeLang.toUpperCase()}`;

  return (
    <>
      <div className="w-px self-stretch bg-zinc-200" />
      <button
        onClick={handleTranslate}
        disabled={loading || isOnDefaultLang}
        title={titleText}
        aria-label={titleText}
        className={`flex w-8 items-center justify-center transition ${
          isOnDefaultLang
            ? "cursor-not-allowed text-zinc-300"
            : error
            ? "text-red-400 hover:text-red-500"
            : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-wait"
        }`}
      >
        {loading ? (
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round"/>
          </svg>
        ) : error ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        )}
      </button>
    </>
  );
}


interface BlockToolbarProps {
  block: EditorBlock;
  def: BlockDefinition | undefined;
  idx: number;
  listLength: number;
  ops: BlockOps;
  isColBlock: boolean;
  activeColInfo: ActiveColInfo | null;
  parentInfo?: { type: string; label: string; onSelect: () => void };
  onDeselectCol: () => void;
}

/**
 * The floating toolbar that appears above a selected block.
 * Contains:
 *   - Optional parent breadcrumb button (when inside a column)
 *   - Block type icon
 *   - Move up / move down
 *   - Delete
 *
 * Extracted from BlockItem to keep it focused and independently testable.
 */
export const BlockToolbar = memo(function BlockToolbar({
  block,
  def,
  idx,
  listLength,
  ops,
  isColBlock,
  activeColInfo,
  parentInfo,
  onDeselectCol,
}: BlockToolbarProps) {
  const showParentBreadcrumb =
    parentInfo || (isColBlock && activeColInfo?.blockId === block.id);

  const activeColOnThisBlock = isColBlock && activeColInfo?.blockId === block.id;

  return (
    <div
      data-editor-ui
      className="absolute bottom-full left-0 z-20 mb-1.5 flex items-end gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      {showParentBreadcrumb && (
        <button
          title={
            parentInfo
              ? `Select parent (${parentInfo.label})`
              : "Select columns block"
          }
          aria-label={
            parentInfo
              ? `Select parent (${parentInfo.label})`
              : "Select columns block"
          }
          onClick={
            parentInfo
              ? parentInfo.onSelect
              : onDeselectCol
          }
          className="flex items-center justify-center w-9 rounded-md border border-zinc-300 bg-white shadow-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition"
          style={{ minHeight: 36 }}
        >
          <BlockIcon
            name={parentInfo ? parentInfo.type : "columns"}
            label={parentInfo ? parentInfo.label : "Columns"}
            size={18}
          />
        </button>
      )}

      <div
        className="flex items-stretch overflow-hidden rounded-md border border-zinc-300 bg-white shadow-md"
        style={{ minHeight: 36 }}
      >
        {/* Block type identifier — non-interactive, screen-reader label via aria-label */}
        <button
          title={activeColOnThisBlock ? "Column" : (def?.label ?? block.type)}
          aria-label={activeColOnThisBlock ? "Column block" : (def?.label ?? block.type)}
          className="flex items-center justify-center w-9 text-lg text-zinc-700 rounded-l-md transition cursor-default"
          tabIndex={-1}
        >
          <BlockIcon
            name={activeColOnThisBlock ? "column" : block.type}
            label={activeColOnThisBlock ? "Column" : (def?.label ?? block.type)}
            size={20}
          />
        </button>

        <div className="w-px self-stretch bg-zinc-200" />

        <button
          onClick={() => ops.move(block.id, -1)}
          disabled={idx === 0}
          title="Move up"
          aria-label="Move block up"
          className="flex w-8 items-center justify-center text-zinc-500 hover:bg-zinc-100 transition disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronUpIcon />
        </button>

        <button
          onClick={() => ops.move(block.id, 1)}
          disabled={idx === listLength - 1}
          title="Move down"
          aria-label="Move block down"
          className="flex w-8 items-center justify-center text-zinc-500 hover:bg-zinc-100 transition disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronDownIcon />
        </button>

        {TRANSLATABLE_BLOCKS.has(block.type) && (
          <TranslateButton block={block} ops={ops} />
        )}

        <div className="w-px self-stretch bg-zinc-200" />

        <button
          onClick={() => ops.remove(block.id)}
          title="Delete block"
          aria-label="Delete block"
          className="flex w-8 items-center justify-center text-zinc-400 hover:bg-red-50 hover:text-red-500 transition"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
});
