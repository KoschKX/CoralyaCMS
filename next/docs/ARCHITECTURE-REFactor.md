# CoralyaCMS Next.js Refactor Notes

This document captures a scalable architecture target and the first refactor slice implemented in this pass.

## Proposed Scalable Structure

```txt
next/
  app/
    (public)/
      [slug]/page.tsx
      posts/[slug]/page.tsx
    admin/
      editor/
      settings/
      media/
    api/
      pages/
      posts/
      settings/
      taxonomies/
      admin/
  components/
    ui/                    # generic design-system components
    editor/                # editor-only composition + interactions
    renderers/             # public render pipeline (html/block)
  blocks/
    core/
      paragraph/
      header/
      columns/
      ...
    plugin/
  lib/
    api/                   # request/response helpers and route-level utils
    editor/                # store, selection, history, tree operations
    data/                  # persistence adapters + repositories
    blocks/                # block registry, schemas, serializers
    plugins/               # plugin runtime and registry
    validation/            # zod schemas
    utils/
  hooks/
  docs/
```

## Refactor Implemented

### 1) Editor state/render coupling reduced

- Removed fast-changing selection fields from BlockEditorContext.
- Block items now read selection and active column state directly from the Zustand store.
- Result: less context churn and cleaner responsibility split.

Touched files:
- components/VisualEditor.tsx
- components/editor/BlockEditorContext.tsx
- components/editor/BlockItem.tsx

### 2) No-op block updates no longer pollute history

- Added shallow equality guard in the editor store update path.
- If incoming block data is unchanged, the store skips publish/history write.
- Result: less unnecessary serialization, fewer re-renders, cleaner undo stack.

Touched file:
- lib/editor/store.ts

### 3) API routes normalized via shared boundary utilities

- Added lib/api/route-utils.ts with reusable JSON parsing + Zod parsing helpers.
- Refactored page, post, taxonomy, and settings routes to use shared helpers.
- Result: consistent API error responses, less duplicated route code, easier to extend.

Touched files:
- lib/api/route-utils.ts
- app/api/pages/route.ts
- app/api/pages/[id]/route.ts
- app/api/posts/route.ts
- app/api/posts/[id]/route.ts
- app/api/taxonomies/route.ts
- app/api/taxonomies/[id]/route.ts
- app/api/settings/route.ts

## Next Suggested Refactor Slices

1. Move block registry and layout registry to generated modules from blocks/core and blocks/plugin sources.
2. Add selector-based editor hooks (useIsBlockSelected, useActiveColumnForBlock) for even narrower subscriptions.
3. Introduce repository interfaces under lib/data with swap-in storage (JSON file now, DB later).
4. Add virtualization strategy for very large block trees.
5. Split editor page orchestration into feature modules under app/admin/editor/features.
