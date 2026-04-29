#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EXT_DIR="$ROOT_DIR/firefox-extension"
DIST_DIR="$ROOT_DIR/dist"
MANIFEST_PATH="$EXT_DIR/manifest.json"

if [[ ! -f "$MANIFEST_PATH" ]]; then
  echo "Manifest not found: $MANIFEST_PATH" >&2
  exit 1
fi

VERSION="$(python3 - <<'PY' "$MANIFEST_PATH"
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as f:
    data = json.load(f)

print(data["version"])
PY
)"

XPI_NAME="autotask-enhancement-suite-firefox-v${VERSION}.xpi"
XPI_PATH="$DIST_DIR/$XPI_NAME"

mkdir -p "$DIST_DIR"
rm -f "$XPI_PATH"

(
  cd "$EXT_DIR"
  zip -rq "$XPI_PATH" .
)

echo "Built Firefox release package:"
echo "$XPI_PATH"
