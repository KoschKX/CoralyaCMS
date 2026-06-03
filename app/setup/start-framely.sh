#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"

# Check Docker is running
if ! docker info &>/dev/null; then
  echo "  ✗ Docker is not running. Please start Docker Desktop and try again."
  exit 1
fi

echo "▶ Starting MySQL via Docker Compose..."
cd "$ROOT/framely"
docker compose up -d

echo ""
echo "  Waiting for MySQL to be ready..."
for i in $(seq 1 30); do
  if docker compose exec -T db mysqladmin ping -uroot -pexamplepass --silent 2>/dev/null; then
    echo "  ✓ MySQL is ready!"
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

echo "▶ Starting Framely on http://localhost:3000 ..."
cd "$ROOT/framely"
npx prisma generate
npm run dev &
APP_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Framely  → http://localhost:3000"
echo "  Press Ctrl+C to stop."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cleanup() {
  echo ""
  echo "Stopping Framely..."
  kill $APP_PID 2>/dev/null
  echo "Stopping MySQL Docker container..."
  cd "$ROOT/framely" && docker compose down
  exit
}

trap cleanup INT TERM
wait $APP_PID
