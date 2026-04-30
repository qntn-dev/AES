// Background script (service worker on Chrome, event page script on
// Firefox). Sole job: when the user clicks the extension's toolbar icon, ask
// the active tab's content script to open the AES Settings modal. The toolbar
// `action` declares no `default_popup`, so `action.onClicked` fires here.
//
// On non-Autotask tabs there is no AES content script listening and the
// `tabs.sendMessage` Promise rejects with "Could not establish connection".
// We swallow that error — the toolbar button silently does nothing on those
// tabs, which matches user expectation.
(function () {
    'use strict';

    const api = (typeof browser !== 'undefined' && browser && browser.action) ? browser : chrome;
    if (!api || !api.action || !api.action.onClicked || !api.tabs) return;
    function isRegionalAutotaskHost(hostname) {
        return /^ww\d+\.autotask\.net$/i.test(String(hostname || ''));
    }

    const HANDLED_PATHS = [
        '/mvc/servicedesk/ticketdetail.mvc',
        '/mvc/servicedesk/ticketnew.mvc',
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
        '/autotask35/dataselectorhandlers/ticketdataselectorpopup.aspx',
        '/mvc/projects/importticket.mvc/copytickettoproject',
        '/servicedesk/popups/forward/svcforward.asp',
        '/servicedesk/reports/togoreportframe.asp',
        '/mvc/servicedesk/tickethistory.mvc/servicetickethistory',
        '/popups/work/svcdetail.asp',
    ];
    const NATIVE_HOME_PATHS = [
        '/mvc/inventory/costitem.mvc/shipping',
    ];
    const HANDLED_PATH_INCLUDES = [
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

    function normalizePath(pathname) {
        return String(pathname || '').toLowerCase().replace(/\/index$/, '');
    }

    function isHandledAutotaskPath(path) {
        if (NATIVE_HOME_PATHS.includes(path)) return false;
        return HANDLED_PATHS.includes(path) ||
            HANDLED_PATH_INCLUDES.some(function (fragment) { return path.includes(fragment); }) ||
            path.includes('/contactdetail') ||
            path.includes('/resourcedetail') ||
            path.includes('/persondetail') ||
            path === '/autotask35/grapevine/profile.aspx';
    }

    function normalizeExternalAutotaskUrl(url) {
        try {
            const parsed = new URL(String(url || ''));
            const path = normalizePath(parsed.pathname);
            if (!isRegionalAutotaskHost(parsed.hostname)) return '';
            if (!isHandledAutotaskPath(path)) return '';
            return parsed.href;
        } catch (e) {
            return '';
        }
    }

    function rewriteToTabRegion(url, tabUrl) {
        try {
            const target = new URL(url);
            const tab = new URL(tabUrl || '');
            if (isRegionalAutotaskHost(target.hostname) && isRegionalAutotaskHost(tab.hostname)) {
                target.hostname = tab.hostname;
            }
            return target.href;
        } catch (e) {
            return url;
        }
    }

    function callApi(method, args) {
        try {
            const result = method.apply(null, args || []);
            if (result && typeof result.then === 'function') return result;
            return Promise.resolve(result);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    function sendMessageToTab(tabId, message) {
        if (typeof tabId !== 'number') return Promise.reject(new Error('Missing tab id'));
        return callApi(api.tabs.sendMessage.bind(api.tabs), [tabId, message]);
    }

    function focusTab(tab) {
        if (!tab || typeof tab.id !== 'number') return Promise.resolve();
        const tasks = [callApi(api.tabs.update.bind(api.tabs), [tab.id, { active: true }]).catch(function () {})];
        if (api.windows && typeof tab.windowId === 'number') {
            tasks.push(callApi(api.windows.update.bind(api.windows), [tab.windowId, { focused: true }]).catch(function () {}));
        }
        return Promise.all(tasks).then(function () {});
    }

    function isExternalOpenerUrl(url) {
        try {
            const parsed = new URL(url || '');
            return /^https?:$/i.test(parsed.protocol) && !isRegionalAutotaskHost(parsed.hostname);
        } catch (e) {
            return false;
        }
    }

    function chooseAutotaskTab(tabs, sender, excludedTabId) {
        const candidates = (tabs || []).filter(function (tab) {
            if (typeof excludedTabId === 'number' && tab.id === excludedTabId) return false;
            try { return isRegionalAutotaskHost(new URL(tab.url || '').hostname); }
            catch (e) { return false; }
        });
        const senderWindowId = sender && sender.tab && typeof sender.tab.windowId === 'number'
            ? sender.tab.windowId
            : null;
        return candidates.find(tab => tab.active && tab.windowId === senderWindowId)
            || candidates.find(tab => tab.windowId === senderWindowId)
            || candidates.find(tab => tab.active)
            || candidates[0]
            || null;
    }

    function openExternalAutotaskUrl(message, sender, sendResponse, options) {
        const rawUrl = normalizeExternalAutotaskUrl(message && message.url);
        if (!rawUrl) {
            sendResponse({ ok: false, reason: 'unsupported-url' });
            return;
        }

        callApi(api.tabs.query.bind(api.tabs), [{ url: ['https://*.autotask.net/*'] }])
            .then(function (tabs) {
                const targetTab = chooseAutotaskTab(tabs, sender, options && options.excludeTabId);
                if (!targetTab) {
                    if (options && options.noNativeFallback) {
                        sendResponse({ ok: false, reason: 'no-autotask-tab' });
                        return null;
                    }
                    return callApi(api.tabs.create.bind(api.tabs), [{ url: rawUrl }])
                        .then(function () {
                            sendResponse({ ok: true, mode: 'native-tab' });
                        });
                }

                const targetUrl = rewriteToTabRegion(rawUrl, targetTab.url);
                return focusTab(targetTab)
                    .then(function () {
                        return sendMessageToTab(targetTab.id, {
                            __aesExternalOpen: true,
                            type: 'open-autotask-url',
                            url: targetUrl,
                        });
                    })
                    .then(function () {
                        if (options && typeof options.closeTabId === 'number') {
                            callApi(api.tabs.remove.bind(api.tabs), [options.closeTabId]).catch(function () {});
                        }
                        sendResponse({ ok: true, mode: 'aes-tab', url: targetUrl });
                    })
                    .catch(function () {
                        return callApi(api.tabs.create.bind(api.tabs), [{ url: targetUrl }])
                            .then(function () {
                                sendResponse({ ok: true, mode: 'fallback-native-tab', url: targetUrl });
                            });
                    });
            })
            .catch(function (error) {
                sendResponse({ ok: false, reason: String(error && error.message || error || 'unknown-error') });
            });
    }

    api.action.onClicked.addListener(function (tab) {
        if (!tab || typeof tab.id !== 'number') return;
        try {
            const sending = api.tabs.sendMessage(tab.id, {
                __aesToolbar: true,
                type: 'open-settings'
            });
            if (sending && typeof sending.catch === 'function') {
                sending.catch(function () { /* ignore: not an AES tab */ });
            }
        } catch (e) {
            // ignore — tab not injectable / no listener
        }
    });

    if (api.runtime && api.runtime.onMessage) {
        api.runtime.onMessage.addListener(function (message, sender, sendResponse) {
            if (!message || !message.__aesExternalOpen || message.type !== 'open-autotask-url') return false;
            openExternalAutotaskUrl(message, sender, sendResponse);
            return true;
        });
    }

    if (api.tabs.onCreated) {
        api.tabs.onCreated.addListener(function (tab) {
            const openedUrl = normalizeExternalAutotaskUrl(tab && (tab.pendingUrl || tab.url));
            if (!openedUrl || !tab || typeof tab.id !== 'number' || typeof tab.openerTabId !== 'number') return;

            callApi(api.tabs.get.bind(api.tabs), [tab.openerTabId])
                .then(function (openerTab) {
                    if (!isExternalOpenerUrl(openerTab && openerTab.url)) return;
                    openExternalAutotaskUrl(
                        { url: openedUrl },
                        { tab: openerTab },
                        function () {},
                        { excludeTabId: tab.id, closeTabId: tab.id, noNativeFallback: true }
                    );
                })
                .catch(function () {});
        });
    }

    if (api.tabs.onUpdated) {
        api.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
            const openedUrl = normalizeExternalAutotaskUrl(changeInfo && changeInfo.url);
            if (!openedUrl || !tab || typeof tab.openerTabId !== 'number') return;

            callApi(api.tabs.get.bind(api.tabs), [tab.openerTabId])
                .then(function (openerTab) {
                    if (!isExternalOpenerUrl(openerTab && openerTab.url)) return;
                    openExternalAutotaskUrl(
                        { url: openedUrl },
                        { tab: openerTab },
                        function () {},
                        { excludeTabId: tabId, closeTabId: tabId, noNativeFallback: true }
                    );
                })
                .catch(function () {});
        });
    }
})();
