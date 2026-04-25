import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
export type { EditorBlock, Post } from "@/lib/types";
import type { Post } from "@/lib/types";
import { applyMigrations } from "@/lib/block-tree";
import { createWriteQueue } from "@/lib/utils/write-queue";

const DATA_FILE = path.join(process.cwd(), "data", "posts.json");

let postsCache: Post[] | null = null;

const serialise = createWriteQueue();

function readAll(): Post[] {
  if (postsCache !== null) return postsCache;
  if (!fs.existsSync(DATA_FILE)) return (postsCache = []);
  try {
    postsCache = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as Post[];
    return postsCache;
  } catch {
    return (postsCache = []);
  }
}

function writeAll(posts: Post[]): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(posts, null, 2));
  fs.renameSync(tmp, DATA_FILE);
  postsCache = posts;
}

export function listPosts(): Post[] {
  return readAll();
}

export type PostMeta = Pick<
  Post,
  "id" | "title" | "slug" | "status" | "excerpt" | "tags" | "categories" | "createdAt" | "updatedAt"
>;

export function listPostsMeta(): PostMeta[] {
  return readAll().map(
    ({ id, title, slug, status, excerpt, tags, categories, createdAt, updatedAt }) => ({
      id,
      title,
      slug,
      status,
      excerpt,
      tags: tags ?? [],
      categories: categories ?? [],
      createdAt,
      updatedAt,
    }),
  );
}

export function getPost(id: string): Post | null {
  const post = readAll().find((p) => p.id === id) ?? null;
  if (!post) return null;
  return { ...post, blocks: applyMigrations(post.blocks) };
}

export function getPostBySlug(slug: string): Post | null {
  const post = readAll().find((p) => p.slug === slug) ?? null;
  if (!post) return null;
  return { ...post, blocks: applyMigrations(post.blocks) };
}

export function createPost(data: Partial<Post>): Promise<Post> {
  return serialise(() => {
    const posts = readAll();
    const now = new Date().toISOString();
    const post: Post = {
      id: randomUUID(),
      title: data.title ?? "Untitled",
      slug: data.slug ?? "",
      status: data.status ?? "draft",
      blocks: data.blocks ?? [],
      html: data.html ?? "",
      excerpt: data.excerpt ?? "",
      tags: data.tags ?? [],
      categories: data.categories ?? [],
      injectCode: data.injectCode,
      createdAt: now,
      updatedAt: now,
    };
    posts.push(post);
    writeAll(posts);
    return post;
  });
}

export function updatePost(id: string, data: Partial<Post>): Promise<Post | null> {
  return serialise(() => {
    const posts = readAll();
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    posts[idx] = {
      ...posts[idx],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    writeAll(posts);
    return posts[idx];
  });
}

export function deletePost(id: string): Promise<boolean> {
  return serialise(() => {
    const posts = readAll();
    const filtered = posts.filter((p) => p.id !== id);
    if (filtered.length === posts.length) return false;
    writeAll(filtered);
    return true;
  });
}
