"use client";

import { useEffect, useRef, useState } from "react";
import { PanelSection } from "@/components/ui/PanelSection";
import { autoSlug } from "@/lib/utils/slug";
import type { Taxonomy } from "@/lib/types";

interface PostPanelProps {
  status: "draft" | "published";
  setStatus: (s: "draft" | "published") => void;
  slug: string;
  setSlug: (s: string) => void;
  excerpt: string;
  setExcerpt: (s: string) => void;
  selectedTags: string[];
  setSelectedTags: (ids: string[]) => void;
  selectedCategories: string[];
  setSelectedCategories: (ids: string[]) => void;
}

export default function PostPanel({
  status,
  setStatus,
  slug,
  setSlug,
  excerpt,
  setExcerpt,
  selectedTags,
  setSelectedTags,
  selectedCategories,
  setSelectedCategories,
}: PostPanelProps) {
  const [allTaxonomies, setAllTaxonomies] = useState<Taxonomy[]>([]);

  // Categories state
  const [catSearch, setCatSearch] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);

  // Tags state
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/taxonomies")
      .then((r) => r.json())
      .then((data: Taxonomy[]) => setAllTaxonomies(data))
      .catch(() => {});
  }, []);

  const allCategories = allTaxonomies.filter((t) => t.type === "category");
  const allTags = allTaxonomies.filter((t) => t.type === "tag");

  const filteredCategories = catSearch.trim()
    ? allCategories.filter((c) =>
        c.name.toLowerCase().includes(catSearch.toLowerCase()),
      )
    : allCategories;

  // ── Categories ────────────────────────────────────────────────────────────

  function toggleCategory(id: string) {
    setSelectedCategories(
      selectedCategories.includes(id)
        ? selectedCategories.filter((c) => c !== id)
        : [...selectedCategories, id],
    );
  }

  async function submitNewCategory() {
    const trimmed = newCatName.trim();
    if (!trimmed || addingCat) return;
    setAddingCat(true);
    try {
      const res = await fetch("/api/taxonomies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, slug: autoSlug(trimmed), type: "category" }),
      });
      if (!res.ok) return;
      const created: Taxonomy = await res.json();
      setAllTaxonomies((prev) => [...prev, created]);
      setSelectedCategories([...selectedCategories, created.id]);
      setNewCatName("");
      setShowAddCat(false);
    } finally {
      setAddingCat(false);
    }
  }

  // ── Tags ──────────────────────────────────────────────────────────────────

  function removeTag(id: string) {
    setSelectedTags(selectedTags.filter((t) => t !== id));
  }

  function addTagById(id: string) {
    if (!selectedTags.includes(id)) setSelectedTags([...selectedTags, id]);
  }

  async function commitTagInput() {
    const trimmed = tagInput.trim().replace(/,$/, "").trim();
    if (!trimmed) return;

    // Check if it already exists
    const existing = allTags.find(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) {
      addTagById(existing.id);
      setTagInput("");
      return;
    }

    // Create new
    const res = await fetch("/api/taxonomies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed, slug: autoSlug(trimmed), type: "tag" }),
    });
    if (!res.ok) return;
    const created: Taxonomy = await res.json();
    setAllTaxonomies((prev) => [...prev, created]);
    setSelectedTags([...selectedTags, created.id]);
    setTagInput("");
  }

  const unselectedTags = allTags.filter((t) => !selectedTags.includes(t.id));

  return (
    <>
      <PanelSection title="Status">
        <div className="flex gap-2">
          {(["draft", "published"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`flex-1 rounded-md border py-1.5 text-xs font-medium capitalize transition ${status === s ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 text-zinc-500 hover:border-zinc-400"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="URL Slug">
        <div className="flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1.5 focus-within:border-zinc-400">
          <span className="shrink-0 text-xs text-zinc-400">/posts/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(autoSlug(e.target.value))}
            placeholder="url-slug"
            className="min-w-0 flex-1 bg-transparent text-xs text-zinc-800 focus:outline-none"
          />
        </div>
      </PanelSection>

      <PanelSection title="Excerpt">
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Short summary shown in post lists…"
          rows={3}
          className="w-full resize-none rounded-md border border-zinc-300 px-2 py-1.5 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
        />
      </PanelSection>

      {/* ── Categories ──────────────────────────────────────────────────── */}
      <PanelSection title="Categories">
        {/* Search */}
        <input
          type="search"
          value={catSearch}
          onChange={(e) => setCatSearch(e.target.value)}
          placeholder="Search categories…"
          className="mb-2 w-full rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
        />

        {/* Scrollable list */}
        <div className="max-h-36 overflow-y-auto rounded-md border border-zinc-300 bg-zinc-50">
          {filteredCategories.length === 0 ? (
            <p className="px-3 py-2 text-xs text-zinc-400">
              {catSearch ? "No matches." : "No categories yet."}
            </p>
          ) : (
            <ul>
              {filteredCategories.map((cat) => (
                <li key={cat.id}>
                  <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-zinc-100">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="h-3.5 w-3.5 accent-zinc-900"
                    />
                    <span className="text-xs text-zinc-700">{cat.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add new */}
        <button
          onClick={() => setShowAddCat((v) => !v)}
          className="mt-2 text-xs font-medium text-zinc-500 hover:text-zinc-800"
        >
          {showAddCat ? "− Cancel" : "+ Add new category"}
        </button>
        {showAddCat && (
          <div className="mt-2 flex gap-1.5">
            <input
              autoFocus
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); void submitNewCategory(); }
              }}
              placeholder="Category name"
              className="flex-1 rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
            />
            <button
              onClick={() => void submitNewCategory()}
              disabled={addingCat || !newCatName.trim()}
              className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-40"
            >
              Add
            </button>
          </div>
        )}
      </PanelSection>

      {/* ── Tags ────────────────────────────────────────────────────────── */}
      <PanelSection title="Tags">
        {/* Selected tag chips */}
        {selectedTags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {selectedTags.map((tid) => {
              const tag = allTags.find((t) => t.id === tid);
              if (!tag) return null;
              return (
                <span
                  key={tid}
                  className="flex items-center gap-1 rounded-full bg-zinc-900 pl-2.5 pr-1 py-0.5 text-[11px] font-medium text-white"
                >
                  {tag.name}
                  <button
                    onClick={() => removeTag(tid)}
                    aria-label={`Remove tag ${tag.name}`}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-700 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Tag input */}
        <div className="flex gap-1.5">
          <input
            ref={tagInputRef}
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                void commitTagInput();
              }
            }}
            placeholder="Add tag… (Enter or ,)"
            className="flex-1 rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
          />
          <button
            onClick={() => void commitTagInput()}
            disabled={!tagInput.trim()}
            className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
          >
            Add
          </button>
        </div>

        {/* Unselected tag suggestions */}
        {unselectedTags.length > 0 && (
          <div className="mt-2">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              All tags
            </p>
            <div className="max-h-28 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {unselectedTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => addTagById(tag.id)}
                    className="rounded-full border border-zinc-300 px-2.5 py-0.5 text-[11px] text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </PanelSection>
    </>
  );
}

