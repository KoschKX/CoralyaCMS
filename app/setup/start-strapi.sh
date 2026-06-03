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
