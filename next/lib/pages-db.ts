import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DATA_FILE = path.join(process.cwd(), "data", "pages.json");

export type PageStatus = "draft" | "published";

/** Module-level cache — invalidated on every write so reads are always consistent. */
let pagesCache: Page[] | null = null;

/**
 * Write-queue mutex: all mutating operations are chained through this promise
 * so that concurrent API requests cannot interleave their read-modify-write cycles.
 */
let writeQueue: Promise<unknown> = Promise.resolve();

function serialise<T>(fn: () => T): Promise<T> {
  const p = writeQueue.then(fn);
  // Keep the queue advancing even if fn throws, so it never gets stuck.
  writeQueue = p.then(
    () => undefined,
    () => undefined,
  );
  return p;
}

export interface EditorBlock {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  status: PageStatus;
  blocks: EditorBlock[];
  /** Rendered HTML string — source of truth for the live site front end.
   *  Generated from blocks on every save, or edited directly via the HTML code view. */
  html?: string;
  /** Optional background color for the page. */
  pageBgColor?: string;
  createdAt: string;
  updatedAt: string;
}

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

export function getPage(id: string): Page | null {
  return readAll().find((p) => p.id === id) ?? null;
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

