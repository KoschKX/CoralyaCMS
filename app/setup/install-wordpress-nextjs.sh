# ─────────────────────────────────────────────────────────────────────────────
# install-wordpress-nextjs.sh — Sourced by setup.sh for the "wordpress-nextjs" backend
# WordPress headless (Docker) + separate Next.js frontend
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

# ── Check Docker is available ────────────────────────
if ! command -v docker &>/dev/null; then
  echo "  ✗ Docker is required for WordPress but was not found."
  echo "    Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

# ── 2. Install WordPress Docker config ──────────────
echo ""
echo "▶ Setting up WordPress (Docker)..."
WP_ZIP="$SCRIPT_DIR/setup/cache/wordpress.zip"
mkdir -p "$TARGET/wordpress"
unzip -qo "$WP_ZIP" -d "$TARGET/wordpress"

# ── 2b. Pull Docker images & initialize WordPress ───
echo "▶ Stopping any existing WordPress containers..."
(cd "$TARGET/wordpress" && docker compose down 2>/dev/null || true)

echo "▶ Pulling Docker images (this may take a minute)..."
(cd "$TARGET/wordpress" && docker compose pull)

echo "▶ Starting WordPress for initial setup..."
(cd "$TARGET/wordpress" && docker compose up -d)

echo "  Waiting for WordPress to be ready (bind-mount first boot can take a few minutes)..."
WP_READY=false
for i in $(seq 1 150); do
  if curl -sf http://localhost:8080/ >/dev/null 2>&1; then
    WP_READY=true
    break
  fi
  [ $((i % 15)) -eq 0 ] && echo "  ...still waiting ($((i * 2))s elapsed)..."
  sleep 2
done

if [ "$WP_READY" = true ]; then
  echo "  ✓ WordPress is running."

  # Auto-install WordPress (skip the browser wizard)
  echo "▶ Running WordPress auto-install..."
  docker compose -f "$TARGET/wordpress/docker-compose.yml" exec -T wordpress \
    bash -c '
      # Wait for wp-cli-compatible state
      until [ -f /var/www/html/wp-includes/version.php ]; do sleep 1; done
      # Install WP-CLI
      curl -sO https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
      chmod +x wp-cli.phar
      # Run install
      php wp-cli.phar core install \
        --url="http://localhost:8080" \
        --title="My Site" \
        --admin_user=admin \
        --admin_password=admin \
        --admin_email=admin@example.com \
        --skip-email \
        --allow-root \
        --path=/var/www/html
      # Enable pretty permalinks (needed for REST API)
      php wp-cli.phar rewrite structure "/%postname%/" --allow-root --path=/var/www/html
      php wp-cli.phar rewrite flush --allow-root --path=/var/www/html
    ' || echo "  ⚠ Auto-install failed — you can finish setup at http://localhost:8080/wp-admin"

  echo "  ✓ WordPress installed (admin/admin)"

  # Stop containers — start.sh will bring them back up
  echo "▶ Stopping WordPress containers (start.sh will restart them)..."
  (cd "$TARGET/wordpress" && docker compose down)
else
  echo "  ⚠ WordPress didn't respond in time. You may need to finish setup manually."
  (cd "$TARGET/wordpress" && docker compose down)
fi

# ── 3. Next.js component ─────────────────────────────
echo "▶ Creating CMS example component in Next.js..."
cat > "$TARGET/next/app/cms-example.tsx" << 'EOF'
// Server component — fetch runs on Node.js, no CORS
export default async function CmsExample() {
  let pages: any[] = [];
  let error: string | null = null;

  try {
    const res = await fetch("http://localhost:8080/?rest_route=/wp/v2/pages&_embed", {
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error(`WordPress API returned ${res.status}`);
    pages = await res.json();
  } catch (err: any) {
    error = err.message;
  }

  return (
    <div className="p-6 bg-white rounded shadow mt-8">
      <h2 className="text-xl font-bold mb-2">WordPress Pages</h2>
      {error && <div className="text-red-600">Error: {error}</div>}
      {pages.length === 0 && !error && (
        <p className="text-zinc-500">
          No pages yet. Create one in WordPress at{" "}
          <a className="underline" href="http://localhost:8080/wp-admin">
            localhost:8080/wp-admin
          </a>.
        </p>
      )}
      {pages.map((page: any) => (
        <div key={page.id} className="mb-4 border-b pb-4">
          <h3 className="text-lg font-semibold">{page.title?.rendered}</h3>
          <div
            className="text-zinc-600 mt-1"
            dangerouslySetInnerHTML={{ __html: page.excerpt?.rendered || "" }}
          />
        </div>
      ))}
    </div>
  );
}
EOF

# ── 4. Homepage ───────────────────────────────────────
echo "▶ Updating Next.js homepage..."
cat > "$TARGET/next/app/page.tsx" << 'EOF'
import CmsExample from "./cms-example";

export default function Home() {
  return (
    <main className="min-h-screen max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">My Site</h1>
      <p className="text-zinc-500 mb-8">Powered by Next.js + WordPress</p>
      <CmsExample />
    </main>
  );
}
EOF

# ── 5. start.sh ───────────────────────────────────────
echo "▶ Creating start.sh..."
cat > "$TARGET/start.sh" << 'EOF'
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
EOF

CMS_ADMIN_URL="http://localhost:8080/wp-admin"

# ── Done ──────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Setup complete!"
echo ""
echo "  To start:  bash $TARGET/start.sh"
echo ""
echo "  Next.js     → http://localhost:3000"
echo "  WordPress   → $CMS_ADMIN_URL"
echo "  WP REST API → http://localhost:8080/wp-json/wp/v2/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
