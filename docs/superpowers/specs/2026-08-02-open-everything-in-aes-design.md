# Increase page compatibility: van allowlist naar opt-out

Datum: 2026-08-02

## Probleem

AES onderschept alleen URL's die exact op de `HANDLED_PATHS`-allowlist in
`chrome-extension/src/aes-routes.js` staan. Elk Autotask-scherm dat in AES moet
openen, vraagt dus om een handmatige toevoeging aan die lijst. Er staan er
inmiddels ~90 in, en er komen er steeds bij. De lijst is tegelijk de
featurelijst en het vangnet: wat er niet op staat, opent gewoon native.

Doel: het vangnet omdraaien. Alles op een Autotask-host opent standaard in AES,
behalve wat expliciet is uitgesloten.

## Beslissingen

Genomen tijdens het ontwerpgesprek:

1. **Volledige opt-out**, geen prefix-afleiding uit de bestaande lijst. Elke
   URL op `ww*.autotask.net` is handled tenzij uitgesloten.
2. **Geen slimme detectie van niet-pagina-URL's** (downloads, exports,
   ajax-endpoints). Wat stukgaat, komt in de EXCLUDED-lijst.
3. **Zichtbare setting** in plaats van een build-time vlag, genaamd
   *Increase page compatibility*.
4. **Standaard aan voor iedereen**, ook voor bestaande installaties na update.

## Ontwerp

### 1. Route-registry: twee functies in plaats van één

In `aes-routes.js`:

- `isKnownRoutePath(pathname)` — de huidige strenge check, ongewijzigd:
  `HANDLED_PATHS` + `HANDLED_PATH_INCLUDES` + `DYNAMIC_EXACT_PATHS` +
  `DYNAMIC_PATH_FRAGMENTS`.
- `isHandledPath(pathname)` — de nieuwe beslisser, in volgorde:
  1. leeg pad → `false`
  2. `isNativeHomePath(path)` → `false`
  3. `isExcludedPath(path)` → `false`
  4. compatibiliteitsmodus aan → `true`
  5. anders → `isKnownRoutePath(path)`

Stap 3 is nieuw op deze plek. Nu zit de EXCLUDED-check los in
`aes-shared.js` (`AES.isExcludedUrl`). Omdat EXCLUDED vanaf nu het enige hek
is, moet die overal gelden waar `isHandledPath` wordt aangeroepen — ook in de
background worker en de page bridge.

De registry krijgt een schakelbare toestand:

- `routes.compatibilityMode` (boolean, default `true`)
- `routes.setCompatibilityMode(enabled)`

### 2. De setting bekend maken in drie werelden

`aes-routes.js` draait in drie contexten, elk met een eigen manier om de
setting te lezen. De eerste routeringsbeslissing valt bij `document_start`,
dus een asynchrone `chrome.storage`-lees is te laat.

| Wereld | Bron | Hoe |
| --- | --- | --- |
| Content script (isolated) | `localStorage` | Synchroon lezen bij load; shell werkt bij op settingswijziging |
| Pagina (MAIN world) | `localStorage` | Idem — zelfde origin, dus dezelfde mirror |
| Background service worker | `chrome.storage.local` | Gecachet bij start + `onChanged`-listener |

De `localStorage`-mirror van de settings bestaat al: `aes-storage.js` schrijft
en leest `autotask-tabs-settings-v1` daar (zie `aes-storage.js` rond regel 402).
De background worker cachet settings al op precies deze manier voor
`extensionEnabled` (`aes-background.js` rond regel 230 en de
`storage.onChanged`-listener rond regel 570); de nieuwe setting haakt daarop
aan.

Waar de setting (nog) niet te lezen is, geldt de default: aan.

### 3. De fuzzy matcher in de page bridge blijft streng

`extractHandledUrlFromPageObject` in `aes-page-bridge.js` verzamelt alle
strings uit een JavaScript-object van de pagina en kiest de eerste waarvoor
`isHandledUrl` waar is. Die heuristiek werkt alleen doordat de meeste strings
géén route zijn. Met een open regel zou hij de eerste de beste string pakken
die met `/` begint — een afbeelding, een stylesheet, wat dan ook.

Deze functie gaat daarom over op `isKnownRoutePath`. De overige
`isHandledUrl`-aanroepen in `aes-page-bridge.js` (de gates rond programmatische
popups en links) gebruiken wel de nieuwe brede regel.

### 4. De setting in de UI

- Sleutel: `increasedPageCompatibility`, default `true`, toegevoegd aan
  `defaultSettingsState()` in `aes-shell.js`.
- Toggle in de settings-modal bij de andere pagina-gedrag-instellingen. Geen
  experimentele sectie — dit is een normale setting.
- Reset-/default-/input-referenties in dezelfde pass bijwerken.
- Tekst:

  > **Increase page compatibility**
  > Opens far more Autotask pages inside AES instead of in a browser tab. Some
  > pages aren't built to run in a frame and may misbehave — switch this off if
  > you run into one.

- Omzetten geldt voor nieuwe navigaties. Tabbladen die al open staan houden hun
  huidige toestand; een refresh is niet vereist.

### 5. Nieuwe rol van de bestaande lijsten

- `HANDLED_PATHS` en varianten blijven bestaan, met twee resterende rollen:
  fallback wanneer de setting uit staat, en de strenge lijst voor de fuzzy
  matcher. Ze hoeven niet meer per nieuw scherm te worden uitgebreid.
- `tabTypeForUrl` in `aes-shell.js` blijft de cosmetica-lijst: bepaalt icoon en
  tabtype. Een route toevoegen is voortaan optioneel — puur voor een mooier
  tabblad, niet meer om een pagina te laten werken.
- Onbekende pagina's degraderen al netjes: `tabEffectiveType` valt terug op het
  type dat uit de entity-header van de pagina zelf wordt gelezen, en anders op
  `unknown`.
- `EXCLUDED_PATHS` / `EXCLUDED_PATH_INCLUDES` worden de nieuwe werklijst.

## Geaccepteerde risico's

- **Downloads en exports.** Bijlagen, Export to Excel, PDF's en
  ajax-endpoints worden nu ook onderschept en worden waarschijnlijk een leeg
  tabblad. Bewust niet vooraf afgevangen; opsporen en in EXCLUDED zetten.
- **Pagina's die frames weigeren.** Schermen met een blokkerende
  frame-header renderen niet in het iframe. Niet vooraf detecteerbaar: het
  resultaat is een leeg tabblad, waarna het pad in EXCLUDED gaat. Hier gaat de
  waarschuwing in de settingtekst over.
- **Bredere blootstelling ineens.** De setting staat standaard aan, dus een
  eventueel probleem raakt alle gebruikers tegelijk. Zij kunnen het zelf
  uitzetten; dat is de bewuste afweging.

## Verificatie

Het project heeft geen testinfrastructuur (geen `package.json`, geen tests).

- `node scripts/check-route-allowlists.js` moet blijven slagen.
- `scripts/verify-extension-sources.sh` moet slagen.
- Handmatig doorklikken in Chrome: een reeks bekende schermen (ticket, account,
  contract, project, invoice), een paar schermen die nog nooit op de lijst
  stonden, en het uit- en weer aanzetten van de setting.
- Controleren dat een bijlage-download en een Export to Excel-actie zichtbaar
  falen of slagen, zodat bekend is wat er in EXCLUDED moet.

## Uitrol

- Chrome runtime source in `chrome-extension/src/` is canoniek.
- `scripts/sync-runtime-sources.sh` spiegelt naar Firefox en de Safari-kopie.
- `scripts/verify-extension-sources.sh` vóór het inpakken.
- CHANGELOG en de in-app release notes bijwerken (die zijn gescheiden).
