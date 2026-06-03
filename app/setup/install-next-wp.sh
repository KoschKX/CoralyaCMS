# ─────────────────────────────────────────────────────────────────────────────
# install-next-wp.sh — Sourced by setup.sh for the "next-wp" backend
# next-wp (9d8dev) + WordPress headless via Docker
# Expects: TARGET, SCRIPT_DIR
# Sets:    CMS_ADMIN_URL
# ─────────────────────────────────────────────────────────────────────────────

# ── Check Docker is available ─────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "  ✗ Docker is required for WordPress but was not found."
  echo "    Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

# ── 1. Extract next-wp ────────────────────────────────────────────────────────
echo "▶ Extracting next-wp..."
mkdir -p "$TARGET/next-wp"
unzip -qo "$SCRIPT_DIR/setup/cache/next-wp.zip" -d "$TARGET/next-wp"

# ── 2. Patch lib/wordpress.ts — use ?rest_route= (no pretty permalinks needed) ─
python3 - "$TARGET/next-wp/lib/wordpress.ts" <<'PYEOF'
import sys
path = sys.argv[1]
src = open(path).read()

old = 'const USER_AGENT = "Next.js WordPress Client";\nconst CACHE_TTL = 3600; // 1 hour'
new = ('const USER_AGENT = "Next.js WordPress Client";\n'
       'const CACHE_TTL = 3600; // 1 hour\n\n'
       '// Build URL using ?rest_route= to avoid needing pretty permalinks in WordPress\n'
       'function buildUrl(path: string, query?: Record<string, any>): string {\n'
       '  const restPath = path.replace(/^\\/wp-json/, "");\n'
       '  const params = { rest_route: restPath, ...query };\n'
       '  return `${baseUrl}/?${querystring.stringify(params)}`;\n'
       '}')
src = src.replace(old, new)

old_url = '`${baseUrl}${path}${query ? `?${querystring.stringify(query)}` : ""}`'
new_url = 'buildUrl(path, query)'
src = src.replace(old_url, new_url)

open(path, 'w').write(src)
PYEOF

# ── 3. Patch next.config.ts — allow HTTP images from localhost:8080 ───────────
python3 - "$TARGET/next-wp/next.config.ts" <<'PYEOF'
import sys
path = sys.argv[1]
src = open(path).read()
old = '''  images: {
    remotePatterns: wordpressHostname
      ? [
          {
            protocol: "https",
            hostname: wordpressHostname,
            port: "",
            pathname: "/**",
          },
        ]
      : [],
  },'''
new = '''  images: {
    remotePatterns: [
      // Allow images from local Docker WordPress (HTTP)
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/**",
      },
      // Also allow any configured remote WordPress host (HTTPS)
      ...(wordpressHostname && wordpressHostname !== "localhost"
        ? [{ protocol: "https" as const, hostname: wordpressHostname, port: "", pathname: "/**" }]
        : []),
    ],
  },'''
open(path, 'w').write(src.replace(old, new))
PYEOF

# ── 4. Create .env.local ──────────────────────────────────────────────────────
echo "▶ Creating .env.local..."
WP_SECRET="$(openssl rand -base64 32)"
cat > "$TARGET/next-wp/.env.local" <<EOF
WORDPRESS_URL="http://localhost:8080"
WORDPRESS_HOSTNAME="localhost"
WORDPRESS_WEBHOOK_SECRET="${WP_SECRET}"
EOF

# ── 5. Install dependencies ───────────────────────────────────────────────────
echo "▶ Installing dependencies..."
(cd "$TARGET/next-wp" && npm install --legacy-peer-deps)

# ── 6. Extract and start WordPress for initial setup ─────────────────────────
echo "▶ Setting up WordPress (Docker)..."
mkdir -p "$TARGET/wordpress"
unzip -qo "$SCRIPT_DIR/setup/cache/wordpress.zip" -d "$TARGET/wordpress"

echo "▶ Stopping any existing WordPress containers..."
(cd "$TARGET/wordpress" && docker compose down 2>/dev/null || true)

echo "▶ Pulling Docker images..."
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

  echo "▶ Running WordPress auto-install..."
  docker compose -f "$TARGET/wordpress/docker-compose.yml" exec -T wordpress \
    bash -c '
      until [ -f /var/www/html/wp-includes/version.php ]; do sleep 1; done
      curl -sO https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
      chmod +x wp-cli.phar
      php wp-cli.phar core install \
        --url="http://localhost:8080" \
        --title="My Site" \
        --admin_user=admin \
        --admin_password=admin \
        --admin_email=admin@example.com \
        --skip-email \
        --allow-root \
        --path=/var/www/html
      php wp-cli.phar rewrite structure "/%postname%/" --allow-root --path=/var/www/html
      php wp-cli.phar rewrite flush --allow-root --path=/var/www/html
    ' || echo "  ⚠ Auto-install failed — finish setup at http://localhost:8080/wp-admin"

  echo "  ✓ WordPress installed (admin/admin)"

  echo "▶ Stopping WordPress containers (start.sh will restart them)..."
  (cd "$TARGET/wordpress" && docker compose down)
else
  echo "  ⚠ WordPress didn't respond in time."
  (cd "$TARGET/wordpress" && docker compose down)
fi

# ── 7. Copy start.sh ──────────────────────────────────────────────────────────
echo "▶ Creating start.sh..."
cp "$SCRIPT_DIR/setup/start-next-wp.sh" "$TARGET/start.sh"

CMS_ADMIN_URL="http://localhost:8080/wp-admin"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Setup complete!"
echo ""
echo "  To start:  bash $TARGET/start.sh"
echo ""
echo "  Next.js  → http://localhost:3000"
echo "  WP Admin → $CMS_ADMIN_URL  (admin / admin)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
