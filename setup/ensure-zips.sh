# ─────────────────────────────────────────────────────────────────────────────
# ensure-zips.sh — Sourced by setup.sh
# Checks that required zips exist in setup/cache/; downloads any that are missing.
# Expects: BACKEND, SCRIPT_DIR
# ─────────────────────────────────────────────────────────────────────────────

NEEDED_ZIPS=()
case "$BACKEND" in
  payload)         NEEDED_ZIPS=("next" "payload") ;;
  strapi)          NEEDED_ZIPS=("next" "strapi") ;;
  payload-website) NEEDED_ZIPS=("payload-website") ;;
  wordpress)         NEEDED_ZIPS=("wordpress") ;;
  wordpress-nextjs)  NEEDED_ZIPS=("next" "wordpress") ;;
  next-wp)           NEEDED_ZIPS=("next-wp" "wordpress") ;;
  framely)           NEEDED_ZIPS=("framely") ;;
  nextjs)            NEEDED_ZIPS=("next") ;;
esac

MISSING_ZIPS=()
for _z in "${NEEDED_ZIPS[@]}"; do
  [ ! -f "$SCRIPT_DIR/setup/cache/$_z.zip" ] && MISSING_ZIPS+=("$_z")
done

if [ ${#MISSING_ZIPS[@]} -gt 0 ]; then
  echo "▶ Missing zips: ${MISSING_ZIPS[*]}"
  echo "  Downloading them now..."
  echo ""
  bash "$SCRIPT_DIR/setup/update_setup.sh" --skip-existing "${MISSING_ZIPS[@]}"
  echo ""
  for _z in "${MISSING_ZIPS[@]}"; do
    if [ ! -f "$SCRIPT_DIR/setup/cache/$_z.zip" ]; then
      echo "  ✗ setup/cache/$_z.zip still not found after update. Aborting."
      exit 1
    fi
  done
fi
