# Autotask Enhancement Suite for Firefox

Firefox build of the Autotask Enhancement Suite extension.

## Temporary Install

1. Open `about:debugging#/runtime/this-firefox`
2. Click `Load Temporary Add-on...`
3. Select `firefox-extension/manifest.json` from this repository

Temporary add-ons are removed when Firefox restarts.

## Notes

- This build uses the same content modules as the Chrome extension.
- `aes-page-bridge.js` is exposed as a web-accessible resource so script-driven Autotask navigation can be routed into the tab system.
- Firefox supports the `chrome.*` WebExtension compatibility namespace used by these scripts.
- The extension declares the `storage` permission so tab and settings persistence can use extension storage.
- For a signed/distributed Firefox add-on, package this folder as a `.zip` and submit it through Mozilla Add-ons.
