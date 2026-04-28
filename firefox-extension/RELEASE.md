# Firefox Release Notes

## Local Testing

1. Open `about:debugging#/runtime/this-firefox`
2. Click `Load Temporary Add-on...`
3. Choose `manifest.json` from this folder.
4. Verify:
   - ticket/account/contract tab opening
   - refresh restore behavior
   - top navigation dropdown layering
   - Home layout spacing
   - settings modal toggles
   - clickable phone number toggle and `tel:` links inside iframe pages

## Packaging

Create a zip from the contents of this folder, not the folder itself.

For publication, submit the zip to Mozilla Add-ons for signing.
