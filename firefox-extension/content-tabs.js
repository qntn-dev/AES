(function () {
    'use strict';

    const AES = window.__AES__;
    if (!AES || AES.bootstrapped) return;
    AES.bootstrapped = true;

    if (AES.isExcludedUrl && AES.isExcludedUrl(location.href)) return;

    const settingsReady = AES.loadSettings ? AES.loadSettings() : Promise.resolve();

    function initSettingsBackedFeatures() {
        return settingsReady.then(function () {
            if (AES.initPhoneLinks) {
                AES.initPhoneLinks();
            }
        });
    }

    if (AES.isTop) {
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
