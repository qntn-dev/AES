(function () {
    'use strict';

    const AES = window.__AES__ = window.__AES__ || {};
    if (AES.sharedInitialized) return;
    AES.sharedInitialized = true;

    AES.version = '0.6.0';
    AES.isTop = window.top === window.self;
    AES.MSG_NS = 'autotask-tabs-v1';
    const ROUTES = globalThis.__AES_ROUTE_REGISTRY__ || {};

    AES.ROUTES = ROUTES;
    AES.HANDLED_PATHS = ROUTES.HANDLED_PATHS || [];
    AES.NATIVE_HOME_PATHS = ROUTES.NATIVE_HOME_PATHS || [];
    AES.HANDLED_PATH_INCLUDES = ROUTES.HANDLED_PATH_INCLUDES || [];
    AES.EXCLUDED_PATHS = ROUTES.EXCLUDED_PATHS || [];
    AES.EXCLUDED_PATH_INCLUDES = ROUTES.EXCLUDED_PATH_INCLUDES || [];
    AES.BAR_H = 65;
    AES.BAR_W = 240;
    AES.BAR_W_MIN = 56;
    AES.BAR_W_MAX = 420;
    AES.BAR_W_COMPACT = 96;
    AES.STORAGE_KEY = 'autotask-tabs-v1';
    AES.SETTINGS_STORAGE_KEY = 'autotask-tabs-settings-v1';

    AES.isRegionalAutotaskHost = function isRegionalAutotaskHost(hostname) {
        return /^ww\d+\.autotask\.net$/i.test(String(hostname || ''));
    };

    AES.isAllowedHost = function isAllowedHost(url) {
        try {
            const parsed = new URL(url || location.href, location.origin);
            return AES.isRegionalAutotaskHost(parsed.hostname);
        } catch (e) {
            return AES.isRegionalAutotaskHost(location.hostname);
        }
    };

    AES.featuresEnabled = function featuresEnabled() {
        return AES.state && AES.state.extensionEnabled !== false;
    };

    AES.pathOf = function pathOf(url) {
        try { return new URL(url, location.origin).pathname.toLowerCase(); }
        catch (e) { return ''; }
    };

    AES.normalizeHandledPath = function normalizeHandledPath(pathname) {
        if (ROUTES.normalizePath) {
            return ROUTES.normalizePath(pathname);
        }
        return String(pathname || '').toLowerCase().replace(/\/index$/, '');
    };

    AES.extractInnerUrlFromLandingPageUrl = function extractInnerUrlFromLandingPageUrl(url) {
        try {
            const landingUrl = new URL(url, location.origin);
            if (landingUrl.pathname.toLowerCase() !== '/autotaskonyx/landingpage') return null;

            const rawViewData = landingUrl.searchParams.get('view-data');
            if (!rawViewData) return null;

            const json = atob(rawViewData);
            const parsed = JSON.parse(json);
            const innerUrl = parsed && typeof parsed.url === 'string' ? parsed.url : '';
            return innerUrl ? AES.toAbsoluteUrl(innerUrl) : null;
        } catch (e) {
            return null;
        }
    };

    AES.isNativeOnyxUrl = function isNativeOnyxUrl(url) {
        try {
            const onyxUrl = new URL(url, location.origin);
            const path = onyxUrl.pathname.toLowerCase();
            if (path !== '/autotaskonyx' && !path.startsWith('/autotaskonyx/')) return false;
            if (path === '/autotaskonyx/landingpage' && AES.extractInnerUrlFromLandingPageUrl(url)) {
                return false;
            }
            return true;
        } catch (e) {
            return false;
        }
    };

    AES.isExcludedUrl = function isExcludedUrl(url) {
        const path = AES.normalizeHandledPath(AES.pathOf(url));
        if (ROUTES.isExcludedPath && ROUTES.isExcludedPath(path)) return true;
        if (!ROUTES.isExcludedPath) {
            if (AES.EXCLUDED_PATHS.includes(path)) return true;
            if (AES.EXCLUDED_PATH_INCLUDES.some(fragment => path.includes(fragment))) return true;
        }

        const innerUrl = AES.extractInnerUrlFromLandingPageUrl(url);
        return !!innerUrl && AES.isExcludedUrl(innerUrl);
    };

    AES.isNativeHomeUrl = function isNativeHomeUrl(url) {
        if (AES.isNativeOnyxUrl(url)) return true;

        const path = AES.normalizeHandledPath(AES.pathOf(url));
        if (ROUTES.isNativeHomePath && ROUTES.isNativeHomePath(path)) return true;
        if (!ROUTES.isNativeHomePath && AES.NATIVE_HOME_PATHS.includes(path)) return true;

        const innerUrl = AES.extractInnerUrlFromLandingPageUrl(url);
        return !!innerUrl && AES.isNativeHomeUrl(innerUrl);
    };

    AES.isDialogPopOutFromDialogUrl = function isDialogPopOutFromDialogUrl(url) {
        const path = AES.normalizeHandledPath(AES.pathOf(url));
        return path === '/mvc/servicedesk/timeentry.mvc/timeentrypopoutfromdialog' ||
            path === '/mvc/servicedesk/note.mvc/notepopoutfromdialog';
    };

    AES.isHandledUrl = function isHandledUrl(url) {
        if (AES.isNativeHomeUrl(url)) return false;
        if (AES.isDialogPopOutFromDialogUrl(url)) return false;

        const innerUrl = AES.extractInnerUrlFromLandingPageUrl(url);
        if (innerUrl) return AES.isHandledUrl(innerUrl);

        const path = AES.normalizeHandledPath(AES.pathOf(url));
        if (ROUTES.isHandledPath) {
            return ROUTES.isHandledPath(path);
        }
        return AES.HANDLED_PATHS.includes(path) ||
            AES.HANDLED_PATH_INCLUDES.some(fragment => path.includes(fragment));
    };

    AES.toAbsoluteUrl = function toAbsoluteUrl(url) {
        return new URL(url, location.origin).href;
    };

    AES.extractHandledUrlFromLandingPageUrl = function extractHandledUrlFromLandingPageUrl(url) {
        if (AES.isNativeOnyxUrl(url)) return null;
        const innerUrl = AES.extractInnerUrlFromLandingPageUrl(url);
        return innerUrl && AES.isHandledUrl(innerUrl) ? innerUrl : null;
    };

    // Detect when our extension context becomes invalid (Chrome auto-
    // update, manual reload, disable) so the still-running OLD
    // content scripts in this tab can gracefully clean up. Without
    // this, every chrome.runtime.* call from the orphaned scripts
    // throws "Extension context invalidated", the AES tab bar stays
    // visible but unresponsive, and the user sees the extension as
    // "broken" until they refresh manually.
    //
    // On detection we strip AES-injected DOM and (top frame only)
    // show a small toast asking the user to refresh.
    if (!AES.lifecycleWatchInstalled) {
        AES.lifecycleWatchInstalled = true;

        let invalidated = false;

        function isExtensionContextValid() {
            try {
                return !!(chrome && chrome.runtime && chrome.runtime.id);
            } catch (e) {
                return false;
            }
        }

        function removeAesDomElements() {
            try {
                const selectors = [
                    '.at-tabs-bar',
                    '.at-tabs-peek-wrapper',
                    '.at-tabs-modal',
                    '.at-tabs-modal-backdrop',
                    '.at-tabs-settings-backdrop',
                    '.at-tabs-release-notes-backdrop',
                    '.at-tabs-context-menu',
                    '.at-tabs-map-modal',
                    '.at-tabs-split-buttons',
                    '.at-tabs-viewport',
                    '.at-tabs-home-cover',
                ];
                document.querySelectorAll(selectors.join(','))
                    .forEach(function (el) { try { el.remove(); } catch (e) {} });
            } catch (e) {}
            try {
                if (document.body && document.body.style) {
                    document.body.style.paddingTop = '';
                }
                if (document.documentElement && document.documentElement.classList) {
                    document.documentElement.classList.remove(
                        'aes-dark', 'aes-shell-active', 'aes-brand-link-colors'
                    );
                }
            } catch (e) {}
        }

        function showRefreshToast() {
            if (document.getElementById('aes-update-toast')) return;
            const host = document.body || document.documentElement;
            if (!host) return;
            const toast = document.createElement('div');
            toast.id = 'aes-update-toast';
            toast.setAttribute('role', 'status');
            toast.style.cssText = [
                'position:fixed', 'z-index:2147483647', 'left:50%',
                'bottom:24px', 'transform:translateX(-50%)',
                'background:#1f2937', 'color:#f9fafb',
                'font:500 13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
                'padding:12px 16px', 'border-radius:8px',
                'box-shadow:0 8px 24px rgba(0,0,0,0.3)',
                'display:flex', 'align-items:center', 'gap:12px',
                'max-width:90vw',
            ].join(';') + ';';
            const text = document.createElement('span');
            text.textContent = 'AES has been updated. Please refresh to continue.';
            const button = document.createElement('button');
            button.textContent = 'Refresh';
            button.style.cssText = [
                'background:#3b82f6', 'color:#ffffff', 'border:0',
                'padding:6px 12px', 'border-radius:6px',
                'font:600 12px/1 system-ui,-apple-system,sans-serif',
                'cursor:pointer',
            ].join(';') + ';';
            button.addEventListener('click', function () {
                try { location.reload(); } catch (e) {}
            });
            toast.appendChild(text);
            toast.appendChild(button);
            host.appendChild(toast);
        }

        function handleExtensionContextInvalidated() {
            if (invalidated) return;
            invalidated = true;
            removeAesDomElements();
            if (window === window.top) {
                try { showRefreshToast(); } catch (e) {}
            }
        }

        const intervalId = setInterval(function () {
            if (isExtensionContextValid()) return;
            try { clearInterval(intervalId); } catch (e) {}
            handleExtensionContextInvalidated();
        }, 3000);
    }
})();
