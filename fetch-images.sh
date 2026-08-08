#!/bin/bash
# Downloads every portfolio image from the Squarespace CDN into assets/img/.
# Run once from this folder:   bash fetch-images.sh
# Safe to re-run — files already downloaded are skipped.

set -u
cd "$(dirname "$0")"
LIST="assets/images.tsv"
[ -f "$LIST" ] || { echo "Missing $LIST. Run this from the site folder."; exit 1; }

total=$(wc -l < "$LIST" | tr -d ' ')
n=0; got=0; failed=0

while IFS=$'\t' read -r path url; do
  [ -z "${path:-}" ] && continue
  n=$((n+1))
  if [ -f "$path" ]; then
    printf "\r[%s/%s] skipping existing files…" "$n" "$total"
    continue
  fi
  mkdir -p "$(dirname "$path")"
  if curl -sSfL --retry 3 --max-time 90 -o "$path" "$url"; then
    got=$((got+1))
    printf "\r[%s/%s] %s" "$n" "$total" "$path"
  else
    failed=$((failed+1))
    rm -f "$path"
    echo ""
    echo "  could not download: $url"
  fi
done < "$LIST"

echo ""
echo "Downloaded $got new files. $failed failed. Open index.html to view the site."
