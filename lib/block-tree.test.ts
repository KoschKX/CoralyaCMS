import { describe, it, expect, vi } from "vitest";

// Mock the block registry so block-tree.ts can be imported without pulling in
// React-dependent block configs. Container detection falls back to false for all
// block types, which is correct for the non-container blocks tested here.
vi.mock("@/blocks/index", () => ({
  blockMap: {},
  blockRegistry: [],
  registerBlock: vi.fn(),
  unregisterBlock: vi.fn(),
  registerIcon: vi.fn(),
  getPluginIcon: vi.fn(),
}));

import {
  findBlockById,
  deepUpdateBlock,
  insertBlockAfter,
  deepInsertBlockAfter,
  deepDeleteBlock,
  deepMoveBlock,
  isDescendant,
} from "@/lib/block-tree";
import type { EditorBlock } from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function block(id: string, type = "paragraph"): EditorBlock {
  return { id, type, data: { text: `Block ${id}` } };
}

// ── findBlockById ─────────────────────────────────────────────────────────────

describe("findBlockById", () => {
  it("finds a top-level block", () => {
    const blocks = [block("a"), block("b"), block("c")];
    expect(findBlockById(blocks, "b")).toEqual(blocks[1]);
  });

  it("returns undefined when not found", () => {
    expect(findBlockById([block("a"), block("b")], "z")).toBeUndefined();
  });

  it("returns undefined for an empty list", () => {
    expect(findBlockById([], "a")).toBeUndefined();
  });
});

// ── deepUpdateBlock ───────────────────────────────────────────────────────────

describe("deepUpdateBlock", () => {
  it("updates the matching block's data", () => {
    const blocks = [block("a"), block("b")];
    const result = deepUpdateBlock(blocks, "b", { text: "updated" });
    expect(result[1].data).toEqual({ text: "updated" });
  });

  it("does not mutate the original array or block", () => {
    const original = [block("a")];
    const result = deepUpdateBlock(original, "a", { text: "new" });
    expect(original[0].data).toEqual({ text: "Block a" });
    expect(result[0].data).toEqual({ text: "new" });
  });

  it("leaves unmatched blocks unchanged", () => {
    const blocks = [block("a"), block("b")];
    const result = deepUpdateBlock(blocks, "a", { text: "changed" });
    expect(result[1]).toEqual(blocks[1]);
  });

  it("is a no-op when the id is not found", () => {
    const blocks = [block("a")];
    const result = deepUpdateBlock(blocks, "z", { text: "x" });
    expect(result[0]).toEqual(blocks[0]);
    expect(result).toHaveLength(1);
  });
});

// ── insertBlockAfter ──────────────────────────────────────────────────────────

describe("insertBlockAfter", () => {
  it('inserts at the start when afterId is "TOP"', () => {
    const blocks = [block("b"), block("c")];
    const result = insertBlockAfter(blocks, "TOP", block("a"));
    expect(result.map((b) => b.id)).toEqual(["a", "b", "c"]);
  });

  it("inserts immediately after the named block", () => {
    const blocks = [block("a"), block("c")];
    const result = insertBlockAfter(blocks, "a", block("b"));
    expect(result.map((b) => b.id)).toEqual(["a", "b", "c"]);
  });

  it("inserts at the end when afterId is the last block", () => {
    const blocks = [block("a"), block("b")];
    const result = insertBlockAfter(blocks, "b", block("c"));
    expect(result.map((b) => b.id)).toEqual(["a", "b", "c"]);
  });
});

// ── deepInsertBlockAfter ──────────────────────────────────────────────────────

describe("deepInsertBlockAfter", () => {
  it('inserts at the start when afterId is "TOP"', () => {
    const blocks = [block("b")];
    const result = deepInsertBlockAfter(blocks, "TOP", block("a"));
    expect(result.map((b) => b.id)).toEqual(["a", "b"]);
  });

  it("inserts after a top-level block", () => {
    const blocks = [block("a"), block("c")];
    const result = deepInsertBlockAfter(blocks, "a", block("b"));
    expect(result.map((b) => b.id)).toEqual(["a", "b", "c"]);
  });
});

// ── deepDeleteBlock ───────────────────────────────────────────────────────────

describe("deepDeleteBlock", () => {
  it("removes a top-level block by id", () => {
    const blocks = [block("a"), block("b"), block("c")];
    const result = deepDeleteBlock(blocks, "b");
    expect(result.map((b) => b.id)).toEqual(["a", "c"]);
  });

  it("is a no-op when the id is not found", () => {
    const blocks = [block("a"), block("b")];
    const result = deepDeleteBlock(blocks, "z");
    expect(result).toHaveLength(2);
  });

  it("can delete the only block", () => {
    const result = deepDeleteBlock([block("a")], "a");
    expect(result).toEqual([]);
  });
});

// ── deepMoveBlock ─────────────────────────────────────────────────────────────

describe("deepMoveBlock", () => {
  it("moves a block up (-1)", () => {
    const blocks = [block("a"), block("b"), block("c")];
    const result = deepMoveBlock(blocks, "b", -1);
    expect(result.map((b) => b.id)).toEqual(["b", "a", "c"]);
  });

  it("moves a block down (+1)", () => {
    const blocks = [block("a"), block("b"), block("c")];
    const result = deepMoveBlock(blocks, "b", 1);
    expect(result.map((b) => b.id)).toEqual(["a", "c", "b"]);
  });

  it("is a no-op when already at the start and moving up", () => {
    const blocks = [block("a"), block("b")];
    const result = deepMoveBlock(blocks, "a", -1);
    expect(result.map((b) => b.id)).toEqual(["a", "b"]);
  });

  it("is a no-op when already at the end and moving down", () => {
    const blocks = [block("a"), block("b")];
    const result = deepMoveBlock(blocks, "b", 1);
    expect(result.map((b) => b.id)).toEqual(["a", "b"]);
  });
});

// ── isDescendant ──────────────────────────────────────────────────────────────

describe("isDescendant", () => {
  it("returns false for non-container blocks (no children)", () => {
    expect(isDescendant(block("a"), "child")).toBe(false);
  });

  it("returns false when checking a block against itself", () => {
    expect(isDescendant(block("a"), "a")).toBe(false);
  });
});
