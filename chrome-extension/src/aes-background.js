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
})();
