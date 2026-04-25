import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
// Re-export shared types so existing imports of EditorBlock / Page from this
// module continue to work without changes.
export type { EditorBlock, Page, PageStatus } from "@/lib/types";
import type { EditorBlock, Page } from "@/lib/types";
import { applyMigrations } from "@/lib/block-tree";
import { createWriteQueue } from "@/lib/utils/write-queue";

const DATA_FILE = path.join(process.cwd(), "data", "pages.json");

/** Module-level cache — invalidated on every write so reads are always consistent. */
let pagesCache: Page[] | null = null;

/**
 * Write-queue mutex: all mutating operations are serialised so concurrent API
 * requests cannot interleave their read-modify-write cycles.
 */
const serialise = createWriteQueue();

function readAll(): Page[] {
  if (pagesCache !== null) return pagesCache;
  if (!fs.existsSync(DATA_FILE)) return (pagesCache = []);
  try {
    pagesCache = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as Page[];
    return pagesCache;
  } catch {
    return (pagesCache = []);
  }
}

function writeAll(pages: Page[]): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  // Write to a temp file then rename for atomic replacement
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(pages, null, 2));
  fs.renameSync(tmp, DATA_FILE);
  pagesCache = pages;
}

export function listPages(): Page[] {
  return readAll();
}

/** Returns only the metadata fields needed for list views — never includes blocks or html. */
export type PageMeta = Pick<Page, "id" | "title" | "slug" | "status" | "pageBgColor" | "createdAt" | "updatedAt">;

export function listPagesMeta(): PageMeta[] {
  return readAll().map(({ id, title, slug, status, pageBgColor, createdAt, updatedAt }) => ({
    id, title, slug, status: status as Page["status"], pageBgColor, createdAt, updatedAt,
  }));
}

export function getPage(id: string): Page | null {
  const page = readAll().find((p) => p.id === id) ?? null;
  if (!page) return null;
  // Apply any pending block data migrations before returning the page.
  return { ...page, blocks: applyMigrations(page.blocks) };
}

export function createPage(data: Partial<Page>): Promise<Page> {
  return serialise(() => {
    const pages = readAll();
    const now = new Date().toISOString();
    const page: Page = {
      id: randomUUID(),
      title: data.title ?? "Untitled",
      slug: data.slug ?? "",
      status: data.status ?? "draft",
      blocks: data.blocks ?? [],
      html: data.html ?? "",
      pageBgColor: data.pageBgColor ?? "#ffffff",
      createdAt: now,
      updatedAt: now,
    };
    pages.push(page);
    writeAll(pages);
    return page;
  });
}

export function updatePage(id: string, data: Partial<Page>): Promise<Page | null> {
  return serialise(() => {
    const pages = readAll();
    const idx = pages.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    pages[idx] = {
      ...pages[idx],
      ...data,
      pageBgColor: data.pageBgColor ?? pages[idx].pageBgColor ?? "#ffffff",
      id,
      updatedAt: new Date().toISOString(),
    };
    writeAll(pages);
    return pages[idx];
  });
}

export function deletePage(id: string): Promise<boolean> {
  return serialise(() => {
    const pages = readAll();
    const filtered = pages.filter((p) => p.id !== id);
    if (filtered.length === pages.length) return false;
    writeAll(filtered);
    return true;
  });
}

