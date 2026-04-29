# Autotask Enhancement Suite

Autotask Enhancement Suite is a browser extension that improves the Autotask web interface with a native-feeling tab system, smarter navigation, optional UI enhancements, phone links, map helpers, and other workflow improvements.

It is built for people who spend a lot of time in Autotask and want a smoother, less cluttered workflow without constantly jumping between browser tabs and popup windows.

## Features

- Open supported Autotask pages inside an in-app tab bar instead of separate browser tabs or popups
- Restore tabs after refresh and optionally remember them between browser sessions
- Split tabs side by side
- Drag, pin, and color tabs for better organization
- Show richer tab titles and metadata for supported pages
- Make phone numbers clickable with `tel:` links
- Open map/location links in an in-page modal
- Add an integrated settings panel inside Autotask

## Browser Support

- `chrome-extension/`: primary extension build
- `firefox-extension/`: Firefox build

## Installation

### Chrome

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select the `chrome-extension/` folder from this repository

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click `Load Temporary Add-on...`
3. Select `firefox-extension/manifest.json`

## Updating

If you cloned the repository with Git, update to the latest version with:

```bash
git pull
```

Then reload the extension in your browser.

## Privacy

See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for the repository privacy policy used for store/distribution documentation.

## Project Structure

- `chrome-extension/`: loadable Chrome extension build
- `firefox-extension/`: loadable Firefox extension build
- `docs/HANDOFF.md`: current project handoff, status, and release notes
- `docs/ARCHITECTURE.md`: source layout and contributor/LLM orientation
- `assets/`: source artwork and shared project assets
- `legacy-userscripts/`: historical userscript-era reference files
- `scripts/verify-extension-sources.sh`: lightweight validation helper

## Main Source Files

Inside `chrome-extension/src/` and `firefox-extension/src/`:

- `content-tabs.js`: bootstrap entrypoint
- `aes-shared.js`: shared constants, route handling, helpers
- `aes-storage.js`: settings and tab persistence
- `aes-phone-links.js`: phone-number detection and `tel:` enhancement
- `aes-page-bridge.js`: page-context bridge for script-driven Autotask navigation
- `aes-iframe-bridge.js`: iframe-side metadata and navigation interception
- `aes-shell.js`: tab shell, settings modal, split view, map modal, layout sync
- `aes-background.js`: toolbar action handling

## Validation

Run the lightweight source checks before packaging or releasing:

```bash
scripts/verify-extension-sources.sh
```
