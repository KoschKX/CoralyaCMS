import path from "path";
import { randomUUID } from "crypto";
import { createWriteQueue } from "@/lib/utils/write-queue";
import { createJsonStore } from "@/lib/utils/json-store";
import type { Taxonomy } from "@/lib/types";

export type { Taxonomy } from "@/lib/types";

const DATA_FILE = path.join(process.cwd(), "data", "taxonomies.json");

const { readAll, writeAll } = createJsonStore<Taxonomy>(DATA_FILE);
const serialise = createWriteQueue();

export function listTaxonomies(): Taxonomy[] {
  return readAll();
}

export function listTags(): Taxonomy[] {
  return readAll().filter((t) => t.type === "tag");
}

export function listCategories(): Taxonomy[] {
  return readAll().filter((t) => t.type === "category");
}

export function getTaxonomy(id: string): Taxonomy | null {
  return readAll().find((t) => t.id === id) ?? null;
}

export function createTaxonomy(data: {
  name: string;
  slug: string;
  type: "tag" | "category";
}): Promise<Taxonomy> {
  return serialise(() => {
    const items = readAll();
    const item: Taxonomy = { id: randomUUID(), ...data };
    items.push(item);
    writeAll(items);
    return item;
  });
}

export function updateTaxonomy(
  id: string,
  data: Partial<Pick<Taxonomy, "name" | "slug">>,
): Promise<Taxonomy | null> {
  return serialise(() => {
    const items = readAll();
    const idx = items.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...data };
    writeAll(items);
    return items[idx];
  });
}

export function deleteTaxonomy(id: string): Promise<boolean> {
  return serialise(() => {
    const items = readAll();
    const filtered = items.filter((t) => t.id !== id);
    if (filtered.length === items.length) return false;
    writeAll(filtered);
    return true;
  });
}
