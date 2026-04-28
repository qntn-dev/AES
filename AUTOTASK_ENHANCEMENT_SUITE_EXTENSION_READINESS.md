# Autotask Enhancement Suite Handoff

Last updated: 2026-04-28  
Current snapshot: `0.4.4-experimental`

This document is the handoff point for continuing work on Autotask Enhancement Suite. It replaces the older extension-readiness notes, which were written before the project became a full browser extension.

## Current Status

Autotask Enhancement Suite is now a WebExtension with Chrome and Firefox source folders. Chrome is the primary build, Firefox mirrors the same runtime files with a Firefox-compatible manifest/background setup.

The extension is intentionally limited at runtime to regional Autotask hosts matching `ww##.autotask.net`. The manifests still use broad `https://*.autotask.net/*` patterns because browser match patterns cannot express `ww` plus digits, but the runtime gate exits immediately on hosts such as `www.autotask.net` or `autotask.net`.

## Source Of Truth

- `chrome-extension/` is the primary implementation.
- `firefox-extension/` should stay functionally mirrored with Chrome.
- `safari-extension/` exists as a conversion project, but Chrome/Firefox are the active builds.
- Legacy userscript files remain as historical references only.

## Main Runtime Files

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
- Support for tickets, organizations/accounts, contacts, resources, contracts, projects, project tasks, recurring tickets, LiveLinks, directory/admin pages, timesheets, shipping/print-related destinations, and other handled MVC/legacy routes.
- Middle-click on supported Autotask links opens a background AES tab and keeps focus on the current tab, browser-style.
- Left-click opens/focuses an AES tab where supported.
- Split-screen support through the tab right-click menu.
- Tab organization: drag tabs, pin tabs, color tabs, duplicate tabs, peek tabs, and copy tab/ticket info from context menu actions.
- Rich tab metadata for supported pages, including ticket title/number/account/resource avatar or initials, project metadata, timesheet date/resource, contact/account metadata, and LiveLinks icon handling.
- Custom tab hover cards instead of native browser URL tooltips.
- Optional tab restore after browser close via extension storage.
- Optional clickable phone numbers inside Autotask pages.
- Organization map button interception: Autotask map links open in an AES modal instead of a browser tab.
- AES Settings lives inside the native Autotask sidebar as `AES Settings`.
- Toolbar extension icon opens the same AES Settings modal.
- Autotask UI Enhancement toggle gates legacy visual tweaks, hidden redundant legacy title bars, modern button styling, dark-mode background normalization, Early Access label hiding, and related UI adjustments.
- Full extension disable toggle keeps settings reachable while suppressing AES behavior.

## Settings Structure

The settings modal is organized into pages:

- General: enable/disable the extension and choose theme behavior.
- UI Enhancement: Autotask UI Enhancement and hide Early Access labels.
- Tab bar: orientation, visibility, persistence, non-iframe experiment, resizable vertical tab bar.
- Miscellaneous: phone number linking.

## Experimental Work In This Snapshot

This release is intentionally tagged experimental because it includes broader layout experiments:

- `Show on non-iframe pages (test)`: shows the AES tab bar on modern top-level Onyx pages that do not use the classic iframe layout.
- `Resizable vertical tab bar (test)`: allows resizing the vertical tab bar. Very narrow widths switch to icon-only mode and expand on hover after a short delay.
- Native Autotask route changes should now reselect Home/native content when the user navigates with Autotask's own navigation instead of AES tabs.
- Page heading background override was moved into the UI Enhancement stylesheet with matching specificity for `body.FullScroll > .PageHeadingContainer`.

These should be tested carefully before promoting to a stable release.

## Important Guardrails

- Do not inject or run behavior on print/authentication views. The shared excluded route list includes print-related paths and Autotask authentication.
- Keep the runtime host gate in place. The extension should only actively run on `ww##.autotask.net`.
- Do not reintroduce the settings cog into the AES tab bar as the primary settings entry point. The native Autotask sidebar item is the intended entry point.
- UI Enhancement changes should respect the master extension toggle and the Autotask UI Enhancement toggle.
- Middle-click must open in the background. Left-click may focus/open.
- Do not push experimental work as a normal stable release unless it has been tested in Autotask.

## Verification Checklist

Before a stable release, verify in Chrome at minimum:

- Extension loads only on `ww##.autotask.net` hosts.
- AES Settings appears once in the top-level native Autotask sidebar.
- Master disable toggle disables enhancements but leaves settings accessible.
- Native Autotask navigation changes the active AES state back to Home/native content.
- Supported links from iframes and top navigation open in AES tabs.
- Middle-click opens a background tab without stealing focus.
- Home tab spinner clears correctly after native iframe loads.
- Context menus and hover dropdowns inside Autotask iframe pages still work.
- Vertical tab bar, pinned tabs, colored tabs, drag/drop, split view, and tab overflow still behave correctly.
- Non-iframe tab bar experiment does not crash or overlap unusably on modern Onyx pages.
- Phone number links do not match dates, ticket numbers, or URL fragments.
- Print/authentication pages are untouched by AES.

## Release Notes For This Experimental Snapshot

New features:
- Added experimental always-visible tab bar support for non-iframe Onyx pages.
- Added experimental resizable vertical tab bar with compact icon-only mode and delayed hover expansion.
- Added full extension enable/disable control in AES Settings.

Improvements:
- Reworked AES Settings into category pages: General, UI Enhancement, Tab bar, and Miscellaneous.
- Improved regional-host safety so AES only runs on `ww##.autotask.net`.
- Restored Home/native activation when navigating via Autotask's native navigation.
- Updated UI Enhancement colors from `#1E2227` to `#1F2227`.
- Added a specific `PageHeadingContainer` white background override under UI Enhancement.

Fixes:
- Prevented AES from running on Autotask authentication pages.
- Added runtime feature gates so iframe/page bridges stop intercepting when the extension is disabled.
- Reduced compact tab bar hover/resize conflicts by suppressing expansion while dragging the resize handle.
