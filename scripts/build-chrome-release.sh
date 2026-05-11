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

SOURCE_VERSION="$(python3 - <<'PY' "$MANIFEST_PATH"
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as f:
    data = json.load(f)

print(data["version"])
PY
)"
VERSION="${AES_RELEASE_VERSION:-$SOURCE_VERSION}"

ZIP_NAME="aes-tabs-for-autotask-chrome-v${VERSION}.zip"
ZIP_PATH="$DIST_DIR/$ZIP_NAME"
LEGACY_ZIP_PATH="$DIST_DIR/autotask-enhancement-suite-chrome-v${VERSION}.zip"

mkdir -p "$DIST_DIR"
rm -f "$ZIP_PATH"
rm -f "$LEGACY_ZIP_PATH"
TMP_DIR="$(mktemp -d "$DIST_DIR/chrome-release.XXXXXX")"
trap 'rm -rf "$TMP_DIR"' EXIT

rsync -a --delete --exclude 'src/aes-local-flags.js' "$EXT_DIR/" "$TMP_DIR/"

python3 - <<'PY' "$TMP_DIR/manifest.json" "$VERSION"
import json
import sys

path = sys.argv[1]
release_version = sys.argv[2]
with open(path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

manifest["version"] = release_version
manifest["permissions"] = [
    permission for permission in manifest.get("permissions", [])
    if permission != "declarativeNetRequest"
]

for script in manifest.get("content_scripts", []):
    script["js"] = [
        item for item in script.get("js", [])
        if item != "src/aes-local-flags.js"
    ]

with open(path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)
    f.write("\n")
PY

(
  cd "$TMP_DIR"
  zip -rq "$ZIP_PATH" .
)

echo "Built Chrome release package:"
echo "$ZIP_PATH"
