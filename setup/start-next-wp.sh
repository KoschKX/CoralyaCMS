#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"

# Check Docker is running
if ! docker info &>/dev/null; then
  echo "  ✗ Docker is not running. Please start Docker Desktop and try again."
  exit 1
fi

echo "▶ Starting WordPress via Docker Compose..."
cd "$ROOT/wordpress"
docker compose up -d

echo ""
echo "  Waiting for WordPress to be ready..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:8080/ >/dev/null 2>&1; then
    echo "  ✓ WordPress is ready!"
    break
  fi
  sleep 2
done

# Clear port 3000 in case a previous server is still running
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "  ⚠ Port 3000 in use — stopping existing process..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  sleep 1
fi

echo "▶ Starting next-wp on http://localhost:3000 ..."
cd "$ROOT/next-wp"
npm run dev &
APP_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Next.js  → http://localhost:3000"
echo "  WP Admin → http://localhost:8080/wp-admin  (admin / admin)"
echo "  Press Ctrl+C to stop."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cleanup() {
  echo ""
  echo "Stopping next-wp..."
  kill $APP_PID 2>/dev/null
  echo "Stopping WordPress Docker containers..."
  cd "$ROOT/wordpress" && docker compose down
  exit
}

trap cleanup INT TERM
wait $APP_PID
