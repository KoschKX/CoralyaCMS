# ─────────────────────────────────────────────────────────────────────────────
# install-payload-website.sh — Sourced by setup.sh for the "payload-website" backend
# Expects: TARGET, SCRIPT_DIR
# Sets:    CMS_ADMIN_URL
# ─────────────────────────────────────────────────────────────────────────────

# ── 2. Install Payload Website ──────────────────────────
echo ""
echo "▶ Creating Payload Website app..."
PW_ZIP="$SCRIPT_DIR/setup/cache/payload-website.zip"
mkdir -p "$TARGET/payload-website"
unzip -qo "$PW_ZIP" -d "$TARGET/payload-website"
if [ ! -d "$TARGET/payload-website/node_modules" ]; then
  echo "  node_modules not in zip — running npm install..."
  (cd "$TARGET/payload-website" && npm install)
fi

# ── 3. Generate import map ────────────────────────────
echo "▶ Generating Payload import map..."
(cd "$TARGET/payload-website" && npm run generate:importmap) || true

# ── 4. start.sh ────────────────────────────────────────
echo "▶ Creating start.sh..."
cat > "$TARGET/start.sh" << 'EOF'
#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "▶ Starting Payload Website on http://localhost:3000 ..."
cd "$ROOT/payload-website"
npm run dev &
APP_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Website        → http://localhost:3000"
echo "  Payload Admin  → http://localhost:3000/admin"
echo "  Press Ctrl+C to stop."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

trap "kill $APP_PID 2>/dev/null; exit" INT TERM
wait $APP_PID
EOF

CMS_ADMIN_URL="http://localhost:3000/admin"

# ── Done ──────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Setup complete!"
echo ""
echo "  To start:  bash $TARGET/start.sh"
echo ""
echo "  Website        → http://localhost:3000"
echo "  Payload Admin  → $CMS_ADMIN_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
