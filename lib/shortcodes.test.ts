import { describe, it, expect, vi } from "vitest";

// Mock block registry so shortcodes.ts can be imported without React block configs.
// Include every block type used in tests — the parser silently drops tokens for
// unregistered types, so each test type needs a minimal entry.
vi.mock("@/lib/plugin-registry", () => ({
  blockMap: {
    paragraph: { name: "paragraph" },
    header:    { name: "header" },
    image:     { name: "image" },
    columns: {
      name: "columns",
      isContainer: true,
      getChildBlocks: (data: Record<string, unknown>) => {
        const cols = data.cols as Array<{ blocks: unknown[] }> | undefined;
        return cols?.map((c) => c.blocks) ?? [];
      },
      setChildBlocks: (data: Record<string, unknown>, arrays: unknown[][]) => ({
        ...data,
        cols: arrays.map((blocks, i) => ({
          ...(data.cols as Array<Record<string, unknown>>)?.[i],
          blocks,
        })),
      }),
    },
  },
}));

// @/blocks/index re-exports blockMap — return the same minimal map
vi.mock("@/blocks/index", () => ({
  blockMap: {
    paragraph: { name: "paragraph" },
    header:    { name: "header" },
    image:     { name: "image" },
    columns:   { name: "columns", isContainer: true },
  },
  blockRegistry: [],
  registerBlock: vi.fn(),
  unregisterBlock: vi.fn(),
  registerIcon: vi.fn(),
  getPluginIcon: vi.fn(),
}));

import {
  serializeAttr,
  blocksToShortcodes,
  shortcodesToBlocks,
} from "@/lib/shortcodes";
import type { EditorBlock } from "@/lib/types";

// ── serializeAttr ─────────────────────────────────────────────────────────────

describe("serializeAttr", () => {
  it("serializes a plain string value with double quotes", () => {
    expect(serializeAttr("key", "value")).toBe('key="value"');
  });

  it("escapes double quotes inside string values", () => {
    expect(serializeAttr("key", 'say "hi"')).toBe('key="say &quot;hi&quot;"');
  });

  it("escapes bracket characters inside string values", () => {
    expect(serializeAttr("key", "[nested]")).toBe('key="&#91;nested&#93;"');
  });

  it("serializes a number with double quotes", () => {
    expect(serializeAttr("level", 2)).toBe('level="2"');
  });

  it("serializes a boolean with double quotes", () => {
    expect(serializeAttr("active", true)).toBe('active="true"');
  });

  it("serializes an array as single-quoted JSON", () => {
    const result = serializeAttr("items", ["a", "b"]);
    expect(result).toMatch(/^items='/);
    expect(result).toContain('"a"');
    expect(result).toContain('"b"');
  });

  it("serializes an object as single-quoted JSON", () => {
    const result = serializeAttr("data", { x: 1 });
    expect(result).toMatch(/^data='/);
    expect(result).toContain('"x"');
  });
});

// ── Round-trip: blocksToShortcodes → shortcodesToBlocks ───────────────────────

describe("shortcode round-trip", () => {
  function roundTrip(blocks: EditorBlock[]): EditorBlock[] {
    return shortcodesToBlocks(blocksToShortcodes(blocks));
  }

  it("preserves a single paragraph block", () => {
    const blocks: EditorBlock[] = [
      { id: "1", type: "paragraph", data: { text: "Hello world" } },
    ];
    const result = roundTrip(blocks);
    expect(result[0].type).toBe("paragraph");
    expect(result[0].data.text).toBe("Hello world");
  });

  it("preserves multiple blocks in order", () => {
    const blocks: EditorBlock[] = [
      { id: "1", type: "paragraph", data: { text: "First" } },
      { id: "2", type: "header", data: { text: "Title", level: 2 } },
      { id: "3", type: "paragraph", data: { text: "Second" } },
    ];
    const result = roundTrip(blocks);
    expect(result.map((b) => b.type)).toEqual(["paragraph", "header", "paragraph"]);
    expect(result[1].data.level).toBe(2);
  });

  it("preserves string data with special characters", () => {
    const blocks: EditorBlock[] = [
      { id: "1", type: "paragraph", data: { text: 'He said "hello" and [waved]' } },
    ];
    const result = roundTrip(blocks);
    expect(result[0].data.text).toBe('He said "hello" and [waved]');
  });

  it("preserves numeric and boolean data values", () => {
    const blocks: EditorBlock[] = [
      { id: "1", type: "header", data: { text: "Title", level: 3, bold: true } },
    ];
    const result = roundTrip(blocks);
    expect(result[0].data.level).toBe(3);
    expect(result[0].data.bold).toBe(true);
  });

  it("preserves object data values (JSON round-trip)", () => {
    const blocks: EditorBlock[] = [
      { id: "1", type: "image", data: { src: "/img.png", attrs: { width: 800, height: 600 } } },
    ];
    const result = roundTrip(blocks);
    expect(result[0].data.attrs).toEqual({ width: 800, height: 600 });
  });

  it("returns an empty array for empty input", () => {
    expect(roundTrip([])).toEqual([]);
  });

  it("produces a non-empty shortcode string for a non-empty block list", () => {
    const blocks: EditorBlock[] = [
      { id: "1", type: "paragraph", data: { text: "hello" } },
    ];
    const sc = blocksToShortcodes(blocks);
    expect(sc.trim().length).toBeGreaterThan(0);
    expect(sc).toContain("[paragraph");
  });
});
