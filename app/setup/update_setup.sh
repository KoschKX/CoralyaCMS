#!/bin/bash
set -e

# ─────────────────────────────────────────────────────────────────────────────
# update_setup.sh — Refreshes setup zip bundles for offline installs
#
# Usage:  bash setup/update_setup.sh [--skip-existing] [next] [payload] [payload-website] [strapi] [wordpress] [framely]
#   e.g.  bash setup/update_setup.sh                   # updates all
#         bash setup/update_setup.sh payload            # updates only payload
#         bash setup/update_setup.sh next strapi
#         bash setup/update_setup.sh --skip-existing next payload
#
# Flags:
#   --skip-existing   Silently skip targets whose zip already exists
#                     (no overwrite prompt). Used by setup.sh.
#
# Produces:
#   setup/cache/next.zip              — Next.js scaffold + node_modules
#   setup/cache/payload.zip           — Payload CMS (blank) scaffold + node_modules
#   setup/cache/payload-website.zip   — Payload CMS (website template) + node_modules
#   setup/cache/strapi.zip            — Strapi scaffold + node_modules
#   setup/cache/wordpress.zip         — WordPress headless (Docker Compose config)
#   setup/cache/framely.zip           — Framely website builder (no node_modules; installed at project time)
# ─────────────────────────────────────────────────────────────────────────────

SETUP_DIR="$(cd "$(dirname "$0")" && pwd)"
WORK_DIR="$(mktemp -d)"
trap 'echo ""; echo "  Cleaning up..."; rm -rf "$WORK_DIR"' EXIT

# ── Parse flags & resolve targets ─────────────────────────────
SKIP_EXISTING=false
TARGETS=""
for _arg in "$@"; do
  case "$_arg" in
    --skip-existing) SKIP_EXISTING=true ;;
    *)               TARGETS="$TARGETS $_arg" ;;
  esac
done
TARGETS="${TARGETS# }"  # trim leading space
if [ -z "$TARGETS" ]; then
  TARGETS="next payload payload-website strapi wordpress framely next-wp"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  update_setup.sh"
echo "  Output dir : $SETUP_DIR"
echo "  Work dir   : $WORK_DIR"
echo "  Targets    : $TARGETS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Helper: zip a directory (including node_modules) ─────────
make_zip() {
  local name="$1"
  local src="$2"
  mkdir -p "$SETUP_DIR/cache"
  local dest="$SETUP_DIR/cache/$name.zip"
  local tmp="$dest.tmp"
  echo "  Zipping → $dest ..."
  (cd "$src" && zip -qry "$tmp" . --exclude "*.git*" --exclude ".DS_Store")
  mv "$tmp" "$dest"
  echo "  ✓ $name.zip ($(du -sh "$dest" | cut -f1))"
}

# ══════════════════════════════════════════════════════════════

for TARGET in $TARGETS; do
  case "$TARGET" in

    # ── next ──────────────────────────────────────────────────
    next)
      if [ -f "$SETUP_DIR/cache/next.zip" ]; then
        if [ "$SKIP_EXISTING" = true ]; then
          echo "  next.zip already exists — skipping."; echo ""; continue
        fi
        read -rp "  next.zip already exists. Overwrite? [y/N] " _confirm
        [[ "$_confirm" =~ ^[Yy]$ ]] || { echo "  Skipping next."; echo ""; continue; }
      fi
      echo "▶ Fetching latest Next.js..."
        npx create-next-app@latest "$WORK_DIR/next" \
          --typescript --tailwind --eslint --app \
          --no-src-dir --import-alias "@/*" --yes
        if [ ! -d "$WORK_DIR/next" ]; then
          echo "  ⚠ create-next-app did not produce $WORK_DIR/next — skipping zip"
        else
          if [ ! -d "$WORK_DIR/next/node_modules" ]; then
            echo "  node_modules missing — running npm install..."
            (cd "$WORK_DIR/next" && npm install)
          fi
          make_zip "next" "$WORK_DIR/next"
        fi
      echo ""
      ;;

    # ── payload ───────────────────────────────────────────────
    payload)
      if [ -f "$SETUP_DIR/cache/payload.zip" ]; then
        if [ "$SKIP_EXISTING" = true ]; then
          echo "  payload.zip already exists — skipping."; echo ""; continue
        fi
        read -rp "  payload.zip already exists. Overwrite? [y/N] " _confirm
        [[ "$_confirm" =~ ^[Yy]$ ]] || { echo "  Skipping payload."; echo ""; continue; }
      fi
      echo "▶ Fetching latest Payload CMS..."
        (cd "$WORK_DIR" && npx create-payload-app@latest \
          --name payload \
          --template blank \
          --db sqlite \
          --db-connection-string "file:./payload.db" \
          --no-git \
          --accept-defaults) || true
        if [ ! -d "$WORK_DIR/payload" ]; then
          echo "  ⚠ create-payload-app did not produce $WORK_DIR/payload — skipping zip"
        else
          if [ ! -d "$WORK_DIR/payload/node_modules" ]; then
            echo "  node_modules missing — running npm install..."
            (cd "$WORK_DIR/payload" && npm install)
          fi
          echo "  Generating import map..."
          (cd "$WORK_DIR/payload" && npm run generate:importmap) || true
          make_zip "payload" "$WORK_DIR/payload"
        fi
      echo ""
      ;;

    # ── strapi ────────────────────────────────────────────────
    strapi)
      if [ -f "$SETUP_DIR/cache/strapi.zip" ]; then
        if [ "$SKIP_EXISTING" = true ]; then
          echo "  strapi.zip already exists — skipping."; echo ""; continue
        fi
        read -rp "  strapi.zip already exists. Overwrite? [y/N] " _confirm
        [[ "$_confirm" =~ ^[Yy]$ ]] || { echo "  Skipping strapi."; echo ""; continue; }
      fi
      echo "▶ Fetching latest Strapi..."
        npx create-strapi-app@latest "$WORK_DIR/strapi" \
          --quickstart \
          --no-run \
          --no-git-init || true
        if [ ! -d "$WORK_DIR/strapi" ]; then
          echo "  ⚠ create-strapi-app did not produce $WORK_DIR/strapi — skipping zip"
        else
          if [ ! -d "$WORK_DIR/strapi/node_modules" ]; then
            echo "  node_modules missing — running npm install..."
            (cd "$WORK_DIR/strapi" && npm install)
          fi
          make_zip "strapi" "$WORK_DIR/strapi"
        fi
      echo ""
      ;;

    # ── payload-website ────────────────────────────────────
    payload-website)
      if [ -f "$SETUP_DIR/cache/payload-website.zip" ]; then
        if [ "$SKIP_EXISTING" = true ]; then
          echo "  payload-website.zip already exists — skipping."; echo ""; continue
        fi
        read -rp "  payload-website.zip already exists. Overwrite? [y/N] " _confirm
        [[ "$_confirm" =~ ^[Yy]$ ]] || { echo "  Skipping payload-website."; echo ""; continue; }
      fi
      echo "▶ Fetching latest Payload CMS (website template)..."
        (cd "$WORK_DIR" && npx create-payload-app@latest \
          --name payload-website \
          --template website \
          --db sqlite \
          --db-connection-string "file:./payload.db" \
          --no-git \
          --accept-defaults) || true
        if [ ! -d "$WORK_DIR/payload-website" ]; then
          echo "  ⚠ create-payload-app did not produce $WORK_DIR/payload-website — skipping zip"
        else
          if [ ! -d "$WORK_DIR/payload-website/node_modules" ]; then
            echo "  node_modules missing — running npm install..."
            (cd "$WORK_DIR/payload-website" && npm install)
          fi
          echo "  Generating import map..."
          (cd "$WORK_DIR/payload-website" && npm run generate:importmap) || true
          make_zip "payload-website" "$WORK_DIR/payload-website"
        fi
      echo ""
      ;;

    # ── wordpress ───────────────────────────────────────
    wordpress)
      if [ -f "$SETUP_DIR/cache/wordpress.zip" ]; then
        if [ "$SKIP_EXISTING" = true ]; then
          echo "  wordpress.zip already exists — skipping."; echo ""; continue
        fi
        read -rp "  wordpress.zip already exists. Overwrite? [y/N] " _confirm
        [[ "$_confirm" =~ ^[Yy]$ ]] || { echo "  Skipping wordpress."; echo ""; continue; }
      fi
      echo "▶ Creating WordPress headless Docker config..."
        WP_DIR="$WORK_DIR/wordpress"
        mkdir -p "$WP_DIR"

        # docker-compose.yml
        cat > "$WP_DIR/docker-compose.yml" << 'DCEOF'
services:
  db:
    image: mysql:8.0
    platform: linux/amd64
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: wordpress
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: wordpress
    volumes:
      - ./database:/var/lib/mysql

  wordpress:
    image: wordpress:latest
    restart: unless-stopped
    depends_on:
      - db
    ports:
      - "8080:80"
    environment:
      WORDPRESS_DB_HOST: db:3306
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: wordpress
      WORDPRESS_DB_NAME: wordpress
      WORDPRESS_DEBUG: "1"
    volumes:
      - ./html:/var/www/html
DCEOF

        # .env defaults
        cat > "$WP_DIR/.env" << 'ENVEOF'
WORDPRESS_PORT=8080
WP_REST_URL=http://localhost:8080/wp-json/wp/v2
ENVEOF

        # README
        cat > "$WP_DIR/README.md" << 'RDEOF'
# WordPress Headless Setup

Runs WordPress via Docker as a headless CMS.

## Requirements
- Docker & Docker Compose

## Start
```bash
docker compose up -d
```

## Access
- WordPress Admin: http://localhost:8080/wp-admin
- REST API: http://localhost:8080/wp-json/wp/v2/pages

## Stop
```bash
docker compose down
```

## Reset (delete all data)
```bash
docker compose down -v
```
RDEOF

        make_zip "wordpress" "$WP_DIR"
      echo ""
      ;;

    # ── framely ─────────────────────────────────────────────────────────────
    framely)
      if [ -f "$SETUP_DIR/cache/framely.zip" ]; then
        if [ "$SKIP_EXISTING" = true ]; then
          echo "  framely.zip already exists — skipping."; echo ""; continue
        fi
        read -rp "  framely.zip already exists. Overwrite? [y/N] " _confirm
        [[ "$_confirm" =~ ^[Yy]$ ]] || { echo "  Skipping framely."; echo ""; continue; }
      fi
      echo "▶ Cloning Framely from GitHub..."
        git clone --depth=1 https://github.com/belastrittmatter/Framely.git "$WORK_DIR/framely" || true
        if [ ! -d "$WORK_DIR/framely" ]; then
          echo "  ⚠ git clone did not produce $WORK_DIR/framely — skipping zip"
        else
          # Zip source only — node_modules are installed fresh at project time
          # so Prisma's WASM paths are correct for the destination machine
          (cd "$WORK_DIR/framely" && zip -qry "$SETUP_DIR/cache/framely.zip.tmp" . \
            --exclude "*.git*" --exclude ".DS_Store" --exclude "node_modules/*")
          mv "$SETUP_DIR/cache/framely.zip.tmp" "$SETUP_DIR/cache/framely.zip"
          echo "  ✓ framely.zip ($(du -sh "$SETUP_DIR/cache/framely.zip" | cut -f1))"
        fi
      echo ""
      ;;

    # ── next-wp ────────────────────────────────────────────────────────────────
    next-wp)
      if [ -f "$SETUP_DIR/cache/next-wp.zip" ]; then
        if [ "$SKIP_EXISTING" = true ]; then
          echo "  next-wp.zip already exists — skipping."; echo ""; continue
        fi
        read -rp "  next-wp.zip already exists. Overwrite? [y/N] " _confirm
        [[ "$_confirm" =~ ^[Yy]$ ]] || { echo "  Skipping next-wp."; echo ""; continue; }
      fi
      echo "▶ Cloning next-wp from GitHub..."
      git clone --depth=1 https://github.com/9d8dev/next-wp.git "$WORK_DIR/next-wp" || true
      if [ ! -d "$WORK_DIR/next-wp" ]; then
        echo "  ⚠ git clone did not produce $WORK_DIR/next-wp — skipping zip"
      else
        (cd "$WORK_DIR/next-wp" && zip -qry "$SETUP_DIR/cache/next-wp.zip.tmp" . \
          --exclude "*.git*" --exclude ".DS_Store" --exclude "node_modules/*" --exclude ".next/*")
        mv "$SETUP_DIR/cache/next-wp.zip.tmp" "$SETUP_DIR/cache/next-wp.zip"
        echo "  ✓ next-wp.zip ($(du -sh "$SETUP_DIR/cache/next-wp.zip" | cut -f1))"
      fi
      echo ""
      ;;

    *)
      echo "  ⚠ Unknown target '$TARGET' — skipping (valid: next, payload, payload-website, strapi, wordpress, framely, next-wp)"
      ;;
  esac
done

# ── Themes: zip all in setup/themes-src/ ───────────────
THEMES_SRC="$SETUP_DIR/themes-src"
THEMES_OUT="$SETUP_DIR/themes"
if [ -d "$THEMES_SRC" ]; then
  mkdir -p "$THEMES_OUT"
  for theme_dir in "$THEMES_SRC"/*/; do
    [ -d "$theme_dir" ] || continue
    theme_name="$(basename "$theme_dir")"
    theme_zip="$THEMES_OUT/$theme_name.zip"
    if [ -f "$theme_zip" ]; then
      read -rp "  $theme_name.zip already exists. Overwrite? [y/N] " _confirm
      [[ "$_confirm" =~ ^[Yy]$ ]] || { echo "  Skipping $theme_name."; continue; }
    fi
    echo "▶ Zipping theme: $theme_name ..."
    (cd "$theme_dir" && zip -qry "$theme_zip.tmp" . --exclude "*.git*" --exclude ".DS_Store")
    mv "$theme_zip.tmp" "$theme_zip"
    echo "  ✓ $theme_name.zip ($(du -sh "$theme_zip" | cut -f1))"
  done
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Done. Zip files are in: $SETUP_DIR/cache"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

