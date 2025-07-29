#!/bin/bash

echo "==> Running text-change conflict resolver..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(dirname "$SCRIPT_DIR")"

cd "$MODULE_DIR" || {
  echo "Failed to change directory to elkan5e module."
  exit 1
}

conflicted_files=$(git diff --name-only --diff-filter=U)

if [[ -z "$conflicted_files" ]]; then
  echo "No merge conflicts found."
  exit 0
fi

ours_tmp="/tmp/ours.tmp"
theirs_tmp="/tmp/theirs.tmp"

resolved_count=0
skipped_files=()

for file in $conflicted_files; do
  git show ":2:$file" > "$ours_tmp" 2>/dev/null
  git show ":3:$file" > "$theirs_tmp" 2>/dev/null

  if [[ ! -s "$ours_tmp" || ! -s "$theirs_tmp" ]]; then
    skipped_files+=("$file")
    continue
  fi

  # Strip description.value content to compare the rest
  ours_stripped=$(sed 's/"value"\s*:\s*"[^"]*"/"value":"STRIPPED"/g' "$ours_tmp" | tr -d '[:space:]')
  theirs_stripped=$(sed 's/"value"\s*:\s*"[^"]*"/"value":"STRIPPED"/g' "$theirs_tmp" | tr -d '[:space:]')

  if [[ "$ours_stripped" == "$theirs_stripped" ]]; then
    git checkout --ours -- "$file"
    git add "$file"
    echo "✅ Auto-resolved: $file (only .system.description.value differs)"
    ((resolved_count++))
  else
    skipped_files+=("$file")
  fi
done

rm -f "$ours_tmp" "$theirs_tmp"

echo ""
echo "Resolution complete."
echo "Resolved: $resolved_count"
if [[ ${#skipped_files[@]} -gt 0 ]]; then
  echo "Skipped files (not eligible for auto-resolve):"
  for file in "${skipped_files[@]}"; do
    echo " - $file"
  done
fi
