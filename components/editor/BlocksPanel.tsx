"use client";

import { useState, useContext, useMemo, useCallback, useRef, useEffect } from "react";
import { blockRegistry } from "@/blocks/index";
import { applyBlockPickerBlocks } from "@/filters/block-picker";
import { BlockEditorContext } from "@/components/editor/BlockEditorContext";
import { BlockIcon } from "@/components/BlockIcon";

// ── Category definitions (Gutenberg-style ordering) ────────────────────────────
const CATEGORIES: { id: string; label: string; icon: React.ReactNode }[] = [
  {
    id: "text",
    label: "Text",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>
      </svg>
    ),
  },
  {
    id: "media",
    label: "Media",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="14" rx="2"/><path d="m10 8 5 3-5 3V8Z" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    id: "design",
    label: "Design",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="8" height="18" rx="1"/><rect x="13" y="3" width="8" height="18" rx="1"/>
      </svg>
    ),
  },
  {
    id: "data",
    label: "Data",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
      </svg>
    ),
  },
  {
    id: "code",
    label: "Code",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>
      </svg>
    ),
  },
];

// Blocks without a category fall into "other"
const UNCATEGORIZED = { id: "other", label: "Other", icon: (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/>
  </svg>
)};

interface BlocksPanelProps {
  onAdd: (type: string) => void;
}

export function BlocksPanel({ onAdd }: BlocksPanelProps) {
  const ctx = useContext(BlockEditorContext);
  const disabledBlocks = ctx?.disabledBlocks ?? [];

  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const searchRef = useRef<HTMLInputElement>(null);

  // Apply the same filter as the popup picker
  const visibleBlocks = useMemo(() => {
    const filtered = applyBlockPickerBlocks(blockRegistry);
    return disabledBlocks.length
      ? filtered.filter((def) => !disabledBlocks.includes(def.name))
      : filtered;
  }, [disabledBlocks]);

  // When searching, show flat filtered list; otherwise group by category
  const query = search.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!query) return null;
    return visibleBlocks.filter(
      (def) =>
        def.label.toLowerCase().includes(query) ||
        def.name.toLowerCase().includes(query),
    );
  }, [query, visibleBlocks]);

  // Group blocks by category
  const grouped = useMemo(() => {
    const knownIds = new Set(CATEGORIES.map((c) => c.id));
    const map = new Map<string, typeof visibleBlocks>();
    for (const def of visibleBlocks) {
      const cat = def.category && knownIds.has(def.category) ? def.category : "other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(def);
    }
    // Build ordered list — known categories first, then "other"
    const result: Array<{ id: string; label: string; icon: React.ReactNode; blocks: typeof visibleBlocks }> = [];
    for (const cat of CATEGORIES) {
      const blocks = map.get(cat.id);
      if (blocks?.length) result.push({ ...cat, blocks });
    }
    const other = map.get("other");
    if (other?.length) result.push({ ...UNCATEGORIZED, blocks: other });
    return result;
  }, [visibleBlocks]);

  const toggleCategory = useCallback((id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Focus search on Ctrl+F / Cmd+F inside the panel
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        if (document.activeElement === searchRef.current) return;
        // Only intercept if focus is within the panel — handled via blur naturally
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center border-b border-zinc-200 px-3 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Blocks</span>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-zinc-100">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400"
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={searchRef}
            type="search"
            placeholder="Search blocks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 py-1.5 pl-7 pr-3 text-xs placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Block list */}
      <div className="flex-1 overflow-y-auto">
        {searchResults !== null ? (
          // Flat search results
          <div className="p-2">
            {searchResults.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-zinc-400">No blocks match &ldquo;{search}&rdquo;</p>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {searchResults.map((def) => (
                  <BlockTile key={def.name} def={def} onAdd={onAdd} />
                ))}
              </div>
            )}
          </div>
        ) : (
          // Categorized grid view
          <div className="p-2">
            {grouped.map((cat) => (
              <div key={cat.id} className="mb-3 last:mb-0">
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="mb-1.5 flex w-full items-center gap-1.5 px-1 text-left"
                  aria-expanded={!collapsed[cat.id]}
                >
                  <span className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{cat.label}</span>
                  <svg
                    className={`shrink-0 text-zinc-300 transition-transform ${collapsed[cat.id] ? "-rotate-90" : ""}`}
                    width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </button>

                {/* Category blocks */}
                {!collapsed[cat.id] && (
                  <div className="grid grid-cols-3 gap-1">
                    {cat.blocks.map((def) => (
                      <BlockTile key={def.name} def={def} onAdd={onAdd} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BlockTile({
  def,
  onAdd,
}: {
  def: (typeof blockRegistry)[number];
  onAdd: (type: string) => void;
}) {
  return (
    <button
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/x-coralya-block", def.name);
        e.dataTransfer.effectAllowed = "copy";
      }}
      onClick={() => onAdd(def.name)}
      className="flex flex-col items-center gap-1.5 rounded-md p-2 text-center transition hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 cursor-grab active:cursor-grabbing"
      title={`Insert ${def.label}`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600">
        <BlockIcon name={def.name} label={def.label} size={20} />
      </span>
      <span className="w-full line-clamp-2 text-[11px] leading-tight text-zinc-700">{def.label}</span>
    </button>
  );
}
