/**
 * JSON file store factory
 * ────────────────────────
 * Provides a cache + atomic-write pattern for a single JSON array file.
 * Used by all *-db modules to avoid duplicating the same read/write boilerplate.
 *
 * Usage:
 *   const { readAll, writeAll } = createJsonStore<Post>("/absolute/path/posts.json");
 */

import fs from "fs";
import path from "path";

export function createJsonStore<T>(filePath: string) {
  // No in-memory cache: Next.js/Turbopack runs API routes and page renderers
  // in separate worker contexts that each have their own module instance.
  // A module-level cache in one worker is invisible to the other, so writes
  // from the API worker would never be seen by the page-render worker.
  // Always reading from disk is correct and fast enough for small JSON files.

  function readAll(): T[] {
    if (!fs.existsSync(filePath)) return [];
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T[];
    } catch {
      return [];
    }
  }

  function writeAll(items: T[]): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tmp = filePath + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(items, null, 2));
    fs.renameSync(tmp, filePath);
  }

  /** No-op: kept for API compatibility. */
  function invalidate(): void {}

  return { readAll, writeAll, invalidate };
}
