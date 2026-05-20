(function () {
    'use strict';

    const AES = window.__AES__;
    if (!AES || AES.bootstrapped) return;
    AES.bootstrapped = true;

    if (AES.isAllowedHost && !AES.isAllowedHost(location.href)) return;
    if (AES.isExcludedUrl && AES.isExcludedUrl(location.href)) return;

    const settingsReady = AES.loadSettings ? AES.loadSettings() : Promise.resolve();
    const DIRECT_HANDLED_OPEN_STORAGE_KEY = 'autotask-tabs-direct-handled-open-url-v1';

    function shouldPromoteDirectHandledTopRoute() {
        if (!AES.isTop) return false;
        if (!AES.isHandledUrl || !AES.isHandledUrl(location.href)) return false;
        if (AES.isDialogPopOutFromDialogUrl && AES.isDialogPopOutFromDialogUrl(location.href)) return false;
        if (AES.extractHandledUrlFromLandingPageUrl && AES.extractHandledUrlFromLandingPageUrl(location.href)) return false;
        if (AES.isNativeHomeUrl && AES.isNativeHomeUrl(location.href)) return false;
        if (AES.featuresEnabled && !AES.featuresEnabled()) return false;
        return true;
    }

    function sendRuntimeMessage(message) {
        const browserRuntime = typeof browser !== 'undefined' && browser && browser.runtime
            ? browser.runtime
            : null;
        if (browserRuntime && typeof browserRuntime.sendMessage === 'function') {
            try {
                return browserRuntime.sendMessage(message).catch(function () { return null; });
            } catch (e) {
                return Promise.resolve(null);
            }
        }

        const chromeRuntime = typeof chrome !== 'undefined' && chrome && chrome.runtime
            ? chrome.runtime
            : null;
        if (!chromeRuntime || typeof chromeRuntime.sendMessage !== 'function') {
            return Promise.resolve(null);
        }

        return new Promise(function (resolve) {
            try {
                chromeRuntime.sendMessage(message, function (response) {
                    try {
                        if (chromeRuntime.lastError) {
                            resolve(null);
                            return;
                        }
                    } catch (e) {}
                    resolve(response || null);
                });
            } catch (e) {
                resolve(null);
            }
        });
    }

    function sendDirectHandledRouteToExistingShell() {
        if (!shouldPromoteDirectHandledTopRoute()) return Promise.resolve(false);
        return sendRuntimeMessage({
            __aesDirectHandledOpen: true,
            type: 'open-in-existing-shell',
            url: location.href,
        }).then(function (response) {
            return !!(response && response.ok);
        });
    }

    function promoteDirectHandledTopRoute() {
        if (!shouldPromoteDirectHandledTopRoute()) return false;
        try {
            sessionStorage.setItem(DIRECT_HANDLED_OPEN_STORAGE_KEY, location.href);
            const shellUrl = new URL('/AutotaskOnyx/LandingPage', location.origin);
            shellUrl.searchParams.set('view', 'dashboard');
            location.replace(shellUrl.href);
            return true;
        } catch (e) {
            return false;
        }
    }

    function promoteDirectHandledTopRouteAsync() {
        if (!shouldPromoteDirectHandledTopRoute()) return Promise.resolve(false);
        return sendDirectHandledRouteToExistingShell().then(function (openedInExistingShell) {
            if (openedInExistingShell) return true;
            return promoteDirectHandledTopRoute();
        });
    }

    function initSettingsBackedFeatures() {
        return settingsReady.then(function () {
            if (AES.initPhoneLinks) {
                AES.initPhoneLinks();
            }
        });
    }

    function injectPageBridgeForTopFrame() {
        // aes-iframe-bridge.js bails on the top frame, so the page-bridge
        // (which lives in the page world and patches window.open /
        // window.close / HTMLFormElement.prototype.submit etc.) was never
        // installed at top. On Onyx pages where the popout dialog and
        // its hidden form live at the top frame, that meant our submit
        // override couldn't see Autotask's form.submit() call. Inject it
        // here so the override is present at the top too.
        if (document.documentElement.dataset.aesPageBridgeInjected === 'true') return;
        document.documentElement.dataset.aesPageBridgeInjected = 'true';

        const mount = document.documentElement || document.head;
        if (!mount) return;
        const runtime = typeof chrome !== 'undefined' && chrome && chrome.runtime
            ? chrome.runtime
            : (typeof browser !== 'undefined' && browser && browser.runtime ? browser.runtime : null);
        if (!runtime || typeof runtime.getURL !== 'function') return;

        const routesScript = document.createElement('script');
        const bridgeScript = document.createElement('script');
        try {
            routesScript.src = runtime.getURL('src/aes-routes.js');
            bridgeScript.src = runtime.getURL('src/aes-page-bridge.js');
        } catch (e) { return; }
        routesScript.onload = function () {
            routesScript.remove();
            mount.appendChild(bridgeScript);
        };
        routesScript.onerror = function () {
            routesScript.remove();
            mount.appendChild(bridgeScript);
        };
        bridgeScript.onload = function () { bridgeScript.remove(); };
        mount.appendChild(routesScript);
    }

    if (AES.isTop) {
        window.addEventListener('message', AES.handleShellMessage);
        injectPageBridgeForTopFrame();

        function initTopFrame() {
            void initSettingsBackedFeatures().then(function () {
                return promoteDirectHandledTopRouteAsync().then(function (promoted) {
                    if (promoted) return null;
                    return AES.mount();
                });
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initTopFrame, { once: true });
        } else {
            initTopFrame();
        }

        return;
    }

    void settingsReady.then(function () {
        if (AES.featuresEnabled && AES.featuresEnabled() && AES.initIframeBridge) {
            AES.initIframeBridge();
        }
        return initSettingsBackedFeatures();
    });
})();
