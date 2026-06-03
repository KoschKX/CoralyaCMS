#!/bin/bash
# start-prod.sh — build and serve Next.js in production mode.
#
# Usage: bash start-prod.sh
#
# Kills any process on port 3000, runs `next build`, then starts
# `next start` on http://localhost:3000. Press Ctrl+C to stop.
ROOT="$(cd "$(dirname "$0")" && pwd)"

# Free port 3000 if something else is holding it
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "  ⚠ Port 3000 in use — killing existing process..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  sleep 1
fi

echo "▶ Building Next.js for production..."
cd "$ROOT/next"
npm run build

# Start production server
echo "▶ Starting Next.js production server on http://localhost:3000 ..."
npm run start &
NEXT_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Next.js (prod)  → http://localhost:3000"
echo "  Press Ctrl+C to stop."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

trap "kill $NEXT_PID 2>/dev/null; exit" INT TERM
wait $NEXT_PID
