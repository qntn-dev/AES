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

    function normalizeExternalAutotaskUrl(url) {
        try {
            const parsed = new URL(String(url || ''));
            const path = parsed.pathname.toLowerCase().replace(/\/index$/, '');
            if (!isRegionalAutotaskHost(parsed.hostname)) return '';
            if (path !== '/contracts/views/contractview.asp'
                && path !== '/contracts/views/contractsummary.asp') return '';
            if (!parsed.searchParams.get('contractID') && !parsed.searchParams.get('contractId')) return '';
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

    function chooseAutotaskTab(tabs, sender) {
        const candidates = (tabs || []).filter(function (tab) {
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

    function openExternalAutotaskUrl(message, sender, sendResponse) {
        const rawUrl = normalizeExternalAutotaskUrl(message && message.url);
        if (!rawUrl) {
            sendResponse({ ok: false, reason: 'unsupported-url' });
            return;
        }

        callApi(api.tabs.query.bind(api.tabs), [{ url: ['https://*.autotask.net/*'] }])
            .then(function (tabs) {
                const targetTab = chooseAutotaskTab(tabs, sender);
                if (!targetTab) {
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
})();
