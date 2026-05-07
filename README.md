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

All Chromium- and Gecko-based browsers are supported. Note that some features may be limited on niche browsers like Arc or Helium. For example, in an upcoming update the Sidebar API will be utilized which is not available on Arc.

![Chromium](https://img.shields.io/badge/Chromium-supported-4285F4?logo=googlechrome&logoColor=white)
![Firefox](https://img.shields.io/badge/Firefox-supported-FF7139?logo=firefoxbrowser&logoColor=white)
![Safari](https://img.shields.io/badge/Safari-not%20yet%20supported-999999?logo=safari&logoColor=white)

- `chrome-extension/`: Chromium-based browser build
- `firefox-extension/`: Gecko-based browser build

## Manual Installation

Autotask Enhancement Suite is currently awaiting approval from Mozilla for release in the Firefox Add-ons store. Until then, install it manually with the steps below.

### Chrome

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select the `chrome-extension/` folder from this repository

### Firefox

1. Use Firefox Developer Edition, Firefox Nightly, or Firefox ESR. Standard Firefox Release does not allow persistent unsigned extensions.
2. Open `about:config`
3. Set `xpinstall.signatures.required` to `false`
4. Open `about:addons`
5. Click the gear icon
6. Choose `Install Add-on From File...`
7. Select the packaged Firefox `.xpi` from `dist/`

For quick temporary testing, you can still use `about:debugging#/runtime/this-firefox`, click `Load Temporary Add-on...`, and select `firefox-extension/manifest.json`. Temporary add-ons are removed when Firefox restarts.

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
- `docs/ARCHITECTURE.md`: public source layout and contributor orientation
- `scripts/verify-extension-sources.sh`: lightweight validation helper
- `scripts/build-chrome-release.sh`: creates the Chrome release package in `dist/`
- `scripts/build-firefox-release.sh`: creates the Firefox release package in `dist/`

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

## Packaging

Build release packages from the current manifest versions:

```bash
scripts/build-chrome-release.sh
scripts/build-firefox-release.sh
```

Generated release packages are written to `dist/`.
