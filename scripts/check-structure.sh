#!/usr/bin/env bash
set -e

required_paths=(
  "frontend"
  "backend"
  "database"
  "database/migrations"
  "database/seeds"
  "docs"
  "docs/report"
  "docs/diagrams"
  "docs/screenshots"
  "docs/postman"
  "README.md"
)

for path in "${required_paths[@]}"; do
  if [ ! -e "$path" ]; then
    echo "Missing: $path"
    exit 1
  fi
done

echo "Repo structure OK."
