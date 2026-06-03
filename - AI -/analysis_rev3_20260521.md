# Project Analysis — `/3` (CoralyaCMS)

_Updated by GitHub Copilot (Claude Sonnet 4.6) · 2026-05-21 (rev 3)_

> **Revision notes (rev 3):** Six open items from rev 2 are now resolved: the media upload endpoint is fully audited and secured (rec 36), `BlockItem`/`BlockList` are memoized (rec 23), `alert-on-load` ships disabled by default (rec 27), `layout-registry.ts` is confirmed as an intentional bundle-optimization pattern (rec 29), the block picker groups by category in both picker surfaces (rec 30), and `closeUnclosedTags` is applied consistently in both render and editor paths (rec 25). Five new findings added (recs 39–43). All remaining open items carry forward.

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

3. **Root-level `]` file** is a stray artifact (likely from a shell glob accident). Delete it: `rm "/Volumes/Workspace/Programming/- SERVER -/public/3/]"`.

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

6. **`pages-db.ts` has its own inline `readAll`/`writeAll`** instead of using the shared `createJsonStore` factory that `users-db.ts` and others use. This is an inconsistency — the factory was created to eliminate exactly this pattern. Refactor `pages-db.ts` to use `createJsonStore<Page>`.

7. **`blocksToHTML` (`lib/blocks-to-html.ts`) calls `renderToStaticMarkup` which works in the browser but is unusual.** If this is ever called from a client component, it pulls `react-dom/server` into the client bundle. Verify call sites. If it's only called server-side (e.g. when building page HTML for storage), add a `"use server"` guard or move calls behind a server-only import.

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

11. **`]` stray file at root** (noted in §1 / rec 3 above) — likely a shell glob expansion artifact.

12. **`package.json` name is `"next"`** — this collides with the `next` npm package name and could cause issues if this package were ever published or if tooling parses the name. Rename to `"coralyacms"` or similar.

---

## 4. Dependencies & Build

**Strengths**

- Dependencies are lean (8 runtime deps, all well-maintained).
- Zod v4, React 19, Next.js 16.2, Zustand 5 — all current major versions.
- Turbopack for dev (`next dev --turbo`) with Webpack for production builds — standard practice.
- `@svgr/webpack` wired for both Turbopack and Webpack — correct dual config.

**Issues / Recommendations**

13. **No `package-lock.json` in `next/` is committed** (excluded in backup.sh). This is fine for local dev but means reproducible installs require it. Consider committing `package-lock.json` or using `npm ci` in the build script for deterministic builds.

14. **`package-lock.json` at root `/3/package-lock.json`** exists (shown in ls) but the root has no `package.json` — this is a stale artifact. Delete it.

15. **`next.config.ts` has both `turbopack.rules` and `webpack()` SVG config.** This duplication is unavoidable today but should be reviewed each Next.js release — the Turbopack config API is stabilising.

16. **No `npm audit` step in `build.sh`.** Add `npm audit --audit-level=high` before `next build` to catch high/critical CVEs at build time.

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

20. **Duplicate Prettier config files**: both `.prettierrc` and `.prettierrc.json` exist. Prettier uses the first config it finds; having two causes ambiguity. Remove one. Keep `.prettierrc.json` (machine-parseable, IDE-friendly).

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

22. **`eslint.config.mjs` missing `"no-floating-promises": "error"` rule.** Async operations on the data layer (e.g. `createPage`, `updatePage`) return Promises. Unhandled rejections are silent bugs. Add:
   ```js
   "@typescript-eslint/no-floating-promises": "error"
   ```

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

24. **`createJsonStore.readAll` lacks error logging.** It silently returns `[]` on parse failure (`catch { return []; }`). A corrupted `posts.json` would silently return an empty list, making it appear there are no posts. Add `console.error` in the catch block (the same pattern used in `pages-db.ts` for its inline `readAll`).

   **Note:** `pages-db.ts` itself still has inline `readAll`/`writeAll` instead of using this factory (see rec 6).

25. ✅ _(rec 25, rev 2 — resolved)_ **`closeUnclosedTags` is applied consistently.** It is called in both `blocks/html/layout.tsx` (server render) and `blocks/html/editable.tsx` (editor preview), so content always has balanced tags at both authoring and render time. No action needed.

26. **The in-memory `rateLimitMap` in `login/route.ts` does not survive process restarts and is not shared across multiple Node.js instances.** This is fine for a single-process deployment. Document this limitation — if the app is ever scaled horizontally, a Redis-backed rate limiter is required.

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

35. **Legacy single-admin session tokens** (no `.` separator) are accepted indefinitely via `getSessionToken()`. This means if `ADMIN_PASSWORD` is ever changed, the old cookie is immediately invalidated (good), but there is no expiry on legacy tokens themselves (they don't include an `iat`). Document that the legacy path will be removed in a future version and encourage users to log out and back in to receive the new token format.

36. ✅ _(rec 36, rev 2 — resolved)_ **`app/api/media/route.ts` is now fully reviewed and well-secured.** The endpoint implements: MIME type allowlist, extension allowlist, 10 MB size cap, magic-bytes validation for all supported types (including a text-scan path for SVG), SVG sanitization (strips `<script>` tags and inline event handlers), and filename sanitization (strips path separators and non-alphanumeric chars). No critical issues found.

   **New (rec 40):** Unlike all other write operations in the codebase (pages, posts, settings, users — all use `.tmp` + `fs.renameSync`), the media upload uses `fs.writeFileSync(dest, finalBuffer)` directly. A process crash mid-write could leave a partially-written file at its final public path. Apply the same atomic temp+rename pattern for consistency:
   ```ts
   const tmp = dest + ".tmp";
   fs.writeFileSync(tmp, finalBuffer);
   fs.renameSync(tmp, dest);
   ```

37. **`unsafe-inline` for `style-src`** is required by Tailwind CSS v4 (which injects `<style>` tags). This is an accepted trade-off, but document it as a known CSP exception.

38. **`package.json` has no `engines` field.** Specify the minimum Node.js version to prevent deployments on incompatible runtimes:
   ```json
   "engines": { "node": ">=20.0.0" }
   ```

---

## New Findings (rev 3)

**39.** See rec 27 above — `alert-on-load.json` dev artifact message.

**40.** See rec 36 above — media upload lacks atomic temp+rename.

**41. `middleware.ts` matcher is an opt-in allowlist — a security maintenance hazard.** New protected API routes added under `/api/` must also be added to the `matcher` array or they bypass authentication silently. The current approach lists specific paths (`/api/pages/:path*`, `/api/settings/:path*`, etc.). If a developer adds `/api/reports` but forgets to add it to `matcher`, it is publicly accessible. Consider a deny-by-default strategy: match `/api/:path*` and `/admin/:path*` broadly, then whitelist truly public routes (`/api/admin/login`, `/api/admin/logout`) inside the middleware function itself. This inverts the failure mode — a forgotten addition defaults to protected rather than unprotected.

**42.** See rec 29 above — `layout-registry.ts` columns container metadata duplication.

**43. `tsconfig.json` target is `"ES2017"`.** Next.js handles transpilation for deployment targets independently of this setting, but the `target` controls which TypeScript features are available in type-checking and what the emitted JavaScript looks like when run directly (e.g. in Vitest). All currently supported Node.js versions and browsers have full ES2022 support. Upgrading enables `Object.hasOwn`, `Array.at()`, `structuredClone` type support, and smaller output for optional chaining:
   ```json
   "target": "ES2022"
   ```

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
| **41** | Middleware matcher is opt-in allowlist — new API routes default unprotected | Open | 🟠 High | Low |
| 17–19 | Add CI/CD, API route tests, e2e tests | Open | 🟠 High | High |
| **40** | Media upload: add atomic temp+rename (consistency with all other writes) | Open | 🟡 Medium | Low |
| 5 / 6 | Refactor `pages-db.ts` to use `createJsonStore` | Open | 🟡 Medium | Low |
| 12 | Rename `package.json` name from `"next"` | Open | 🟡 Medium | Low |
| 24 | Add error logging to `createJsonStore.readAll` | Open | 🟡 Medium | Low |
| 20 | Remove duplicate Prettier config (`.prettierrc` vs `.prettierrc.json`) | Open | 🟡 Medium | Trivial |
| 22 | Add `@typescript-eslint/no-floating-promises` ESLint rule | Open | 🟡 Medium | Low |
| 35 | Document / deprecate legacy session tokens | Open | 🟡 Medium | Low |
| **42** | `layout-registry.ts` columns container metadata duplicates `blockMap` | Open | 🟡 Medium | Low |
| **39** | Clear dev artifact message from `alert-on-load.json` | Open | 🟡 Medium | Trivial |
| 14 | Delete stale root `package-lock.json` | Open | 🟢 Low | Trivial |
| 3 | Delete stray `]` file | Open | 🟢 Low | Trivial |
| **43** / 10 | Upgrade `tsconfig.json` target from ES2017 → ES2022 | Open | 🟢 Low | Low |
| 15 | Add `engines` field to `package.json` | Open | 🟢 Low | Trivial |
| 16 | Add `npm audit` to `build.sh` | Open | 🟢 Low | Low |
| 21 | Add `husky` + `lint-staged` | Open | 🟢 Low | Low |
| 31–33 | Improve README, add API docs, add CHANGELOG | Open | 🟢 Low | Medium |

---

_Updated by GitHub Copilot (Claude Sonnet 4.6) · 2026-05-21 (rev 3)_
