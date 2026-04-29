# Release Notes

## Local development

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked` or `Reload`
4. Point Chrome at the `chrome-extension/` folder in this repository.

## Versioning

- Update `manifest.json` version when shipping user-visible changes.
- Add a short entry to `CHANGELOG.md` for each new version.

## Suggested release checklist

1. Reload the unpacked extension.
2. Verify:
   - ticket/account/contract tab opening
   - refresh restore behavior
   - top navigation dropdown layering
   - Home layout spacing
   - settings modal toggles
   - clickable phone number toggle and `tel:` links inside iframe pages
3. Build both release artifacts:
   - `scripts/build-chrome-release.sh`
   - `scripts/build-firefox-release.sh`
4. Confirm `dist/` contains the Chrome `.zip` and Firefox `.xpi` for the current manifest version.
5. If icons changed, confirm the extension icon updated in Chrome.
6. Commit both source and extension-folder changes together.
