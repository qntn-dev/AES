# Release Notes Concept

## 0.6.5

### New features:

- Added support for opening external Autotask links directly in AES tabs.
- AES can now let you know when a newer stable version is available on GitHub.
- The Tab Bar now works on more Autotask pages by default, including pages that are not loaded inside an iframe.
- The vertical Tab Bar can now be resized by default.

### Improvements:

- Tab Bar resize and Show tab bar on all Autotask pages are now normal Tab Bar settings instead of beta options.
- Tab customization now starts with the recommended layout by default.
- The Organization tab now correctly shows Classification where Autotask uses that field.

### Fixes:

- Fixed settings sometimes falling back to defaults after reloading the extension.
- Fixed the Home tab spinner getting stuck after refreshing Autotask from another AES tab.
- Improved Home tab behavior on newer non-iframe Autotask pages.

## 0.6.0

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
- Added tab metadata customization, so you can choose what appears on Line 2 and Line 3 per tab type.
- Added `Set to recommended` in Customization to quickly apply a clean default tab layout.
- Added a setting to open new tabs at the start or end of the tab bar.
- Added richer device and ticket metadata options, including device details, ticket status/priority, last activity, and quick copy buttons.
- Added in-app release notes that appear after extension updates, with options to view GitHub notes, be reminded next time, or hide until the next release.

### Improvements:

- The Customization page is larger, clearer, and labels the Line 2 / Line 3 columns.
- Tabs restore more smoothly after refreshing the browser.
- Closing a tab now returns you to the tab you came from when possible.
- The right-click menu is cleaner, with tab colors moved into a side menu.
- Hover cards now stay open while your mouse is on them.
- Status and priority can inherit Autotask's color when shown on a tab line.
- Hid and disabled the experimental page-redesign settings by default while they are being stabilized.

### Fixes:

- Fixed opportunity tabs sometimes showing the wrong title.
- Fixed Shipping sometimes opening as a separate AES tab.
- Fixed hover card copy buttons.
- Fixed a few icon and menu layout issues.
- Added a runtime build guard that reloads Autotask once when AES code changes, preventing stale or duplicate content scripts after extension updates.
