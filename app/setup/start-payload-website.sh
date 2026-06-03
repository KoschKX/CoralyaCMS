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
