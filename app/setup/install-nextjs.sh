# ─────────────────────────────────────────────────────────────────────────────
# install-nextjs.sh — Sourced by setup.sh for the "nextjs" (standalone) backend
# Expects: TARGET, SCRIPT_DIR
# ─────────────────────────────────────────────────────────────────────────────

# ── 1. Next.js ────────────────────────────────────────────────
echo "▶ Creating Next.js app..."
unzip -qo "$SCRIPT_DIR/setup/cache/next.zip" -d "$TARGET/next"
if [ ! -d "$TARGET/next/node_modules" ]; then
  echo "  node_modules not in zip — running npm install..."
  (cd "$TARGET/next" && npm install)
fi

# ── 2. Homepage ───────────────────────────────────────────────
echo "▶ Updating Next.js homepage..."
cat > "$TARGET/next/app/page.tsx" << 'EOF'
export default function Home() {
  return (
    <main className="min-h-screen max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">My Site</h1>
      <p className="text-zinc-500">Powered by Next.js</p>
    </main>
  );
}
EOF

# ── 3. start.sh ───────────────────────────────────────────────
echo "▶ Creating start.sh..."
cat > "$TARGET/start.sh" << 'EOF'
#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"

# Free port 3000 if something else is holding it
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "  ⚠ Port 3000 in use — killing existing process..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  sleep 1
fi

echo "▶ Starting Next.js on http://localhost:3000 ..."
cd "$ROOT/next"
npm run dev &
NEXT_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Next.js  → http://localhost:3000"
echo "  Press Ctrl+C to stop."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

trap "kill $NEXT_PID 2>/dev/null; exit" INT TERM
wait $NEXT_PID
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Next.js install complete"
echo ""
echo "  To start:  bash $TARGET/start.sh"
echo "  Dev URL:   http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
