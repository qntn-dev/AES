# Privacy Policy

Autotask Enhancement Suite is a browser extension that enhances the Autotask web interface for authenticated users.

## What the extension does

The extension adds productivity and interface features inside Autotask, including:

- an in-app tab bar for supported Autotask pages
- routing supported Autotask pages, popups, and Peek windows into the AES tab interface
- optional tab/session persistence
- optional clickable phone links
- optional map/location helpers
- release notes and update information shown inside the extension
- optional user-interface enhancements

## Data processed

To provide its features, the extension may read information already visible in Autotask pages, including:

- page titles and identifiers used for tab labels and metadata
- organization, contact, project, contract, ticket, and timesheet names shown in the interface
- visible phone numbers when the phone-link feature is enabled
- visible address or location information when the map feature is used
- supported Autotask URLs, page paths, popup URLs, and tab state needed to route pages into AES tabs or Peek windows
- browser tab information for Autotask tabs, such as the current tab URL and active tab, when needed to open, focus, close, or route AES-managed Autotask pages

This processing happens locally in the user's browser.

## Data storage

The extension stores a limited amount of data locally in the browser, including:

- extension settings
- open tab/session state
- optional persisted tab state when the user enables remembering tabs between browser sessions
- release-note state, such as whether a version's notes have already been shown
- UI customization preferences, including tab layout, theme-related options, and enabled or disabled experimental features

The extension uses browser storage mechanisms such as extension storage, session storage, and local storage where applicable.

## Browser permissions

Autotask Enhancement Suite requests only the permissions needed for its features:

- `storage`: saves extension settings, UI preferences, release-note state, and optional remembered AES tabs locally in the browser.
- `tabs`: lets the extension detect, focus, create, update, or close Autotask browser tabs when routing supported Autotask pages into the AES tab shell. It is also used when the toolbar button opens the AES settings panel on the active Autotask tab.
- `https://*.autotask.net/*`: allows the extension to run on Autotask pages and supported Autotask iframes, popups, and Peek windows.
- `https://api.github.com/*`: allows the extension to retrieve public release information from GitHub for the in-extension release notes feature.

## Data sharing

Autotask Enhancement Suite does not send Autotask page content, personal data, analytics, or telemetry to the developer's servers.

## Third-party services

When the map feature is used, the extension may open or embed map URLs from third-party map providers such as Google Maps or OpenStreetMap in response to a user action.

When release notes are opened or checked, the extension may contact GitHub's public API to retrieve public release metadata for this project. Autotask page content is not sent to GitHub by this feature.

When a user opens an external feedback or issue link, the browser navigates to GitHub. Any information entered on GitHub is handled by GitHub according to GitHub's own terms and privacy policy.

## Data retention and control

Data stored by the extension remains in the user's browser unless the browser syncs extension storage according to the user's browser account settings. Users can remove locally stored extension data by changing AES settings, resetting AES settings, disabling remembered tabs, clearing browser extension data, or uninstalling the extension.

## Data sale

The developer does not sell user data.

## Changes to this policy

This privacy policy may be updated from time to time to reflect changes to the extension.

## Contact

Publisher: QNTN.dev
