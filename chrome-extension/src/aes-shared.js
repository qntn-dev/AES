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

    AES.isHandledUrl = function isHandledUrl(url) {
        if (AES.isNativeHomeUrl(url)) return false;

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
})();
