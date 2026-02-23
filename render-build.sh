#!/usr/bin/env bash
set -euo pipefail

# Ensure corepack and pnpm are active before any install/build step
echo "Enabling corepack and preparing pnpm@10.4.1"
corepack enable
corepack prepare pnpm@10.4.1 --activate

echo "Installing dependencies (frozen lockfile)"
pnpm install --frozen-lockfile

echo "Building project"
pnpm build

echo "Build complete"
