(function () {
    'use strict';

    if (window.__AESExternalOpenPageBridgeInstalled) return;
    window.__AESExternalOpenPageBridgeInstalled = true;

    const MSG_NS = 'autotask-tabs-external-open-v1';

    function decodeUrl(url) {
        return String(url || '').replace(/\\u0026/g, '&').replace(/&amp;/g, '&');
    }

    function normalizeAutotaskContractUrl(url) {
        try {
            const parsed = new URL(decodeUrl(url), location.href);
            const path = parsed.pathname.toLowerCase().replace(/\/index$/, '');
            if (!/^ww\d+\.autotask\.net$/i.test(parsed.hostname)) return '';
            if (path !== '/contracts/views/contractview.asp'
                && path !== '/contracts/views/contractsummary.asp') return '';
            if (!parsed.searchParams.get('contractID') && !parsed.searchParams.get('contractId')) return '';
            return parsed.href;
        } catch (e) {
            return '';
        }
    }

    function postOpen(url) {
        const targetUrl = normalizeAutotaskContractUrl(url);
        if (!targetUrl) return false;

        window.postMessage({
            __ns: MSG_NS,
            type: 'open-autotask-url',
            url: targetUrl,
        }, location.origin);
        return true;
    }

    function createExternalOpenWindow(url) {
        return {
            closed: false,
            opener: window,
            focus: function () {
                postOpen(url);
            },
            blur: function () {},
            close: function () { this.closed = true; },
        };
    }

    const originalOpen = window.open;
    window.open = function (url, target, features) {
        const targetUrl = normalizeAutotaskContractUrl(url);
        if (targetUrl && postOpen(targetUrl)) {
            return createExternalOpenWindow(targetUrl);
        }
        return originalOpen.call(window, url, target, features);
    };
})();
