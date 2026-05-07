#!/bin/bash
# purge-key.sh — removes GeminiKey.txt from ALL git history, then force-pushes
set -e
cd ~/Documents/Studio/Projects/Golf

echo "→ Stashing uncommitted changes..."
git stash

echo "→ Rewriting history..."
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch --force \
  --index-filter 'git rm --cached --ignore-unmatch GeminiKey.txt' \
  --prune-empty --tag-name-filter cat -- --all

echo "→ Cleaning up refs..."
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "→ Restoring stashed changes..."
git stash pop

echo "→ Force pushing to GitHub..."
git push origin main --force

echo "✓ Done — GeminiKey.txt scrubbed from all history."
rm ~/Documents/Studio/Projects/Golf/purge-key.sh
