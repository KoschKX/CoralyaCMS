# ─────────────────────────────────────────────────────────────────────────────
# install-strapi.sh — Sourced by setup.sh for the "strapi" backend
# Expects: TARGET, SCRIPT_DIR
# Sets:    CMS_ADMIN_URL
# ─────────────────────────────────────────────────────────────────────────────

# ── 1. Next.js ────────────────────────────────────────────────
echo "▶ Creating Next.js app..."
unzip -qo "$SCRIPT_DIR/setup/cache/next.zip" -d "$TARGET/next"
if [ ! -d "$TARGET/next/node_modules" ]; then
  echo "  node_modules not in zip — running npm install..."
  (cd "$TARGET/next" && npm install)
fi

# ── 2. Install Strapi ───────────────────────────────────
echo ""
echo "▶ Creating Strapi app..."
STRAPI_ZIP="$SCRIPT_DIR/setup/cache/strapi.zip"
mkdir -p "$TARGET/strapi"
unzip -qo "$STRAPI_ZIP" -d "$TARGET/strapi"
if [ ! -d "$TARGET/strapi/node_modules" ]; then
  echo "  node_modules not in zip — running npm install..."
  (cd "$TARGET/strapi" && npm install)
fi

# ── 3. Next.js component ───────────────────────────────
echo "▶ Creating CMS example component in Next.js..."
cat > "$TARGET/next/app/cms-example.tsx" << 'EOF'
"use client";

import { useEffect, useState } from "react";

export default function CmsExample() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:1337/api/pages?publicationState=live", {
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch from Strapi API");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="p-6 bg-white rounded shadow mt-8">
      <h2 className="text-xl font-bold mb-2">Strapi Pages</h2>
      {error && <div className="text-red-600">Error: {error}</div>}
      {!data && !error && <p className="text-zinc-400">Loading...</p>}
      {data?.data?.length === 0 && (
        <p className="text-zinc-500">
          No pages yet. Create one in Strapi at{" "}
          <a className="underline" href="http://localhost:1337/admin">
            localhost:1337/admin
          </a>.
        </p>
      )}
      {data?.data?.map((page: any) => (
        <div key={page.id} className="mb-4 border-b pb-4">
          <h3 className="text-lg font-semibold">
            {page.attributes?.title ?? page.title}
          </h3>
        </div>
      ))}
    </div>
  );
}
EOF

# ── 4. Homepage ────────────────────────────────────────
echo "▶ Updating Next.js homepage..."
cat > "$TARGET/next/app/page.tsx" << 'EOF'
import CmsExample from "./cms-example";

export default function Home() {
  return (
    <main className="min-h-screen max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">My Site</h1>
      <p className="text-zinc-500 mb-8">Powered by Next.js + Strapi</p>
      <CmsExample />
    </main>
  );
}
EOF

# ── 5. start.sh ────────────────────────────────────────
echo "▶ Creating start.sh..."
cat > "$TARGET/start.sh" << 'EOF'
#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "▶ Starting Strapi on http://localhost:1337 ..."
cd "$ROOT/strapi"
npm run develop &
BACKEND_PID=$!

echo "▶ Starting Next.js on http://localhost:3000 ..."
cd "$ROOT/next"
npm run dev &
NEXT_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Next.js  → http://localhost:3000"
echo "  Strapi   → http://localhost:1337/admin"
echo "  Press Ctrl+C to stop."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

trap "kill $BACKEND_PID $NEXT_PID 2>/dev/null; exit" INT TERM
wait $BACKEND_PID $NEXT_PID
EOF

CMS_ADMIN_URL="http://localhost:1337/admin"

# ── Done ──────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Setup complete!"
echo ""
echo "  To start:  bash $TARGET/start.sh"
echo ""
echo "  Next.js  → http://localhost:3000"
echo "  Strapi   → $CMS_ADMIN_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
