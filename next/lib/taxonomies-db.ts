import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createWriteQueue } from "@/lib/utils/write-queue";
import type { Taxonomy } from "@/lib/types";

export type { Taxonomy } from "@/lib/types";

const DATA_FILE = path.join(process.cwd(), "data", "taxonomies.json");

let cache: Taxonomy[] | null = null;
const serialise = createWriteQueue();

function readAll(): Taxonomy[] {
  if (cache !== null) return cache;
  if (!fs.existsSync(DATA_FILE)) return (cache = []);
  try {
    cache = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as Taxonomy[];
    return cache;
  } catch {
    return (cache = []);
  }
}

function writeAll(items: Taxonomy[]): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(items, null, 2));
  fs.renameSync(tmp, DATA_FILE);
  cache = items;
}

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
