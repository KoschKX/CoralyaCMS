# Project Analysis — `/3` (CoralyaCMS)

_Updated by GitHub Copilot (Claude Sonnet 4.6) · 2026-05-21 (rev 5)_

> **Revision notes (rev 5):** Ten items resolved: middleware rewritten to deny-by-default (recs 41 + 44), media upload now uses atomic temp+rename (rec 40), `alert-on-load.json` dev artifact cleared (rec 39), columns container metadata extracted to a shared export eliminating the duplication between `config.tsx` and `layout-registry.ts` (rec 42), and rate-limiter multi-instance caveat documented (rec 26). Four items that were already fixed in the codebase but carried as open are now formally closed: `npm audit` in `build.sh` (rec 16), legacy-token deprecation comment in `auth.ts` (rec 35), `unsafe-inline` CSP comment in `next.config.ts` (rec 37), and `blocksToHTML` JSDoc clarifying browser safety (rec 7). Remaining open items are all low-effort housekeeping or high-effort new features (CI/CD, docs).

---

## Detected Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router) |
| UI | React 19 |
| Language | TypeScript 5 (`strict: true`) |
| Styling | Tailwind CSS v4 + per-block CSS modules |
| State (editor) | Zustand 5 + Immer 11 |
| Validation | Zod v4 |
| Auth | HMAC-SHA256 sessions + scrypt passwords (Web Crypto / Node crypto) |
| Persistence | JSON flat-file (Node.js `fs`, atomic write pattern) |
| Code editor | PrismJS + `react-simple-code-editor` |
| Testing | Vitest 3 (node environment) |
| Build | Turbopack (dev) / Webpack (prod) via Next.js; `@svgr/webpack` for SVG |
| Linting | ESLint 9 flat config (next/core-web-vitals + typescript) |
| Formatting | Prettier |
| Scripts | Bash + .bat dual-platform wrappers |

---

## Project Structure (Actual)

```
/3
├── next/                          # Main Next.js application
│   ├── app/
│   │   ├── [slug]/page.tsx        # Public dynamic page rendering (ISR)
│   │   ├── posts/[slug]/page.tsx  # Blog post rendering
│   │   ├── posts/page.tsx         # Posts listing
│   │   ├── admin/                 # Admin UI (editor, settings, users, media)
│   │   │   └── editor/            # Visual block editor route
│   │   │       └── hooks/         # 8 editor-specific hooks
│   │   └── api/                   # REST API routes
│   ├── blocks/                    # 11 core block definitions
│   │   └── {type}/config.tsx|layout.tsx|editable.tsx|styles.css
│   ├── components/                # Shared React components
│   │   └── editor/                # Editor-specific subcomponents
│   ├── filters/                   # WordPress-style filter hooks (public API)
│   ├── hooks/                     # App-level hooks (useSettings)
│   ├── lib/                       # Server + shared business logic
│   │   ├── editor/                # Zustand store + context
│   │   └── utils/                 # json-store, write-queue, slug, paginate
│   ├── plugins/                   # Plugin system
│   │   └── alert-on-load/         # Example plugin
│   └── types/
│       └── globals.d.ts           # Global TypeScript declarations
├── data/                          # Root-level workspace defaults
├── next/data/                     # Runtime data (pages.json, users.json, …)
├── setup/                         # Install scripts for alternative stacks
├── - AI -/                        # AI prompt templates
├── - ARCHIVE -/                   # Backup zips
├── - JOBS -/                      # AI job definitions
└── backup.sh / build.sh / start.sh / start-prod.sh
```

---

## 1. Project Structure & Organization

**Strengths**

- Clear separation: `blocks/` for block definitions, `lib/` for server logic, `filters/` for plugin hooks, `components/` for UI.
- Each block follows a consistent `config / layout / editable / styles` pattern — easy to add new block types.
- `lib/types.ts` is a shared isomorphic type file with no runtime dependencies — correctly importable by both server and client.
- `lib/utils/` holds reusable primitives (json-store factory, write-queue, slug, paginate).
- `filters/index.ts` is a clean public API barrel — plugin authors never need to reach into internals.

**Issues / Recommendations**

1. ✅ _(rev 1)_ **`next/types/` was empty** — now contains `globals.d.ts`. No action needed.

2. **Two `data/` directories at different levels.** Root `/3/data/settings.json` appears to be a workspace-level default. Runtime data is in `next/data/`. Document this distinction in `README.md` or consolidate — the root `data/` folder currently serves no function at runtime and could mislead contributors.

3. ✅ _(rev 4)_ **Root-level `]` stray file** — deleted. No action needed.

4. **`- AI -/`, `- JOBS -/`, `- WORKSPACE -/` meta folders** sit alongside source code. Consider placing them in a top-level `._meta/` folder, or exclude them explicitly in `.gitignore`, to keep the project root clean for contributors.

5. **Proposed optimal layout** (minor restructure, no breaking changes):
   ```
   next/
   ├── app/          (routes — unchanged)
   ├── blocks/       (unchanged)
   ├── components/   (unchanged)
   ├── filters/      (unchanged)
   ├── hooks/        (unchanged)
   ├── lib/
   │   ├── types.ts
   │   ├── auth.ts
   │   ├── filters.ts
   │   ├── plugin-registry.ts
   │   ├── plugin-types.ts
   │   ├── block-types.ts
   │   ├── block-tree.ts
   │   ├── block-advanced-css.ts
   │   ├── blocks-to-html.ts
   │   ├── responsive-css.ts
   │   ├── shortcodes.ts
   │   ├── color-palette.ts
   │   ├── close-unclosed-tags.ts
   │   ├── editor-breakpoints.ts
   │   ├── api-schemas.ts
   │   ├── db/             ← move *-db.ts files here
   │   │   ├── pages.ts
   │   │   ├── posts.ts
   │   │   ├── settings.ts
   │   │   ├── taxonomies.ts
   │   │   └── users.ts
   │   ├── editor/         (unchanged)
   │   └── utils/          (unchanged)
   └── plugins/
   ```

---

## 2. Idiomatic Usage

**Strengths**

- Next.js App Router used correctly: async Server Components, `generateStaticParams`, ISR with `revalidate` + on-demand `revalidatePath`.
- `use client` boundaries are tight — editor state (Zustand) is client-only, server components stay pure.
- Zod v4 at every API boundary (`api-schemas.ts`) — proper input validation.
- Zustand + Immer for the block editor is idiomatic and produces minimal boilerplate.
- Web Crypto API used in `auth.ts` ensures edge-runtime compatibility.

**Issues / Recommendations**

6. ✅ _(rev 4)_ **`pages-db.ts` had its own inline `readAll`/`writeAll`** — now refactored to use `createJsonStore<Page>`, consistent with all other db modules. No action needed.

7. ✅ _(rev 5)_ **`blocksToHTML` uses `renderToStaticMarkup`** — the JSDoc explicitly notes "Safe to call from client components — react-dom/server works in the browser." No action needed.

8. ✅ _(rec 8, rev 1 — resolved)_ **Plugin filters on public pages** — `PluginPageInjections` imports `@/plugins/index` as a side effect and is rendered on every public page. Filters are active. No action needed.

   **New (related):** `PluginPageInjections` uses `dangerouslySetInnerHTML` to inject plugin-provided HTML. This is intentional for analytics/tracking scripts and safe for developer-installed plugins. Document this trust boundary in `plugin-types.ts` so future plugin authors are aware.

---

## 3. Code Quality

**Strengths**

- Consistent use of `const` assertions, interface-over-type for object shapes.
- Factory pattern (`createJsonStore`, `createWriteQueue`) eliminates duplication across db modules.
- Atomic write pattern (write to `.tmp` then `fs.renameSync`) prevents corrupt JSON on crash.
- `write-queue` mutex correctly serialises concurrent read-modify-write cycles.
- `BlockDefinition` interface is comprehensive: supports containers, breakpoints, panel controls, data migration, and custom shortcode serializers.
- Dead code is minimal; every utility has a clear, documented purpose.

**Issues / Recommendations**

9. ✅ _(rec 9, rev 1 — resolved)_ **Settings placeholders** — `next/data/settings.json` now has `siteUrl: ""` and `logoUrl: ""`. No action needed.

10. **`lib/auth.ts` custom `timingSafeEqual` pads strings before comparing.** The padding strategy is sound for equal-length comparison, but the XOR of lengths (`diff = a.length ^ b.length`) only flags differences when lengths differ — it does NOT prevent timing leaks between strings of the same length but different content (the loop itself does that). The implementation is correct; but consider adding a comment clarifying that the loop is the constant-time part, and the XOR is only a fallback for mismatched lengths.

11. ✅ _(rec 3, resolved in rev 4)_ **`]` stray file at root** — deleted. No action needed.

12. ✅ _(rev 4)_ **`package.json` name was `"next"`** — renamed to `"coralyacms"`. No action needed.

---

## 4. Dependencies & Build

**Strengths**

- Dependencies are lean (8 runtime deps, all well-maintained).
- Zod v4, React 19, Next.js 16.2, Zustand 5 — all current major versions.
- Turbopack for dev (`next dev --turbo`) with Webpack for production builds — standard practice.
- `@svgr/webpack` wired for both Turbopack and Webpack — correct dual config.

**Issues / Recommendations**

13. **No `package-lock.json` in `next/` is committed** (excluded in backup.sh). This is fine for local dev but means reproducible installs require it. Consider committing `package-lock.json` or using `npm ci` in the build script for deterministic builds.

14. ✅ _(rev 4)_ **Stale root `package-lock.json`** — deleted. No action needed.

15. **`next.config.ts` has both `turbopack.rules` and `webpack()` SVG config.** This duplication is unavoidable today but should be reviewed each Next.js release — the Turbopack config API is stabilising.

16. ✅ _(rev 5)_ **`build.sh` already runs `npm audit --audit-level=high`** before `next build`. No action needed.

---

## 5. Testing & CI/CD

**✅ Tests now exist** _(all of rec 17–19 from rev 1 were resolved)_

- `vitest.config.ts` is properly configured with `@/` alias mirroring tsconfig.
- `package.json` includes `"test": "vitest run"` and `"test:watch": "vitest"`.
- Test coverage spans the four highest-risk modules:

  | File | Covers |
  |---|---|
  | `lib/auth.test.ts` | `timingSafeEqual`, `createUserSession`/`verifyUserSession` (tamper, wrong secret, empty) |
  | `lib/block-tree.test.ts` | `findBlockById`, `deepUpdateBlock`, `insertBlockAfter`, `deepDeleteBlock`, `deepMoveBlock`, `isDescendant` |
  | `lib/shortcodes.test.ts` | `serializeAttr`, `blocksToShortcodes`, round-trip via `shortcodesToBlocks` |
  | `lib/utils/write-queue.test.ts` | Ordering, error recovery, async tasks |

**Remaining gaps:**

17. **No CI/CD configuration** (no `.github/workflows/`, no Dockerfile). Recommended minimum:
   ```yaml
   # .github/workflows/ci.yml
   steps:
     - run: npm ci
     - run: npm run lint
     - run: npm run test
     - run: npm run build
   ```

18. **No API route tests.** The REST layer (`/api/pages`, `/api/admin/login`, etc.) is untested. The login rate-limiting and credential-verification logic are worth covering with Vitest using Next.js route handler utilities.

19. **No end-to-end tests.** Playwright is the recommended choice for testing the full save/publish/render flow in a real browser.

---

## 6. Linting & Formatting

**Strengths**

- ESLint 9 flat config is modern and project-wide.
- Rules are well-chosen: `react-hooks/exhaustive-deps`, `no-console`, `eqeqeq`, `no-unreachable`, `@typescript-eslint/no-explicit-any` (warn).
- `@typescript-eslint/consistent-type-imports` enforces `import type` — reduces bundle risk.
- Prettier present.

**Issues / Recommendations**

20. ✅ _(rev 4)_ **Duplicate Prettier config files** — `.prettierrc` deleted; only `.prettierrc.json` remains. No action needed.

21. **No `lint-staged` + `husky` pre-commit hook.** Linting runs manually (`npm run lint`) but is not enforced on commit. Add:
   ```bash
   npm install --save-dev husky lint-staged
   npx husky init
   ```
   Then in `package.json`:
   ```json
   "lint-staged": {
     "next/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"]
   }
   ```

22. ✅ _(rev 4)_ **`eslint.config.mjs` was missing `"no-floating-promises": "error"` rule** — now added. No action needed.

---

## 7. Performance, Error Handling & Extensibility

**Strengths**

- ISR with `revalidate = 60` + on-demand `revalidatePath` on every write — pages are never stale for more than 60 s and update instantly after admin saves.
- `write-queue` prevents race conditions on concurrent API requests modifying the same JSON file.
- Zustand store uses narrow selectors (`useEditorStore(s => s.selectedBlockId === id)`) so only affected blocks re-render on selection change.
- `ErrorBoundary` wraps the visual editor.
- Block migration system (`version` field + `applyMigrations`) is forward-thinking.

**Issues / Recommendations**

23. ✅ _(rec 23, rev 2 — resolved)_ **`BlockItem` and `BlockList` are both wrapped with `React.memo`** and `BlockToolbar` is also memoized. Narrow Zustand selectors + memo together mean only the affected block re-renders on state changes. No action needed.

24. ✅ _(rev 4)_ **`createJsonStore.readAll` lacked error logging** — now logs `console.error` with filename and error details on parse failure. No action needed.

   **Note:** `pages-db.ts` has also been refactored to use this factory (see rec 6).

25. ✅ _(rec 25, rev 2 — resolved)_ **`closeUnclosedTags` is applied consistently.** It is called in both `blocks/html/layout.tsx` (server render) and `blocks/html/editable.tsx` (editor preview), so content always has balanced tags at both authoring and render time. No action needed.

26. ✅ _(rev 5)_ **In-memory rate limiter caveat documented.** `login/route.ts` now notes that state does not survive process restarts and is not shared across multiple instances, directing future maintainers toward a Redis-backed store for horizontal scaling. No further action needed.

27. ✅ _(rec 27, rev 2 — resolved)_ **`alert-on-load` ships disabled by default.** `data/plugin-settings/plugin-states.json` sets `"alert-on-load": false` out of the box. The plugin only injects if `message` is non-empty AND the plugin is enabled. No action needed.

   **New (rec 39):** `data/plugin-settings/alert-on-load.json` still contains a dev artifact message (`"message": "Test2Tes"`). If a developer enables the plugin without configuring it, this test string will appear on every public page. Clear it to `"message": ""` or document it as a required configuration step.

---

## 8. Frontend / CMS-Specific Patterns

**Strengths**

- Block architecture (config / layout / editable / styles) is clean and mirrors Gutenberg's separation of concerns.
- `BlockDefinition` interface handles: containers (nested blocks), responsive breakpoints, panel controls, custom shortcode serialisation, data migration, picker visibility.
- WordPress-style shortcode format for storage is human-readable and Git-diffable.
- Filter/hook system (`addFilter` / `applyFilters`) is a well-understood extension model.
- Plugin `adminPages` hook lets plugins add their own settings pages — extensible without core changes.

**Issues / Recommendations**

28. **Shortcode format is custom — no external parser/serialiser.** This is intentional and works well. Ensure `serializeAttr` and `decodeAttrValue` are thoroughly tested (see §5, rec 17), as an encoding bug would silently corrupt all stored content.

29. ✅ _(rec 29, rev 2 — resolved)_ **`blocks/layout-registry.ts` is a deliberate bundle-optimization layer.** It exports only `Layout` components (not `Editable` or `PanelControls`), keeping editor-only code out of the public page bundle. `BlockRenderer.tsx` imports from it directly. No action needed.

   **New (rec 42):** The `columns` entry in `layout-registry.ts` duplicates the `isContainer` flag and `getChildBlocks` function that are already defined in `blocks/columns/config.tsx`. A future change to the columns data shape requires updating both places. Consider deriving the public registry's container metadata from the main `blockMap` at startup so there is a single source of truth.

30. ✅ _(rec 30, rev 2 — resolved)_ **Both picker surfaces group blocks by category.** `BlocksPanel.tsx` groups using a `CATEGORIES` ordered list with an "Other" fallback, and `BlockPickerAndAddZone.tsx` uses the same pattern. The `block-picker.ts` filter is applied before grouping in both cases. No action needed.

---

## 9. Documentation

**Strengths**

- Inline JSDoc is thorough throughout `lib/`, `filters/`, and `blocks/`.
- `AGENTS.md` and `CLAUDE.md` in `next/` provide AI agent guidance.
- `filters/index.ts` doubles as a quick-reference for plugin authors.

**Issues / Recommendations**

31. **`README.md` exists but content was not verified during this analysis.** Ensure it covers: local dev setup (`./start.sh`), env var requirements (`SESSION_SECRET`, `ADMIN_PASSWORD`), production build/start (`./build.sh`, `./start-prod.sh`), and how to create a plugin.

32. **No API documentation.** The REST API (`/api/pages`, `/api/posts`, `/api/settings`, `/api/admin/users`, `/api/media`, `/api/taxonomies`, `/api/plugins/*`) has no docs. Consider an OpenAPI spec or at minimum a `docs/api.md` listing each endpoint, method, auth requirement, and request/response shape.

33. **No CHANGELOG or version history.** `package.json` version is `0.1.0` and there is no CHANGELOG. Add one when the project moves toward `1.0.0`.

---

## 10. Security

**Strengths**

- CSP headers in `next.config.ts` — production disables `unsafe-eval`, dev includes it only for HMR.
- CSRF protection via `Origin` header check on all mutation methods in middleware — correct approach.
- Rate limiting on login endpoint (10 attempts / 60 s per IP).
- scrypt (N=32768) for password hashing — strong KDF, appropriate parameters.
- `timingSafeEqual` used for both session token comparison and password verification.
- HTTP-only session cookies (HMAC-signed, 7-day TTL).
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy` headers all set.
- Zod validation on every API input, including regex guards on slugs and CSS color values.
- `randomUUID()` from `crypto` for all entity IDs.

**Issues / Recommendations**

34. ✅ _(rec 34, rev 1 — resolved)_ **`SESSION_SECRET` production guard** — `getSecret()` now throws in production when the default value is detected. No action needed.

35. ✅ _(rev 5)_ **Legacy session token path is documented as deprecated** in `auth.ts` JSDoc: "DEPRECATED: This path has no `iat` claim... It will be removed in a future version. Users should log out and back in to receive the new signed-payload token format." No further action needed.

36. ✅ _(rec 36, rev 2 — resolved)_ **`app/api/media/route.ts` is now fully reviewed and well-secured.** The endpoint implements: MIME type allowlist, extension allowlist, 10 MB size cap, magic-bytes validation for all supported types (including a text-scan path for SVG), SVG sanitization (strips `<script>` tags and inline event handlers), and filename sanitization (strips path separators and non-alphanumeric chars). No critical issues found.

   **New (rec 40):** Unlike all other write operations in the codebase (pages, posts, settings, users — all use `.tmp` + `fs.renameSync`), the media upload uses `fs.writeFileSync(dest, finalBuffer)` directly. A process crash mid-write could leave a partially-written file at its final public path. Apply the same atomic temp+rename pattern for consistency:
   ```ts
   const tmp = dest + ".tmp";
   fs.writeFileSync(tmp, finalBuffer);
   fs.renameSync(tmp, dest);
   ```

37. ✅ _(rev 5)_ **`unsafe-inline` for `style-src` is documented** in `next.config.ts`: `// unsafe-inline needed for Tailwind/inline styles`. No further action needed.

38. ✅ _(rev 4)_ **`package.json` had no `engines` field** — now set to `{ "node": ">=20.0.0" }`. No action needed.

---

## New Findings (rev 3)

**39.** ✅ _(rev 5)_ **`alert-on-load.json` dev artifact cleared** — `message` reset to `""`. No action needed.

**40.** ✅ _(rev 5)_ **Media upload now uses atomic temp+rename.** `app/api/media/route.ts` writes to `dest + ".tmp"` then calls `fs.renameSync`, consistent with all other write paths. No action needed.

**41.** ✅ _(rev 5)_ **Middleware rewritten to deny-by-default.** `matcher` is now `["/admin/:path*", "/api/:path*"]`. Any new route is protected automatically; only the existing early-return block handles the login/logout public exceptions. No action needed.

**42.** ✅ _(rev 5)_ **Columns container metadata is now a single source of truth.** `columnsIsContainer` and `columnsGetChildBlocks` are exported from `blocks/columns/layout.tsx` and imported by both `layout-registry.ts` and `config.tsx`. No action needed.

**43.** ✅ _(rev 4)_ **`tsconfig.json` target was `"ES2017"`** — upgraded to `"ES2022"`. `Object.hasOwn`, `Array.at()`, and `structuredClone` type support are now available; optional chaining emits smaller output. No action needed.

---

## New Findings (rev 4)

**44.** ✅ _(rev 5)_ **`/api/posts` and `/api/taxonomies` are now protected.** The deny-by-default middleware rewrite (rec 41) covers all `/api/:path*` routes, including posts and taxonomies. No action needed.

---

## Summary & Priority Matrix

| # | Area | Status | Priority | Effort |
|---|---|---|---|---|
| ✅ 17–19 (rev 1) | Tests (auth, block-tree, shortcodes, write-queue) + `vitest.config.ts` | Resolved | — | — |
| ✅ 8 (rev 1) | Plugin filters active on public pages | Resolved | — | — |
| ✅ 34 (rev 1) | SESSION_SECRET throws in production | Resolved | — | — |
| ✅ 9 (rev 1) | Settings placeholder values cleared | Resolved | — | — |
| ✅ 36 (rev 2) | Media upload endpoint audited — magic bytes, SVG sanitization, allowlists | Resolved | — | — |
| ✅ 23 (rev 2) | `BlockItem` / `BlockList` / `BlockToolbar` wrapped with `React.memo` | Resolved | — | — |
| ✅ 27 (rev 2) | `alert-on-load` ships disabled by default | Resolved | — | — |
| ✅ 29 (rev 2) | `layout-registry.ts` confirmed: intentional bundle-optimization | Resolved | — | — |
| ✅ 30 (rev 2) | Block picker groups by category (both surfaces) | Resolved | — | — |
| ✅ 25 (rev 2) | `closeUnclosedTags` applied in both render and editor paths | Resolved | — | — |
| ✅ 3 (rev 4) | Stray `]` file at root — deleted | Resolved | — | — |
| ✅ 6 (rev 4) | `pages-db.ts` refactored to use `createJsonStore` | Resolved | — | — |
| ✅ 12 (rev 4) | `package.json` name changed from `"next"` to `"coralyacms"` | Resolved | — | — |
| ✅ 14 (rev 4) | Stale root `package-lock.json` deleted | Resolved | — | — |
| ✅ 38 (rev 4) | `engines` field added to `package.json` | Resolved | — | — |
| ✅ 20 (rev 4) | Duplicate `.prettierrc` deleted | Resolved | — | — |
| ✅ 22 (rev 4) | `no-floating-promises: "error"` added to ESLint config | Resolved | — | — |
| ✅ 24 (rev 4) | Error logging added to `createJsonStore.readAll` | Resolved | — | — |
| ✅ 43 (rev 4) | `tsconfig.json` target upgraded ES2017 → ES2022 | Resolved | — | — |
| ✅ 44 + 41 (rev 5) | Middleware rewritten to deny-by-default — all `/api/*` routes protected | Resolved | — | — |
| ✅ 40 (rev 5) | Media upload: atomic temp+rename implemented | Resolved | — | — |
| ✅ 39 (rev 5) | `alert-on-load.json` dev artifact cleared | Resolved | — | — |
| ✅ 42 (rev 5) | Columns container metadata extracted — single source of truth | Resolved | — | — |
| ✅ 26 (rev 5) | Rate limiter multi-instance caveat documented | Resolved | — | — |
| ✅ 16 (rev 5) | `npm audit` already in `build.sh` — formally closed | Resolved | — | — |
| ✅ 35 (rev 5) | Legacy token deprecation already in `auth.ts` JSDoc — formally closed | Resolved | — | — |
| ✅ 37 (rev 5) | `unsafe-inline` CSP already commented in `next.config.ts` — formally closed | Resolved | — | — |
| ✅ 7 (rev 5) | `blocksToHTML` JSDoc confirms browser safety — formally closed | Resolved | — | — |
| 17–19 | Add CI/CD, API route tests, e2e tests | Open | 🟠 High | High |
| 21 | Add `husky` + `lint-staged` pre-commit hooks | Open | 🟢 Low | Low |
| 31–33 | Improve README, add API docs, add CHANGELOG | Open | 🟢 Low | Medium |
| 2 | Document / consolidate the two `data/` directories | Open | 🟢 Low | Low |
| 10 | Add clarity comment to `timingSafeEqual` (XOR vs loop roles) | Open | 🟢 Low | Trivial |

---

_Updated by GitHub Copilot (Claude Sonnet 4.6) · 2026-05-21 (rev 5)_
