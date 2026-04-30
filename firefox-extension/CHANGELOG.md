# Changelog

## 0.6.5

### New:

- Added support for opening external Autotask links directly in AES tabs.
- AES can now let you know when a newer stable version is available on GitHub.
- The Tab Bar now works on more Autotask pages by default, including pages that are not loaded inside an iframe.
- The vertical Tab Bar can now be resized by default.

### Improved:

- Tab Bar resize and "show on all Autotask pages" are now normal Tab Bar settings instead of beta options.
- Tab customization now starts with the recommended layout by default.
- The Organization tab now correctly shows Classification where Autotask uses that field.

### Fixed:

- Fixed settings sometimes falling back to defaults after reloading the extension.
- Fixed the Home tab spinner getting stuck after refreshing Autotask from another AES tab.
- Improved Home tab behavior on newer non-iframe Autotask pages.

## 0.6.2

### Experimental:

- Added support for opening supported external Autotask entity links directly in the AES Tab Bar.
- Added a stable GitHub release check that can notify users when a newer AES version is available before store approval finishes.

## 0.6.0

### New features:

- Added AES Tab Bar support for:
  - Devices / Installed Products
  - Notes
  - Opportunities
  - Sales Orders
  - Purchase Orders
  - Quotes
  - Quote Templates
  - Contact Groups
  - Billing Products
  - Ticket Charges
- Added Autotask-style Font Awesome icons for tabs and tab menu actions.
- Added tab metadata customization for choosing what appears on Line 2 and Line 3 per tab type.
- Added `Set to recommended` in Customization to quickly apply a clean default tab layout.
- Added a Tab Bar setting to open new tabs at the start or end of the tab bar.
- Added richer device and ticket metadata options, including device details, ticket status/priority, last activity, and quick copy buttons.
- Added in-app release notes that appear after extension updates, with options to view GitHub notes, be reminded next time, or hide until the next release.

### Improvements:

- Made the Customization page larger, clearer, and labeled with Line 2 / Line 3 columns.
- Restored tabs now load more smoothly after refreshing the browser.
- Closing a tab now returns you to the tab you came from when possible.
- The right-click menu is cleaner, with tab colors moved into a side menu.
- Hover cards now stay open while your mouse is on them.
- Status and priority can inherit Autotask's color when shown on a tab line.
- Hid and disabled the experimental page-redesign settings by default while they are being stabilized.
- Added a runtime build guard that reloads Autotask once when AES code changes, preventing stale or duplicate content scripts after extension updates.

### Fixes:

- Fixed opportunity tabs sometimes showing the wrong title.
- Fixed Shipping sometimes opening as a separate AES tab.
- Fixed hover card copy buttons.
- Fixed several icon and context-menu layout issues.

## 0.5.2

### New features:

- Added a `Refresh tab` action to the tab right-click menu. It appears at the top of the menu and reloads the selected Autotask iframe.

### Improvements:

- Added a lightweight automatic metadata refresh for all loaded custom tabs, including background tabs, so tab titles and ticket details stay fresher without manually reloading.
- Updated the `Clear tab color` menu icon to better match what the action actually does.

### Fixes:

- Fixed an issue where refreshing the browser could make the Home tab inherit the title of an open custom tab instead of the real Home iframe.

## 0.5.1

### New features:

- Added a Reset settings button in AES Settings to restore extension settings to their defaults while leaving open tabs intact.

### Improvements:

- No additional improvements in this release.

### Fixes:

- No additional fixes in this release.

## 0.5.0

### New features:

- Added `Replace legacy Dispatch Calendar with Resource Planner`, a separate UI Enhancement setting that turns the native Calendar button into a Resource Planner shortcut and removes the dropdown chevron.
- Added `[BETA] Show tab bar on all Autotask pages` for modern non-iframe Onyx pages such as Resource Planner and Umbrella Contracts.
- Added `[BETA] Allow resizing of the vertical tab bar`, including compact icon-only mode and delayed hover expansion.
- Added `[EXPERIMENTAL] Modernize readonly timesheets`, `[EXPERIMENTAL] Modernize Preferences page`, and `[EXPERIMENTAL] Modernize My Workspace & Queues` for scoped legacy-page visual passes.
- Added a full extension enable/disable toggle in AES Settings.
- Added a configurable Peek outside-click close confirmation with a matching AES Settings toggle.

### Improvements:

- Reworked AES Settings into category pages for General, UI Enhancement, Tab bar, and Miscellaneous settings.
- Improved Peek performance by reusing the already-loaded tab iframe when possible.
- Added smoother open and close animations for Peek and AES Settings, respecting reduced-motion preferences.
- Limited active runtime behavior to regional `ww##.autotask.net` hosts and added feature gates for disabled-state behavior.
- Restored Home/native activation when navigating with Autotask's own navigation and updated UI Enhancement colors to use `#1F2227`.

### Fixes:

- Prevented AES from running on Autotask authentication pages.
- Added a specific `PageHeadingContainer` background override under UI Enhancement.
- Reduced compact vertical tab bar hover/resize conflicts.
- Fixed Resource Planner replacement getting overwritten by Autotask nav overflow updates, which could leave Firefox showing `More` with a chevron.
- Fixed the Peek outside-click "Do not show this again" choice being effectively permanent by exposing it in settings.

## 0.4.4-experimental

### New features:

- Added experimental always-visible AES tab bar support for modern non-iframe Onyx pages.
- Added experimental resizable vertical tab bar with compact icon-only mode and delayed hover expansion.
- Added a full extension enable/disable toggle in AES Settings.

### Improvements:

- Reworked AES Settings into category pages for General, UI Enhancement, Tab bar, and Miscellaneous settings.
- Limited active runtime behavior to regional `ww##.autotask.net` hosts and added feature gates for disabled-state behavior.
- Restored Home/native activation when navigating with Autotask's own navigation and updated UI Enhancement colors to use `#1F2227`.

### Fixes:

- Prevented AES from running on Autotask authentication pages.
- Added a specific `PageHeadingContainer` background override under UI Enhancement.
- Reduced compact vertical tab bar hover/resize conflicts.

## 0.4.3

### New features:

- Middle-click on supported Autotask links now opens a duplicate AES tab in the background without stealing focus from the current tab.

### Improvements:

- Project task detail pages now open inside the AES tab bar instead of a separate browser tab.

### Fixes:

- Project tabs now keep their existing metadata when navigating to project subpages that do not expose the same details.

## 0.4.2

### New features:

- No new features in this release.

### Improvements:

- Timesheet tabs now show the submitted date and resource name from the page metadata.

### Fixes:

- Fixed the AES tab bar so the native OS scrollbar no longer appears and crops tabs.

## 0.4.1

### New features:

- Added AES tab-bar support for legacy `View Timesheet` pages opened via `/timeSheets/views/readonly/tmsReadOnly_100.asp?...`

### Improvements:

- Timesheet tabs now use a dedicated clock icon and `timesheet` tab type instead of falling back to a temporary generic type.

### Fixes:

- No additional fixes in this release.

## 0.4.0

- Fixed top-level Onyx bookmark and history/menu actions that route via `window.open(...)` or `history.pushState(...)` but should open inside the AES tab bar:
  - the page bridge is now injected on the top-level page as well as inside iframe pages
  - page-bridge messages now use the shared AES namespace consistently, fixing intercepted actions that were swallowed before reaching the shell
  - newly observed handled landing routes are now always promoted into an AES tab (or focused if already open) instead of sometimes rendering inside the Home tab
- Fixed tab classification and metadata extraction for detail-route `/Index` variants such as organization/account pages opened from bookmarks, so they no longer fall back to ticket styling/type.
- Fixed an early-load race where top-level route promotion could run before the shell viewport existed, causing `appendChild` crashes on some landing routes such as project detail pages.

## 0.3.99

- Added support for all Autotask regional hosts by broadening extension injection, host permissions, and web-accessible resource matches from `ww19.autotask.net` to `*.autotask.net`. This fixes the issue where the extension appeared installed but did nothing on non-`ww19` Autotask zones.

## 0.3.98

- Fixed a wrong target in 0.3.97. The actual `AES Settings` entry-point is the native menu item injected by `createNativeSettingsMenuItem()` into Autotask's top-level sidebar (next to Home / CRM / Admin), not the cog button on the AES tab bar. Reverted the cog hover back to `#f8fafc`. The native menu item's `mouseenter` handler now picks the hover background from the active theme — `#E5E5E5` in light mode and `#48505A` in dark mode (was hard-coded to `#48505A` always) — by checking `html.aes-dark`, the same gate used by the rest of the shell's theme styles.

## 0.3.97

- Light-mode hover background changed for the wrong button (the AES tab-bar settings cog `.at-tabs-settings-button`). Superseded by 0.3.98 which targets the actual AES Settings entry-point.

## 0.3.96

- Hover card row labels: bumped `min-width` from 64px to 92px so the longest label ("Last activity") fits on one line and its value column stays aligned with the others instead of wrapping.

## 0.3.95

- **Tab hover preview now actually shows new info.** For ticket tabs the hover card now displays Status, Priority, and Last activity in addition to Account / Primary / Type. The iframe-bridge extracts these from the ticket detail DOM:
  - Status / Priority via a new `findReadOnlyValueByLabel()` helper that walks `.ReadOnlyData .ReadOnlyLabelContainer .PrimaryText` and reads the matching `.ReadOnlyValueContainer .Value` (handles both ColorBand and plain values).
  - Last activity via `extractTicketLastActivity()` — the first `.ConversationChunk .ConversationItem .Footer .Timestamp` (Autotask renders newest-first).
- The new fields are reported via the existing `nav` postMessage (sig now includes them so changes trigger re-send), applied to the tab in `handleMessage`, persisted in `buildTabsPayload` and restored in `restoreTabs`, and seeded by `createAndAddTab` (so duplicate tabs don't lose them).
- Removed the native browser `title` tooltip on tabs — it was double-rendering on top of the custom hover card. The `el.title = tabTooltipFor(tab)` set in `buildTabEl` and the matching update in `updateTabEl` are gone; the custom card is now the only hover info.

## 0.3.94

- Peek now re-uses the existing iframe for tabs that are already open, instead of mounting a fresh iframe at the same URL (which forced a full reload). The peek modal element becomes a positioning ghost; the live iframe is promoted to a fixed-position overlay via a new `at-tab-peeking` class, with its top/left/width/height kept in sync with the modal's bounding rect via `ResizeObserver` + `window.resize`. On close, the class and any inline styles are stripped and `syncTabPaneState()` re-applies normal pane visibility (hidden / primary-pane / split-pane) — so peeking the active tab, the split-pane tab, or a hidden background tab all restore correctly. Tabs that aren't yet mounted (e.g. lazy/persisted but never visited) still get a fresh iframe, the previous behavior.

## 0.3.93

- Added tab-bar support for Project Detail pages (`/Mvc/Projects/ProjectDetail.mvc/ProjectDetail`). Routed via `HANDLED_PATHS`, classified as `'project'` in `tabTypeForUrl`, with a new dedicated folder/list `project` icon. New `extractProjectInfo()` in `aes-iframe-bridge.js` extracts the project title and ID from `.EntityHeadingContainer` and surfaces the linked Organization / Account / Customer as the tab's secondary line. Pre-extract fallback shows `ID <projectId>` from the URL query string while the iframe loads.

## 0.3.92

- **Tab hover preview card.** Hovering a tab for ~350ms shows a small popover with the tab's title, number, account, primary resource, and entity type. Anchors below the tab in horizontal mode and to the right in vertical mode, with viewport-edge clamping. Suppressed during drag and while the context menu / peek / settings / map modal is open. Hides on `mouseleave` (with a short grace period), Escape, window resize, or window blur.
- **Peek action in tab right-click menu.** New `Peek` item opens the tab's URL inside an Arc-style overlay modal centered over the content. A vertical button column floats to the right of the modal with two actions: a `×` close button, and a "Split with current tab" button that calls `enableSplitScreen(tab.id)` and then closes the modal. Split is disabled (with an explanatory tooltip) when there's no current tab to split with, or when the peeked tab is the current tab. Backdrop click and Escape both close the peek.

## 0.3.91

- Added `padding-top: 12px` override to the Standard / Grid / Gantt view containers (and their inner `.VerticalContainer`s) inside `body.SummaryPage1 > .PageContentContainer > .MainContainer1 > .PrimaryContentContainer1`. Appended to the existing `injectLegacyChromeOverrides()` rule list so SummaryPage1 view bodies sit slightly inset from the surrounding chrome.

## 0.3.90

- Extended the tab right-click context menu with new actions:
  - **Duplicate tab** (any tab type) — opens a second tab pointing at the same Autotask URL. Refactored `openTab()` to share a new `createAndAddTab()` helper that bypasses URL deduplication; the duplicate is seeded with the source tab's title/number/contact so it doesn't briefly show "Loading..." before the iframe re-extracts.
  - **Copy as markdown link** (ticket tabs only) — copies `[<number> - <title>](<url>)` to the clipboard.
  - **Copy ticket number** (ticket tabs only) — copies just `tab.number`. Disabled when the tab has no extracted number yet.
  - **Copy ticket title** (ticket tabs only) — copies just `tab.title`. Disabled when empty.
- Added `copyTextToClipboard()` helper using async Clipboard API with a hidden-textarea + `execCommand('copy')` fallback for older / restricted contexts.

## 0.3.89

- Clicking the extension icon in the browser toolbar now opens (toggles) the AES Settings modal on the active Autotask tab. New `aes-background.js` (registered as a service worker on Chrome and as a background script on Firefox) listens for `action.onClicked` and sends an `__aesToolbar` message; `aes-shell.js` registers a `runtime.onMessage` listener at the top frame that calls `toggleSettingsModal()`. Toolbar clicks on non-Autotask tabs silently no-op (sendMessage rejection is swallowed).

## 0.3.88

- Aligned the enhanced organization Map button visual styling with Autotask's native primary action buttons (e.g. New Note / New To-Do — `Button2 ButtonIcon2 NormalBackground` painted by `injectModernButtonStyles()`). Updated padding `3px 12px` → `4px 10px` and border-radius `4px` → `6px` to match. The Onyx native render adds an inset darkening overlay that shifts its visible color one notch darker than its declared `background-color`; to match the rendered look, the Map button palette is shifted darker by one step: normal `#376A94` → `#2c567a`, hover `#2c567a` → `#24475f`, active `#24475f` → `#1d3a4d`.

## 0.3.87

- Hide the legacy `.TitleBar.Active:not(.TitleBarNavigation)` row at the top of organization/contact detail pages (entity title + bookmark/help icons, no nav arrows). This is the no-arrows sibling of the `.TitleBar.TitleBarNavigation` bar already hidden in 0.3.67 — both are duplicated by the custom tab bar. Existing `body.FullScroll` padding override (50px) reclaims the empty space without further tuning.

## 0.3.86

- Added a small disclaimer note underneath the "Remember tabs after closing browser" setting warning that enabling it will severely increase initial load times since all tabs will be loaded in one go.

## 0.3.85

- Fixed inconsistent tab drag-and-drop reordering. A document-level capture-phase `drop` listener was clearing `state.draggingTabId` before the per-tab `drop` handler ran, so the drop indicator showed but the reorder never happened. Removed the redundant capture-phase cleanup; the existing `dragend` handler still resets state.

## 0.3.84

- Added padding override for `body.EntityPage>.MessageBarContainer` (`25px 8px 0 8px`).

## 0.3.83

- Split print/export routing from print/export injection. Print-style pages are now valid AES tab targets when launched from Autotask, but still skip content bootstrap after loading so the extension does not alter the print view itself.
- Tightened print-view isolation for embedded print previews. The dark UI enhancer now skips and cleans any existing enhancer styling from `iframe.PrintFriendlyFrame` elements and any iframe whose `src` matches the shared exclusion predicate, so parent pages can keep AES features without darkening the print preview iframe itself.
- Broadened the Ticket print exclusion from an exact `/TicketPrintView.mvc` path to any path containing `/TicketPrintView.mvc`, covering preview routes such as `/TicketPrintView.mvc/IndexPreview`.
- Added `/Mvc/Inventory/CostItem.mvc/Shipping` to the handled tab routes so the shipping page can open inside the AES tab shell while its nested print-friendly frames remain excluded.

## 0.3.82

- Added a shared print/export exclusion list so AES stays hands-off on print-style pages. Excluded pages skip the content bootstrap entirely, are never treated as custom tab targets, and are ignored by the page-context navigation bridge. Initial exclusions:
  - `/Mvc/ServiceDesk/TicketPrintView.mvc`
  - paths containing `/PickListDetailForShippingGrid`
  - paths containing `/PackingListDetailForShippingGrid`

## 0.3.81

- Fixed an Autotask UI Enhancement startup race. Iframes now request the current enhancement state from the top shell on startup, with a few short retries, so late-loading iframes no longer need one or two manual refreshes before the legacy UI tweaks apply.

## 0.3.80

- Fixed the real dark-mode tab-color root cause. The base `.at-tab` CSS variables were still seeded with light-mode values, so dark mode could inherit the pale active background (`#E1E9EF`) while also using white text. `html.aes-dark .at-tab` now overrides the default `--aes-tab-bg-*` variables (`idle`, `hover`, `active`) to dark-mode values before any custom color tinting is applied.

## 0.3.79

- Fixed the dark-mode default active-tab fallback. Uncolored active tabs in dark mode now use the intended dark selected background (`#232D37`) with only the blue border accent, instead of filling the whole tab with `#376A94`.

## 0.3.78

- Tabs whose title contains `LiveLink` / `LiveLinks` now use a chain-link icon instead of the default ticket icon.

## 0.3.77

- Fixed the remaining Home-tab title/spinner race where the tab could show a real title briefly and then fall back to the spinner again. If Home already has a resolved non-overlay title, later `DialogIFrameOverlayPage` messages are now ignored instead of re-arming the loading state.

## 0.3.76

- Fixed a Home-tab spinner edge case after browser refresh. `DialogIFrameOverlayPage` is still treated as a transient loading title, but it now only keeps the spinner active while `state.homeLoadingAwaitingNativeLoad` is actually true. Late stray overlay-title messages after the real iframe `load` no longer re-enable the spinner permanently.

## 0.3.75

- Added two more legacy Autotask popup/detail routes to the custom-tab interception list so they open inside the tab shell instead of a new browser window:
  - `/autotask/AutotaskExtend/livelinks/livelinkEditor.aspx`
  - `/autotask/AutotaskExtend/directory_view.aspx`

## 0.3.74

- Hardened the Home-tab loading-title guard. `setHomeTitle()` now treats any case-insensitive title containing `DialogIFrameOverlayPage` as a transient loading title and keeps the spinner visible instead of showing it on the Home tab.

## 0.3.73

- Refined the custom tab coloring/pinning behavior:
  - removed the separate blue preset from the `Color tab` palette so default/clear styling owns the standard blue selected state
  - restored the standard blue active tab appearance for uncolored tabs (`Clear = blue`)
  - colored tabs now stay visibly colored while both inactive and active
  - only active colored tabs show the accent border; inactive colored tabs do not
  - re-added a small pin icon in the top-left corner of pinned tabs

## 0.3.72

- Moved the `Tab bar position` setting from the `Appearance` section to the `Tabbar` section in the settings modal so it sits with the other tab-bar-specific controls.

## 0.3.71

- Added tab organization tools to the custom tab context menu:
  - `Pin tab` / `Unpin tab`
  - `Color tab` palette with 16 preset colors
  - `Clear tab color`
- Pinned tabs stay grouped at the start of the custom tab list (just after Home) in both horizontal and vertical modes.
- Added drag-and-drop tab reordering. Reordering respects the pinned/unpinned grouping so pinned tabs stay in the pinned section and regular tabs stay below them.
- Tab colors now tint both the background and the accent border line, with theme-aware opacity in light and dark mode.
- Tab payload persistence now includes `pinned` and `color`, so both survive refresh/restore.

## 0.3.70

- Fixed native `AES Settings` menu attachment after the 0.3.69 fallback-cog removal. Instead of relying on one fragile `Admin` row signature, the shell now identifies the top-level Autotask sidebar by its direct child labels (`Home`, `CRM`, `Contracts`, `Projects`, `Service Desk`, `Timesheets`, `Inventory`, `Reports`, `Admin`). This keeps the settings item out of nested menu layers while making the root match much more resilient.

## 0.3.69

- Renamed the `Dark mode enhancer (legacy pages)` setting to `Autotask UI Enhancement`.
- The setting now gates the full legacy iframe polish bundle: the dark-surface enhancer, brand-blue legacy/Onyx-style button styling, and legacy title-bar/spacing cleanup.
- Removed the visible fallback settings cog from the custom tab bar again so settings are surfaced through the native Autotask sidebar item only.
- Relaxed native sidebar detection slightly so the `AES Settings` item can still attach when Autotask varies the `Admin` row markup, as long as the top-level menu still has a direct `Admin` item with either the known external ID or the native gear icon.
- Home tab now treats `DialogIFrameOverlayPage` as an in-between loading title and keeps the spinner visible until a real page title arrives.

## 0.3.68

- Tightened the empty space left after hiding `.TitleBar.TitleBarNavigation` (0.3.67). `injectLegacyChromeOverrides()` now also overrides `body.FullScroll` `padding-top` to 50px (was 105px), `.EntityNew/.EntityEdit/.EntityDetail > .MainContainer > .SecondaryContainer` `padding-top` to 10px, and `body.FullScroll > .QuickLaunchBar` `top` to 60px. Only those specific properties are overridden — everything else on those selectors stays at Autotask's defaults.

## 0.3.67

- Hide the legacy `.TitleBar.TitleBarNavigation` row at the top of detail pages (the entity title plus the `1 of N` page-nav arrows + bookmark/help icons). The custom tab bar already shows the entity title and provides its own navigation, so this row was redundant. New `injectLegacyChromeOverrides()` in the iframe bridge injects an unconditional `<style id="aes-legacy-chrome-overrides-style">` that hides the bar in every iframe.

## 0.3.66

- Extended the dark mode enhancer button-style exemption to also cover `.ContextOverlay` (Autotask's dropdown menu / popover container — `.DropDownButtonOverlay2`, action menus, etc.). Buttons rendered as menu items inside dropdowns no longer get the brand-blue treatment and keep their native dropdown styling. Implemented via `:is(.TabBar, .ContextOverlay)` ancestor selector applied to both the dark-enhancer button revert rules and the unconditional `.Button2.ButtonIcon2.NormalBackground` revert rules.

## 0.3.65

- Dark mode enhancer: added `.TabBar` exemption. Autotask reuses button classes (e.g. `<a class="Button ButtonIcon SelectedState">`) inside `<div class="TabBar">` for what are visually tabs. Our brand-blue button styling now reverts to Autotask's own tab styling for any descendants of `.TabBar` — applies to both the dark-enhancer button rules and the unconditional `.Button2.ButtonIcon2.NormalBackground` rule. Higher specificity (extra `.TabBar` ancestor class) makes the revert win the cascade.

## 0.3.64

- Legacy ASP `Button2 ButtonIcon2 NormalBackground` toolbar buttons (e.g. `Save` / `Cancel` on legacy ASP toolbars — they reuse those class names from the Onyx design system but the markup is legacy) now get the brand-blue + white treatment in BOTH light and dark modes via a new unconditional stylesheet `injectModernButtonStyles()`. The dark mode walker now skips these buttons and their descendants so the unconditional stylesheet wins the cascade. Includes hover (`#2c567a`) / active (`#24475f`) states, 6px border-radius, and a `filter: brightness(0) invert(1)` rule on the inner `.StandardButtonIcon` so the sprite icon renders white on the brand-blue face.

## 0.3.63

- Dark mode enhancer button selector list extended again with `a.buttons` (lowercase plural — Autotask's primary submit-style class, e.g. the `Generate` button on legacy report pages). Also covers its inner `.Text` span so the label sits cleanly white on brand blue.

## 0.3.62

- Extended the dark mode enhancer's button selector list with the two other Autotask legacy button anchor classes — `a.NoImgLink` (text-only buttons like `Hide Report Criteria`) and `a.OnlyImageButton` (icon-only buttons like the print icon). Previously only `a.ImgLink` (icon + text) got the brand-blue treatment.
- Added a `6px` border-radius and explicit `4px 10px` padding to all enhanced buttons, with tighter `4px 6px` padding for icon-only `a.OnlyImageButton` so the icon stays centered. Inner `.Text` spans inside all three legacy anchor variants are now bumped to pure white.

## 0.3.61

- Dark mode enhancer: legacy ASP buttons (`<a class="ImgLink">`, `<a class="Button">`, `<input type="button|submit|reset">`, etc.) now get an explicit brand-blue background (`#376A94`) with white text/icon when the enhancer is on. The JS walker only swaps flat `backgroundColor` and these legacy buttons paint their face via a CSS gradient/image, so they were rendering with their original light gray background while the walker had recolored their inner text to light → unreadable. Hover darkens to `#2c567a`, active to `#24475f`. Inner `.Text` spans inside `a.ImgLink` are bumped to pure white so they sit cleanly on brand blue (the walker had set them to `#f2f3f5`).

## 0.3.60

- Fixed `AES Settings` menu item showing up in every nested menu/submenu layer. Two issues were compounding: the existing top-level check only verified that the candidate menu had an Admin direct child, but Autotask submenus often re-render the parent's items and pass the same check; and `ensureNativeSettingsMenuItem()` queried the chosen menu for an existing item via `#id`, which returns null when the previous run inserted the item into a different (now-stale) menu, so a fresh item got created without removing the old one. Added a real top-level check (`isNestedMenu()` walks up the DOM and rejects any menu that has an ancestor `[role="menu"]`) and a `removeStaleNativeSettingsItems()` sweep that strips orphan AES Settings items from anywhere in the document before placing the canonical one in the chosen menu.

## 0.3.59

- Tightened native `AES Settings` menu placement again. The shell now only injects the settings item into a native menu that has a direct `li[role="menuitem"]` child with `data-onyx-external-id="0P072IJj"` and text exactly `Admin`, matching Autotask's root Admin navigation item.

## 0.3.58

- Restricted the native `AES Settings` menu item to Autotask's top-level navigation menu only. The menu detection now requires the candidate native menu to contain `Admin`, preventing the extension item from being injected into nested navigation layers/submenus.

## 0.3.57

- Updated the native Autotask settings menu item label from `Autotask Enhancement Suite` to `AES Settings`.
- Changed the native settings menu icon from a cog to a puzzle piece and added an explicit `#48505A` hover background to match Autotask's native list item hover styling.

## 0.3.56

- Moved the extension settings entry into the native Autotask left navigation menu. The shell now injects an `Autotask Enhancement Suite` menu item as the last native menu item and opens the same settings modal from there.
- The old settings cog in the custom tab bar remains as a fallback only; it is automatically hidden whenever the native settings menu item is present. A MutationObserver keeps the native item attached after Autotask rerenders the menu.

## 0.3.55

- Reduced vertical tab height scaling: tabs now cap at two native Autotask row units instead of three. A three-line tab still shows its content, but its vertical footprint matches two native left-menu rows.
- Extended the dark-mode enhancer background map for ticket pages. It now also recognizes already-normalized `#090B0D` and previous elevated replacement variants `#262A30` / `#262A31`, mapping them to the intended current canvas/elevated colors (`#090B0D` and `#1F2227` respectively).

## 0.3.54

- Improved vertical tab sizing to follow Autotask's native left-menu row rhythm. In vertical mode every tab now uses a 32px row unit: one visible line = one native row, two lines = two rows, and three lines = three rows. Home is a one-row tab; ticket/person/account/etc. tabs expand based on title, number, and contact metadata.
- Added an Appearance setting: `Hide early access labels`. When enabled, the shell hides native Autotask `Early Access` badge wrappers in the top-level navigation menu while preserving the rest of the menu row. The setting is persisted and restored on toggle-off.

## 0.3.53

- Fixed a false Home-tab spinner after closing the last custom tab. The top-level iframe mutation watcher now ignores mutations inside the extension-owned shell/viewport, so removing a custom tab iframe is not mistaken for native Autotask iframe navigation.
- Activating Home now clears the Home spinner unless a real native iframe load is already pending. Tracking an existing native iframe also no longer starts the spinner unless its observed `src` differs from the last loaded native URL.

## 0.3.52

- Added Autotask recurring ticket popup support to the tab system. URLs matching `/Autotask/Popups/Tickets/recurring_ticket.aspx?recurring_ticket_id=...` are now treated as handled ticket-like pages, so native `window.open()` / popup launches are redirected into the custom tab shell instead of opening a browser tab.
- Added `recurring_ticket_id` / `recurringTicketId` to the page bridge ID-key extraction list and a recurring-ticket metadata fallback so these tabs get a usable title/number while loading.

## 0.3.51

- Retuned the dark-mode enhancer background replacements in `aes-iframe-bridge.js`: the darker Autotask surface `#111b22` / `rgb(17, 27, 34)` now maps to `#090B0D`, and the lighter elevated surface `#192229` / `rgb(25, 34, 41)` now maps to `#1F2227`.
- The legacy threshold fallback background now also uses `#090B0D`, so very-legacy near-white pages inherit the new darker canvas color.

## 0.3.50

- Fixed the remaining Home-tab spinner gap where Autotask changed/replaced the native iframe without the iframe bridge's `beforeunload` signal firing. The shell now watches the native iframe's `src` attribute and native iframe replacements from the top document; when either changes while Home is active, the Home tab immediately enters loading state and keeps the spinner visible until the native iframe `load` event.
- Added `startNativeHomeLoading()` as the single helper for native Home loading transitions, shared by bridge `nav-start`, native iframe tracking, `src` mutations, and iframe replacement detection.

## 0.3.49

- Fixed Home-tab spinner reliability. `setHomeLoading()` now always reapplies the `.loading` class to the rendered Home tab, even when the internal state already matched, so a freshly rendered Home tab cannot miss the spinner class.
- Native Home navigation now keeps the spinner visible until the native iframe `load` event. This prevents stale `native-title` messages from the page that is navigating away from immediately clearing the spinner before the new page finishes loading.

## 0.3.48

- Dark mode enhancer: Autotask's two known dark surfaces now map to differentiated greys instead of collapsing onto one color. `#111b22` (the darker page/canvas background) → `#1F2227`. `#192229` (the lighter elevated card/grid/table background) → `#262A30`. Original luminance ordering preserved so the depth hierarchy between page and cards stays visible after the swap.

## 0.3.47

- Replaced OS-native scrollbars with custom translucent ones across the top document and every same-origin iframe (legacy ASP, MVC iframes, etc.). Selectors are wrapped in `:where()` so they have zero CSS specificity — any explicit Autotask `::-webkit-scrollbar` / `scrollbar-color` rule with a normal selector wins automatically and keeps its existing custom scrollbar untouched. The translucent neutral thumb (`rgba(125, 167, 201, 0.5)`) shows up correctly on both light and dark backgrounds without a theme switch. Especially useful in dark mode where Autotask's native scrollbars previously rendered as a bright white bar.
- Home tab now shows just the spinner (no label text) while the iframe's title hasn't been reported yet. Clears as soon as the iframe bridge posts the new `native-title` (also cleared by the iframe's `load` event as a safety net). Mount also enters loading state immediately so the home tab shows a spinner from the very first paint until the iframe reports.

## 0.3.46

- Fixed Home tab title: it was reading the parent window's `<title>` (always "Autotask"), not the iframed page's `<title>`. The iframe bridge now posts a `native-title` message with its own `document.title` to the top shell on init, on `<head>` mutations, and on `load`. The shell ignores those messages from any iframe that belongs to a custom tab (tab labels are still driven by their own metadata) and otherwise updates the Home tab text. So pages like `My Workspace & Queues` now show the actual page title in the Home tab.

## 0.3.45

- Reverted the `var(--border-primary, fallback)` border colors back to hardcoded values with explicit dark-mode overrides. Reason: Autotask's Tailwind defines `--border-primary` as an RGB triplet (`"200 200 200"`), not a full color, so the bare `var()` lookup yielded an invalid value and the fallback never kicked in — borders rendered as the light fallback `#e2e8f0` (very white) in dark mode. Light mode borders stay `#e2e8f0`, dark mode `#2a2e34`. Vertical-bar variants get the corresponding right/top borders.
- Raised the Dark mode enhancer's "color preserve" saturation gate from `0.25` to `0.35`. User reported the muted dark-blue text `#355460` (saturation ≈ 0.29) wasn't being swapped to light text. Brand-blue text `rgb(55,101,151)` (saturation ≈ 0.46) is still preserved by the new threshold. Status colors (red/green/teal/orange) remain well above any reasonable saturation cutoff.

## 0.3.44

- Dark mode enhancer now also handles very-legacy ASP pages (e.g. `/ServiceDesk/DashBoard/dskSvcDskBot.asp`) that have no concept of dark mode at all. A second threshold-based pass runs alongside the existing surgical color swap: any element whose computed background is "near white" (luminance > 0.7, low saturation) gets `#1F2227`; any element whose computed text color is "near black" (luminance < 0.3, low saturation) gets `#f2f3f5`. Saturated status colors (red errors, green successes, Autotask blue, etc.) and `<img>`/`<video>`/`<canvas>`/`<svg>` are preserved. Also sets `<html>` + `<body>` background to `#1F2227` so transparent legacy elements (most of the page) inherit dark instead of the browser default white.

## 0.3.43

- Tab bar borders now use Autotask's own `--border-primary` CSS custom property (the same token Autotask's `border-border-primary` Tailwind class reads from) with the previous static colors as fallbacks. This makes the bottom/left/right/top dividers around the tab bar, home cover, and settings cog match the native Autotask Onyx border in both light and dark mode automatically. Removed the now-redundant explicit dark-mode border overrides.

## 0.3.42

- Fixed a thin black bar at the bottom of the native iframe on Home view. The container reserves space via `padding-top: BAR_H` with `box-sizing: border-box`, so its content area is already `height - BAR_H`. The iframe inside was being sized to `calc(100% - BAR_H)` of that content area, double-subtracting BAR_H. Iframe height is now `100%` so it fills the already-shrunk content area cleanly. Same fix applied to the vertical-bar width path.

## 0.3.41

- Dark mode enhancer: corrected the background replacement color from `#a9a9a9` (typo) to `#1F2227`. Also added `#192229` (`rgb(25, 34, 41)`) as a second background target — both `#111b22` and `#192229` are now swapped to `#1F2227`.

## 0.3.40

- Dark mode enhancer: changed the background replacement color from `#22272B` to `#a9a9a9` per user spec.
- Added info icons next to each setting name in the settings modal. Hover shows a description (native browser tooltip via `title`). Each setting gets its own description: Theme / Tab bar position / Dark mode enhancer / Hide tab bar / Remember tabs after closing browser / Clickable phone numbers.

## 0.3.39

- Reworked the dark mode enhancer to walk computed styles instead of CSS rules / attribute selectors. Previous version missed `#111b22` backgrounds because Autotask sets them via CSS variables (the rule says `var(--whatever)`, not `#111b22` literally) so the stylesheet scan never matched. The new approach walks all elements, reads `getComputedStyle().backgroundColor`, and overrides the inline `background-color` on any element computing to `rgb(17, 27, 34)`.
- Text recoloring is now scoped to elements whose original computed `color` is exactly `#a9a9a9` (`rgb(169, 169, 169)`), instead of blanket `body * { color: ... }`. Reds, greens, blues, etc. retain their original colors.
- A `MutationObserver` watches body for added nodes only (childList + subtree) and re-walks. Attribute mutations are intentionally NOT observed — our own inline-style writes count as attribute mutations and would create a feedback loop. Coalesced via `requestIdleCallback` (or rAF fallback).
- Toggling off cleanly removes inline overrides from all tagged elements (`data-aes-enhancer-bg` / `data-aes-enhancer-fg`) and disconnects the observer.

## 0.3.38

- Dark mode enhancer now applies to every iframe regardless of URL path. Previous version filtered out paths containing `/mvc/`, but every page that loads inside an iframe in Autotask is legacy by definition (modern Autotask renders top-level, not iframed), so the filter was wrong. Removed `isLegacyIframePath()` and the early-return that used it.

## 0.3.37

- Home tab title now mirrors the parent page's `<title>`. The `Home` text is replaced with the live document title and updates via a `MutationObserver` on `<head>`. The home tab is now sized dynamically (`.home-label` ellipsizes at 240px) since titles are variable length.
- Added a `Tab bar position` setting under Appearance: `Horizontal (top)` (default) or `Vertical (left)`. In vertical mode the tab bar sits to the left of the native iframe (240px wide), tabs stack vertically, and the active tab gets a brand-blue left border instead of bottom border. The native iframe's parent container reserves padding-left instead of padding-top accordingly. Setting persists.
- Added a `Dark mode enhancer (legacy pages)` setting under Appearance. When enabled and Autotask is in dark mode, legacy iframe pages (anything outside `/Mvc/`) get a stylesheet override that swaps `#111b22` backgrounds with `#22272B` (covers inline styles + class-based stylesheet rules) and forces all text to `#f2f3f5`. Toggling broadcasts via postMessage to all same-origin iframes.

## 0.3.36

- Added an `Appearance` section to the top of the settings modal with a `Theme` dropdown (Follow Autotask / Light / Dark). Selection persists via the existing settings storage path and applies immediately. `Follow Autotask` keeps the existing auto-detection behavior. Light/Dark force the shell theme regardless of Autotask's `--is-theme-dark` value.
- Cleaned up section headers: `Tabbar settings` → `Tabbar`, `Phone number settings` → `Phone number`. New section is just `Appearance` for consistency.

## 0.3.35

- Followed up 0.3.34 with full dark-mode coverage of settings + map modal interiors. Now darkened: settings modal close button, setting rows + hover, setting names, toggle track + knob (toggle accent stays brand blue when on), map modal heading text, "Open in maps" link button + hover, map modal close button + hover. Modal containers/headers/backdrops were already covered.

## 0.3.34

- Added dark-mode support for all shell-injected elements (tab bar, home cover, viewport, tabs, settings cog, scroll buttons, context menu, settings/map modals, backdrops). The shell detects Autotask's `--is-theme-dark: 1` inline custom property on `<body>` and toggles a matching `aes-dark` class on `<html>`. A MutationObserver on `<body>` keeps it in sync if the user switches themes mid-session. User-specified palette: tab bar background `#1F2227`, active tab background `#232D37`, active tab bottom border `#376A94`; remaining shades derived to match.

## 0.3.33

- Replaced the settings cog SVG in `aes-shell.js` `ICONS.settings` with a clean stroke-only outline gear (Feather/Lucide style) so it visually matches the home/ticket/contract/account/person tab icons. Old icon was a fill-based path with hundreds of cubic-bezier anchor points which rendered as a chunky/mismatched glyph next to the other tab icons.

## 0.3.32

- Changed Home tab spacing from moving the native Autotask iframe to reserving space in the iframe's native parent container. The shell now adds top padding to the parent chrome container and shrinks the iframe inside it, which should be less disruptive to Autotask's internal hover/context-menu coordinate handling.
- Added restorable inline-style helpers so the parent-container reservation can be cleanly removed when switching to custom tabs or hiding the shell.

## 0.3.31

- Added a defensive metadata-reporting fallback so unexpected Autotask primary-resource DOM variants cannot break tab title/number/contact reporting. If resource extraction fails, the bridge now logs a warning and still reports the page title instead of leaving the tab metadata blank/loading.

## 0.3.30

- Hotfix for Autotask iframe context menus: replaced the Home iframe offset from CSS `translate` back to a physical `margin-top` + reduced height offset, and changed geometry reads so the shell no longer removes/reapplies the offset before every measurement. This avoids iframe jump/transform behavior that can make Autotask hover/context menus flash and disappear.

## 0.3.29

- Hotfix: fixed ticket metadata reporting when the primary resource has a profile photo instead of initials. The extractor no longer reads `.className` from a missing `.Initials` element, preventing tabs from staying in the loading state indefinitely.

## 0.3.28

- Primary resource badges on ticket tabs now support Autotask profile photos. If `.PrimaryResource` contains an image, the tab badge renders that photo; otherwise it falls back to initials and the copied swatch colors.

## 0.3.27

- Refined split screen layout with a 10px gutter between the two iframe panes.
- Split pane order now follows tab order: if the split tab is left of the active tab in the tab bar, it renders as the left iframe pane; if it is right of the active tab, it renders as the right iframe pane.

## 0.3.26

- Added a custom right-click context menu for custom tabs. The first menu action is split screen: right-click an inactive tab while another custom tab is active, choose `Open in split screen`, and the selected tab opens as a right-side pane next to the active tab.
- Added split-screen pane state to the tab shell, including restored split state when tab persistence is enabled. The active tab stays the primary/left pane, while the split target is highlighted and rendered as the secondary/right pane.

## 0.3.25

- Changed custom tab hover tooltips to show the full tab title/first line instead of the iframe URL. Ticket/account/contract/person title extraction no longer caps titles at 120 characters, so long titles can show fully in the browser tooltip while remaining visually ellipsized in the tab.

## 0.3.24

- Added primary-resource initials badges to ticket tabs, rendered under the close button. Ticket iframes now report the current primary resource name/initials/color metadata to the parent tab shell, and the badge is included in tab persistence.

## 0.3.23

- Changed the shell-side Home iframe offset from `margin-top` to the CSS individual transform property `translate: 0 65px`, while still reducing iframe height by 65px. This keeps the tab bar in the top document and moves the native iframe visually below it, avoiding both Autotask internal padding quirks and margin behavior on managed iframe layouts.

## 0.3.22

- Replaced the failed iframe-internal shell-bar padding strategy with a shell-side native iframe offset. On Home, the native Autotask iframe is measured unshifted, then moved down by the 65px shell bar height and reduced by the same height. This avoids Autotask pages whose absolute/fixed root containers ignore body/html padding.
- Neutralized the old iframe bridge padding path so stale `aes-native-body-shell-padding` / `aes-native-html-shell-padding` classes are removed instead of stacking with the shell-side offset.

## 0.3.21

- Final shell-bar overlap fix for MVC grid/landing pages. The previous attempt tried to make `<html>` a containing block via `position: relative` + `transform: translateZ(0)`, but Chromium doesn't reliably honor this on the root element, so absolute children like `.PageContentContainer` with `top: 0` kept resolving to the viewport (top `0px`). The bridge now adds `position: relative` to `<body>` alongside body padding — body is a regular element and reliably becomes the containing block for its absolutely-positioned descendants. Absolute root containers now resolve to body's padding box (65px below body's top), landing correctly below the bar.

## 0.3.20

- Fixed shell-bar overlap on MVC grid/landing pages (`AccountGridSearch`, `AdministrationSetup/Landing`, and siblings) where the root `.PageContentContainer` is absolutely positioned at `top: 0` and ignored any body/html padding. The bridge now adds `position: relative` and `transform: translateZ(0)` to `<html>` when applying html padding, turning html into the containing block for absolute descendants and forcing a containing block for position-fixed descendants too. The page content now sits below the bar.
- Also fixed a race in the bridge where `applyShellBarBodyPadding` could run once before `document.body` existed (applying html class) and once again at DOMContentLoaded (applying body class), leaving both classes active and risking double offset. Now the first invocation short-circuits until body is ready; only the DOMContentLoaded run applies classes.
- Added a second verification check in the body-padding branch: we verify not just that body's computed padding-top landed but that the topmost visible body child is actually at or below BAR_H. If it's not (because it's absolutely positioned), we escalate to html padding automatically.

## 0.3.19

- Made the shell-bar body/html offset self-healing across every Autotask page. The bridge now tries body padding first, re-measures on the next two animation frames, and if body padding didn't actually land (Autotask's CSS won specificity, or the body layout ignores padding), it falls back to html padding with `box-sizing: border-box` and `height: 100vh`. Pages where Autotask already offsets body by ≥ BAR_H (MVC detail pages with a fixed header) are left alone to avoid double spacing. Also neutralized the old shell-side `ensureNativeFrameSpacer` so it no longer applies padding externally (avoiding double offsets with the bridge's work).

## 0.3.18

- Fixed shell-bar overlap on legacy Autotask pages that load through a `<frameset>` wrapper (e.g. `/Home/DeskTop/...` routes). Diagnostic showed `document.body` in the wrapper is actually a `<frameset>` element, which ignores padding — so our previous fix landed on the frameset without visible effect. The iframe bridge now detects this case and applies `padding-top: BAR_H` to `<html>` instead (with `box-sizing: border-box` and `height: 100vh`), which correctly pushes the nested frames down.

## 0.3.17

- Fixed remaining shell-bar overlap on legacy Autotask pages (e.g. `/Home/DeskTop/Project/dskProjectBot.asp` and similar ASP views) by pushing the body down from inside each iframe via `aes-iframe-bridge.js`, rather than relying on the top shell identifying the iframe through `findContentIframe`. The bridge already runs in every same-origin frame, so nested wrappers and unhandled routes are now covered. Iframes inside the shell's own tab viewport and iframes nested more than one level deep are still skipped so their layout isn't affected.

## 0.3.16

- Fixed shell-bar overlap on native Autotask pages that weren't getting pushed down enough (LiveLinks views, grids, dashboards, and other legacy ASP pages). The spacer used to rely on adding `margin-top` to the body's first child, which silently failed whenever the first child used positioning or a layout mode that ignores margins. The spacer now pushes the whole body via `padding-top`, with an escape hatch for explicit `position:fixed/absolute` first-level children. No URL filtering — spacer runs on any native iframe we find while the user is on Home.

## 0.3.15

- Added a loading spinner on the Home tab whenever Autotask's native iframe navigates (e.g. clicking a top-level native Autotask tab while the shell is on Home). The spinner replaces the Home icon during load and clears when the native `load` event fires. Iframes that belong to custom tabs are excluded from the signal, so the existing per-tab loader still handles those.

## 0.3.14

- Fixed: refreshing the parent Autotask page no longer bounces the user from the restored active tab to Home. Autotask's initial native-iframe load after a page refresh is now ignored for a 4-second grace window, so the previously selected tab survives the refresh. User-driven native navigation (clicking a tab in Autotask's top nav later on) still properly steps the shell aside to Home.

## 0.3.13

- Restyled the enhanced organization map button to match Autotask's native primary button language (e.g. `Assign & Schedule`): rounded 4px corners, brand-blue `#376A94` fill, white 13px medium label, 3×12px padding, with hover/active darken states.
- Reset the `.EntityHeadingIconButton` wrapper around the map button to `inline-flex` with zero margin/padding so it aligns on the address line baseline instead of being offset by the wrapper's original icon-sized dimensions.
- Icon bumped to 14px to balance with the larger text; dropped the optical `top: -0.5px` nudge now that the button aligns via flex.

## 0.3.12

- Refined the enhanced organization map button so it reads as an inline chip rather than a floating pill: smaller height/padding, 11px weight-500 text, 12px map pin, softer 6px radius, no shadow, and a `vertical-align: -4px` nudge so it sits on the address line's text baseline instead of riding above it.

## 0.3.11

- Reverted the native `Button2` map-button markup because it broke the organization page layout; restored the safer custom inline map button.

## 0.3.10

- Changed the enhanced organization map control to use Autotask's native `Button2 ButtonIcon2 NormalBackground` markup/style instead of custom button styling.

## 0.3.9

- Refined the enhanced organization map button from a tab-like shape into a compact inline action button with softer borders and improved middle alignment.

## 0.3.8

- Restyled the enhanced organization map button to align with the tab bar visual language: white square button, blue bottom accent, and better baseline alignment.

## 0.3.7

- Returned a small fake window object for intercepted map opens so repeated clicks/focus calls reopen the in-page map modal.

## 0.3.6

- Replaced Autotask's tiny native organization map glyph with a clearer pill-style `Map` button while preserving the original click behavior.

## 0.3.5

- Fixed organization map interception when Autotask opens Google Maps before the normal click event by detecting map URLs directly and arming on earlier pointer events.

## 0.3.4

- Broadened native organization map interception to catch Autotask page navigation objects and programmatic anchor clicks after the map icon is clicked.

## 0.3.3

- Open Autotask organization map button results inside an in-page map modal instead of a separate browser tab.

## 0.3.2

- Split clickable phone number controls into a separate settings section.

## 0.3.1

- Changed contact/resource/person tabs to use a person icon.
- Kept the person ID value while removing the visible `ID:` prefix and added organization/company context on the third line when available.
- Slimmed the tab strip scrollbar so overflow tabs remain usable without the bulky native scrollbar look.

## 0.3.0

- Added horizontal tab overflow handling with left/right scroll buttons.
- Kept the settings button pinned outside the scrollable tab area so it stays visible when many tabs are open.

## 0.2.9

- Added support for legacy Autotask resource profile URLs such as `/Autotask35/grapevine/Profile.aspx?resourceId=...`.

## 0.2.8

- Added contact/resource/person detail routes so Autotask `LinkButton2` person links can open in the custom tab system.

## 0.2.7

- Added a page-context navigation bridge so Autotask page scripts that call native `window.open` or `autotask.siteNavigation.__openPage` can be routed into the custom tab system.

## 0.2.6

- Intercepted normal handled links and iframe `window.open` calls so organization/account links opened from ticket iframes use the custom tab system instead of browser tabs.

## 0.2.5

- Improved phone detection for Autotask values that use Unicode dash characters, fixing cases like `0181 - 745 030` and `010 - 313 86 31`.

## 0.2.4

- Tightened phone-number detection to avoid dates, times, and ticket numbers while supporting spaced formats such as `0181 - 745 030`.

## 0.2.3

- Replaced the tab title `Loading...` fallback with a compact spinner icon while new tab metadata loads.

## 0.2.2

- Added clickable phone number detection across Autotask pages and iframes.
- Added a `Clickable phone numbers` setting to the in-page settings modal.

## 0.2.1

- Fixed the extension content script to load in Autotask iframes too via `all_frames`, which is required for the iframe bridge and tab metadata reporting.

## 0.2.0

- Split the extension content script into smaller files:
  - `aes-shared.js`
  - `aes-storage.js`
  - `aes-iframe-bridge.js`
  - `aes-shell.js`
  - `content-tabs.js` bootstrap
- Removed Tampermonkey metadata from the extension entrypoint.
- Added extension-native setting support for remembering tabs after browser close.
- Added packaged icon assets and updated extension branding.

## 0.1.0

- Initial unpacked Chrome extension scaffold based on the working tab system.
