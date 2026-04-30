#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EXT_DIR="$ROOT_DIR/chrome-extension"
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

ZIP_NAME="autotask-enhancement-suite-chrome-v${VERSION}.zip"
ZIP_PATH="$DIST_DIR/$ZIP_NAME"

mkdir -p "$DIST_DIR"
rm -f "$ZIP_PATH"

(
  cd "$EXT_DIR"
  zip -rq "$ZIP_PATH" .
)

echo "Built Chrome release package:"
echo "$ZIP_PATH"
