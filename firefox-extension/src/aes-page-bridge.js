(function () {
    'use strict';

    if (window.__AESPageBridgeInstalled) return;
    window.__AESPageBridgeInstalled = true;

    const MSG_NS = 'autotask-tabs-v1';
    let pendingMapOpenUntil = 0;
    let pendingDuplicateOpenUntil = 0;
    let pendingUserNavigationUntil = 0;
    let featureEnabled = true;
    let syntheticOpenerInstalled = false;
    let nativeOpenerValue = null;
    let syntheticOpenerProxy = null;

    function aesFrameCloseTarget() {
        try {
            let current = window;
            while (current && current !== current.top) {
                const fe = current.frameElement;
                if (fe && fe.classList && (
                    fe.classList.contains('at-tabs-peek-frame') ||
                    (fe.closest && fe.closest('.at-tabs-peek-wrapper'))
                )) return 'peek';
                if (fe && fe.classList && (
                    fe.classList.contains('at-tab-frame') ||
                    (fe.closest && fe.closest('.at-tabs-viewport'))
                )) return 'tab';
                current = current.parent;
            }
        } catch (e) {
            return '';
        }
        return '';
    }

    function isVisibleFrame(frame) {
        try {
            const style = frame.ownerDocument.defaultView.getComputedStyle(frame);
            return style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                frame.offsetWidth > 0 &&
                frame.offsetHeight > 0;
        } catch (e) {
            return false;
        }
    }

    function sameOriginWindowWithAutotask(win) {
        try {
            return win && win !== window && win.autotask ? win : null;
        } catch (e) {
            return null;
        }
    }

    function findAesSyntheticOpenerWindow() {
        if (!aesFrameCloseTarget()) return null;

        try {
            const topDoc = window.top && window.top.document;
            if (topDoc) {
                const frames = Array.prototype.slice.call(topDoc.querySelectorAll('iframe'));
                const preferred = frames.filter(function (frame) {
                    return frame.contentWindow !== window &&
                        frame.classList &&
                        frame.classList.contains('at-tab-frame') &&
                        !frame.classList.contains('at-tabs-peek-frame') &&
                        isVisibleFrame(frame);
                });
                const candidates = preferred.concat(frames.filter(function (frame) {
                    return frame.contentWindow !== window &&
                        (!frame.classList || !frame.classList.contains('at-tabs-peek-frame'));
                }));
                for (const frame of candidates) {
                    const candidate = sameOriginWindowWithAutotask(frame.contentWindow);
                    if (candidate) return candidate;
                }
            }
        } catch (e) {}

        const fallbackWindows = [window.parent, window.top, window];
        for (const candidate of fallbackWindows) {
            const opener = sameOriginWindowWithAutotask(candidate);
            if (opener) return opener;
        }

        try {
            return window.parent && window.parent !== window ? window.parent : null;
        } catch (e) {
            return null;
        }
    }

    function getSyntheticOpenerFallback(prop) {
        const fallbackWindows = [window.parent, window.top, window];
        for (const candidate of fallbackWindows) {
            try {
                if (candidate && candidate[prop]) return candidate[prop];
            } catch (e) {}
        }
        return undefined;
    }

    function getAesSyntheticOpener() {
        if (!syntheticOpenerProxy) {
            syntheticOpenerProxy = new Proxy({ closed: false }, {
                get: function (_target, prop) {
                    if (prop === 'closed') return false;
                    if (prop === 'focus') {
                        return function () {
                            const target = findAesSyntheticOpenerWindow();
                            try {
                                if (target && typeof target.focus === 'function') target.focus();
                            } catch (e) {}
                        };
                    }
                    if (prop === 'close') return function () {};
                    const target = findAesSyntheticOpenerWindow();
                    if (target) {
                        try {
                            const value = target[prop];
                            return typeof value === 'function' ? value.bind(target) : value;
                        } catch (e) {}
                    }
                    return getSyntheticOpenerFallback(prop);
                },
                set: function (_target, prop, value) {
                    const target = findAesSyntheticOpenerWindow();
                    try {
                        if (target) target[prop] = value;
                    } catch (e) {}
                    return true;
                },
            });
        }
        return syntheticOpenerProxy;
    }

    function installAesSyntheticOpener() {
        if (syntheticOpenerInstalled || !featureEnabled || !aesFrameCloseTarget()) return;
        try {
            nativeOpenerValue = window.opener || null;
        } catch (e) {
            nativeOpenerValue = null;
        }
        if (nativeOpenerValue) return;

        try {
            Object.defineProperty(window, 'opener', {
                configurable: true,
                get: function () {
                    return nativeOpenerValue || getAesSyntheticOpener();
                },
                set: function (value) {
                    nativeOpenerValue = value;
                },
            });
            syntheticOpenerInstalled = true;
        } catch (e) {
            try {
                window.opener = getAesSyntheticOpener();
                syntheticOpenerInstalled = true;
            } catch (_e) {}
        }
    }
    const ROUTES = globalThis.__AES_ROUTE_REGISTRY__ || {};
    const ID_KEYS = [
        'ID',
        'ticketId',
        'ticketID',
        'genericId',
        'accountId',
        'contractID',
        'contractId',
        'contactId',
        'contactID',
        'resourceId',
        'resourceID',
        'projectId',
        'projectID',
        'taskId',
        'taskID',
        'installedProductId',
        'installedProductID',
        'configurationItemId',
        'configurationItemID',
        'opportunityId',
        'opportunityID',
        'salesorderid',
        'salesOrderId',
        'salesOrderID',
        'purchaseOrderId',
        'purchaseorderid',
        'purchaseOrderID',
        'QuoteID',
        'quoteID',
        'quoteId',
        'objectID',
        'groupid',
        'groupId',
        'groupID',
        'personId',
        'personID',
        'recurring_ticket_id',
        'recurringTicketId',
    ];

    function pathOf(url) {
        try {
            const parsed = new URL(url, window.location.href);
            if (ROUTES.normalizePath) {
                return ROUTES.normalizePath(parsed.pathname);
            }
            return parsed.pathname.toLowerCase().replace(/\/index$/, '');
        } catch (error) {
            return '';
        }
    }

    function isHandledUrl(url) {
        const path = pathOf(url);
        if (!path) {
            return false;
        }
        if (ROUTES.isHandledPath) {
            return ROUTES.isHandledPath(path);
        }
        return false;
    }

    function absoluteUrl(url) {
        try { return new URL(decodeUrl(String(url || '')), location.origin).href; }
        catch (e) { return ''; }
    }

    function decodeUrl(url) {
        return (url || '').replace(/\\u0026/g, '&').replace(/&amp;/g, '&');
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
        if (!featureEnabled) return false;
        const targetUrl = absoluteUrl(url);
        if (!targetUrl || !isHandledUrl(targetUrl)) return false;
        window.postMessage({ __ns: MSG_NS, type: 'open', url: targetUrl }, location.origin);
        return true;
    }

    function postOpenDuplicate(url) {
        if (!featureEnabled) return false;
        const targetUrl = absoluteUrl(url);
        if (!targetUrl || !isHandledUrl(targetUrl)) return false;
        pendingDuplicateOpenUntil = 0;
        window.postMessage({ __ns: MSG_NS, type: 'open-duplicate', url: targetUrl }, location.origin);
        return true;
    }

    function isPendingMapOpen() {
        return pendingMapOpenUntil && Date.now() < pendingMapOpenUntil;
    }

    function isPendingDuplicateOpen() {
        return pendingDuplicateOpenUntil && Date.now() < pendingDuplicateOpenUntil;
    }

    function hasUserNavigationActivation() {
        if (pendingUserNavigationUntil && Date.now() < pendingUserNavigationUntil) return true;
        const activation = navigator.userActivation;
        return !!(activation && activation.isActive);
    }

    function armUserNavigationFromEvent(event) {
        if (!featureEnabled || !event || event.isTrusted === false) return;
        if (extractHandledNavigationUrlFromEventTarget(event.target)) {
            pendingUserNavigationUntil = Date.now() + 1500;
        }
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
        if (!featureEnabled) return false;
        const targetUrl = absoluteUrl(url);
        if (!targetUrl || (!isPendingMapOpen() && !isMapUrl(targetUrl))) return false;
        pendingMapOpenUntil = 0;
        window.postMessage({ __ns: MSG_NS, type: 'map', url: targetUrl }, location.origin);
        return true;
    }

    function isPeekPopupUrl(url) {
        // Peek routing has two gates: this page-context bridge posts the request,
        // then aes-iframe-bridge.js validates and forwards it to the top shell.
        // When adding a programmatic Peek URL, update both isPeekPopupUrl copies.
        const targetUrl = absoluteUrl(url);
        if (!targetUrl) return false;
        try {
            const parsed = new URL(targetUrl);
            const path = pathOf(parsed.href);
            if ((path === '/mvc/inventory/receipthistory.mvc' ||
                path === '/mvc/inventory/emailpurchaseorder.mvc/emailpurchaseorder') &&
                parsed.searchParams.has('purchaseOrderId')) return true;
            if (path === '/autotask/column_chooser.aspx') return true;
            if (path.includes('contract') && (
                path.includes('service') ||
                path.includes('discount') ||
                path.includes('exclusion') ||
                path.includes('selector') ||
                path.includes('installedproduct') ||
                path.includes('contract_products')
            )) return true;
            return path === '/mvc/servicedesk/timeentry.mvc/timeentrypopoutfromdialog' ||
                path === '/mvc/servicedesk/note.mvc/notepopoutfromdialog' ||
                path === '/mvc/servicedesk/timeentry.mvc/newtickettimeentrypage' ||
                path === '/mvc/servicedesk/note.mvc/newticketnotepage' ||
                path === '/mvc/projects/projectnote.mvc/newprojectnote' ||
                path === '/projects/calendar/prjcalendar.asp' ||
                path === '/mvc/file/attachment.mvc/projectattachment' ||
                path === '/mvc/projects/teammember.mvc/add' ||
                path === '/autotask/views/projects/project_cost.aspx' ||
                path === '/mvc/timesheets/expense.mvc/createnewprojectexpense' ||
                path === '/projects/wizards/transformations/copyattributes/popwiz_frames.asp' ||
                path === '/projects/reports' ||
                path.startsWith('/projects/reports/') ||
                path === '/autotask35/dataselectorhandlers/ticketdataselectorpopup.aspx' ||
                path === '/mvc/projects/importticket.mvc/copytickettoproject' ||
                path === '/servicedesk/popups/forward/svcforward.asp' ||
                path === '/servicedesk/reports/togoreportframe.asp' ||
                path === '/mvc/servicedesk/tickethistory.mvc/servicetickethistory' ||
                path === '/popups/work/svcdetail.asp' ||
                path === '/popups/searches/srcclient.asp' ||
                path === '/administrator/roles/tabroleview.asp' ||
                path === '/autotask/views/administration/companysetup/neweditallocationcode.aspx' ||
                path === '/mvc/contracts/contract.mvc/edit' ||
                path === '/mvc/contracts/newcontractwizard.mvc/renewcontractwizard' ||
                path === '/mvc/contracts/contractnote.mvc/newcontractnote' ||
                path === '/mvc/contracts/contracthistory.mvc/entitychangehistory' ||
                (path === '/popups/journals/jrnpop.asp' && parsed.searchParams.get('action') === 'showCompliance');
        } catch (e) {
            return false;
        }
    }

    function postPeek(url) {
        if (!featureEnabled) return false;
        const targetUrl = absoluteUrl(url);
        if (!targetUrl || !isPeekPopupUrl(targetUrl)) return false;
        window.postMessage({ __ns: MSG_NS, type: 'open-peek', url: targetUrl }, location.origin);
        return true;
    }

    function postCloseFrame() {
        const target = aesFrameCloseTarget();
        if (!featureEnabled || !target) return false;
        window.postMessage({ __ns: MSG_NS, type: 'close-frame', target: target }, location.origin);
        return true;
    }

    function isClientSearchSelectionClick(event) {
        if (aesFrameCloseTarget() !== 'peek') return false;
        if (pathOf(location.href) !== '/popups/searches/srcclient.asp') return false;
        const el = event.target && event.target.closest
            ? event.target.closest('a[onclick], td[onclick], div[onclick], tr[onclick]')
            : null;
        if (!el) return false;
        const onclickText = el.getAttribute('onclick') || '';
        return /\blast5List\.Insert\s*\(/i.test(onclickText);
    }

    function closePeekAfterNativeSelection() {
        setTimeout(function () {
            window.postMessage({ __ns: MSG_NS, type: 'close-frame', target: 'peek' }, location.origin);
        }, 0);
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

    function createPeekWindow(url) {
        const targetUrl = absoluteUrl(url);
        return {
            closed: false,
            opener: window,
            focus: function () {
                if (targetUrl) window.postMessage({ __ns: MSG_NS, type: 'open-peek', url: targetUrl }, location.origin);
            },
            blur: function () {},
            close: function () {
                this.closed = true;
                window.postMessage({ __ns: MSG_NS, type: 'close-frame', target: 'peek' }, location.origin);
            },
        };
    }

    function armMapOpenFromEvent(event) {
        if (!featureEnabled) return false;
        const clickedMapIcon = event.target.closest && event.target.closest('.InlineIconButton.Map, .InlineIcon.Map');
        if (clickedMapIcon) {
            pendingMapOpenUntil = Date.now() + 5000;
        }
        return !!clickedMapIcon;
    }

    function extractHandledNavigationUrlFromEventTarget(target) {
        const anchor = target && target.closest ? target.closest('a[href]') : null;
        if (anchor) {
            const href = anchor.getAttribute('href') || '';
            const contactMatch = href.match(/OpenContactDetail\s*\(\s*(\d+)\s*\)/i);
            if (contactMatch) {
                return absoluteUrl('/opportunity/contacts/Contact.asp?contactID=' + encodeURIComponent(contactMatch[1]));
            }
            const hrefUrl = absoluteUrl(anchor.href || anchor.getAttribute('href') || '');
            if (hrefUrl && isHandledUrl(hrefUrl)) return hrefUrl;
        }

        const el = target && target.closest ? target.closest('td[onclick], a[onclick], div[onclick]') : null;
        if (!el) return '';
        const onclickText = el.getAttribute('onclick') || '';
        const newWindowMatch = onclickText.match(
            /NewWindowPage\s*\(\s*'[^']*'\s*,\s*'([^']+)'\s*,\s*(?:true|false)\s*,\s*'([^']+)'\s*,\s*'([^']+)'/
        );
        if (newWindowMatch) {
            const baseUrl = newWindowMatch[1] || '';
            const key = newWindowMatch[2] || '';
            const value = newWindowMatch[3] || '';
            const url = new URL(absoluteUrl(baseUrl), location.origin);
            if (!isHandledUrl(url.href)) return '';
            if (key && value && !url.searchParams.has(key)) url.searchParams.set(key, value);
            return url.href;
        }

        const windowOpenMatch = onclickText.match(/window\.open\s*\(\s*['"]([^'"]+)['"]/i);
        if (windowOpenMatch) {
            const hrefUrl = absoluteUrl(windowOpenMatch[1] || '');
            if (hrefUrl && isHandledUrl(hrefUrl)) return hrefUrl;
        }

        return '';
    }

    document.addEventListener('pointerdown', armMapOpenFromEvent, true);
    document.addEventListener('pointerdown', armUserNavigationFromEvent, true);
    window.addEventListener('message', function (event) {
        if (event.source !== window) return;
        if (event.origin !== location.origin) return;
        const data = event.data;
        if (!data || data.__ns !== MSG_NS || data.type !== 'feature-enabled') return;
        featureEnabled = data.enabled !== false;
        if (!featureEnabled) {
            pendingMapOpenUntil = 0;
            pendingDuplicateOpenUntil = 0;
            pendingUserNavigationUntil = 0;
        }
    }, true);
    document.addEventListener('mousedown', armMapOpenFromEvent, true);
    document.addEventListener('mousedown', armUserNavigationFromEvent, true);
    document.addEventListener('mousedown', function (event) {
        if (!featureEnabled) return;
        if (event.button !== 1) return;
        const targetUrl = extractHandledNavigationUrlFromEventTarget(event.target);
        if (!targetUrl) return;
        pendingDuplicateOpenUntil = Date.now() + 1500;
        event.preventDefault();
    }, true);

    document.addEventListener('click', function (event) {
        if (!featureEnabled) return;
        armMapOpenFromEvent(event);
        armUserNavigationFromEvent(event);
        if (isClientSearchSelectionClick(event)) {
            closePeekAfterNativeSelection();
        }
        if (isPendingMapOpen()) {
            const anchor = event.target.closest && event.target.closest('a[href]');
            if (anchor && postMap(anchor.href)) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                return;
            }
        }

        const targetUrl = extractHandledNavigationUrlFromEventTarget(event.target);
        if (!targetUrl) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (!postPeek(targetUrl)) postOpen(targetUrl);
    }, true);
    document.addEventListener('auxclick', function (event) {
        if (!featureEnabled) return;
        if (event.button !== 1) return;
        const targetUrl = extractHandledNavigationUrlFromEventTarget(event.target);
        if (!targetUrl) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        postOpenDuplicate(targetUrl);
    }, true);

    const originalOpen = window.open;
    window.open = function (url, target, features) {
        if (!featureEnabled) return originalOpen.apply(window, arguments);
        if (!hasUserNavigationActivation() && !isPendingDuplicateOpen() && !isPendingMapOpen()) {
            return originalOpen.apply(window, arguments);
        }
        if (postPeek(url)) return createPeekWindow(url);
        if (postMap(url)) return createMapWindow(url);
        if (isPendingDuplicateOpen() && postOpenDuplicate(url)) return null;
        if (postOpen(url)) return null;
        return originalOpen.apply(window, arguments);
    };

    const originalClose = window.close;
    window.close = function () {
        if (postCloseFrame()) return;
        return originalClose.apply(window, arguments);
    };

    installAesSyntheticOpener();
    setTimeout(installAesSyntheticOpener, 0);
    setTimeout(installAesSyntheticOpener, 1000);
    window.addEventListener('pageshow', installAesSyntheticOpener, true);

    const originalAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
        if (!featureEnabled) return originalAnchorClick.apply(this, arguments);
        if (!hasUserNavigationActivation()) return originalAnchorClick.apply(this, arguments);
        if (postPeek(this.href)) return;
        if (postMap(this.href)) return;
        return originalAnchorClick.apply(this, arguments);
    };

    function patchSiteNavigation() {
        const nav = window.autotask && window.autotask.siteNavigation;
        if (!nav || nav.__AESPatchedOpenPage || typeof nav.__openPage !== 'function') return false;

        const originalOpenPage = nav.__openPage;
        nav.__AESPatchedOpenPage = true;
        nav.__openPage = function (pageObject) {
            if (!featureEnabled) return originalOpenPage.apply(this, arguments);
            if (!hasUserNavigationActivation() && !isPendingDuplicateOpen() && !isPendingMapOpen()) {
                return originalOpenPage.apply(this, arguments);
            }
            const peekUrl = extractHandledUrlFromPageObject(pageObject);
            if (peekUrl && postPeek(peekUrl)) return false;
            if (isPendingMapOpen()) {
                const mapUrl = extractMapUrlFromPageObject(pageObject);
                if (mapUrl && postMap(mapUrl)) return false;
            }
            const url = extractHandledUrlFromPageObject(pageObject);
            if (url && isPendingDuplicateOpen() && postOpenDuplicate(url)) return false;
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
