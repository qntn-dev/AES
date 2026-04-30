# Autotask Enhancement Suite Handoff

Last updated: 2026-04-29
Current snapshot: `0.6.0`

This document is the handoff point for continuing work on Autotask Enhancement Suite. It replaces the older extension-readiness notes, which were written before the project became a full browser extension.

## Current Status

Autotask Enhancement Suite is now a WebExtension with Chrome and Firefox source folders. Chrome is the primary build, Firefox mirrors the same runtime files with a Firefox-compatible manifest/background setup.

The extension is intentionally limited at runtime to regional Autotask hosts matching `ww##.autotask.net`. The manifests still use broad `https://*.autotask.net/*` patterns because browser match patterns cannot express `ww` plus digits, but the runtime gate exits immediately on hosts such as `www.autotask.net` or `autotask.net`.

## Source Of Truth

- `chrome-extension/src/` and `firefox-extension/src/` contain the active runtime files.
- Chrome and Firefox runtime files should remain identical. Browser-specific differences should live in `manifest.json`, packaging, or docs unless there is a strong reason.
- `chrome-extension/` and `firefox-extension/` are the maintained browser builds.
- `legacy-userscripts/` contains historical userscript-era reference files only.
- `scripts/verify-extension-sources.sh` runs lightweight syntax, manifest, and Chrome/Firefox parity checks for both active builds.
- `scripts/build-chrome-release.sh` and `scripts/build-firefox-release.sh` write the Chrome `.zip` and Firefox `.xpi` release artifacts to `dist/`.

## Main Runtime Files

These files live under both `chrome-extension/src/` and `firefox-extension/src/`.

- `aes-shared.js`: shared constants, handled route matching, host gating, URL helpers, feature gates.
- `aes-storage.js`: persisted settings and tab/session restore.
- `aes-phone-links.js`: optional phone number detection and `tel:` link wrapping.
- `aes-page-bridge.js`: page-context bridge that intercepts Autotask-owned navigation APIs, `window.open`, middle-click behavior, map opens, and duplicate/background tab opens.
- `aes-iframe-bridge.js`: iframe-side metadata extraction, navigation interception, map button enhancement, UI Enhancement CSS for legacy pages.
- `aes-shell.js`: top-level tab shell, tab layout, settings modal, native Autotask menu integration, split view, map modal, context menu, drag/pin/color tabs, non-iframe experiment.
- `content-tabs.js`: bootstrap script that coordinates startup in top and iframe contexts.
- `aes-background.js`: browser toolbar action handler.

## Current Feature Set

- AES tab shell for supported Autotask pages that would otherwise open in browser tabs, popups, or the Home iframe.
- Support for tickets, organizations/accounts, contacts, resources, contracts, projects, project tasks, recurring tickets, LiveLinks, directory/admin pages, timesheets, devices, notes, opportunities, sales orders, purchase orders, quotes, quote templates, contact groups, billing products, ticket charges, shipping/print-related destinations, and other handled MVC/legacy routes.
- Middle-click on supported Autotask links opens a background AES tab and keeps focus on the current tab, browser-style.
- Left-click opens/focuses an AES tab where supported.
- Split-screen support through the tab right-click menu.
- Tab organization: drag tabs, pin tabs, color tabs, duplicate tabs, peek tabs, and copy tab/ticket info from context menu actions.
- The tab context menu includes `Refresh tab` as its first action, which reloads that tab's iframe without refreshing the full browser page.
- Rich tab metadata for supported pages, including ticket title/number/account/resource avatar or initials, project metadata, timesheet date/resource, contact/account metadata, and LiveLinks icon handling.
- Tab metadata customization lets users choose what appears on Line 2 and Line 3 per tab type, with a `Set to recommended` shortcut for the preferred layout.
- Metadata is refreshed automatically on a lightweight timer for all loaded custom tabs, including background tabs. This does not reload pages; it asks each iframe bridge to re-report its current metadata.
- Custom tab hover cards instead of native browser URL tooltips.
- Optional tab restore after browser close via extension storage.
- Optional clickable phone numbers inside Autotask pages.
- Organization map button interception: Autotask map links open in an AES modal instead of a browser tab.
- AES Settings lives inside the native Autotask sidebar as `AES Settings`.
- Toolbar extension icon opens the same AES Settings modal.
- Autotask UI Enhancement toggle gates legacy visual tweaks, hidden redundant legacy title bars, modern button styling, dark-mode background normalization, Early Access label hiding, and related UI adjustments.
- Optional Resource Planner replacement changes the native Calendar button into a Resource Planner shortcut and hides the dropdown chevron.
- Optional beta all-pages tab bar shows the AES tab bar on modern non-iframe Onyx pages. New non-iframe Onyx pages still render on Home because AES tabs depend on iframe-backed pages.
- Optional beta resizable vertical tab bar supports compact icon-only mode and delayed hover expansion.
- Experimental page redesign toggles are currently hidden in public builds via `SHOW_PAGE_REDESIGN_EXPERIMENTS = false`. The dormant runtime code remains in place for local testing, but users will not see those settings unless the flag is enabled in local source.
- Peek uses the already-loaded tab iframe where possible, has smoother open/close animation, and includes configurable outside-click close confirmation.
- Full extension disable toggle keeps settings reachable while suppressing AES behavior.

## Settings Structure

The settings modal is organized into pages:

- General: enable/disable the extension and choose theme behavior.
- UI Enhancement: Autotask UI Enhancement, hide Early Access labels, and Resource Planner replacement.
- Tab bar: orientation, new-tab placement, visibility, persistence, and Peek close confirmation.
- Customization: per-tab-type Line 2 / Line 3 metadata choices and recommended defaults.
- Experimental: beta layout features. Page-specific redesign experiments are hidden in public builds unless `SHOW_PAGE_REDESIGN_EXPERIMENTS` is enabled locally.
- Miscellaneous: phone number linking.

## Beta Work In This Snapshot

These features are intentionally labeled beta in settings because they touch broader Autotask layout behavior:

- `[BETA] Show tab bar on all Autotask pages`: shows the AES tab bar on modern top-level Onyx pages that do not use the classic iframe layout. The page itself stays on Home because new Onyx pages are not iframe-backed.
- `[BETA] Allow resizing of the vertical tab bar`: allows resizing the vertical tab bar. Very narrow widths switch to icon-only mode and expand on hover after a short delay.

These should be tested carefully after Autotask UI updates.

## Important Guardrails

- Do not inject or run behavior on print/authentication views. The shared excluded route list includes print-related paths and Autotask authentication.
- Keep the runtime host gate in place. The extension should only actively run on `ww##.autotask.net`.
- Do not reintroduce the settings cog into the AES tab bar as the primary settings entry point. The native Autotask sidebar item is the intended entry point.
- UI Enhancement changes should respect the master extension toggle and the Autotask UI Enhancement toggle.
- Middle-click must open in the background. Left-click may focus/open.
- Keep beta features separately toggleable. Do not make broad Autotask layout behavior mandatory.

## Verification Checklist

Before a stable release, verify in Chrome at minimum:

- Extension loads only on `ww##.autotask.net` hosts.
- AES Settings appears once in the top-level native Autotask sidebar.
- Master disable toggle disables enhancements but leaves settings accessible.
- Native Autotask navigation changes the active AES state back to Home/native content.
- Supported links from iframes and top navigation open in AES tabs.
- Middle-click opens a background tab without stealing focus.
- Home tab spinner clears correctly after native iframe loads.
- Refreshing the browser while a custom tab is active does not let that tab's title overwrite the Home tab label.
- `Refresh tab` in the tab context menu reloads only the selected custom-tab iframe.
- Context menus and hover dropdowns inside Autotask iframe pages still work.
- Vertical tab bar, pinned tabs, colored tabs, drag/drop, split view, and tab overflow still behave correctly.
- Non-iframe tab bar experiment does not crash or overlap unusably on modern Onyx pages.
- Phone number links do not match dates, ticket numbers, or URL fragments.
- Print/authentication pages are untouched by AES.
- Release artifacts are rebuilt for the current manifest version: run `scripts/build-chrome-release.sh` and `scripts/build-firefox-release.sh`, then confirm both files exist in `dist/`.

## Release Notes For Current Snapshot

New features:
- Added AES Tab Bar support for Devices / Installed Products, Notes, Opportunities, Sales Orders, Purchase Orders, Quotes, Quote Templates, Contact Groups, Billing Products, and Ticket Charges.
- Added Autotask-style Font Awesome icons for tabs and tab menu actions.
- Added tab metadata customization with `Set to recommended`.
- Added a setting to choose whether new tabs open at the start or end of the tab bar.
- Added in-app release notes that appear after extension updates, with GitHub, remind next time, and hide until next release actions.

Improvements:
- Device and ticket metadata can now be used on tab lines, including device details, ticket status/priority, and last activity.
- The Customization page is larger and labels Line 2 / Line 3 clearly.
- Tabs restore more smoothly after browser refresh, and closing a child tab returns to the previous tab when possible.
- The tab right-click menu is cleaner, with colors moved into a side menu.

Fixes:
- Fixed opportunity tabs sometimes showing the wrong title.
- Fixed Shipping sometimes opening as a separate AES tab.
- Fixed hover card copy buttons and several icon/menu layout issues.
- Fixed a Workspace & Queues crash caused by AES styling Autotask's large hover overlay previews.
