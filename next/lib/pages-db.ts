import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DATA_FILE = path.join(process.cwd(), "data", "pages.json");

export type PageStatus = "draft" | "published";

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
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as Page[];
  } catch {
    return [];
  }
}

function writeAll(pages: Page[]): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(pages, null, 2));
}

export function listPages(): Page[] {
  return readAll();
}

export function getPage(id: string): Page | null {
  return readAll().find((p) => p.id === id) ?? null;
}

export function createPage(data: Partial<Page>): Page {
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
}

export function updatePage(id: string, data: Partial<Page>): Page | null {
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
}

export function deletePage(id: string): boolean {
  const pages = readAll();
  const filtered = pages.filter((p) => p.id !== id);
  if (filtered.length === pages.length) return false;
  writeAll(filtered);
  return true;
}
