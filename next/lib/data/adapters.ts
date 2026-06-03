/**
 * Concrete Repository implementations for the JSON flat-file data layer.
 *
 * These classes implement the Repository / SlugRepository interfaces from
 * `@/lib/data/repository` and delegate to the existing db module functions.
 * Consumer code that imports from here can be migrated to a different backend
 * by replacing the adapter with a new implementation — zero changes in callers.
 *
 * NOTE: This file is server-only. Never import it from client components.
 */

import type { Repository, SlugRepository } from "@/lib/data/repository";
import type { Page, Post } from "@/lib/types";
import type { Taxonomy } from "@/lib/taxonomies-db";
import {
  listPages, getPage, createPage, updatePage, deletePage,
} from "@/lib/pages-db";
import {
  listPosts, getPost, getPostBySlug, createPost, updatePost, deletePost,
} from "@/lib/posts-db";
import {
  listTaxonomies, getTaxonomy, createTaxonomy, updateTaxonomy, deleteTaxonomy,
} from "@/lib/taxonomies-db";

// ── Page repository ──────────────────────────────────────────────────────────

class PageRepositoryImpl implements SlugRepository<Page> {
  findAll() { return listPages(); }
  findById(id: string) { return getPage(id); }
  findBySlug(slug: string) {
    // pages-db does not expose getPageBySlug; fall back to linear search.
    return listPages().find((p) => p.slug === slug) ?? null;
  }
  create(data: Partial<Page>) { return createPage(data); }
  update(id: string, data: Partial<Page>) { return updatePage(id, data); }
  delete(id: string) { return deletePage(id); }
}

// ── Post repository ──────────────────────────────────────────────────────────

class PostRepositoryImpl implements SlugRepository<Post> {
  findAll() { return listPosts(); }
  findById(id: string) { return getPost(id); }
  findBySlug(slug: string) { return getPostBySlug(slug); }
  create(data: Partial<Post>) { return createPost(data); }
  update(id: string, data: Partial<Post>) { return updatePost(id, data); }
  delete(id: string) { return deletePost(id); }
}

// ── Taxonomy repository ───────────────────────────────────────────────────────

class TaxonomyRepositoryImpl implements Repository<Taxonomy> {
  findAll() { return listTaxonomies(); }
  findById(id: string) { return getTaxonomy(id); }
  create(data: Partial<Taxonomy>) {
    return createTaxonomy(data as Parameters<typeof createTaxonomy>[0]);
  }
  update(id: string, data: Partial<Taxonomy>) { return updateTaxonomy(id, data); }
  delete(id: string) { return deleteTaxonomy(id); }
}

// ── Singleton exports ─────────────────────────────────────────────────────────

/** Singleton page repository. Use this in server components and API routes. */
export const pageRepository: SlugRepository<Page> = new PageRepositoryImpl();

/** Singleton post repository. Use this in server components and API routes. */
export const postRepository: SlugRepository<Post> = new PostRepositoryImpl();

/** Singleton taxonomy repository. Use this in server components and API routes. */
export const taxonomyRepository: Repository<Taxonomy> = new TaxonomyRepositoryImpl();
