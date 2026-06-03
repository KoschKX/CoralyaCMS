/**
 * Repository pattern interfaces for the data layer.
 *
 * These interfaces describe what each data store must support, independent
 * of the storage backend (JSON flat-files today, DB tomorrow). Any consumer
 * should depend on these types rather than the concrete db module so the
 * storage implementation can be swapped without touching application code.
 *
 * Usage:
 *   import type { ContentRepository } from "@/lib/data/repository";
 *   function myService(repo: ContentRepository<Page>) { ... }
 */

// ── Generic CRUD interface ───────────────────────────────────────────────────

export interface Repository<T> {
  /** Return all items in the collection. */
  findAll(): T[];
  /** Return a single item by id, or null if not found. */
  findById(id: string): T | null;
  /** Create a new item; returns the persisted item with generated id + timestamps. */
  create(data: Partial<T>): Promise<T>;
  /** Update an existing item; returns the updated item or null if not found. */
  update(id: string, data: Partial<T>): Promise<T | null>;
  /** Delete an item by id; returns true if it existed. */
  delete(id: string): Promise<boolean>;
}

// ── Domain-specific extensions ───────────────────────────────────────────────

export interface SlugRepository<T> extends Repository<T> {
  /** Look up an item by its URL slug. */
  findBySlug(slug: string): T | null;
}

/** Minimal list projection — only metadata, never full block trees. */
export type MetaOnly<T, K extends keyof T> = Pick<T, K>;
