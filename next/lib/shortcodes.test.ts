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

  it("preserves camelCase attribute key names through the round-trip", () => {
    // Regression: the parser previously lowercased all attribute keys, turning
    // camelCase fields like bgColor → bgcolor and customNetworks → customnetworks,
    // which caused block data to be silently dropped on every page reload.
    const blocks: EditorBlock[] = [
      {
        id: "1",
        type: "image",
        data: {
          bgColor: "#ff0000",
          iconSize: "20px",
          iconsBoxed: true,
          customNetworks: [{ id: "custom_1", label: "Test", color: "#555" }],
        },
      },
    ];
    const result = roundTrip(blocks);
    expect(result[0].data.bgColor).toBe("#ff0000");
    expect(result[0].data.iconSize).toBe("20px");
    expect(result[0].data.iconsBoxed).toBe(true);
    expect(result[0].data.customNetworks).toEqual([{ id: "custom_1", label: "Test", color: "#555" }]);
    // Lowercase variants must NOT exist
    expect(result[0].data.bgcolor).toBeUndefined();
    expect(result[0].data.iconsize).toBeUndefined();
    expect(result[0].data.iconsboxed).toBeUndefined();
    expect(result[0].data.customnetworks).toBeUndefined();
  });

  it("drops stale lowercase duplicate keys when serialising", () => {
    // Regression: blocks loaded from an old page had both customnetworks (stale lowercase)
    // and customNetworks (correct camelCase) in their data.  The serialiser must emit only
    // the camelCase key so the shortcode stays clean after every save.
    const blocks: EditorBlock[] = [
      {
        id: "1",
        type: "image",
        data: {
          customnetworks: [{ id: "stale", label: "Stale", color: "#000" }], // stale
          customNetworks: [{ id: "custom_1", label: "Good", color: "#fff" }], // correct
          iconsboxed: false, // stale
          iconsBoxed: true,  // correct
        },
      },
    ];
    const shortcode = blocksToShortcodes(blocks);
    // camelCase versions must appear
    expect(shortcode).toContain("customNetworks=");
    expect(shortcode).toContain("iconsBoxed=");
    // lowercase duplicates must NOT appear
    expect(shortcode).not.toContain("customnetworks=");
    expect(shortcode).not.toContain("iconsboxed=");
    // After a round-trip only the camelCase data survives
    const result = roundTrip(blocks);
    expect(result[0].data.customNetworks).toEqual([{ id: "custom_1", label: "Good", color: "#fff" }]);
    expect(result[0].data.customnetworks).toBeUndefined();
    expect(result[0].data.iconsBoxed).toBe(true);
    expect(result[0].data.iconsboxed).toBeUndefined();
  });
});
