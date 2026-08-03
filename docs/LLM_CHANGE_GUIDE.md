# AES change guide for LLMs and contributors

AES is a no-build WebExtension project. Chrome and Firefox folders must remain directly loadable, and runtime source files must stay identical across Chrome, Firefox, and the Safari runtime copy when it exists.

## Start here

- Change Chrome runtime source first in `chrome-extension/src/`.
- Run `scripts/sync-runtime-sources.sh` after runtime edits to mirror Chrome into Firefox and Safari.
- Run `scripts/verify-extension-sources.sh` before packaging or handing work off.
- Do not introduce bundlers, generated source, minifiers, TypeScript, or template engines.

## Common changes

- Add AES tab compatibility: pages open in AES by default via the "Increase page compatibility" setting, so no route entry is needed to make a page work. Add a route to `tabTypeForUrl` in `aes-shell.js` only to give the tab a proper icon and type, and to `aes-iframe-bridge.js` only when the tab needs custom metadata. Add to `EXCLUDED_PATHS` / `EXCLUDED_PATH_INCLUDES` in `aes-routes.js` when a page must stay out of AES.
- Change tab metadata display options: edit `aes-shell-config.js` for tab line options, defaults, labels, and customization icons.
- Change metadata extraction: edit `aes-iframe-bridge.js` for iframe-page extraction and `aes-shell.js` only when shell-side fallback/type handling changes.
- Change settings: edit the settings modal section in `aes-shell.js` and keep reset/default logic in the same pass. Rounded page frames, improved scrollbars, and phone links are normal settings, not experimental settings.
- Change styling: edit `aes-shell-styles.js` for shell CSS. Smoke test Chrome and Safari after frame, Peek, settings, or tab bar styling changes.
- Change Peek behavior: edit Peek handling in `aes-shell.js` and iframe routing in `aes-iframe-bridge.js` when a programmatic popup/click path is involved.
- Change Safari behavior: edit Chrome runtime source, sync to Safari with `scripts/sync-runtime-sources.sh`, then rebuild Safari. Do not manually maintain Safari-only runtime drift unless the code explicitly gates WebKit behavior.

## Guardrails

- Route eligibility is centralized in `aes-routes.js`. That file must stay available in both content-script world and page-injected bridge world; `aes-iframe-bridge.js` injects `aes-routes.js` before `aes-page-bridge.js`.
- If a settings row is removed, also remove its reset/default/input references.
- If a runtime file is added, update both manifests and `scripts/verify-extension-sources.sh`.
- If Firefox validation warns about dynamic HTML APIs, prefer DOM construction helpers over `innerHTML` or `createContextualFragment`.
- `extractHandledUrlFromPageObject` in `aes-page-bridge.js` must keep using `isKnownRoutePath` / `isKnownRouteUrl`. It scans arbitrary page strings, so the broad compatibility rule would make it match the first string that looks like a path.
- Route behavior is asserted by `scripts/check-route-behavior.js`. Run it alongside `scripts/check-route-allowlists.js` after touching `aes-routes.js`.
