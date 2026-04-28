# Autotask Enhancement Suite – Chrome Extension Readiness

Date: 2026-04-23  
Scope reviewed: `autotask-iframe-tabs.js` (primary), plus `autotask-iframe-simple.js` and `autotask-iframe.user.js` for packaging alignment.

## Summary
`autotask-iframe-tabs.js` is in good shape functionally and is close to extension-ready.  
Main hardening needed is around `postMessage` trust boundaries and a couple of performance/packaging improvements.

## Priority Findings

### 1) `postMessage` origin/source hardening (High)
Current behavior:
- Child frame sends with `window.top.postMessage(..., '*')`.
- Parent accepts by namespace only:
  - `window.addEventListener('message', handleMessage)`
  - checks `data.__ns === MSG_NS`

Risk:
- Any frame on the page that can guess `MSG_NS` could send spoofed messages.

Recommended change:
- In parent `handleMessage`, validate:
  - `event.origin === location.origin`
  - `event.source` maps to a known Autotask content iframe
- In child `postToTop`, send to `location.origin` instead of `'*'` when possible.

Suggested target area:
- `autotask-iframe-tabs.js` around:
  - child `postToTop(...)`
  - parent `handleMessage(event)`

---

### 2) Interval-based geometry sync every 500ms (Medium)
Current behavior:
- `setInterval(syncGeometry, 500)` runs continuously after mount.

Risk:
- Unnecessary constant layout work on large pages.

Recommended change:
- Keep `resize` listener.
- Replace interval with one of:
  - `ResizeObserver` on the native iframe + container
  - lightweight `MutationObserver` on iframe additions/removals
  - `requestAnimationFrame`-throttled sync only after known triggers

Suggested target area:
- `mount()` in `autotask-iframe-tabs.js`

---

### 3) Extension packaging split (Medium)
Current behavior:
- Tampermonkey header metadata in each file (`@name`, `@match`, `@run-at`).

For extension:
- Move metadata into `manifest.json`.
- Keep code in content scripts only.
- Avoid loading all three scripts together on the same pages unless intentionally coordinated.

Recommended packaging:
- Choose **one primary runtime** for extension MVP:
  - `autotask-iframe-tabs.js` (recommended)
- Keep other scripts as optional modules or disabled by default.

---

### 4) Session storage key namespace (Low)
Current behavior:
- Uses keys like `autotask-tabs-v1`, `autotaskIframeNavHistory.v1`.

Recommendation:
- Prefix all storage keys with suite + module for long-term maintainability:
  - `aes.tabs.v1`
  - `aes.simpleNav.history.v1`

---

### 5) Message schema versioning (Low)
Current behavior:
- `MSG_NS = 'autotask-tabs-v1'` is good baseline.

Recommendation:
- Add explicit `version` field in message payload to make future migrations safer:
  - `{ __ns: MSG_NS, version: 1, type: 'open', ... }`

## Proposed Extension Structure (No code changes yet)

```text
autotask-enhancement-suite/
  manifest.json
  content/
    tabs.js            (from autotask-iframe-tabs.js)
  assets/
    icon16.png
    icon48.png
    icon128.png
  README.md
```

## Manifest baseline (MVP)

```json
{
  "manifest_version": 3,
  "name": "Autotask Enhancement Suite",
  "version": "0.1.0",
  "description": "Autotask Enhancement Suite: iframe tabs, navigation, and productivity upgrades.",
  "content_scripts": [
    {
      "matches": ["https://ww19.autotask.net/*"],
      "js": ["content/tabs.js"],
      "run_at": "document_start"
    }
  ],
  "icons": {
    "16": "assets/icon16.png",
    "48": "assets/icon48.png",
    "128": "assets/icon128.png"
  }
}
```

## Migration Checklist

1. Copy `autotask-iframe-tabs.js` to extension `content/tabs.js`.
2. Remove userscript header block (`// ==UserScript== ...`).
3. Apply message hardening (Finding #1).
4. Replace interval sync (Finding #2).
5. Load unpacked extension and validate:
   - ticket/account/contract click interception
   - tab restore via session storage
   - no duplicate overlays in nested/system frames.

## Recommendation
For extension MVP, ship only the tabs runtime first (`autotask-iframe-tabs.js` lineage), then decide whether simple/full variants should become optional feature flags.
