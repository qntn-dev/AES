(function () {
    'use strict';

    const MSG_NS = 'autotask-tabs-external-open-v1';

    const runtime = (typeof browser !== 'undefined' && browser && browser.runtime)
        ? browser.runtime
        : (typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime : null);

    function requestOpenInAes(url) {
        if (!url || !runtime || !runtime.sendMessage) return false;

        try {
            runtime.sendMessage({
                __aesExternalOpen: true,
                type: 'open-autotask-url',
                url: url,
            });
            return true;
        } catch (e) {
            return false;
        }
    }

    if (window.__AESExternalOpenBridgeInstalled) return;
    window.__AESExternalOpenBridgeInstalled = true;

    window.addEventListener('message', function (event) {
        if (event.source !== window || event.origin !== location.origin) return;
        const data = event.data;
        if (!data || data.__ns !== MSG_NS || data.type !== 'open-autotask-url' || !data.url) return;
        requestOpenInAes(data.url);
    }, true);

    const script = document.createElement('script');
    script.src = runtime.getURL('src/aes-external-open-page-bridge.js');
    script.onload = function () { script.remove(); };
    (document.documentElement || document.head).appendChild(script);
})();
