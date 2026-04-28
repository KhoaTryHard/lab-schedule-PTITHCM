#!/usr/bin/env bash
set -e

git init
git add .
git commit -m "chore: initialize lab schedule monorepo skeleton"
git branch -M main
git checkout -b develop

echo "Local repo initialized."
echo "Next: create GitHub repo, then run:"
echo "git remote add origin <your-github-repo-url>"
echo "git push -u origin main"
echo "git push -u origin develop"
