# Increase Page Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AES opent standaard élke Autotask-pagina in zijn eigen tab-shell, behalve wat expliciet is uitgesloten, met een gebruikersinstelling *Increase page compatibility* die standaard aan staat.

**Architecture:** De route-registry in `aes-routes.js` krijgt twee functies: `isKnownRoutePath()` (de huidige strenge allowlist) en `isHandledPath()` (nieuwe beslisser die in compatibiliteitsmodus alles toelaat behalve native-home, Onyx en EXCLUDED). De modus wordt per wereld gelezen: browsercontexten via een synchrone `localStorage`-spiegel, de background service worker via zijn bestaande `chrome.storage`-cache. De fuzzy URL-scanner in `aes-page-bridge.js` blijft op de strenge lijst werken.

**Tech Stack:** Plain ES5/ES2017 JavaScript, WebExtension Manifest V3, geen build-stap, geen bundler, geen TypeScript. Node.js alleen voor controlescripts.

**Testing note:** Dit project heeft geen testframework en dat blijft zo (geen `package.json`, geen dependencies). `aes-routes.js` is een IIFE die zichzelf op `globalThis` zet en dus rechtstreeks in Node te laden is. Taak 1 bouwt daarom een klein, dependency-vrij assertiescript in dezelfde stijl als het bestaande `scripts/check-route-allowlists.js`. Voor de bestanden die niet los in Node te laden zijn (page bridge, background, shell) gebruiken we broncontroles plus een handmatige rooktest aan het eind.

**Spec:** `docs/superpowers/specs/2026-08-02-open-everything-in-aes-design.md`

**Afwijking van de spec:** De spec zegt dat de settings al een `localStorage`-spiegel hebben. Dat klopt niet — `aes-storage.js` gebruikt `localStorage` alléén als fallback wanneer `chrome.storage` ontbreekt, dus in de extensie staat daar niets. Dit plan schrijft daarom een eigen, aparte sleutel (`aes-page-compatibility-v1`) die uitsluitend deze ene boolean spiegelt. Verder ontdekt tijdens het uitwerken: `/autotaskonyx/*` en het kale pad `/` worden nu alleen native gehouden doordat ze niet op de allowlist staan; in compatibiliteitsmodus moeten ze expliciet worden afgevangen in de registry, anders gaan page bridge en background ze onderscheppen.

---

## Bestandsoverzicht

| Bestand | Verantwoordelijkheid na deze wijziging |
| --- | --- |
| `scripts/check-route-behavior.js` (nieuw) | Voert de route-registry in Node uit en assert het beslisgedrag in beide modi |
| `chrome-extension/src/aes-routes.js` | Route-eligibiliteit + compatibiliteitsmodus + synchrone spiegel-lees |
| `chrome-extension/src/aes-page-bridge.js` | Fuzzy scanner op strenge lijst, overige gates op brede regel |
| `chrome-extension/src/aes-background.js` | Cachet de setting uit `chrome.storage` en voedt de registry |
| `chrome-extension/src/aes-storage.js` | Default, laden en opslaan van `increasedPageCompatibility` + spiegel schrijven |
| `chrome-extension/src/aes-shell.js` | Settingsdefault, UI-rij, resetgedrag, registry synchroniseren |
| `chrome-extension/CHANGELOG.md` | Changelog-regel |
| `firefox-extension/`, `dist/safari/…` | Gespiegeld via `scripts/sync-runtime-sources.sh` |

Alle runtime-edits gebeuren eerst in `chrome-extension/src/`. Firefox en Safari worden pas in taak 8 gesynchroniseerd.

---

### Task 1: Gedragstestscript voor de route-registry

**Files:**
- Create: `scripts/check-route-behavior.js`

- [ ] **Step 1: Schrijf het falende testscript**

Maak `scripts/check-route-behavior.js`:

```js
#!/usr/bin/env node
const assert = require('assert');
const path = require('path');

const root = path.resolve(__dirname, '..');

function loadRoutes() {
    for (const key of Object.keys(require.cache)) {
        delete require.cache[key];
    }
    delete globalThis.__AES_ROUTE_REGISTRY__;
    require(path.join(root, 'chrome-extension/src/aes-routes.js'));
    return globalThis.__AES_ROUTE_REGISTRY__;
}

const routes = loadRoutes();

// --- De strenge lijst blijft zich gedragen zoals voorheen ---
routes.setCompatibilityMode(false);

assert.strictEqual(routes.isKnownRoutePath('/mvc/servicedesk/ticketdetail.mvc'), true,
    'known route: ticket detail');
assert.strictEqual(routes.isKnownRoutePath('/Mvc/ServiceDesk/TicketDetail.mvc'), true,
    'known route matching is case-insensitive');
assert.strictEqual(routes.isKnownRoutePath('/mvc/crm/contactdetail.mvc/index'), true,
    'known route ignores a trailing /index');
assert.strictEqual(routes.isKnownRoutePath('/some/page/nobody/added.aspx'), false,
    'unknown route is not a known route');
assert.strictEqual(routes.isKnownRoutePath(''), false,
    'empty path is not a known route');

assert.strictEqual(routes.isHandledPath('/mvc/servicedesk/ticketdetail.mvc'), true,
    'compat off: known route is handled');
assert.strictEqual(routes.isHandledPath('/some/page/nobody/added.aspx'), false,
    'compat off: unknown route is not handled');

// --- Compatibiliteitsmodus laat alles door, op de uitzonderingen na ---
routes.setCompatibilityMode(true);

assert.strictEqual(routes.isHandledPath('/some/page/nobody/added.aspx'), true,
    'compat on: unknown route is handled');
assert.strictEqual(routes.isHandledPath('/mvc/servicedesk/ticketdetail.mvc'), true,
    'compat on: known route stays handled');

assert.strictEqual(routes.isHandledPath(''), false,
    'compat on: empty path is never handled');
assert.strictEqual(routes.isHandledPath('/'), false,
    'compat on: bare root is never handled');

assert.strictEqual(routes.isHandledPath('/autotaskonyx'), false,
    'compat on: the Onyx shell stays native');
assert.strictEqual(routes.isHandledPath('/autotaskonyx/dashboard'), false,
    'compat on: Onyx sub-pages stay native');
assert.strictEqual(routes.isHandledPath('/autotaskonyx/landingpage'), false,
    'compat on: landing pages are unwrapped by callers, not handled directly');
assert.strictEqual(routes.isNativeHomePath('/autotaskonyx/landingpage'), false,
    'landing pages must not count as native home, or inner-URL unwrapping breaks');

assert.strictEqual(routes.isHandledPath('/mvc/user/preferences.mvc/index'), false,
    'compat on: native home paths stay native');
assert.strictEqual(routes.isHandledPath('/mvc/servicedesk/ticketprintview.mvc'), false,
    'compat on: excluded paths stay excluded');
assert.strictEqual(routes.isHandledPath('/help/content/whatever.htm'), false,
    'compat on: excluded path fragments stay excluded');

// --- De modus is per wereld instelbaar en uitleesbaar ---
assert.strictEqual(routes.getCompatibilityMode(), true, 'mode is readable');
routes.setCompatibilityMode(false);
assert.strictEqual(routes.getCompatibilityMode(), false, 'mode is settable');

// --- Zonder localStorage (service worker) valt de registry terug op aan ---
const fresh = loadRoutes();
assert.strictEqual(fresh.getCompatibilityMode(), true,
    'default is on when no mirror is readable');

console.log('route_behavior_ok');
```

- [ ] **Step 2: Draai het script en controleer dat het faalt**

Run: `node scripts/check-route-behavior.js`
Expected: FAIL met `TypeError: routes.setCompatibilityMode is not a function`

- [ ] **Step 3: Commit het testscript**

```bash
cd "/Users/quintenvannoorloos/Desktop/Autotask Userscript/Dev"
git add scripts/check-route-behavior.js
git commit -m "test: add route registry behavior checks for compatibility mode"
```

---

### Task 2: Compatibiliteitsmodus in de route-registry

**Files:**
- Modify: `chrome-extension/src/aes-routes.js:145-213`
- Test: `scripts/check-route-behavior.js`

- [ ] **Step 1: Voeg de spiegel-lees en de modusstatus toe**

Voeg in `aes-routes.js` direct ná de `DYNAMIC_EXACT_PATHS`-array en vóór `function unique(values)` dit blok in:

```js
    // Synchrone spiegel van de "Increase page compatibility"-setting.
    //
    // De echte setting staat in chrome.storage en is asynchroon, maar de
    // eerste routeringsbeslissing valt al bij document_start — en in de
    // MAIN world is chrome.storage sowieso niet beschikbaar. De shell
    // schrijft de waarde daarom óók naar deze localStorage-sleutel, die
    // elke browsercontext synchroon kan lezen. De service worker heeft
    // geen localStorage en krijgt de waarde via setCompatibilityMode().
    const COMPATIBILITY_MIRROR_KEY = 'aes-page-compatibility-v1';
    const NATIVE_ONYX_PATH = '/autotaskonyx';
    const ONYX_LANDING_PAGE_PATH = '/autotaskonyx/landingpage';

    let compatibilityMode = true;

    function readCompatibilityMirror() {
        try {
            if (typeof localStorage === 'undefined' || !localStorage) {
                return null;
            }
            const raw = localStorage.getItem(COMPATIBILITY_MIRROR_KEY);
            if (raw === '0') return false;
            if (raw === '1') return true;
            return null;
        } catch (e) {
            return null;
        }
    }

    function writeCompatibilityMirror(enabled) {
        try {
            if (typeof localStorage === 'undefined' || !localStorage) {
                return;
            }
            localStorage.setItem(COMPATIBILITY_MIRROR_KEY, enabled ? '1' : '0');
        } catch (e) {}
    }

    function isNativeOnyxPath(path) {
        return path === NATIVE_ONYX_PATH || path.indexOf(NATIVE_ONYX_PATH + '/') === 0;
    }
```

- [ ] **Step 2: Vervang het `routes`-object**

Vervang in `aes-routes.js` het hele blok van `const routes = {` tot en met de afsluitende `};` door:

```js
    const routes = {
        HANDLED_PATHS: unique(HANDLED_PATHS),
        NATIVE_HOME_PATHS: unique(NATIVE_HOME_PATHS),
        HANDLED_PATH_INCLUDES: unique(HANDLED_PATH_INCLUDES),
        EXCLUDED_PATHS: unique(EXCLUDED_PATHS),
        EXCLUDED_PATH_INCLUDES: unique(EXCLUDED_PATH_INCLUDES),
        DYNAMIC_PATH_FRAGMENTS: unique(DYNAMIC_PATH_FRAGMENTS),
        DYNAMIC_EXACT_PATHS: unique(DYNAMIC_EXACT_PATHS),
        normalizePath,
        includesAny,
        getCompatibilityMode() {
            return compatibilityMode;
        },
        setCompatibilityMode(enabled) {
            compatibilityMode = enabled !== false;
            writeCompatibilityMirror(compatibilityMode);
        },
        isNativeHomePath(pathname) {
            const path = normalizePath(pathname);
            if (isNativeOnyxPath(path) && path !== ONYX_LANDING_PAGE_PATH) {
                return true;
            }
            return routes.NATIVE_HOME_PATHS.includes(path);
        },
        isExcludedPath(pathname) {
            const path = normalizePath(pathname);
            return routes.EXCLUDED_PATHS.includes(path) || includesAny(path, routes.EXCLUDED_PATH_INCLUDES);
        },
        // De curated allowlist. Blijft in gebruik als fallback wanneer de
        // compatibiliteitsmodus uit staat, en voor de fuzzy URL-scanner in
        // aes-page-bridge.js die géén brede regel mag gebruiken.
        isKnownRoutePath(pathname) {
            const path = normalizePath(pathname);

            if (!path) {
                return false;
            }

            return routes.HANDLED_PATHS.includes(path)
                || includesAny(path, routes.HANDLED_PATH_INCLUDES)
                || routes.DYNAMIC_EXACT_PATHS.includes(path)
                || includesAny(path, routes.DYNAMIC_PATH_FRAGMENTS);
        },
        isHandledPath(pathname) {
            const path = normalizePath(pathname);

            if (!path || path === '/') {
                return false;
            }
            if (routes.isNativeHomePath(path)) {
                return false;
            }
            if (routes.isExcludedPath(path)) {
                return false;
            }
            // Onyx-paden krijgen nooit het blanket "ja". De landingpage
            // wordt door de callers uitgepakt naar zijn inner URL; die
            // inner URL doorloopt deze functie daarna opnieuw.
            if (compatibilityMode && !isNativeOnyxPath(path)) {
                return true;
            }

            return routes.isKnownRoutePath(path);
        }
    };

    const mirroredCompatibilityMode = readCompatibilityMirror();
    if (mirroredCompatibilityMode !== null) {
        compatibilityMode = mirroredCompatibilityMode;
    }
```

Let op: de `isExcludedPath`-check is nieuw binnen `isHandledPath`. Die stond eerder alleen los in `aes-shared.js`; nu EXCLUDED het enige hek is, moet hij ook gelden voor de page bridge en de background worker.

- [ ] **Step 3: Draai de gedragstests**

Run: `node scripts/check-route-behavior.js`
Expected: `route_behavior_ok`

- [ ] **Step 4: Draai de bestaande allowlist-check**

Run: `node scripts/check-route-allowlists.js`
Expected: `route_allowlists_ok`

- [ ] **Step 5: Commit**

```bash
cd "/Users/quintenvannoorloos/Desktop/Autotask Userscript/Dev"
git add chrome-extension/src/aes-routes.js
git commit -m "feat: add compatibility mode to the AES route registry"
```

---

### Task 3: Fuzzy URL-scanner op de strenge lijst houden

`extractHandledUrlFromPageObject` in `aes-page-bridge.js` verzamelt álle strings uit een JavaScript-object van de pagina en kiest de eerste die een route blijkt. Met een brede regel pakt hij de eerste de beste string die met `/` begint — een afbeeldingspad, een stylesheet-URL, wat dan ook. Deze ene functie moet daarom op `isKnownRoutePath` blijven werken.

**Files:**
- Modify: `chrome-extension/src/aes-page-bridge.js:223-232`, `chrome-extension/src/aes-page-bridge.js:279-286`
- Modify: `scripts/check-route-allowlists.js:56-70`

- [ ] **Step 1: Voeg de broncontrole toe die nu faalt**

Voeg in `scripts/check-route-allowlists.js`, direct ná de `for (const rel of consumers) { … }`-lus en vóór `const runtimeRoots = [`, dit blok toe:

```js
const bridgeSource = fs.readFileSync(path.join(root, 'chrome-extension/src/aes-page-bridge.js'), 'utf8');
const bridgeScannerMatch = bridgeSource.match(/function\s+extractHandledUrlFromPageObject\s*\([\s\S]*?\n    \}/);
if (!bridgeScannerMatch) {
    throw new Error('aes-page-bridge.js no longer defines extractHandledUrlFromPageObject');
}
if (!bridgeScannerMatch[0].includes('isKnownRouteUrl')) {
    throw new Error('extractHandledUrlFromPageObject must use the curated route list, not the broad rule');
}
```

- [ ] **Step 2: Draai de check en controleer dat hij faalt**

Run: `node scripts/check-route-allowlists.js`
Expected: FAIL met `extractHandledUrlFromPageObject must use the curated route list, not the broad rule`

- [ ] **Step 3: Voeg `isKnownRouteUrl` toe aan de page bridge**

Voeg in `aes-page-bridge.js` direct ná de bestaande `isHandledUrl`-functie (die eindigt op `return false;` gevolgd door `}`) deze functie toe:

```js
    // Strenge variant voor plekken waar we niet van een brede regel uit
    // mogen gaan — zie extractHandledUrlFromPageObject.
    function isKnownRouteUrl(url) {
        const path = pathOf(url);
        if (!path) {
            return false;
        }
        if (isDialogPopOutFromDialogPath(path)) {
            return false;
        }
        if (ROUTES.isKnownRoutePath) {
            return ROUTES.isKnownRoutePath(path);
        }
        return false;
    }
```

- [ ] **Step 4: Laat de scanner die functie gebruiken**

Vervang in `extractHandledUrlFromPageObject`:

```js
        const rawUrl = strings.find(function (value) {
            return isHandledUrl(absoluteUrl(value));
        });
```

door:

```js
        const rawUrl = strings.find(function (value) {
            return isKnownRouteUrl(absoluteUrl(value));
        });
```

De vijf andere `isHandledUrl`-aanroepen in dit bestand blijven ongewijzigd: die zijn echte routeringsbeslissingen en moeten juist wél de brede regel volgen.

- [ ] **Step 5: Draai beide checks**

Run: `node scripts/check-route-allowlists.js && node scripts/check-route-behavior.js`
Expected: `route_allowlists_ok` gevolgd door `route_behavior_ok`

- [ ] **Step 6: Commit**

```bash
cd "/Users/quintenvannoorloos/Desktop/Autotask Userscript/Dev"
git add chrome-extension/src/aes-page-bridge.js scripts/check-route-allowlists.js
git commit -m "fix: keep the page-object URL scanner on the curated route list"
```

---

### Task 4: Background worker voedt de registry

De service worker heeft geen `localStorage`, maar cachet zijn settings al uit `chrome.storage` — precies zoals hij dat voor `extensionEnabled` doet. Daar haakt de nieuwe setting op aan.

**Files:**
- Modify: `chrome-extension/src/aes-background.js:230-257`, `chrome-extension/src/aes-background.js:570-577`

- [ ] **Step 1: Voeg de leesfunctie toe**

Voeg in `aes-background.js` direct ná `readExtensionEnabledSetting` toe:

```js
    function readIncreasedPageCompatibilitySetting(settings) {
        return !(settings && settings.increasedPageCompatibility === false);
    }

    function applyIncreasedPageCompatibilitySetting(settings) {
        if (ROUTES.setCompatibilityMode) {
            ROUTES.setCompatibilityMode(readIncreasedPageCompatibilitySetting(settings));
        }
    }
```

- [ ] **Step 2: Roep hem aan op alle drie de plekken waar settings binnenkomen**

In `syncUmbrellaContractFrameRulesFromStorage`, in de promise-tak:

```js
                    .then(function (result) {
                        const settings = result && result[SETTINGS_STORAGE_KEY];
                        extensionEnabled = readExtensionEnabledSetting(settings);
                        applyIncreasedPageCompatibilitySetting(settings);
                        return setUmbrellaContractFrameRulesEnabled(readUmbrellaContractFrameSetting(settings));
                    })
```

In dezelfde functie, in de callback-tak:

```js
            api.storage.local.get([SETTINGS_STORAGE_KEY], function (result) {
                const settings = result && result[SETTINGS_STORAGE_KEY];
                extensionEnabled = readExtensionEnabledSetting(settings);
                applyIncreasedPageCompatibilitySetting(settings);
                setUmbrellaContractFrameRulesEnabled(readUmbrellaContractFrameSetting(settings));
            });
```

En in de `storage.onChanged`-listener:

```js
        api.storage.onChanged.addListener(function (changes, areaName) {
            if (areaName !== 'local' || !changes || !changes[SETTINGS_STORAGE_KEY]) return;
            const settings = changes[SETTINGS_STORAGE_KEY].newValue;
            extensionEnabled = readExtensionEnabledSetting(settings);
            applyIncreasedPageCompatibilitySetting(settings);
            setUmbrellaContractFrameRulesEnabled(readUmbrellaContractFrameSetting(settings));
        });
```

- [ ] **Step 3: Controleer dat de service worker de registry echt binnenhaalt**

Run: `grep -n "importScripts('aes-routes.js')" chrome-extension/src/aes-background.js`
Expected: één regelnummer rond 36 — de registry wordt al geladen, er is geen manifestwijziging nodig.

- [ ] **Step 4: Commit**

```bash
cd "/Users/quintenvannoorloos/Desktop/Autotask Userscript/Dev"
git add chrome-extension/src/aes-background.js
git commit -m "feat: sync page compatibility setting into the background route registry"
```

---

### Task 5: Setting opslaan, laden en spiegelen

**Files:**
- Modify: `chrome-extension/src/aes-storage.js:71-73` (defaults), `:372-374` en `:441-443` (laden, beide takken), `:506` (opslaan)

- [ ] **Step 1: Voeg de statusdefault toe**

Voeg in `aes-storage.js` direct ná het `improvedScrollbarsEnabled`-defaultblok toe:

```js
    if (typeof AES.state.increasedPageCompatibility !== 'boolean') {
        AES.state.increasedPageCompatibility = true;
    }
```

- [ ] **Step 2: Lees de setting in de chrome.storage-tak van `loadSettings`**

Voeg direct ná de `AES.state.improvedScrollbarsEnabled = …`-toekenning in de `if (AES.hasChromeStorage())`-tak toe:

```js
            AES.state.increasedPageCompatibility = settings && typeof settings.increasedPageCompatibility === 'boolean'
                ? settings.increasedPageCompatibility
                : true;
```

- [ ] **Step 3: Lees de setting ook in de localStorage-fallbacktak**

Voeg exact hetzelfde blok toe ná de `AES.state.improvedScrollbarsEnabled = …`-toekenning in de tweede (fallback) tak van `loadSettings`:

```js
            AES.state.increasedPageCompatibility = settings && typeof settings.increasedPageCompatibility === 'boolean'
                ? settings.increasedPageCompatibility
                : true;
```

- [ ] **Step 4: Neem de setting op in de opgeslagen payload**

Voeg in `AES.saveSettings` aan het payload-object toe, direct ná `improvedScrollbarsEnabled`:

```js
            increasedPageCompatibility: !!AES.state.increasedPageCompatibility,
```

- [ ] **Step 5: Handmatige controle in Chrome**

1. Laad de extensie ongepakt via `chrome://extensions` → *Load unpacked* → `Dev/chrome-extension`.
2. Open een Autotask-pagina op `ww*.autotask.net`.
3. Open de DevTools-console van de pagina en draai:

```js
JSON.parse(localStorage.getItem('autotask-tabs-settings-v1') || 'null')
```

Expected: `null` (de settings staan in `chrome.storage`, niet hier) — dit bevestigt waarom taak 6 een eigen spiegel schrijft.

4. Draai in de console van de *extensie-service-worker* (via `chrome://extensions` → *service worker*):

```js
chrome.storage.local.get('autotask-tabs-settings-v1').then(r => r['autotask-tabs-settings-v1'].increasedPageCompatibility)
```

Expected: `true`

- [ ] **Step 6: Commit**

```bash
cd "/Users/quintenvannoorloos/Desktop/Autotask Userscript/Dev"
git add chrome-extension/src/aes-storage.js
git commit -m "feat: persist the increased page compatibility setting"
```

---

### Task 6: Setting in de shell — default, UI, reset en synchronisatie

**Files:**
- Modify: `chrome-extension/src/aes-shell.js:6657-6684` (defaults), `:6717` e.v. (UI-rij), `:7940` (rij toevoegen aan sectie), `:8055-8075` (reset), `:11161-11167` (synchronisatie bij laden)

- [ ] **Step 1: Voeg de default toe**

Voeg in `defaultSettingsState()` toe, direct ná `improvedScrollbarsEnabled: true,`:

```js
            increasedPageCompatibility: true,
```

- [ ] **Step 2: Voeg de synchronisatiefunctie toe**

Voeg in `aes-shell.js` direct vóór `function defaultSettingsState()` toe:

```js
    function syncPageCompatibilityState() {
        const enabled = state.increasedPageCompatibility !== false;
        if (AES.ROUTES && AES.ROUTES.setCompatibilityMode) {
            AES.ROUTES.setCompatibilityMode(enabled);
        }
    }
```

- [ ] **Step 3: Voeg de UI-rij toe**

Voeg in `openSettingsModal` toe, direct ná het `improvedScrollbarsControl`-blok (dus ná `const improvedScrollbarsInput = improvedScrollbarsControl.input;`):

```js
        const pageCompatibilityControl = createSettingsToggleRow({
            name: 'Increase page compatibility',
            info: 'Opens far more Autotask pages inside AES instead of in a browser tab. Some pages are not built to run in a frame and may misbehave — switch this off if you run into one.',
            checked: state.increasedPageCompatibility !== false,
            onChange: function (input) {
                state.increasedPageCompatibility = input.checked;
                AES.state.increasedPageCompatibility = input.checked;
                syncPageCompatibilityState();
                void AES.saveSettings();
            }
        });
        const pageCompatibilityRow = pageCompatibilityControl.row;
        const pageCompatibilityInput = pageCompatibilityControl.input;
```

- [ ] **Step 4: Hang de rij in de General-sectie**

Vervang:

```js
        generalSection.appendChild(enabledRow);
```

door:

```js
        generalSection.appendChild(enabledRow);
        generalSection.appendChild(pageCompatibilityRow);
```

- [ ] **Step 5: Neem de setting mee in reset-to-defaults**

Voeg in het resetblok toe, direct ná `improvedScrollbarsInput.checked = defaults.improvedScrollbarsEnabled;`:

```js
            pageCompatibilityInput.checked = defaults.increasedPageCompatibility;
            state.increasedPageCompatibility = defaults.increasedPageCompatibility;
            AES.state.increasedPageCompatibility = defaults.increasedPageCompatibility;
```

En voeg in datzelfde blok, direct ná `syncImprovedScrollbarsState();`, toe:

```js
            syncPageCompatibilityState();
```

- [ ] **Step 6: Synchroniseer bij het laden van de settings**

Voeg toe direct ná het `improvedScrollbarsEnabled`-blok rond regel 11161:

```js
        if (typeof AES.state.increasedPageCompatibility === 'boolean') {
            state.increasedPageCompatibility = AES.state.increasedPageCompatibility;
        }
```

En voeg direct ná de bestaande `syncImprovedScrollbarsState();`-aanroep in datzelfde stuk toe:

```js
        syncPageCompatibilityState();
```

- [ ] **Step 7: Handmatig verifiëren dat de spiegel wordt geschreven**

1. Herlaad de extensie via `chrome://extensions`.
2. Open een Autotask-pagina en ververs één keer.
3. Draai in de console van de pagina:

```js
localStorage.getItem('aes-page-compatibility-v1')
```

Expected: `"1"`

4. Open de AES-settings, zet *Increase page compatibility* uit, draai dezelfde regel opnieuw.

Expected: `"0"`

5. Zet de setting weer aan.

Expected: `"1"`

- [ ] **Step 8: Commit**

```bash
cd "/Users/quintenvannoorloos/Desktop/Autotask Userscript/Dev"
git add chrome-extension/src/aes-shell.js
git commit -m "feat: add the Increase page compatibility setting to the AES settings modal"
```

---

### Task 7: Handmatige rooktest

Er is geen geautomatiseerde end-to-end-test; dit is de vangnetcontrole vóór het spiegelen naar Firefox en Safari.

**Files:** geen

- [ ] **Step 1: Bekende schermen blijven werken (setting aan)**

Open achtereenvolgens een ticket, een organisatie, een contract, een project en een invoice.
Expected: elk opent in een AES-tab met het juiste icoon en de juiste titel, precies zoals vóór deze wijziging.

- [ ] **Step 2: Onbekende schermen openen nu óók in AES**

Navigeer naar minimaal drie Autotask-schermen die niet in `HANDLED_PATHS` staan (bijvoorbeeld een willekeurig admin-scherm of rapport).
Expected: ze openen in een AES-tab. Icoon en titel mogen generiek zijn — dat is verwacht gedrag, geen bug.

- [ ] **Step 3: De Autotask-shell blijft native**

Klik door het Onyx-menu en open de startpagina.
Expected: `/autotaskonyx/*` blijft de gewone Autotask-interface, komt níét in een AES-tab terecht.

- [ ] **Step 4: Uitzetten herstelt het oude gedrag**

Zet *Increase page compatibility* uit, ververs de pagina, herhaal stap 2.
Expected: die onbekende schermen openen weer native, buiten AES.

- [ ] **Step 5: Noteer wat stukgaat**

Noteer elk pad dat een leeg tabblad of een kapotte pagina oplevert (met name bijlage-downloads en *Export to Excel*). Deze paden gaan in `EXCLUDED_PATHS` of `EXCLUDED_PATH_INCLUDES` in `aes-routes.js`. Voeg ze toe, herhaal `node scripts/check-route-behavior.js`, en commit ze als aparte wijziging.

---

### Task 8: Spiegelen naar Firefox en Safari

**Files:**
- Modify: `firefox-extension/src/*` en de Safari-kopie (via script, niet met de hand)

- [ ] **Step 1: Draai het syncscript**

```bash
cd "/Users/quintenvannoorloos/Desktop/Autotask Userscript/Dev"
./scripts/sync-runtime-sources.sh
```

Expected: exit code 0.

- [ ] **Step 2: Verifieer dat de bronnen identiek zijn**

```bash
cd "/Users/quintenvannoorloos/Desktop/Autotask Userscript/Dev"
./scripts/verify-extension-sources.sh && node scripts/check-route-allowlists.js && node scripts/check-route-behavior.js
```

Expected: exit code 0, `route_allowlists_ok`, `route_behavior_ok`.

- [ ] **Step 3: Rooktest in Firefox**

Laad `Dev/firefox-extension` via `about:debugging` → *This Firefox* → *Load Temporary Add-on*, open een ticket en een onbekend scherm.
Expected: hetzelfde gedrag als in taak 7 stap 1 en 2.

- [ ] **Step 4: Commit**

```bash
cd "/Users/quintenvannoorloos/Desktop/Autotask Userscript/Dev"
git add firefox-extension dist
git commit -m "chore: sync runtime sources to firefox and safari"
```

---

### Task 9: Changelog en in-app release notes

**Files:**
- Modify: `chrome-extension/CHANGELOG.md`
- Modify: `chrome-extension/src/aes-shell.js:296` (`RELEASE_NOTES`), `:8` in `aes-shared.js` (`AES.version`), `chrome-extension/manifest.json` en `firefox-extension/manifest.json` (`version`)

Versienummer: `1.2.0` (nieuwe functionaliteit, geen breuk in de API). Wijk hiervan af als Quinten een ander nummer wil.

- [ ] **Step 1: Bump het versienummer op alle vier de plekken**

- `chrome-extension/manifest.json` → `"version": "1.2.0"`
- `firefox-extension/manifest.json` → `"version": "1.2.0"`
- `chrome-extension/src/aes-shared.js` → `AES.version = '1.2.0';`
- `chrome-extension/src/aes-shell.js` → `RELEASE_NOTES.version` → `'1.2.0'`

- [ ] **Step 2: Schuif de vorige release notes de historie in**

Kopieer het huidige `RELEASE_NOTES`-object naar een nieuwe constante `RELEASE_NOTES_V1_1_0` naast `RELEASE_NOTES_V1_0_0`, en voeg die toe aan `RELEASE_NOTES_HISTORY` op dezelfde plek waar `RELEASE_NOTES_V1_0_0` staat.

- [ ] **Step 3: Vervang de inhoud van `RELEASE_NOTES`**

```js
    const RELEASE_NOTES = {
            version: '1.2.0',
            sections: [
                {
                    title: 'AES Tip',
                    items: [
                        'Ran into a page that does not look right inside AES? Open Settings and switch off "Increase page compatibility" to send pages back to a normal browser tab.',
                    ],
                },
                {
                    title: 'Highlights',
                    items: [
                        'Almost every Autotask page now opens in an AES Tab',
                    ],
                },
                {
                    title: 'New Features',
                    items: [
                        'New setting "Increase page compatibility", on by default. AES now opens almost every Autotask page in a Tab instead of only the pages that were added one by one. Pages that are not built to run in a frame may misbehave — switch the setting off if you run into one.',
                    ],
                },
            ],
        };
```

- [ ] **Step 4: Voeg de changelog-regel toe**

Voeg boven in `chrome-extension/CHANGELOG.md` een `## 1.2.0`-sectie toe:

```markdown
## 1.2.0

- AES route eligibility switched from an explicit allowlist to opt-out. Every Autotask page now opens in an AES Tab unless it is the native Autotask shell, a native home page, or explicitly excluded. Controlled by the new "Increase page compatibility" setting, on by default.
- `HANDLED_PATHS` and friends remain as the fallback when the setting is off, and as the curated list backing the page-object URL scanner in `aes-page-bridge.js`.
- Adding a route to `tabTypeForUrl` is now cosmetic only: it sets the tab icon and type, and is no longer required for a page to open in AES.
```

- [ ] **Step 5: Sync en verifieer opnieuw**

```bash
cd "/Users/quintenvannoorloos/Desktop/Autotask Userscript/Dev"
./scripts/sync-runtime-sources.sh && ./scripts/verify-extension-sources.sh && node scripts/check-route-allowlists.js && node scripts/check-route-behavior.js
```

Expected: exit code 0, `route_allowlists_ok`, `route_behavior_ok`.

- [ ] **Step 6: Controleer de release notes in de app**

Herlaad de extensie, open een Autotask-pagina.
Expected: de release-notes-modal voor 1.2.0 verschijnt met de bovenstaande tekst.

- [ ] **Step 7: Commit**

```bash
cd "/Users/quintenvannoorloos/Desktop/Autotask Userscript/Dev"
git add -A
git commit -m "chore: release 1.2.0 with increased page compatibility"
```

---

### Task 10: Documentatie bijwerken

**Files:**
- Modify: `docs/LLM_CHANGE_GUIDE.md:14`

- [ ] **Step 1: Werk de "Common changes"-regel bij**

Vervang de regel die begint met `- Add AES tab compatibility:` door:

```markdown
- Add AES tab compatibility: pages open in AES by default via the "Increase page compatibility" setting, so no route entry is needed to make a page work. Add a route to `tabTypeForUrl` in `aes-shell.js` only to give the tab a proper icon and type, and to `aes-iframe-bridge.js` only when the tab needs custom metadata. Add to `EXCLUDED_PATHS` / `EXCLUDED_PATH_INCLUDES` in `aes-routes.js` when a page must stay out of AES.
```

- [ ] **Step 2: Voeg een guardrail toe**

Voeg onderaan de `## Guardrails`-lijst toe:

```markdown
- `extractHandledUrlFromPageObject` in `aes-page-bridge.js` must keep using `isKnownRoutePath` / `isKnownRouteUrl`. It scans arbitrary page strings, so the broad compatibility rule would make it match the first string that looks like a path.
- Route behavior is asserted by `scripts/check-route-behavior.js`. Run it alongside `scripts/check-route-allowlists.js` after touching `aes-routes.js`.
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/quintenvannoorloos/Desktop/Autotask Userscript/Dev"
git add docs/LLM_CHANGE_GUIDE.md
git commit -m "docs: update the change guide for opt-out route eligibility"
```
