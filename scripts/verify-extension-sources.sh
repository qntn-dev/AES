#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

check_js() {
  local dir="$1"
  shift
  for file in "$@"; do
    node --check "$ROOT_DIR/$dir/$file" >/dev/null
  done
}

check_manifest() {
  local manifest="$1"
  node -e '
    const fs = require("fs");
    const manifest = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    if (!manifest.version) throw new Error("manifest.version is missing");
    console.log(`${process.argv[1]} ${manifest.version}`);
  ' "$ROOT_DIR/$manifest"
}

check_manifest_paths() {
  local extension_dir="$1"
  node -e '
    const fs = require("fs");
    const path = require("path");
    const dir = process.argv[1];
    const manifestPath = path.join(dir, "manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const paths = [];

    for (const script of manifest.content_scripts || []) {
      paths.push(...(script.js || []));
    }

    if (manifest.background) {
      if (manifest.background.service_worker) paths.push(manifest.background.service_worker);
      paths.push(...(manifest.background.scripts || []));
    }

    for (const resource of manifest.web_accessible_resources || []) {
      paths.push(...(resource.resources || []));
    }

    for (const rel of paths) {
      const full = path.join(dir, rel);
      if (!fs.existsSync(full)) {
        throw new Error(`${manifestPath} references missing file: ${rel}`);
      }
    }
  ' "$ROOT_DIR/$extension_dir"
}

runtime_files=(
  "src/aes-routes.js"
  "src/aes-shell-settings-ui.js"
  src/aes-background.js
  src/aes-iframe-runtime.js
  src/aes-iframe-bridge.js
  src/aes-page-bridge.js
  src/aes-phone-links.js
  src/aes-ticket-links.js
  src/aes-shared.js
  src/aes-shell-runtime.js
  src/aes-shell-config.js
  src/aes-shell-styles.js
  src/aes-shell.js
  src/aes-storage.js
  src/content-tabs.js
)

check_js chrome-extension "${runtime_files[@]}"
check_js firefox-extension "${runtime_files[@]}"

safari_runtime_dir="dist/safari/Autotask Enhancement Suite/Autotask Enhancement Suite Extension/Resources"
if [[ -d "$ROOT_DIR/$safari_runtime_dir/src" ]]; then
  check_js "$safari_runtime_dir" "${runtime_files[@]}"
fi

chrome_version="$(node -e 'console.log(require(process.argv[1]).version)' "$ROOT_DIR/chrome-extension/manifest.json")"
firefox_version="$(node -e 'console.log(require(process.argv[1]).version)' "$ROOT_DIR/firefox-extension/manifest.json")"

if [[ "$chrome_version" != "$firefox_version" ]]; then
  echo "Chrome/Firefox manifest versions differ: $chrome_version vs $firefox_version" >&2
  exit 1
fi

check_manifest chrome-extension/manifest.json
check_manifest firefox-extension/manifest.json
check_manifest_paths chrome-extension
check_manifest_paths firefox-extension
if [[ -f "$ROOT_DIR/$safari_runtime_dir/manifest.json" ]]; then
  check_manifest "$safari_runtime_dir/manifest.json"
  check_manifest_paths "$safari_runtime_dir"
fi
node "$ROOT_DIR/scripts/check-route-allowlists.js"

for file in "${runtime_files[@]}"; do
  if ! cmp -s "$ROOT_DIR/chrome-extension/$file" "$ROOT_DIR/firefox-extension/$file"; then
    echo "Chrome/Firefox runtime files differ: $file" >&2
    exit 1
  fi
  if [[ -d "$ROOT_DIR/$safari_runtime_dir/src" ]] && ! cmp -s "$ROOT_DIR/chrome-extension/$file" "$ROOT_DIR/$safari_runtime_dir/$file"; then
    echo "Chrome/Safari runtime files differ: $file" >&2
    echo "Run scripts/sync-runtime-sources.sh before building Safari." >&2
    exit 1
  fi
done

echo "Extension source verification passed."
