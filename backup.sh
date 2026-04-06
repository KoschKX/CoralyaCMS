#!/usr/bin/env bash
# backup.sh — create a timestamped zip of the project, skipping regenerable large files.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
ARCHIVE_DIR="$ROOT/- ARCHIVE -"
TIMESTAMP="$(date +"%Y-%m-%d_%H-%M")"
OUT="$ARCHIVE_DIR/backup_$TIMESTAMP.zip"

mkdir -p "$ARCHIVE_DIR"

echo "📦 Backing up to: $OUT"

cd "$ROOT"

zip -r "$OUT" next start.sh backup.sh \
  --exclude "*/node_modules/*" \
  --exclude "next/.next/*" \
  --exclude "*/package-lock.json" \

SIZE=$(du -sh "$OUT" | cut -f1)
echo "✅ Done — $OUT ($SIZE)"
