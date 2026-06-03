#!/bin/bash
# start.sh — start Next.js in development mode.
#
# Usage: bash start.sh
#
# Kills any process on port 3000, installs deps if missing, then runs
# `next dev --turbo`. Press Ctrl+C to stop.
ROOT="$(cd "$(dirname "$0")" && pwd)"

# Free port 3000 if something else is holding it
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "  ⚠ Port 3000 in use — killing existing process..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  sleep 1
fi

echo "▶ Starting Next.js on http://localhost:3000 ..."
if [ ! -d "$ROOT/next/node_modules" ]; then
  echo "[>] node_modules not found in next/. Running npm install ..."
  (cd "$ROOT/next" && npm install)
fi

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
