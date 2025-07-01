#!/bin/bash

# Get all files with add/add conflicts
conflicted_files=$(git diff --name-only --diff-filter=U)

for file in $conflicted_files; do
  echo "Checking $file ..."

  # Extract versions to temp files
  git show :2:"$file" > /tmp/ours.tmp
  git show :3:"$file" > /tmp/theirs.tmp

  # Compare the two versions
  if cmp -s /tmp/ours.tmp /tmp/theirs.tmp; then
    echo "No difference found in $file — auto-resolving."
    git add "$file"
  else
    echo "Differences found in $file — manual merge required."
  fi

  # Clean up temp files
  rm /tmp/ours.tmp /tmp/theirs.tmp
done
