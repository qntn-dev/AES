# Autotask Enhancement Suite

Autotask Enhancement Suite is a browser extension project that improves the Autotask web interface with a native-feeling tab system, navigation interception, UI enhancements, settings, phone links, map helpers, and related workflow improvements.

## Repository Layout

- `chrome-extension/`: main active codebase and primary source of truth
- `firefox-extension/`: Firefox build, generally kept in sync with the Chrome build
- `safari-extension/`: Safari conversion project
- `dist/`: generated release artifacts for local packaging only
- `PROJECT_HANDOFF.md`: living implementation and debugging history for LLM handoff continuity
- `AUTOTASK_ENHANCEMENT_SUITE_EXTENSION_READINESS.md`: Chrome Web Store readiness notes
- `autotask-iframe-simple.legacy.js`, `autotask-iframe.user.legacy.js`, `autotask-iframe-tabs.js`: historical userscript-era reference files

## Main Source Files

Inside `chrome-extension/`:

- `content-tabs.js`: bootstrap entrypoint
- `aes-shared.js`: shared constants, route handling, helpers
- `aes-storage.js`: settings and tab persistence
- `aes-phone-links.js`: phone-number detection and `tel:` enhancement
- `aes-page-bridge.js`: page-context bridge for script-driven Autotask navigation
- `aes-iframe-bridge.js`: iframe-side metadata and navigation interception
- `aes-shell.js`: tab shell, settings modal, split view, map modal, layout sync
- `aes-background.js`: toolbar action handling

## Local Development

### Chrome

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select the `chrome-extension/` folder

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click `Load Temporary Add-on...`
3. Select `firefox-extension/manifest.json`

### Safari

The Safari project lives in `safari-extension/` and is generated from the WebExtension source. Local Xcode build output is intentionally ignored from version control.

## GitHub Notes

This repository is configured to keep local-only and private artifacts out of source control, including:

- packaged extension archives
- signing keys such as `.pem`
- generated Safari/Xcode build output
- local HTML capture/debug files
- macOS metadata files

If you publish this repository, commit the source folders and docs, not the generated release artifacts.
