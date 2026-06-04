/**
 * Zod schemas for API request body validation.
 * Import these in API route handlers to parse + validate input at the boundary.
 */

import { z } from "zod";

// ── Shared primitives ─────────────────────────────────────────────────────────

const EditorBlockSchema: z.ZodType<{ id: string; type: string; data: Record<string, unknown> }> = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
});

const slugSchema = z
  .string()
  .max(500)
  .regex(/^[a-z0-9-]*$/, "slug must be lowercase alphanumeric and hyphens only")
  .optional();

const titleSchema = z.string().max(500).optional();

// ── Pages ─────────────────────────────────────────────────────────────────────

const cssColorSchema = z
  .string()
  .max(50)
  .regex(
    /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]{1,50}\)|hsla?\([^)]{1,50}\)|[a-zA-Z]{2,30})?$/,
    "pageBgColor must be a valid CSS color",
  );

const InjectCodeSchema = z.object({
  tracking:   z.string().optional(),
  head:       z.string().optional(),
  beforeBody: z.string().optional(),
  afterBody:  z.string().optional(),
});

const PageTranslationSchema = z.object({
  title: z.string().max(500).optional(),
  blocks: z.array(EditorBlockSchema).optional().default([]),
  html: z.string().optional(),
});

export const CreatePageSchema = z.object({
  title: titleSchema,
  slug: slugSchema,
  status: z.enum(["draft", "published"]).optional(),
  blocks: z.array(EditorBlockSchema).optional(),
  html: z.string().optional(),
  pageBgColor: cssColorSchema.optional(),
  injectCode: InjectCodeSchema.optional(),
  translations: z.record(z.string().min(2).max(10), PageTranslationSchema).optional(),
});

export const UpdatePageSchema = CreatePageSchema;

// ── Posts ─────────────────────────────────────────────────────────────────────

export const CreatePostSchema = z.object({
  title: titleSchema,
  slug: slugSchema,
  status: z.enum(["draft", "published"]).optional(),
  blocks: z.array(EditorBlockSchema).optional(),
  html: z.string().optional(),
  excerpt: z.string().max(2000).optional(),
  tags: z.array(z.string().uuid()).optional(),
  categories: z.array(z.string().uuid()).optional(),
  injectCode: InjectCodeSchema.optional(),
});

export const UpdatePostSchema = CreatePostSchema;

// ── Taxonomies ────────────────────────────────────────────────────────────────

export const CreateTaxonomySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().max(200).regex(/^[a-z0-9-]*$/, "slug must be lowercase alphanumeric and hyphens only"),
  type: z.enum(["tag", "category"]),
});

export const UpdateTaxonomySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().max(200).regex(/^[a-z0-9-]*$/, "slug must be lowercase alphanumeric and hyphens only").optional(),
});

// ── Settings ─────────────────────────────────────────────────────────────────

const PaletteColorSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const HeadingStyleSchema = z.object({
  size: z.string(),
  weight: z.string(),
  lineHeight: z.string(),
});

const TypographySchema = z.object({
  fontSizes: z.object({
    sm: z.string(),
    base: z.string(),
    lg: z.string(),
    xl: z.string(),
  }),
  headings: z.object({
    h1: HeadingStyleSchema,
    h2: HeadingStyleSchema,
    h3: HeadingStyleSchema,
    h4: HeadingStyleSchema,
  }),
});

const LayoutSchema = z.object({
  contentMaxWidth: z.string(),
  contentPaddingX: z.string(),
  blockSpacing: z.string(),
  breakpoints: z.object({
    mobile: z.string(),
    tablet: z.string(),
    desktop: z.string(),
  }),
});

export const UpdateSettingsSchema = z.object({
  title: z.string().max(500).optional(),
  tagline: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  siteUrl: z.string().url().max(500).optional().or(z.literal("")),
  logoUrl: z.string().url().max(500).optional().or(z.literal("")),
  instagramAccessToken: z.string().max(500).optional(),
  flickrApiKey: z.string().max(500).optional(),
  disabledBlocks: z.array(z.string()).optional(),
  paletteColors: z.array(PaletteColorSchema).optional(),
  typography: TypographySchema.optional(),
  layout: LayoutSchema.optional(),
  languages: z.array(z.string().min(2).max(10)).min(1).optional(),
  allowedMimeTypes: z.array(z.string().max(100)).optional(),
});

// ── Auth ──────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  username: z.string().min(1, "username is required"),
  password: z.string().min(1, "password is required"),
});

// ── Users ─────────────────────────────────────────────────────────────────────

export const CreateUserSchema = z.object({
  username: z
    .string()
    .min(1, "username is required")
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, "username must be alphanumeric, hyphens, or underscores"),
  displayName: z.string().max(100).optional(),
  email: z.string().email("must be a valid email").max(200).optional().or(z.literal("")),
  password: z.string().min(6, "password must be at least 6 characters"),
  role: z.enum(["administrator", "editor", "author"]),
});

export const UpdateUserSchema = z.object({
  displayName: z.string().max(100).optional(),
  email: z.string().email("must be a valid email").max(200).optional().or(z.literal("")),
  password: z.string().min(6, "password must be at least 6 characters").optional().or(z.literal("")),
  role: z.enum(["administrator", "editor", "author"]).optional(),
});
