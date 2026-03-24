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

echo "▶ Starting Next.js on http://localhost:3000 ..."
cd "$ROOT/next"
npm run dev &
NEXT_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Next.js     → http://localhost:3000"
echo "  WordPress   → http://localhost:8080/wp-admin"
echo "  WP REST API → http://localhost:8080/wp-json/wp/v2/"
echo "  Press Ctrl+C to stop."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cleanup() {
  echo ""
  echo "Stopping Next.js..."
  kill $NEXT_PID 2>/dev/null
  echo "Stopping WordPress Docker containers..."
  cd "$ROOT/wordpress" && docker compose down
  exit
}

trap cleanup INT TERM
wait $NEXT_PID
