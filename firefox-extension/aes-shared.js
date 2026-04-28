(function () {
    'use strict';

    const AES = window.__AES__ = window.__AES__ || {};
    if (AES.sharedInitialized) return;
    AES.sharedInitialized = true;

    AES.version = '0.4.0';
    AES.isTop = window.top === window.self;
    AES.MSG_NS = 'autotask-tabs-v1';
    AES.HANDLED_PATHS = [
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
        '/mvc/projects/projectdetail.mvc/projectdetail',
        '/contracts/views/contractview.asp',
        '/contracts/views/contractsummary.asp',
    ];
    AES.HANDLED_PATH_INCLUDES = [
        '/ticketprintview.mvc',
        '/picklistdetailforshippinggrid',
        '/packinglistdetailforshippinggrid',
    ];
    // Pages where AES must stay completely hands-off after they load. They can
    // still be opened as tab-shell destinations via HANDLED_PATH_INCLUDES.
    AES.EXCLUDED_PATHS = [
        '/mvc/servicedesk/ticketprintview.mvc',
    ];
    AES.EXCLUDED_PATH_INCLUDES = [
        '/ticketprintview.mvc',
        '/picklistdetailforshippinggrid',
        '/packinglistdetailforshippinggrid',
    ];
    AES.BAR_H = 65;
    AES.BAR_W = 240;
    AES.STORAGE_KEY = 'autotask-tabs-v1';
    AES.SETTINGS_STORAGE_KEY = 'autotask-tabs-settings-v1';

    AES.pathOf = function pathOf(url) {
        try { return new URL(url, location.origin).pathname.toLowerCase(); }
        catch (e) { return ''; }
    };

    AES.normalizeHandledPath = function normalizeHandledPath(path) {
        return (path || '').toLowerCase().replace(/\/index$/, '');
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

    AES.isExcludedUrl = function isExcludedUrl(url) {
        const path = AES.normalizeHandledPath(AES.pathOf(url));
        if (AES.EXCLUDED_PATHS.includes(path)) return true;
        if (AES.EXCLUDED_PATH_INCLUDES.some(fragment => path.includes(fragment))) return true;

        const innerUrl = AES.extractInnerUrlFromLandingPageUrl(url);
        return !!innerUrl && AES.isExcludedUrl(innerUrl);
    };

    AES.isHandledUrl = function isHandledUrl(url) {
        const path = AES.normalizeHandledPath(AES.pathOf(url));
        return AES.HANDLED_PATHS.includes(path) ||
            AES.HANDLED_PATH_INCLUDES.some(fragment => path.includes(fragment)) ||
            path.includes('/contactdetail') ||
            path.includes('/resourcedetail') ||
            path.includes('/persondetail') ||
            path === '/autotask35/grapevine/profile.aspx';
    };

    AES.toAbsoluteUrl = function toAbsoluteUrl(url) {
        return new URL(url, location.origin).href;
    };

    AES.extractHandledUrlFromLandingPageUrl = function extractHandledUrlFromLandingPageUrl(url) {
        const innerUrl = AES.extractInnerUrlFromLandingPageUrl(url);
        return innerUrl && AES.isHandledUrl(innerUrl) ? innerUrl : null;
    };
})();
