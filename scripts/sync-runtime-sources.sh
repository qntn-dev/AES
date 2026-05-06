#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CHROME_SRC="$ROOT_DIR/chrome-extension/src/"
FIREFOX_SRC="$ROOT_DIR/firefox-extension/src/"
SAFARI_SRC="$ROOT_DIR/dist/safari/Autotask Enhancement Suite/Autotask Enhancement Suite Extension/Resources/src/"

rsync -a --delete "$CHROME_SRC" "$FIREFOX_SRC"

if [[ -d "$SAFARI_SRC" ]]; then
  rsync -a --delete "$CHROME_SRC" "$SAFARI_SRC"
fi

echo "Synced runtime sources from Chrome to Firefox"
if [[ -d "$SAFARI_SRC" ]]; then
  echo "Synced runtime sources from Chrome to Safari"
else
  echo "Safari runtime source folder not found; skipped Safari sync"
fi
