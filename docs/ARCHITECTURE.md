# Autotask Enhancement Suite Architecture

This project is a browser extension with two actively maintained WebExtension builds:

- `chrome-extension/`
- `firefox-extension/`

Users can load either folder directly in the browser. There is intentionally no required build step for normal development or manual installation.

## Source Layout

```text
chrome-extension/
  manifest.json
  icons/
  src/

firefox-extension/
  manifest.json
  icons/
  src/

docs/
legacy-userscripts/
scripts/
assets/
```

## Runtime Source

The active runtime files live in both browser folders under `src/`:

- `aes-shared.js`: shared constants, route matching, host gates, and feature gates.
- `aes-storage.js`: settings, persistence, and tab/session restore.
- `aes-phone-links.js`: optional phone-number detection and `tel:` link wrapping.
- `aes-page-bridge.js`: page-context interception for Autotask script-driven navigation.
- `aes-iframe-bridge.js`: iframe metadata extraction, map-button interception, and iframe-side navigation handling.
- `aes-shell.js`: top-level tab shell, settings UI, tab behavior, split view, Peek, map modal, and layout sync.
- `content-tabs.js`: bootstrap entrypoint for top-frame and iframe contexts.
- `aes-background.js`: browser toolbar action handler.

Chrome and Firefox runtime files should stay identical. If you change one, make the same change in the other and run:

```bash
scripts/verify-extension-sources.sh
```

Browser-specific differences should normally be limited to `manifest.json`, packaging notes, or store metadata.

## Development Rules

- Load `chrome-extension/` in Chrome for day-to-day testing.
- Keep `firefox-extension/src/` mirrored with `chrome-extension/src/`.
- Do not edit files in `legacy-userscripts/` for active features; they are reference-only.
- Keep release artifacts in `dist/` or local ignored files, not tracked source folders.
- Keep local-only helpers out of Git unless they are useful to other contributors.

## Important Runtime Constraints

- The manifests must use broad Autotask match patterns because browser match patterns cannot express only `ww##.autotask.net`.
- Runtime host gating in `aes-shared.js` must continue to block `www.autotask.net`, bare `autotask.net`, authentication pages, and print views.
- The AES Settings entry belongs in the native Autotask sidebar, not in the AES tab bar.
- Beta layout features should remain separately toggleable.
- Middle-click behavior should open a background AES tab without stealing focus.

## Validation

Before packaging, releasing, or asking another LLM to continue work, run:

```bash
scripts/verify-extension-sources.sh
```

The verifier checks JavaScript syntax, manifest versions, and Chrome/Firefox runtime parity.
