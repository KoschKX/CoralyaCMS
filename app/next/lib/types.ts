/**
 * Shared types for the CoralyaCMS block editor.
 *
 * This file is safe to import in both server (Node.js) and client (browser)
 * environments. It contains only TypeScript interfaces — no runtime code.
 *
 * Server-only modules (pages-db, settings-db, auth) import from here so that
 * client components can import these types without pulling in Node.js-only modules.
 */

// ── Block types ───────────────────────────────────────────────────────────────

export interface EditorBlock {
  id: string;
  type: string;
  data: Record<string, unknown>;
  /** Schema version of the block data. Increment the matching BlockDefinition.version when the data shape changes. */
  version?: number;
}

// ── Page types ────────────────────────────────────────────────────────────────

export type PageStatus = "draft" | "published";

/** Per-page code injection slots (tracking scripts, <head> additions, etc.). */
export interface InjectCode {
  tracking?: string;
  head?: string;
  beforeBody?: string;
  afterBody?: string;
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
  /** Per-page code injection (tracking, head, body snippets). */
  injectCode?: InjectCode;
  createdAt: string;
  updatedAt: string;
}

// ── Taxonomy types ────────────────────────────────────────────────────────────

export interface Taxonomy {
  id: string;
  name: string;
  slug: string;
  type: "tag" | "category";
}

// ── Post types ────────────────────────────────────────────────────────────────

export interface Post {
  id: string;
  title: string;
  slug: string;
  status: PageStatus;
  blocks: EditorBlock[];
  html?: string;
  excerpt?: string;
  /** Tag IDs */
  tags: string[];
  /** Category IDs */
  categories: string[];
  injectCode?: InjectCode;
  createdAt: string;
  updatedAt: string;
}

// ── Editor types ──────────────────────────────────────────────────────────────

/** Represents the currently selected block in the editor panel. */
export interface SelectedBlock {
  id: string;
  name: string;
  data: Record<string, unknown>;
}
