# ─────────────────────────────────────────────────────────────────────────────
# install-wordpress.sh — Sourced by setup.sh for the "wordpress" backend
# WordPress standalone (no Next.js frontend)
# Expects: TARGET, SCRIPT_DIR
# Sets:    CMS_ADMIN_URL
# ─────────────────────────────────────────────────────────────────────────────

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

# ── 3. start.sh ───────────────────────────────────────
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

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  WordPress   → http://localhost:8080"
echo "  WP Admin    → http://localhost:8080/wp-admin"
echo "  WP REST API → http://localhost:8080/wp-json/wp/v2/"
echo "  Press Ctrl+C to stop."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cleanup() {
  echo ""
  echo "Stopping WordPress Docker containers..."
  cd "$ROOT/wordpress" && docker compose down
  exit
}

trap cleanup INT TERM
docker compose logs -f
EOF

CMS_ADMIN_URL="http://localhost:8080/wp-admin"

# ── Done ──────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Setup complete!"
echo ""
echo "  To start:  bash $TARGET/start.sh"
echo ""
echo "  WordPress   → http://localhost:8080"
echo "  WP Admin    → $CMS_ADMIN_URL"
echo "  WP REST API → http://localhost:8080/wp-json/wp/v2/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
