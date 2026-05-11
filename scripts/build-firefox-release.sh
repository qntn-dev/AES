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

SOURCE_VERSION="$(python3 - <<'PY' "$MANIFEST_PATH"
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as f:
    data = json.load(f)

print(data["version"])
PY
)"
VERSION="${AES_RELEASE_VERSION:-$SOURCE_VERSION}"

XPI_NAME="aes-tabs-for-autotask-firefox-v${VERSION}.xpi"
XPI_PATH="$DIST_DIR/$XPI_NAME"
LEGACY_XPI_PATH="$DIST_DIR/autotask-enhancement-suite-firefox-v${VERSION}.xpi"

mkdir -p "$DIST_DIR"
rm -f "$XPI_PATH"
rm -f "$LEGACY_XPI_PATH"
TMP_DIR="$(mktemp -d "$DIST_DIR/firefox-release.XXXXXX")"
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

background = manifest.get("background")
if isinstance(background, dict):
    background["scripts"] = [
        item for item in background.get("scripts", [])
        if item != "src/aes-local-flags.js"
    ]

with open(path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)
    f.write("\n")
PY

(
  cd "$TMP_DIR"
  zip -rq "$XPI_PATH" .
)

echo "Built Firefox release package:"
echo "$XPI_PATH"
