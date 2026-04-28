(function () {
    'use strict';

    if (window.__AESPageBridgeInstalled) return;
    window.__AESPageBridgeInstalled = true;

    const MSG_NS = 'autotask-tabs-v1';
    let pendingMapOpenUntil = 0;
    const HANDLED_PATHS = [
        '/mvc/servicedesk/ticketdetail.mvc',
        '/mvc/crm/accountdetail.mvc',
        '/mvc/crm/contactdetail.mvc',
        '/mvc/administrationsetup/resourcedetail.mvc',
        '/mvc/administration/resourcedetail.mvc',
        '/mvc/administrationsetup/resource.mvc/resourcedetail',
        '/mvc/administrationsetup/persondetail.mvc',
        '/autotask35/grapevine/profile.aspx',
        '/autotask/popups/tickets/recurring_ticket.aspx',
        '/autotask/autotaskextend/livelinks/livelinkeditor.aspx',
        '/autotask/autotaskextend/directory_view.aspx',
        '/mvc/inventory/costitem.mvc/shipping',
        '/contracts/views/contractview.asp',
        '/contracts/views/contractsummary.asp',
    ];
    const HANDLED_PATH_INCLUDES = [
        '/ticketprintview.mvc',
        '/picklistdetailforshippinggrid',
        '/packinglistdetailforshippinggrid',
    ];
    const ID_KEYS = [
        'ticketId',
        'accountId',
        'contractID',
        'contractId',
        'contactId',
        'contactID',
        'resourceId',
        'resourceID',
        'personId',
        'personID',
        'recurring_ticket_id',
        'recurringTicketId',
    ];

    function pathOf(url) {
        try { return new URL(url, location.origin).pathname.toLowerCase().replace(/\/index$/, ''); }
        catch (e) { return ''; }
    }

    function isHandledUrl(url) {
        const path = pathOf(url);
        return HANDLED_PATHS.includes(path) ||
            HANDLED_PATH_INCLUDES.some(fragment => path.includes(fragment)) ||
            path.includes('/contactdetail') ||
            path.includes('/resourcedetail') ||
            path.includes('/persondetail') ||
            path === '/autotask35/grapevine/profile.aspx';
    }

    function absoluteUrl(url) {
        try { return new URL(String(url || ''), location.origin).href; }
        catch (e) { return ''; }
    }

    function looksLikeUrl(value) {
        return /^(https?:)?\/\//i.test(value) ||
            /^\//.test(value) ||
            /\bmaps?\b/i.test(value) ||
            /[?&](q|query|address|daddr|destination)=/i.test(value);
    }

    function collectStrings(value, out, depth) {
        if (depth > 3 || value == null) return;
        if (typeof value === 'string' || typeof value === 'number') {
            out.push(String(value));
            return;
        }
        if (typeof value !== 'object') return;

        try {
            for (const key of Object.keys(value)) {
                out.push(String(key));
                collectStrings(value[key], out, depth + 1);
            }
        } catch (e) {}
    }

    function extractHandledUrlFromPageObject(pageObject) {
        const strings = [];
        collectStrings(pageObject, strings, 0);

        const rawUrl = strings.find(function (value) {
            return isHandledUrl(absoluteUrl(value));
        });
        if (!rawUrl) return '';

        const url = new URL(absoluteUrl(rawUrl));
        if ([...url.searchParams.keys()].some(key => ID_KEYS.includes(key))) {
            return url.href;
        }

        for (const key of ID_KEYS) {
            const keyIndex = strings.findIndex(value => value === key);
            if (keyIndex === -1) continue;
            const idValue = strings.slice(keyIndex + 1).find(value => /^\d+$/.test(value));
            if (idValue) {
                url.searchParams.set(key, idValue);
                return url.href;
            }
        }

        const firstNumeric = strings.find(value => /^\d{4,}$/.test(value));
        if (firstNumeric) {
            const fallbackKey = pathOf(url.href).includes('accountdetail') ? 'accountId'
                : pathOf(url.href).includes('contactdetail') ? 'contactId'
                    : pathOf(url.href).includes('resourcedetail') ? 'resourceId'
                        : pathOf(url.href).includes('/grapevine/profile.aspx') ? 'resourceId'
                        : pathOf(url.href).includes('persondetail') ? 'personId'
                : pathOf(url.href).includes('recurring_ticket.aspx') ? 'recurring_ticket_id'
                : pathOf(url.href).includes('contract') ? 'contractID'
                    : 'ticketId';
            url.searchParams.set(fallbackKey, firstNumeric);
        }
        return url.href;
    }

    function extractMapUrlFromPageObject(pageObject) {
        const strings = [];
        collectStrings(pageObject, strings, 0);
        const rawUrl = strings.find(function (value) {
            return looksLikeUrl(value);
        });
        return rawUrl ? absoluteUrl(rawUrl) : '';
    }

    function postOpen(url) {
        const targetUrl = absoluteUrl(url);
        if (!targetUrl || !isHandledUrl(targetUrl)) return false;
        window.postMessage({ __ns: MSG_NS, type: 'open', url: targetUrl }, location.origin);
        return true;
    }

    function isPendingMapOpen() {
        return pendingMapOpenUntil && Date.now() < pendingMapOpenUntil;
    }

    function isMapUrl(url) {
        const targetUrl = absoluteUrl(url);
        if (!targetUrl) return false;
        try {
            const parsed = new URL(targetUrl);
            return /(^|\.)maps\.google\./i.test(parsed.hostname) ||
                /(^|\.)google\.[^/]+$/i.test(parsed.hostname) && parsed.pathname.toLowerCase().includes('/maps') ||
                /(^|\.)openstreetmap\.org$/i.test(parsed.hostname);
        } catch (e) {
            return /\bmaps\.google\.|openstreetmap\.org/i.test(targetUrl);
        }
    }

    function postMap(url) {
        const targetUrl = absoluteUrl(url);
        if (!targetUrl || (!isPendingMapOpen() && !isMapUrl(targetUrl))) return false;
        pendingMapOpenUntil = 0;
        window.postMessage({ __ns: MSG_NS, type: 'map', url: targetUrl }, location.origin);
        return true;
    }

    function createMapWindow(url) {
        const targetUrl = absoluteUrl(url);
        return {
            closed: false,
            opener: window,
            focus: function () {
                if (targetUrl) window.postMessage({ __ns: MSG_NS, type: 'map', url: targetUrl }, location.origin);
            },
            blur: function () {},
            close: function () { this.closed = true; },
        };
    }

    function armMapOpenFromEvent(event) {
        const clickedMapIcon = event.target.closest && event.target.closest('.InlineIconButton.Map, .InlineIcon.Map');
        if (clickedMapIcon) {
            pendingMapOpenUntil = Date.now() + 5000;
        }
        return !!clickedMapIcon;
    }

    document.addEventListener('pointerdown', armMapOpenFromEvent, true);
    document.addEventListener('mousedown', armMapOpenFromEvent, true);

    document.addEventListener('click', function (event) {
        armMapOpenFromEvent(event);
        if (isPendingMapOpen()) {
            const anchor = event.target.closest && event.target.closest('a[href]');
            if (anchor && postMap(anchor.href)) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                return;
            }
        }
    }, true);

    const originalOpen = window.open;
    window.open = function (url, target, features) {
        if (postMap(url)) return createMapWindow(url);
        if (postOpen(url)) return null;
        return originalOpen.apply(window, arguments);
    };

    const originalAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
        if (postMap(this.href)) return;
        return originalAnchorClick.apply(this, arguments);
    };

    function patchSiteNavigation() {
        const nav = window.autotask && window.autotask.siteNavigation;
        if (!nav || nav.__AESPatchedOpenPage || typeof nav.__openPage !== 'function') return false;

        const originalOpenPage = nav.__openPage;
        nav.__AESPatchedOpenPage = true;
        nav.__openPage = function (pageObject) {
            if (isPendingMapOpen()) {
                const mapUrl = extractMapUrlFromPageObject(pageObject);
                if (mapUrl && postMap(mapUrl)) return false;
            }
            const url = extractHandledUrlFromPageObject(pageObject);
            if (url && postOpen(url)) return false;
            return originalOpenPage.apply(this, arguments);
        };
        return true;
    }

    if (!patchSiteNavigation()) {
        const timer = window.setInterval(function () {
            if (patchSiteNavigation()) window.clearInterval(timer);
        }, 250);
        window.setTimeout(function () { window.clearInterval(timer); }, 15000);
    }
})();
