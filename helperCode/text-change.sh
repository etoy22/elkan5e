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

log_dir="$SCRIPT_DIR/merge-logs"
resolved_log="$log_dir/text-change-resolved.log"
skipped_log="$log_dir/text-change-skipped.log"

mkdir -p "$log_dir"
> "$resolved_log"
> "$skipped_log"

resolved_count=0
skipped_count=0

for file in $conflicted_files; do
  git show ":2:$file" > "$ours_tmp" 2>/dev/null
  git show ":3:$file" > "$theirs_tmp" 2>/dev/null

  if [[ ! -s "$ours_tmp" || ! -s "$theirs_tmp" ]]; then
    echo "$file - Could not extract both versions" >> "$skipped_log"
    ((skipped_count++))
    continue
  fi

  # Strip description.value content to compare the rest
  ours_stripped=$(sed 's/"value"\s*:\s*"[^"]*"/"value":"STRIPPED"/g' "$ours_tmp" | tr -d '[:space:]')
  theirs_stripped=$(sed 's/"value"\s*:\s*"[^"]*"/"value":"STRIPPED"/g' "$theirs_tmp" | tr -d '[:space:]')

  if [[ "$ours_stripped" == "$theirs_stripped" ]]; then
    git checkout --ours -- "$file"
    git add "$file"
    echo "$file" >> "$resolved_log"
    echo "✅ Auto-resolved: $file"
    ((resolved_count++))
  else
    echo "$file - Differences beyond description.value" >> "$skipped_log"
    ((skipped_count++))
  fi
done

rm -f "$ours_tmp" "$theirs_tmp"

echo ""
echo "Resolution complete."
echo "Resolved: $resolved_count"
echo "Skipped:  $skipped_count"
echo "Logs saved to:"
echo " - $resolved_log"
echo " - $skipped_log"