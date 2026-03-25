"use client";

/**
 * VisualEditor
 * ────────────
 * A custom React visual block editor. The source of truth is a hidden
 * <textarea> whose content is a shortcode/HTML string; the visual mode
 * renders interactive, directly-editable blocks derived from parsing that string.
 *
 * When a block is selected, its content becomes directly editable in-place
 * (no separate editing box). Un-selected blocks are rendered read-only.
 *
 * Data flow:
 *   hidden textarea ──parse──► blocks (internal state) ──edit──► serialize ──► textarea
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from "react";
import type { EditorBlock } from "@/lib/pages-db";
import { blockRegistry, blockMap } from "@/blocks/index";
import { blocksToShortcodes } from "@/lib/shortcodes";
import BlockRenderer from "@/components/BlockRenderer";
import { closeUnclosedTags } from "@/lib/close-unclosed-tags";
import { BlockIcon } from "@/components/BlockIcon";

// ── Default data for each block type (used when inserting a new block) ───────

const DEFAULT_DATA: Record<string, Record<string, unknown>> = {
  paragraph: { text: "New paragraph" },
  header:    { text: "New heading", level: 2 },
  list:      { items: ["Item 1", "Item 2"], style: "unordered" },
  code:      { code: "" },
  quote:     { text: "Quote text", caption: "" },
  delimiter: {},
  table:     { content: [["Heading 1", "Heading 2"], ["Cell 1", "Cell 2"]], withHeadings: true },
  embed:     { embed: "" },
  columns:   { cols: [{ blocks: [], width: "50%" }, { blocks: [], width: "50%" }] },
  html:      { content: "<p>HTML content</p>" },
};

// ── Deep tree helpers (used for nested blocks inside columns) ────────────────

/** Recursively update a block anywhere in the tree by id. */
function deepUpdateBlock(
  blocks: EditorBlock[],
  id: string,
  newData: Record<string, unknown>,
): EditorBlock[] {
  return blocks.map((b) => {
    if (b.id === id) return { ...b, data: newData };
    if (b.type === "columns") {
      const cols = (b.data.cols as Array<{ blocks: EditorBlock[]; width?: string }>) ?? [];
      return {
        ...b,
        data: {
          ...b.data,
          cols: cols.map((col) => ({
            ...col,
            blocks: deepUpdateBlock(col.blocks ?? [], id, newData),
          })),
        },
      };
    }
    return b;
  });
}

/** Find a block anywhere in the tree by id. */
function findBlockById(blocks: EditorBlock[], id: string): EditorBlock | undefined {
  for (const b of blocks) {
    if (b.id === id) return b;
    if (b.type === "columns") {
      const cols = (b.data.cols as Array<{ blocks: EditorBlock[] }>) ?? [];
      for (const col of cols) {
        const found = findBlockById(col.blocks ?? [], id);
        if (found) return found;
      }
    }
  }
  return undefined;
}

/** Returns true if targetId is a descendant of block (at any depth). */
function isDescendant(block: EditorBlock, targetId: string): boolean {
  if (block.type === "columns") {
    const cols = (block.data.cols as Array<{ blocks: EditorBlock[] }>) ?? [];
    for (const col of cols) {
      for (const child of col.blocks ?? []) {
        if (child.id === targetId || isDescendant(child, targetId)) return true;
      }
    }
  }
  return false;
}

// ── ContentEditable helper ────────────────────────────────────────────────────
// React can't combine dangerouslySetInnerHTML + contentEditable, so we set
// innerHTML via a ref.  We only update the DOM when the external html prop
// actually changes (e.g. panel pushed a style change), leaving the user's
// in-progress edits untouched during normal typing.

function CE<T extends keyof React.JSX.IntrinsicElements = "div">({
  as,
  html,
  onSave,
  onKeyDown,
  className,
  style,
  placeholder,
}: {
  as?: T;
  html: string;
  onSave: (val: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
}) {
  const Tag = (as ?? "div") as React.ElementType;
  const elRef = useRef<HTMLElement>(null);

  // Set innerHTML synchronously on mount (no flash) and on external html changes.
  const refCallback = useCallback(
    (el: HTMLElement | null) => {
      elRef.current = el;
      if (el) el.innerHTML = html;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    const el = elRef.current;
    if (el && el.innerHTML !== html) el.innerHTML = html;
  }, [html]);

  return (
    <Tag
      ref={refCallback}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      className={className}
      style={style}
      onKeyDown={onKeyDown}
      onBlur={(e: React.FocusEvent<HTMLElement>) => onSave(e.currentTarget.innerHTML)}
    />
  );
}

// ── CodeEditor ────────────────────────────────────────────────────────────────
// A contentEditable <code> element that mirrors <pre><code> from the live site
// exactly, so the block height in the editor matches the front end.
// Uses textContent (not innerHTML) to preserve raw newlines without escaping.

function CodeEditor({ code, onSave }: { code: string; onSave: (val: string) => void }) {
  const ref = useRef<HTMLElement>(null);
  const refCallback = useCallback(
    (el: HTMLElement | null) => {
      ref.current = el;
      if (el) el.textContent = code;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => {
    const el = ref.current;
    if (el && el.textContent !== code) el.textContent = code;
  }, [code]);
  return (
    <code
      ref={refCallback}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      className="focus:outline-none"
      style={{ display: "block", whiteSpace: "pre" }}
      onBlur={(e) => onSave(e.currentTarget.textContent ?? "")}
    />
  );
}


// ── Column fraction presets ──────────────────────────────────────────────────

const FRACTION_PRESETS = [
  { label: "Auto", value: "" },
  { label: "1/6",  value: "16.667%" },
  { label: "1/5",  value: "20%" },
  { label: "1/4",  value: "25%" },
  { label: "1/3",  value: "33.333%" },
  { label: "2/5",  value: "40%" },
  { label: "1/2",  value: "50%" },
  { label: "3/5",  value: "60%" },
  { label: "2/3",  value: "66.667%" },
  { label: "3/4",  value: "75%" },
  { label: "5/6",  value: "83.333%" },
  { label: "Full", value: "100%" },
];

// ── ColToolbar ────────────────────────────────────────────────────────────────
// Floating toolbar shown on hover over a column cell inside a columns block.

function ColToolbar({
  colIdx,
  total,
  width,
  onMove,
  onDelete,
  onAddCol,
  onResize,
}: {
  colIdx: number;
  total: number;
  width?: string;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
  onAddCol: () => void;
  onResize: (w: string) => void;
}) {
  const [sizeOpen, setSizeOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sizeOpen) return;
    function handler(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setSizeOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sizeOpen]);

  return (
    <>
      <span className="flex items-center px-2 font-mono text-xs font-semibold text-zinc-500">{colIdx + 1}</span>
      <div className="w-px self-stretch bg-zinc-200" />
      {/* Size picker */}
      <div ref={popRef}>
        <button
          title="Resize column"
          onClick={() => setSizeOpen((o) => !o)}
          className="flex items-center px-2 text-xs text-zinc-500 hover:bg-zinc-100 transition h-full"
        >
          {FRACTION_PRESETS.find((p) => p.value === (width ?? ""))?.label ?? (width || "auto")}
        </button>
        {sizeOpen && (
          <div className="absolute top-full inset-x-0 z-40 mt-1 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-6 gap-px">
              {FRACTION_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { onResize(p.value); setSizeOpen(false); }}
                  className={`rounded py-1.5 text-sm transition text-center font-medium ${
                    (width ?? "") === p.value
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="w-px self-stretch bg-zinc-200" />
      <button
        title="Move column left"
        disabled={colIdx === 0}
        onClick={() => onMove(-1)}
        className="flex w-8 items-center justify-center text-zinc-500 hover:bg-zinc-100 transition disabled:opacity-25 disabled:cursor-not-allowed"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <button
        title="Move column right"
        disabled={colIdx === total - 1}
        onClick={() => onMove(1)}
        className="flex w-8 items-center justify-center text-zinc-500 hover:bg-zinc-100 transition disabled:opacity-25 disabled:cursor-not-allowed"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
      </button>
      <div className="w-px self-stretch bg-zinc-200" />
      <button
        title="Add column after"
        onClick={onAddCol}
        className="flex w-8 items-center justify-center text-zinc-500 hover:bg-zinc-100 transition"
      >
        +
      </button>
      <button
        title="Delete column"
        disabled={total <= 1}
        onClick={onDelete}
        className="flex w-8 items-center justify-center text-zinc-400 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-25 disabled:cursor-not-allowed"
      >
        ✕
      </button>
    </>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface VisualEditorProps {
  initialBlocks: EditorBlock[];
  onChange: (code: string, blocks: EditorBlock[]) => void;
  onSelectBlock: (id: string | null, data: Record<string, unknown>, type: string) => void;
  selectedBlockId: string | null;
  registerUpdateHandler: (fn: ((id: string, newData: Record<string, unknown>) => void) | null) => void;
}

// ── EditableBlock ─────────────────────────────────────────────────────────────
// Renders a block in-place using the EXACT same wrapper classes as each
// layout.tsx — so clicking a block causes zero visual shift.
// Only leaf text nodes are replaced with contentEditable equivalents.

function EditableBlock({
  block,
  onUpdate,
  renderChildBlocks,
  isSelected,
  onSelect,
  activeColIdx,
  onActiveColChange,
}: {
  block: EditorBlock;
  onUpdate: (newData: Record<string, unknown>) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  activeColIdx?: number | null;
  onActiveColChange?: (ci: number | null) => void;
  renderChildBlocks?: (
    colBlocks: EditorBlock[],
    onUpdateAll: (newBlocks: EditorBlock[]) => void,
  ) => ReactNode;
}) {
  const data = block.data as Record<string, unknown>;
  const type = block.type;

  // ── paragraph ──────────────────────────────────────────────────────────────
  // Mirrors: <p className="block-paragraph leading-relaxed" style={…}>
  if (type === "paragraph") {
    const fontSize = (data.fontSize as string) || "base";
    return (
      <CE
        as="p"
        html={(data.text as string) ?? ""}
        onSave={(val) => onUpdate({ ...data, text: val })}
        className="block-paragraph leading-relaxed focus:outline-none"
        style={{
          fontSize: `var(--font-size-${fontSize})`,
          textAlign: ((data.align as string) || "left") as CSSProperties["textAlign"],
          color: (data.color as string) || undefined,
        }}
      />
    );
  }

  // ── header ─────────────────────────────────────────────────────────────────
  // Mirrors: <h1-4 className={marginClass[level]} style={…}>
  if (type === "header") {
    const level = (data.level as number) ?? 2;
    const marginClass: Record<number, string> = {
      1: "block-heading block-heading--1 mt-8 mb-2",
      2: "block-heading block-heading--2 mt-7 mb-2",
      3: "block-heading block-heading--3 mt-6 mb-1",
      4: "block-heading block-heading--4 mt-5 mb-1",
    };
    return (
      <CE
        as={`h${level}` as "h1" | "h2" | "h3" | "h4"}
        html={(data.text as string) ?? ""}
        onSave={(val) => onUpdate({ ...data, text: val })}
        className={`${marginClass[level] ?? "mt-5 mb-1"} focus:outline-none`}
        style={{
          fontSize: `var(--h${level}-size)`,
          fontWeight: `var(--h${level}-weight)` as CSSProperties["fontWeight"],
          lineHeight: `var(--h${level}-line-height)`,
          textAlign: ((data.align as string) || "left") as CSSProperties["textAlign"],
          color: (data.color as string) || undefined,
        }}
      />
    );
  }

  // ── quote ──────────────────────────────────────────────────────────────────
  // Mirrors: <blockquote className="block-quote border-l-4 border-zinc-300 pl-5 italic text-zinc-600">
  if (type === "quote") {
    return (
      <blockquote
        className="block-quote border-l-4 border-zinc-300 pl-5 italic text-zinc-600"
        style={{ textAlign: ((data.align as string) || "left") as CSSProperties["textAlign"] }}
      >
        <CE
          as="p"
          html={(data.text as string) ?? ""}
          onSave={(val) => onUpdate({ ...data, text: val })}
          className="focus:outline-none"
        />
        <cite className="mt-1 flex items-baseline gap-1 text-sm not-italic text-zinc-400">
          <span>—</span>
          <CE
            html={(data.caption as string) ?? ""}
            onSave={(val) => onUpdate({ ...data, caption: val })}
            className="focus:outline-none"
            placeholder="Attribution"
          />
        </cite>
      </blockquote>
    );
  }

  // ── list ───────────────────────────────────────────────────────────────────
  // Mirrors: <ul/ol className="block-list list-disc/decimal pl-6 space-y-1">
  if (type === "list") {
    const items = (data.items as string[]) ?? [];
    const ordered = data.style === "ordered";
    const ListTag = ordered ? "ol" : "ul";

    function handleKeyDown(e: React.KeyboardEvent<HTMLElement>, i: number) {
      if (e.key === "Enter") {
        e.preventDefault();
        const newItems = [...items.slice(0, i + 1), "", ...items.slice(i + 1)];
        onUpdate({ ...data, items: newItems });
        requestAnimationFrame(() => {
          const li = (e.currentTarget.parentElement as HTMLElement)?.querySelectorAll("li")[i + 1];
          (li as HTMLElement | null)?.focus();
        });
      } else if (e.key === "Backspace" && e.currentTarget.innerHTML === "" && items.length > 1) {
        e.preventDefault();
        const newItems = items.filter((_, j) => j !== i);
        onUpdate({ ...data, items: newItems });
        requestAnimationFrame(() => {
          const prevIdx = Math.max(0, i - 1);
          const li = (e.currentTarget.parentElement as HTMLElement)?.querySelectorAll("li")[prevIdx];
          (li as HTMLElement | null)?.focus();
        });
      }
    }

    return (
      <ListTag className={`block-list ${ordered ? "list-decimal pl-6 space-y-1" : "list-disc pl-6 space-y-1"}`}>
        {items.map((item, i) => (
          <CE
            key={i}
            as="li"
            html={item}
            onSave={(val) => {
              const newItems = [...items];
              newItems[i] = val;
              onUpdate({ ...data, items: newItems });
            }}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className="focus:outline-none"
          />
        ))}
      </ListTag>
    );
  }

  // ── code ───────────────────────────────────────────────────────────────────
  // Mirrors: <pre className="block-code overflow-x-auto rounded-lg bg-zinc-900 px-5 py-4 text-sm text-zinc-100">
  // Uses a contentEditable <code> element (identical structure to the live site)
  // so the block is exactly the same height as it will appear on the front end.
  if (type === "code") {
    const code = (data.code as string) ?? "";
    return (
      <pre className="block-code overflow-x-auto rounded-lg bg-zinc-900 px-5 py-4 text-sm text-zinc-100">
        <CodeEditor code={code} onSave={(val) => onUpdate({ ...data, code: val })} />
      </pre>
    );
  }

  // ── table ──────────────────────────────────────────────────────────────────
  // Mirrors: <div className="block-table overflow-x-auto"> … </div>
  if (type === "table") {
    const rows = (data.content as string[][]) ?? [[""]];
    const withHeadings = !!(data.withHeadings);
    return (
      <div className="block-table overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                className={ri === 0 && withHeadings ? "bg-zinc-100 font-semibold" : "even:bg-zinc-50"}
              >
                {row.map((cell, ci) =>
                  ri === 0 && withHeadings ? (
                    <CE
                      key={ci}
                      as="th"
                      html={cell}
                      onSave={(val) => {
                        const newRows = rows.map((r, ri2) =>
                          ri2 === ri ? r.map((c, ci2) => (ci2 === ci ? val : c)) : r
                        );
                        onUpdate({ ...data, content: newRows });
                      }}
                      className="border border-zinc-200 px-3 py-2 text-left focus:outline-none focus:bg-blue-50"
                    />
                  ) : (
                    <CE
                      key={ci}
                      as="td"
                      html={cell}
                      onSave={(val) => {
                        const newRows = rows.map((r, ri2) =>
                          ri2 === ri ? r.map((c, ci2) => (ci2 === ci ? val : c)) : r
                        );
                        onUpdate({ ...data, content: newRows });
                      }}
                      className="border border-zinc-200 px-3 py-2 focus:outline-none focus:bg-blue-50"
                    />
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-1 flex gap-3 text-xs text-zinc-400">
          <button
            className="hover:text-zinc-700"
            onClick={() => {
              const w = rows[0]?.length ?? 1;
              onUpdate({ ...data, content: [...rows, Array(w).fill("")] });
            }}
          >
            + row
          </button>
          <button
            className="hover:text-zinc-700"
            onClick={() => onUpdate({ ...data, content: rows.map((r) => [...r, ""]) })}
          >
            + col
          </button>
        </div>
      </div>
    );
  }

  // ── embed ──────────────────────────────────────────────────────────────────
  // Mirrors: <div className="block-embed aspect-video w-full overflow-hidden rounded-lg">
  // Iframe can't be edited, so we show a URL input that fills the same container.
  if (type === "embed") {
    return (
      <div className="block-embed aspect-video w-full overflow-hidden rounded-lg bg-zinc-100 flex flex-col items-center justify-center gap-2">
        <span className="text-xs text-zinc-400">Embed URL</span>
        <input
          type="text"
          className="w-3/4 rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-zinc-400"
          defaultValue={(data.embed as string) ?? ""}
          placeholder="https://…"
          onBlur={(e) => onUpdate({ ...data, embed: e.target.value })}
        />
      </div>
    );
  }

  // ── html ───────────────────────────────────────────────────────────────────
  // Mirrors: <div className="block-html">
  // When unselected: render the live HTML preview so height matches the live site.
  // When selected: swap in the textarea for editing.
  if (type === "html") {
    const rawContent = (data.content as string) ?? "";
    const content = closeUnclosedTags(rawContent);
    if (!isSelected) {
      return (
        <div className="block-html">
          <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      );
    }
    return (
      <div className="block-html">
        <textarea
          className="w-full resize-y rounded border border-zinc-200 bg-zinc-50 p-2 font-mono text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-300"
          rows={Math.max(3, content.split("\n").length)}
          defaultValue={content}
          onBlur={(e) => onUpdate({ ...data, content: e.target.value })}
          spellCheck={false}
        />
      </div>
    );
  }

  // ── columns ────────────────────────────────────────────────────────────────
  // If renderChildBlocks is provided (injected by VisualEditor), each column's
  // child blocks are rendered with full selection/toolbar/addzone support.
  // The fallback (no renderChildBlocks) is a read-only render used outside the editor.
  if (type === "columns") {
    const cols = (data.cols as Array<{ blocks: EditorBlock[]; width?: string }>) ?? [];
    // Convert percentage widths to fr units to avoid overflow with gap-6.
    const gridTemplateColumns = cols.every((c) => !c.width)
      ? `repeat(${cols.length || 2}, minmax(0, 1fr))`
      : cols.map((c) => {
          if (!c.width) return "1fr";
          const n = parseFloat(c.width);
          return isNaN(n) ? c.width : `${n}fr`;
        }).join(" ");

    // Shared per-column ops — called with index from the single shared toolbar

    return (
      <div className="block-columns grid gap-6" style={{ gridTemplateColumns }}>
        {cols.map((col, colIdx) => (
          <div
            key={colIdx}
            className={`block-columns__col relative min-w-0 rounded transition cursor-pointer ${
              isSelected && (activeColIdx ?? null) === colIdx
                ? "ring-2 ring-blue-400"
                : "ring-1 ring-transparent hover:ring-blue-300"
              }`}
              onClick={(e) => { e.stopPropagation(); onActiveColChange?.(colIdx); onSelect?.(); }}
            >
              {renderChildBlocks
                ? renderChildBlocks(
                    col.blocks ?? [],
                    (newBlocks) => {
                      onUpdate({ ...data, cols: cols.map((c, ci) => ci === colIdx ? { ...c, blocks: newBlocks } : c) });
                    },
                  )
                : (col.blocks ?? []).map((childBlock) => (
                    <EditableBlock
                      key={childBlock.id}
                      block={childBlock}
                      onUpdate={(newData) => {
                        onUpdate({ ...data, cols: cols.map((c, ci) =>
                          ci === colIdx
                            ? { ...c, blocks: c.blocks.map((b) => b.id === childBlock.id ? { ...b, data: newData } : b) }
                            : c
                        )});
                      }}
                    />
                  ))}
            </div>
          ))}
        </div>
    );
  }

  // ── delimiter / fallback ───────────────────────────────────────────────────
  // No editable content — render read-only.
  const def = blockMap[type];
  if (!def) return null;
  return (
    <div className="pointer-events-none select-none">
      <def.Layout
        data={data}
        renderBlocks={(children) => <BlockRenderer blocks={children} />}
      />
    </div>
  );
}

// ── Block picker popup ────────────────────────────────────────────────────────

function BlockPicker({
  onSelect,
  onClose,
}: {
  onSelect: (type: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-40 mt-1 w-52 rounded-lg border border-zinc-200 bg-white shadow-lg"
    >
      <div className="p-1">
        {blockRegistry.map((def) => (
          <button
            key={def.name}
            onClick={() => onSelect(def.name)}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition hover:bg-zinc-50"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-zinc-200 font-mono text-[11px] text-zinc-500">
              <BlockIcon name={def.name} label={def.label} size={20} />
            </span>
            <span className="text-zinc-800">{def.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Add block zone (shown between blocks and at top/bottom) ──────────────────

function AddZone({ onAdd, variant = "inline" }: { onAdd: (type: string) => void; variant?: "inline" | "footer" | "col-empty" | "col-last" }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  if (variant === "col-empty") {
    return (
      <div className="group relative flex h-full min-h-[60px] items-center justify-center">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-400 bg-white text-zinc-500 text-sm leading-none opacity-0 group-hover:opacity-100 hover:border-blue-500 hover:text-blue-500 transition-all"
          title="Add block"
        >
          +
        </button>
        {open && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 z-30 mt-1">
            <BlockPicker onSelect={(t) => { setOpen(false); onAdd(t); }} onClose={close} />
          </div>
        )}
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2 px-1 py-2 text-sm text-zinc-400 hover:text-zinc-600 transition"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded border border-zinc-300 bg-white text-zinc-400 text-sm leading-none hover:border-zinc-500 hover:text-zinc-600">+</span>
          <span>Type / to choose a block</span>
        </button>
        {open && (
          <div className="absolute top-full left-0 z-30">
            <BlockPicker onSelect={(t) => { setOpen(false); onAdd(t); }} onClose={close} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`insert-zone${variant === "col-last" ? " insert-zone--col-last" : ""}`}>
      <div className="insert-zone__line" />
      <button
        onClick={() => setOpen((o) => !o)}
        className="insert-zone__btn"
        title="Add block"
      >
        +
      </button>
      {open && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30">
          <BlockPicker onSelect={(t) => { setOpen(false); onAdd(t); }} onClose={close} />
        </div>
      )}
    </div>
  );
}

// ── VisualEditor ──────────────────────────────────────────────────────────────

export default function VisualEditor({
  initialBlocks,
  onChange,
  onSelectBlock,
  selectedBlockId,
  registerUpdateHandler,
}: VisualEditorProps) {
  const [blocks, setBlocks] = useState<EditorBlock[]>(initialBlocks);
  const [activeColInfo, setActiveColInfo] = useState<{ blockId: string; colIdx: number } | null>(null);

  // Keep refs to avoid stale closures inside callbacks
  const blocksRef = useRef(blocks);
  const onChangeRef = useRef(onChange);
  const onSelectBlockRef = useRef(onSelectBlock);
  useEffect(() => { blocksRef.current = blocks; }, [blocks]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onSelectBlockRef.current = onSelectBlock; }, [onSelectBlock]);

  // Publish changes upstream (serializes to shortcode string)
  const publish = useCallback((newBlocks: EditorBlock[]) => {
    setBlocks(newBlocks);
    onChangeRef.current(blocksToShortcodes(newBlocks), newBlocks);
  }, []);

  // Register the update handler so the parent panel can push style changes in.
  // Uses deepUpdateBlock so panels can update blocks nested inside columns.
  useEffect(() => {
    registerUpdateHandler((id, newData) => {
      const updated = deepUpdateBlock(blocksRef.current, id, newData);
      publish(updated);
      const found = findBlockById(blocksRef.current, id);
      onSelectBlockRef.current(id, newData, found?.type ?? "");
    });
    return () => registerUpdateHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Block operations ─────────────────────────────────────────────────────

  function updateBlock(id: string, newData: Record<string, unknown>) {
    const updated = blocks.map((b) => (b.id === id ? { ...b, data: newData } : b));
    publish(updated);
    if (id === selectedBlockId) {
      onSelectBlock(id, newData, blocks.find((b) => b.id === id)?.type ?? "");
    }
  }

  function deleteBlock(id: string) {
    const updated = blocks.filter((b) => b.id !== id);
    publish(updated);
    if (id === selectedBlockId) onSelectBlock(null, {}, "");
  }

  function moveBlock(id: string, dir: -1 | 1) {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    const updated = [...blocks];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    publish(updated);
  }

  function addBlockAfter(afterId: string | "TOP", type: string) {
    const newBlock: EditorBlock = {
      id: crypto.randomUUID(),
      type,
      data: { ...(DEFAULT_DATA[type] ?? {}) },
    };
    let updated: EditorBlock[];
    if (afterId === "TOP") {
      updated = [newBlock, ...blocks];
    } else {
      const idx = blocks.findIndex((b) => b.id === afterId);
      updated = [...blocks.slice(0, idx + 1), newBlock, ...blocks.slice(idx + 1)];
    }
    publish(updated);
    onSelectBlock(newBlock.id, newBlock.data as Record<string, unknown>, type);
  }

  // ── renderBlockList ───────────────────────────────────────────────────────
  // Renders a list of blocks with Gutenberg-style UX: selection ring,
  // transparent click-capture overlay (removed when selected so contentEditable
  // works), floating toolbar, and AddZone between blocks.
  //
  // ops provides the CRUD operations for this block list level —
  // either the top-level VisualEditor state or a per-column derived set.
  // This function calls itself recursively via renderChildBlocks for columns.

  type BlockOps = {
    update: (id: string, newData: Record<string, unknown>) => void;
    remove: (id: string) => void;
    move: (id: string, dir: -1 | 1) => void;
    addAfter: (afterId: string | "TOP", type: string) => void;
  };

  function renderBlockList(list: EditorBlock[], ops: BlockOps, isInColumn = false): ReactNode {
    // Build per-column ops — called inside the loop for columns blocks.
    function makeColOps(
      colBlocks: EditorBlock[],
      onUpdateAll: (newBlocks: EditorBlock[]) => void,
    ): BlockOps {
      return {
        update: (id, newData) => {
          onUpdateAll(colBlocks.map((b) => (b.id === id ? { ...b, data: newData } : b)));
          if (id === selectedBlockId) {
            onSelectBlock(id, newData, colBlocks.find((b) => b.id === id)?.type ?? "");
          }
        },
        remove: (id) => {
          onUpdateAll(colBlocks.filter((b) => b.id !== id));
          if (id === selectedBlockId) onSelectBlock(null, {}, "");
        },
        move: (id, dir) => {
          const i = colBlocks.findIndex((b) => b.id === id);
          if (i < 0) return;
          const ni = i + dir;
          if (ni < 0 || ni >= colBlocks.length) return;
          const u = [...colBlocks];
          [u[i], u[ni]] = [u[ni], u[i]];
          onUpdateAll(u);
        },
        addAfter: (afterId, type) => {
          const nb: EditorBlock = {
            id: crypto.randomUUID(),
            type,
            data: { ...(DEFAULT_DATA[type] ?? {}) },
          };
          let u: EditorBlock[];
          if (afterId === "TOP") {
            u = [nb, ...colBlocks];
          } else {
            const i = colBlocks.findIndex((b) => b.id === afterId);
            u = [...colBlocks.slice(0, i + 1), nb, ...colBlocks.slice(i + 1)];
          }
          onUpdateAll(u);
          onSelectBlock(nb.id, nb.data as Record<string, unknown>, type);
        },
      };
    }

    return list.map((block, idx) => {
      const def = blockMap[block.type];
      if (!def) return null;

      const isSelected = block.id === selectedBlockId;
      const descendantSelected =
        !isSelected && !!selectedBlockId && isDescendant(block, selectedBlockId);
      const showOverlay = !isSelected && !descendantSelected;

      const renderChildBlocks = (
        colBlocks: EditorBlock[],
        onUpdateAll: (newBlocks: EditorBlock[]) => void,
      ): ReactNode => {
        const colOps = makeColOps(colBlocks, onUpdateAll);
        return (
          <>
            {colBlocks.length === 0 ? (
              <AddZone onAdd={(type) => colOps.addAfter("TOP", type)} variant="col-empty" />
            ) : (
              <>
                <AddZone onAdd={(type) => colOps.addAfter("TOP", type)} />
                {renderBlockList(colBlocks, colOps, true)}
              </>
            )}
          </>
        );
      };

      const isLast = idx === list.length - 1;
      return (
        <div
          key={block.id}
          data-block-id={block.id}
          className={`relative transition ${
            isSelected
              ? "ring-2 ring-blue-500"
              : descendantSelected
                ? "ring-2 ring-blue-200"
                : "ring-1 ring-transparent"
          }`}
          style={{ marginBottom: isInColumn && isLast ? 0 : "var(--block-spacing, 1.5rem)", paddingBottom: isInColumn && isLast ? "var(--block-spacing, 1.5rem)" : undefined }}
        >
          <div className="group/block relative">
            <EditableBlock
              block={block}
              onUpdate={(newData) => ops.update(block.id, newData)}
              isSelected={isSelected}
              onSelect={() => { if (block.type !== "columns") setActiveColInfo(null); onSelectBlock(block.id, block.data as Record<string, unknown>, block.type); }}
              activeColIdx={activeColInfo?.blockId === block.id ? activeColInfo.colIdx : null}
              onActiveColChange={(ci) => ci !== null ? setActiveColInfo({ blockId: block.id, colIdx: ci }) : setActiveColInfo(null)}
              renderChildBlocks={block.type === "columns" ? renderChildBlocks : undefined}
            />

            {showOverlay && (
              <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBlock(
                    block.id,
                    block.data as Record<string, unknown>,
                    block.type,
                  );
                }}
              />
            )}

            {/* ── Block toolbar + optional col toolbar ── */}
            {isSelected && (
              <>
              {/* Main block toolbar — left */}
              <div
                className="absolute bottom-full left-0 z-20 mb-1.5 flex items-end gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="flex items-stretch overflow-hidden rounded-md border border-zinc-200 bg-white shadow-md"
                  style={{ minHeight: 36 }}
                >
                {/* Block type */}
                <button
                  title={def.label}
                  className="flex items-center justify-center w-9 text-lg text-zinc-700 hover:bg-zinc-100 rounded-l-md transition"
                >
                  <BlockIcon name={block.type} label={def.label} size={20} />
                </button>

                <div className="w-px self-stretch bg-zinc-200" />

                {/* Move up */}
                <button
                  onClick={() => ops.move(block.id, -1)}
                  disabled={idx === 0}
                  title="Move up"
                  className="flex w-8 items-center justify-center text-zinc-500 hover:bg-zinc-100 transition disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                </button>

                {/* Move down */}
                <button
                  onClick={() => ops.move(block.id, 1)}
                  disabled={idx === list.length - 1}
                  title="Move down"
                  className="flex w-8 items-center justify-center text-zinc-500 hover:bg-zinc-100 transition disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>

                <div className="w-px self-stretch bg-zinc-200" />

                {/* Delete */}
                <button
                  onClick={() => ops.remove(block.id)}
                  title="Delete block"
                  className="flex w-8 items-center justify-center text-zinc-400 hover:bg-red-50 hover:text-red-500 transition"
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
                </div>
              </div>

              {/* Col toolbar pill — right */}
              {block.type === "columns" && activeColInfo?.blockId === block.id && (() => {
                const ci = activeColInfo.colIdx;
                const cols = ((block.data as Record<string, unknown>).cols as Array<{ blocks: EditorBlock[]; width?: string }>) ?? [];
                const col = cols[ci];
                const colData = block.data as Record<string, unknown>;
                return (
                  <div
                    key={`coltoolbar-${ci}`}
                    className="absolute bottom-full right-0 z-20 mb-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      className="flex items-stretch rounded-md border border-zinc-200 bg-white shadow-md"
                      style={{ minHeight: 36 }}
                    >
                    <ColToolbar
                      colIdx={ci}
                      total={cols.length}
                      width={col?.width}
                      onMove={(dir) => {
                        const ni = ci + dir;
                        if (ni < 0 || ni >= cols.length) return;
                        const nc = [...cols]; [nc[ci], nc[ni]] = [nc[ni], nc[ci]];
                        ops.update(block.id, { ...colData, cols: nc });
                        setActiveColInfo({ blockId: block.id, colIdx: ni });
                      }}
                      onDelete={() => {
                        if (cols.length <= 1) return;
                        ops.update(block.id, { ...colData, cols: cols.filter((_, i) => i !== ci) });
                        setActiveColInfo(null);
                      }}
                      onAddCol={() => {
                        const nc = [...cols.slice(0, ci + 1), { blocks: [], width: undefined }, ...cols.slice(ci + 1)];
                        ops.update(block.id, { ...colData, cols: nc });
                      }}
                      onResize={(w) => {
                        ops.update(block.id, { ...colData, cols: cols.map((c, i) => i === ci ? { ...c, width: w || undefined } : c) });
                      }}
                    />
                    </div>
                  </div>
                );
              })()}
              </>
            )}
          </div>

          {(!isLast || isInColumn) && <AddZone onAdd={(type) => ops.addAfter(block.id, type)} variant={isInColumn && isLast ? "col-last" : "inline"} />}
        </div>
      );
    });
  }

  const topOps: BlockOps = {
    update: updateBlock,
    remove: deleteBlock,
    move: moveBlock,
    addAfter: addBlockAfter,
  };

  return (
    <div className="text-zinc-800" style={{ display: "flex", flexDirection: "column" }}>
        <AddZone onAdd={(type) => addBlockAfter("TOP", type)} />

        {blocks.length === 0 && (
          <div className="my-4 flex min-h-[160px] items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 text-sm text-zinc-400">
            Click + to add your first block
          </div>
        )}

        {renderBlockList(blocks, topOps)}

        <AddZone onAdd={(type) => addBlockAfter(blocks[blocks.length - 1]?.id ?? "TOP", type)} variant="footer" />
    </div>
  );
}
