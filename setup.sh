#!/bin/bash
set -e

# ─────────────────────────────────────────────────────────────────────────────
# setup.sh — Scaffolds a fresh Next.js + CMS project
#
# Usage:  bash setup.sh [target-directory]
#   e.g.  bash setup.sh my-project
#         (defaults to current directory if no argument given)
#
# Creates:
#   <target>/next/            — Next.js app (TypeScript + Tailwind)
#   <target>/payload/         — Payload CMS  (if chosen)
#   <target>/strapi/          — Strapi CMS   (if chosen)
#   <target>/wordpress/       — WordPress headless via Docker (if chosen)
#   <target>/next-wp/         — next-wp headless WP starter (if chosen)
#   <target>/framely/         — Framely website builder via Docker (if chosen)
#   <target>/payload-website/ — Combined Next.js + Payload (website template)
#   <target>/start.sh         — starts the services
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Parse flags ───────────────────────────────────────────────
TARGET="."
for _arg in "$@"; do
  case "$_arg" in
    *)        TARGET="$_arg" ;;
  esac
done
mkdir -p "$TARGET"
TARGET="$(cd "$TARGET" && pwd)"

# ── Choose backend ────────────────────────────────────────────
echo ""
echo "Which backend would you like to use?"
echo "  1) Payload (blank) + separate Next.js frontend"
echo "  2) Strapi + separate Next.js frontend"
echo "  3) Payload Website (official template with frontend built-in)"
echo "  4) WordPress standalone (Docker)"
echo "  5) WordPress headless (Docker) + separate Next.js frontend"
echo "  6) next-wp — full-featured headless WordPress starter (9d8dev)"
echo "  7) Framely — drag-and-drop website builder (Docker + MySQL)"
echo "  8) Next.js only (no CMS)"
echo ""
read -rp "Enter 1-8: " BACKEND_CHOICE

case "$BACKEND_CHOICE" in
  1) BACKEND="payload" ;;
  2) BACKEND="strapi"  ;;
  3) BACKEND="payload-website" ;;
  4) BACKEND="wordpress" ;;
  5) BACKEND="wordpress-nextjs" ;;
  6) BACKEND="next-wp" ;;
  7) BACKEND="framely" ;;
  8) BACKEND="nextjs" ;;
  *) echo "Invalid choice. Exiting."; exit 1 ;;
esac

CMS_LABEL="$(echo "$BACKEND" | awk '{print toupper(substr($0,1,1)) substr($0,2)}')"

# ── Check for existing installation ──────────────────────────
EXISTING=()
if [ "$BACKEND" = "nextjs" ]; then
  [ -d "$TARGET/next" ] && EXISTING+=("$TARGET/next")
elif [ "$BACKEND" = "payload-website" ] || [ "$BACKEND" = "framely" ] || [ "$BACKEND" = "wordpress" ]; then
  [ -d "$TARGET/$BACKEND" ] && EXISTING+=("$TARGET/$BACKEND")
elif [ "$BACKEND" = "wordpress-nextjs" ]; then
  [ -d "$TARGET/wordpress" ] && EXISTING+=("$TARGET/wordpress")
  [ -d "$TARGET/next" ]      && EXISTING+=("$TARGET/next")
elif [ "$BACKEND" = "next-wp" ]; then
  [ -d "$TARGET/wordpress" ] && EXISTING+=("$TARGET/wordpress")
  [ -d "$TARGET/next-wp" ]   && EXISTING+=("$TARGET/next-wp")
else
  [ -d "$TARGET/next" ]     && EXISTING+=("$TARGET/next")
  [ -d "$TARGET/$BACKEND" ] && EXISTING+=("$TARGET/$BACKEND")
fi
[ -f "$TARGET/start.sh" ]          && EXISTING+=("$TARGET/start.sh")

if [ ${#EXISTING[@]} -gt 0 ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ⚠  Already set up — the following already exist:"
  for item in "${EXISTING[@]}"; do
    echo "       $item"
  done
  echo ""
  echo "  To start fresh, delete them and re-run setup.sh:"
  for item in "${EXISTING[@]}"; do
    echo "       rm -rf \"$item\""
  done
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Setting up $CMS_LABEL in: $TARGET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Ensure zips are present ──────────────────────────────────
. "$SCRIPT_DIR/setup/ensure-zips.sh"

# ── Run backend installer ─────────────────────────────────────
. "$SCRIPT_DIR/setup/install-${BACKEND}.sh"

chmod +x "$TARGET/start.sh"
