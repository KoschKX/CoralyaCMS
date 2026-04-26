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
  let cache: T[] | null = null;

  function readAll(): T[] {
    if (cache !== null) return cache;
    if (!fs.existsSync(filePath)) return (cache = []);
    try {
      cache = JSON.parse(fs.readFileSync(filePath, "utf-8")) as T[];
      return cache;
    } catch {
      return (cache = []);
    }
  }

  function writeAll(items: T[]): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tmp = filePath + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(items, null, 2));
    fs.renameSync(tmp, filePath);
    cache = items;
  }

  /** Force the next readAll() to re-read from disk. */
  function invalidate(): void {
    cache = null;
  }

  return { readAll, writeAll, invalidate };
}
