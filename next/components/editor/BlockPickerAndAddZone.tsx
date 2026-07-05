"use client";

import { useState, useEffect, useRef, useCallback, useContext, useMemo } from "react";
import { blockRegistry } from "@/blocks/index";
import { applyBlockPickerBlocks } from "@/filters/block-picker";
import { BlockEditorContext } from "@/components/editor/BlockEditorContext";
import { BlockIcon } from "@/components/BlockIcon";
import { useBlockLocale } from "@/components/editor/BlockLocaleContext";
import { getBlockLabel } from "@/lib/i18n/block-messages";

// ── Category order (matches BlocksPanel) ───────────────────────────────────────
const CATEGORIES = [
  { id: "text",   label: "Text" },
  { id: "media",  label: "Media" },
  { id: "design", label: "Design" },
  { id: "data",   label: "Data" },
  { id: "code",   label: "Code" },
];

export function BlockPicker({
  onSelect,
  onClose,
}: {
  onSelect: (type: string) => void;
  onClose: () => void;
}) {
  const ctx = useContext(BlockEditorContext);
  const disabledBlocks = ctx?.disabledBlocks ?? [];
  const locale = useBlockLocale();
  const filtered = applyBlockPickerBlocks(blockRegistry);
  const allBlocks = disabledBlocks.length
    ? filtered.filter((def) => !disabledBlocks.includes(def.name))
    : filtered;

  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Focus search on mount
  useEffect(() => { searchRef.current?.focus(); }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const visibleBlocks = useMemo(() => {
    if (!search.trim()) return allBlocks;
    const q = search.toLowerCase();
    return allBlocks.filter((d) => getBlockLabel(d, locale).toLowerCase().includes(q) || d.label.toLowerCase().includes(q) || d.name.toLowerCase().includes(q));
  }, [search, allBlocks, locale]);

  // Group by category — only computed when not searching (groups are hidden during search)
  const groups = useMemo(() => {
    if (search.trim()) return null;
    const map = new Map<string, typeof allBlocks>();
    for (const cat of CATEGORIES) map.set(cat.id, []);
    map.set("other", []);
    for (const def of allBlocks) {
      const key = (def as { category?: string }).category;
      const bucket = (key && map.has(key)) ? map.get(key)! : map.get("other")!;
      bucket.push(def);
    }
    return [...CATEGORIES, { id: "other", label: "Other" }]
      .map((cat) => ({ ...cat, blocks: map.get(cat.id) ?? [] }))
      .filter((g) => g.blocks.length > 0);
  }, [search, allBlocks]);

  // Focus trap: Tab/Shift+Tab cycles within the modal while it is open.
  useEffect(() => {
    const modal = ref.current;
    if (!modal) return;
    const sel = 'button, input, [href], [tabindex]:not([tabindex="-1"])';
    function trapFocus(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const focusable = Array.from(modal!.querySelectorAll<HTMLElement>(sel)).filter(
        (el) => !el.hasAttribute("disabled"),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", trapFocus);
    return () => document.removeEventListener("keydown", trapFocus);
  }, []);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Insert block"
      className="z-40 w-72 rounded-lg border border-zinc-300 bg-white shadow-xl"
    >
      {/* Search */}
      <div className="border-b border-zinc-300 p-2">
        <div className="relative">
          <svg className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search blocks…"
            className="w-full rounded-md border border-zinc-300 bg-zinc-50 py-1.5 pl-7 pr-3 text-xs placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Block grid */}
      <div className="max-h-72 overflow-y-auto p-2">
        {search.trim() ? (
          visibleBlocks.length === 0 ? (
            <p className="py-4 text-center text-xs text-zinc-400">No blocks found</p>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {visibleBlocks.map((def) => (
                <BlockTile key={def.name} def={def} onSelect={onSelect} />
              ))}
            </div>
          )
        ) : (
          groups?.map((group) => (
            <div key={group.id} className="mb-2 last:mb-0">
              <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{group.label}</p>
              <div className="grid grid-cols-3 gap-1">
                {group.blocks.map((def) => (
                  <BlockTile key={def.name} def={def} onSelect={onSelect} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function BlockTile({ def, onSelect }: { def: { name: string; label: string }; onSelect: (type: string) => void }) {
  const locale = useBlockLocale();
  const label = getBlockLabel(def, locale);
  return (
    <button
      onClick={() => onSelect(def.name)}
      className="flex flex-col items-center gap-1.5 rounded-md p-2 text-center transition hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-600">
        <BlockIcon name={def.name} label={label} size={20} />
      </span>
      <span className="w-full line-clamp-2 text-[11px] leading-tight text-zinc-700">{label}</span>
    </button>
  );
}

export function AddZone({
  onAdd,
  variant = "inline",
  isSelected = false,
  onOpenChange,
}: {
  onAdd: (type: string) => void;
  variant?: "inline" | "col-empty" | "col-last";
  isSelected?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  // Keep a ref to the trigger button so focus is restored when the picker closes.
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { onOpenChange?.(open); }, [open, onOpenChange]);

  const close = useCallback(() => {
    setOpen(false);
    // Return focus to the button that opened the picker.
    triggerRef.current?.focus();
  }, []);
  const select = useCallback((t: string) => { setOpen(false); onAdd(t); }, [onAdd]);
  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen((o) => !o);
  }, []);

  if (variant === "col-empty") {
    return (
      <div className="group relative flex h-full min-h-[60px] items-center justify-center">
        <button
          ref={triggerRef}
          onClick={toggle}
          aria-label="Add block"
          aria-expanded={open}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-400 bg-white text-zinc-500 text-sm leading-none opacity-0 group-hover:opacity-100 hover:border-blue-500 hover:text-blue-500 transition-all"
        >
          +
        </button>
        {open && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 z-30 mt-1">
            <BlockPicker onSelect={select} onClose={close} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`insert-zone${variant === "col-last" ? " insert-zone--col-last" : ""}${isSelected ? " insert-zone--selected" : ""}`}>
      <div className="insert-zone__line" />
      <button
        ref={triggerRef}
        onClick={toggle}
        aria-label="Add block"
        aria-expanded={open}
        className="insert-zone__btn"
      >
        +
      </button>
      {open && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30">
          <BlockPicker onSelect={select} onClose={close} />
        </div>
      )}
    </div>
  );
}
