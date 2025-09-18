#!/usr/bin/env bash
# Lightweight setup script: prefer bun if present, otherwise fall back to npm
set -e

echo "Detecting package manager..."
if command -v bun >/dev/null 2>&1; then
  echo "bun detected — running: bun install"
  bun install
else
  echo "bun not found — running: npm install"
  npm install
fi

echo "Setup complete. Run 'npm run dev' or 'bun run dev' to start the dev server."