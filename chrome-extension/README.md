# Autotask Enhancement Suite

This is the first Chrome extension scaffold for the current Autotask work.

## Current setup

- `aes-shared.js`: shared constants and URL helpers
- `aes-storage.js`: settings and persistence backend logic
- `aes-phone-links.js`: phone number detection and `tel:` link creation
- `aes-page-bridge.js`: page-context navigation bridge for Autotask script-driven opens
- `aes-iframe-bridge.js`: iframe-side click interception and page metadata reporting
- `aes-shell.js`: top-page tab shell, settings modal, layout sync, and navigation handling
- `content-tabs.js`: tiny bootstrap that wires the modules together
- `icons/`: generated Chrome extension icon set based on the original ticket + toolbox artwork
- `CHANGELOG.md`: human-readable version history
- `RELEASE.md`: simple local release checklist

## Load in Chrome

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select the `chrome-extension/` folder from this repository

## Notes

- This first pass intentionally enables only the tab-based experience.
- The tab-based script is the actively maintained version.
- The extension now has packaged icon assets wired into `manifest.json`.
- The extension entrypoint no longer includes userscript metadata.
- Next good steps would be:
  - add a popup/options page only if the in-page settings modal ever becomes limiting
