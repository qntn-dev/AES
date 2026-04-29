(function () {
    'use strict';

    const AES = window.__AES__ = window.__AES__ || {};
    if (AES.sharedInitialized) return;
    AES.sharedInitialized = true;

    AES.version = '0.6.0';
    AES.isTop = window.top === window.self;
    AES.MSG_NS = 'autotask-tabs-v1';
    AES.HANDLED_PATHS = [
        '/mvc/servicedesk/ticketdetail.mvc',
        '/mvc/crm/accountdetail.mvc',
        '/mvc/crm/contactdetail.mvc',
        '/mvc/crm/installedproductdetail.mvc',
        '/mvc/crm/note.mvc/view',
        '/mvc/crm/opportunitydetail.mvc',
        '/mvc/administrationsetup/resourcedetail.mvc',
        '/mvc/administration/resourcedetail.mvc',
        '/mvc/administrationsetup/resource.mvc/resourcedetail',
        '/mvc/administrationsetup/persondetail.mvc',
        '/autotask35/grapevine/profile.aspx',
        '/autotask35/crm/salesorder/salesorderdetail.aspx',
        '/opportunity/quotes/quote.asp',
        '/opportunity/quotes/newquote.asp',
        '/mvc/crm/quotetemplate.mvc/editproperties',
        '/autotask/popups/tickets/recurring_ticket.aspx',
        '/autotask/autotaskextend/livelinks/livelinkeditor.aspx',
        '/autotask/autotaskextend/directory_view.aspx',
        '/autotask/views/crm/contact_group_management.aspx',
        '/autotask35/crm/contactgroupmanager.aspx',
        '/timesheets/views/readonly/tmsreadonly_100.asp',
        '/autotask/views/servicedesk/servicedeskticket/service_ticket_panel_edit.aspx',
        '/mvc/crm/contractbillingruleassociation.mvc/editcontact',
        '/mvc/projects/projectdetail.mvc/projectdetail',
        '/mvc/projects/taskdetail.mvc',
        '/contracts/views/contractview.asp',
        '/contracts/views/contractsummary.asp',
    ];
    AES.NATIVE_HOME_PATHS = [
        '/mvc/inventory/costitem.mvc/shipping',
    ];
    AES.HANDLED_PATH_INCLUDES = [
        '/ticketprintview.mvc',
        '/picklistdetailforshippinggrid',
        '/packinglistdetailforshippinggrid',
        '/inventory/inventory_edit_order.aspx',
        '/billingproduct',
        '/billingproducts',
        '/billing_product',
        '/billing_products',
        '/billingrule',
        '/billingrules',
        '/billing_rule',
        '/billing_rules',
        '/billingassociation',
        '/billingassociations',
        '/billingproductassociation',
        '/billingruleassociation',
    ];
    // Pages where AES must stay completely hands-off after they load. They can
    // still be opened as tab-shell destinations via HANDLED_PATH_INCLUDES.
    AES.EXCLUDED_PATHS = [
        '/mvc/servicedesk/ticketprintview.mvc',
        '/mvc/framework/authentication.mvc/authenticate',
    ];
    AES.EXCLUDED_PATH_INCLUDES = [
        '/ticketprintview.mvc',
        '/picklistdetailforshippinggrid',
        '/packinglistdetailforshippinggrid',
    ];
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

    AES.isNativeHomeUrl = function isNativeHomeUrl(url) {
        const path = AES.normalizeHandledPath(AES.pathOf(url));
        if (AES.NATIVE_HOME_PATHS.includes(path)) return true;

        const innerUrl = AES.extractInnerUrlFromLandingPageUrl(url);
        return !!innerUrl && AES.isNativeHomeUrl(innerUrl);
    };

    AES.isHandledUrl = function isHandledUrl(url) {
        if (AES.isNativeHomeUrl(url)) return false;
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
