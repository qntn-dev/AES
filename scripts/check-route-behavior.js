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

// Ticket print view staat bewust in zowel de handled- als de excluded-
// lijst: een window.open ervan wordt in een AES-tab gevangen, en binnen
// die tab blijft AES er vervolgens vanaf. De curated lijst wint dus van
// de excluded-check — in beide modi.
assert.strictEqual(routes.isHandledPath('/mvc/servicedesk/ticketprintview.mvc'), true,
    'compat off: dual-listed print view stays handled (curated list wins)');

assert.strictEqual(routes.isHandledPath('/mvc/framework/authentication.mvc/authenticate'), false,
    'compat off: excluded-only paths stay excluded');

// Native-home paden zijn ook voor de curated lijst geen route, ook al
// matcht dit pad het /billingproduct-fragment in HANDLED_PATH_INCLUDES.
assert.strictEqual(routes.isKnownRoutePath('/mvc/contracts/billingproductmapping.mvc/installedproductmapping'), false,
    'known route: native home paths are refused even when a fragment matches');

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
assert.strictEqual(routes.isHandledPath('/mvc/servicedesk/ticketprintview.mvc'), true,
    'compat on: dual-listed print view stays handled (curated list wins)');
assert.strictEqual(routes.isHandledPath('/mvc/framework/authentication.mvc/authenticate'), false,
    'compat on: excluded-only paths stay excluded');
assert.strictEqual(routes.isHandledPath('/help/content/whatever.htm'), false,
    'compat on: excluded path fragments stay excluded');

// --- isRoutableUrl: alleen http(s) op een regionale Autotask-host ---
assert.strictEqual(routes.isRoutableUrl('javascript:void(0)'), false,
    'routable: javascript: URLs are never routable');
assert.strictEqual(routes.isRoutableUrl('mailto:a@b.c'), false,
    'routable: mailto: URLs are never routable');
assert.strictEqual(routes.isRoutableUrl('https://example.com/foo'), false,
    'routable: third-party hosts are not routable');
assert.strictEqual(routes.isRoutableUrl('http://ww5.autotask.net/x'), true,
    'routable: http on a regional host is routable');
assert.strictEqual(routes.isRoutableUrl('https://ww5.autotask.net/x'), true,
    'routable: https on a regional host is routable');
assert.strictEqual(routes.isRoutableUrl('https://www.autotask.net/x'), false,
    'routable: non-regional autotask.net hosts are not routable');
assert.strictEqual(routes.isRoutableUrl('/mvc/crm/accountdetail.mvc', 'https://ww5.autotask.net/'), true,
    'routable: relative URL resolves against a regional base');
assert.strictEqual(routes.isRoutableUrl('/mvc/crm/accountdetail.mvc'), false,
    'routable: relative URL without a base is not routable');

// --- De modus is per wereld instelbaar en uitleesbaar ---
assert.strictEqual(routes.getCompatibilityMode(), true, 'mode is readable');
routes.setCompatibilityMode(false);
assert.strictEqual(routes.getCompatibilityMode(), false, 'mode is settable');

// --- Zonder localStorage (service worker) valt de registry terug op aan ---
const fresh = loadRoutes();
assert.strictEqual(fresh.getCompatibilityMode(), true,
    'default is on when no mirror is readable');

console.log('route_behavior_ok');
