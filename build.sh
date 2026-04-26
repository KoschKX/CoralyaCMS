#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"

cd "$ROOT/next"
npm run build
