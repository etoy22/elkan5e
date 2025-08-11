#!/bin/bash

echo "==> Starting merge conflict resolution script..."
# Resolve the absolute path of the script and its parent (elkan5e)
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
ours_norm="/tmp/ours.norm"
theirs_norm="/tmp/theirs.norm"

manual_merge_log="merge-logs/manual_merge_required.log"
mkdir -p "$(dirname "$manual_merge_log")"
> "$manual_merge_log"

manual_merge_required=()

for file in $conflicted_files; do
  git show ":2:$file" > "$ours_tmp" 2>/dev/null
  git show ":3:$file" > "$theirs_tmp" 2>/dev/null

  if [[ ! -s "$ours_tmp" || ! -s "$theirs_tmp" ]]; then
    manual_merge_required+=("$file")
    echo "File: $file" >> "$manual_merge_log"
    echo "Could not extract both versions; manual merge required." >> "$manual_merge_log"
    echo "" >> "$manual_merge_log"
    continue
  fi

  # Normalize by removing whitespace and sorting chars
  tr -d '[:space:]' < "$ours_tmp" | fold -w1 | sort | tr -d '\n' > "$ours_norm"
  tr -d '[:space:]' < "$theirs_tmp" | fold -w1 | sort | tr -d '\n' > "$theirs_norm"

  if cmp -s "$ours_norm" "$theirs_norm"; then
    git checkout --ours -- "$file"
    git add "$file"
  else
    manual_merge_required+=("$file")
    echo "File: $file" >> "$manual_merge_log"
    diff_output=$(diff -u "$ours_tmp" "$theirs_tmp")
    diff_line_count=$(echo "$diff_output" | wc -l)

    if [[ $diff_line_count -le 40 ]]; then
      echo "Diff between versions:" >> "$manual_merge_log"
      echo "$diff_output" >> "$manual_merge_log"
    else
      echo "Diff too large to display (>$diff_line_count lines), skipping detailed diff." >> "$manual_merge_log"
    fi
    echo "" >> "$manual_merge_log"
  fi
done

rm -f "$ours_tmp" "$theirs_tmp" "$ours_norm" "$theirs_norm"

if [ ${#manual_merge_required[@]} -eq 0 ]; then
  echo "All conflicts auto-resolved."
else
  echo "Files needing manual merge resolution:"
  for file in "${manual_merge_required[@]}"; do
    echo "$file"
  done
  echo ""
  echo "Detailed manual merge info logged to $manual_merge_log"
fi
