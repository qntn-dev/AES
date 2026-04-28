(function () {
    'use strict';

    const AES = window.__AES__;
    if (!AES || AES.bootstrapped) return;
    AES.bootstrapped = true;

    if (AES.isExcludedUrl && AES.isExcludedUrl(location.href)) return;

    const settingsReady = AES.loadSettings ? AES.loadSettings() : Promise.resolve();

    function injectTopLevelPageBridge() {
        if (!AES.isTop) return;
        if (document.documentElement.dataset.aesPageBridgeInjected === 'true') return;
        document.documentElement.dataset.aesPageBridgeInjected = 'true';

        const runtime = (typeof browser !== 'undefined' && browser && browser.runtime)
            ? browser.runtime
            : (typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime : null);
        if (!runtime || typeof runtime.getURL !== 'function') return;

        const script = document.createElement('script');
        script.src = runtime.getURL('aes-page-bridge.js');
        script.onload = function () { script.remove(); };
        (document.documentElement || document.head).appendChild(script);
    }

    function initSettingsBackedFeatures() {
        return settingsReady.then(function () {
            if (AES.initPhoneLinks) {
                AES.initPhoneLinks();
            }
        });
    }

    if (AES.isTop) {
        injectTopLevelPageBridge();
        window.addEventListener('message', AES.handleShellMessage);
        AES.installTopLevelNavigationInterception();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                void initSettingsBackedFeatures().then(AES.mount);
            }, { once: true });
        } else {
            void initSettingsBackedFeatures().then(AES.mount);
        }

        window.addEventListener('popstate', AES.maybePromoteTopLevelLandingRoute);
        window.addEventListener('hashchange', AES.maybePromoteTopLevelLandingRoute);
        setInterval(AES.maybePromoteTopLevelLandingRoute, 250);
        AES.maybePromoteTopLevelLandingRoute();
        return;
    }

    if (AES.initIframeBridge) {
        AES.initIframeBridge();
    }
    void initSettingsBackedFeatures();
})();
