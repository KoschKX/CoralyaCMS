#!/bin/bash
# build.sh — build the Next.js app for production.
#
# Usage: bash build.sh
#
# Runs `next build` inside next/. Exits with the build's exit code.
ROOT="$(cd "$(dirname "$0")" && pwd)"

cd "$ROOT/next"
npm audit --audit-level=high
npm run build
