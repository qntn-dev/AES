// ==UserScript==
// @name         Autotask Enhancement Suite
// @namespace    http://tampermonkey.net/
// @version      2026-04-23
// @description  Enhancements for Autotask, including a multi-tab overlay for tickets, accounts, and contracts
// @author       You
// @match        https://ww19.autotask.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=autotask.net
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const isTop = window.top === window.self;

    const MSG_NS = 'autotask-tabs-v1';
    const HANDLED_PATHS = [
        '/mvc/servicedesk/ticketdetail.mvc',
        '/mvc/crm/accountdetail.mvc',
        '/contracts/views/contractview.asp',
        '/contracts/views/contractsummary.asp',
    ];

    function pathOf(url) {
        try { return new URL(url, location.origin).pathname.toLowerCase(); }
        catch (e) { return ''; }
    }

    function normalizeHandledPath(path) {
        return (path || '').toLowerCase().replace(/\/index$/, '');
    }

    function isHandledUrl(url) {
        return HANDLED_PATHS.includes(normalizeHandledPath(pathOf(url)));
    }

    function toAbsoluteUrl(url) {
        return new URL(url, location.origin).href;
    }

    function extractHandledUrlFromLandingPageUrl(url) {
        try {
            const landingUrl = new URL(url, location.origin);
            if (landingUrl.pathname.toLowerCase() !== '/autotaskonyx/landingpage') return null;

            const rawViewData = landingUrl.searchParams.get('view-data');
            if (!rawViewData) return null;

            // Onyx stores view-data as base64-encoded JSON like:
            // {"url":"https://ww19.autotask.net/Mvc/ServiceDesk/TicketDetail.mvc/..."}
            const json = atob(rawViewData);
            const parsed = JSON.parse(json);
            const innerUrl = parsed && typeof parsed.url === 'string' ? parsed.url : '';
            if (!innerUrl) return null;

            const absoluteInnerUrl = toAbsoluteUrl(innerUrl);
            return isHandledUrl(absoluteInnerUrl) ? absoluteInnerUrl : null;
        } catch (e) {
            return null;
        }
    }

    // ========================================================================
    // IFRAME SIDE: intercept ticket clicks, post to parent; report navigation.
    // ========================================================================
    if (!isTop) {
        function decodeUrl(url) {
            return (url || '').replace(/\\u0026/g, '&').replace(/&amp;/g, '&');
        }

        function extractWindowOpenUrl(onclickText) {
            if (!onclickText) return null;
            const match = onclickText.match(/window\.open\s*\(\s*['"]([^'"]+)['"]/i);
            if (!match) return null;

            const rawUrl = decodeUrl(match[1] || '');
            const absoluteUrl = toAbsoluteUrl(rawUrl);
            return isHandledUrl(absoluteUrl) ? absoluteUrl : null;
        }

        function extractUrlFromOnclick(onclickText) {
            if (!onclickText) return null;
            const m = onclickText.match(
                /NewWindowPage\s*\(\s*'[^']*'\s*,\s*'([^']+)'\s*,\s*(?:true|false)\s*,\s*'([^']+)'\s*,\s*'([^']+)'/
            );
            if (!m) return null;
            const baseUrl = decodeUrl(m[1] || '');
            const path = baseUrl.split('?')[0];
            if (!isHandledUrl(path)) return null;
            const sep = baseUrl.includes('?') ? '&' : '?';
            return baseUrl + sep + encodeURIComponent(m[2]) + '=' + encodeURIComponent(m[3]);
        }

        function postToTop(payload) {
            try { window.top.postMessage({ __ns: MSG_NS, ...payload }, '*'); }
            catch (e) {}
        }

        document.addEventListener('click', function (event) {
            const el = event.target.closest('td[onclick], a[onclick], div[onclick]');
            if (!el) return;
            const onclickText = el.getAttribute('onclick') || '';
            if (!onclickText.includes('NewWindowPage') && !onclickText.includes('window.open')) return;

            const targetUrl =
                extractUrlFromOnclick(onclickText) ||
                extractWindowOpenUrl(onclickText);
            if (!targetUrl) return;

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            postToTop({ type: 'open', url: toAbsoluteUrl(targetUrl) });
        }, true);

        function cleanText(s) {
            return (s || '').replace(/\s+/g, ' ').trim();
        }

        function findFieldValue(labelText) {
            const rows = document.querySelectorAll('.ReadOnlyData');
            const wanted = labelText.toLowerCase();
            for (const row of rows) {
                const primary = row.querySelector('.ReadOnlyLabelContainer .PrimaryText');
                if (!primary) continue;
                if (cleanText(primary.textContent).toLowerCase() !== wanted) continue;
                // Value side: everything after the label container
                const valueEl = row.querySelector(
                    '.ReadOnlyValueContainer, .ValueContainer, .DataContainer, .Value'
                );
                if (valueEl) {
                    const link = valueEl.querySelector('a');
                    return cleanText((link || valueEl).textContent);
                }
                // Fallback: clone, strip label, read text
                const clone = row.cloneNode(true);
                const lbl = clone.querySelector('.ReadOnlyLabelContainer');
                if (lbl) lbl.remove();
                return cleanText(clone.textContent);
            }
            return '';
        }

        function extractTicketInfo() {
            const heading = document.querySelector('.EntityHeadingContainer');
            let number = '';
            let title = '';

            if (heading) {
                const idEl = heading.querySelector('.IdentificationText');
                if (idEl) number = cleanText(idEl.textContent);

                const titleEl = heading.querySelector('.Title > .Text');
                if (titleEl) title = cleanText(titleEl.textContent);
            }

            if (!number) {
                const m = document.title.match(/\bT\d{8}\.\d{3,5}\b/);
                if (m) number = m[0];
            }
            if (!title) {
                title = cleanText(document.title)
                    .replace(/^Ticket\s*[-–]\s*/i, '')
                    .replace(number, '')
                    .replace(/^\s*[-–]\s*/, '');
            }

            const organization = findFieldValue('Organization');

            return {
                title: (title || 'Ticket').slice(0, 120),
                number: number.slice(0, 40),
                contact: organization.slice(0, 80),
            };
        }

        function extractContractInfo() {
            const params = new URLSearchParams(location.search);
            const urlName = (params.get('ContractName') || '').trim();
            const urlId = (params.get('contractID') || '').trim();
            const urlOrg = (params.get('ClientName') || '').trim();

            let name = urlName;
            let id = urlId;
            let org = urlOrg;

            // DOM fallbacks — the SecondaryTitle shows "Name (ID: 12345) (Client)"
            const secondary = document.querySelector('.SecondaryTitle');
            if (secondary) {
                const txt = cleanText(secondary.textContent);
                if (!id) {
                    const m = txt.match(/ID:\s*(\d+)/i);
                    if (m) id = m[1];
                }
                if (!name) {
                    const m = txt.match(/^(.+?)\s*\(ID:/i);
                    if (m) name = m[1].trim();
                }
            }

            if (!org) {
                // Find the "Organization Name" label cell and take the next cell.
                for (const td of document.querySelectorAll('td.FieldLabels')) {
                    const label = cleanText(td.textContent).toLowerCase();
                    if (label === 'organization name') {
                        const valueTd = td.nextElementSibling;
                        if (valueTd) org = cleanText(valueTd.textContent);
                        break;
                    }
                }
            }

            return {
                title: (name || 'Contract').slice(0, 120),
                number: id,
                contact: org.slice(0, 80),
            };
        }

        function extractAccountInfo() {
            const heading = document.querySelector('.EntityHeadingContainer');
            let number = '', title = '';
            if (heading) {
                const idEl = heading.querySelector('.IdentificationText');
                if (idEl) number = cleanText(idEl.textContent).replace(/^ID:\s*/i, '');
                const titleEl = heading.querySelector('.Title > .Text');
                if (titleEl) title = cleanText(titleEl.textContent);
            }
            const classification = findFieldValue('Classification');
            return {
                title: (title || 'Organization').slice(0, 120),
                number: number.slice(0, 40),
                contact: classification.slice(0, 80),
            };
        }

        function extractInfo() {
            const p = pathOf(location.href);
            if (p === '/contracts/views/contractview.asp' ||
                p === '/contracts/views/contractsummary.asp') {
                return extractContractInfo();
            }
            if (p === '/mvc/crm/accountdetail.mvc') {
                return extractAccountInfo();
            }
            return extractTicketInfo();
        }

        let lastSent = '';
        function reportSelf() {
            if (!isHandledUrl(location.href)) return;
            const info = extractInfo();
            const sig = [info.title, info.number, info.contact].join('|');
            if (sig === lastSent) return;
            lastSent = sig;
            postToTop({ type: 'nav', url: location.href, ...info });
        }

        // Watch the heading area for late-render updates.
        function startWatching() {
            if (!isHandledUrl(location.href)) return;
            reportSelf();
            const obs = new MutationObserver(() => reportSelf());
            obs.observe(document.body || document.documentElement, {
                childList: true, subtree: true, characterData: true,
            });
            // Stop watching after 15s once the ticket has settled.
            setTimeout(() => obs.disconnect(), 15000);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startWatching, { once: true });
        } else {
            startWatching();
        }
        window.addEventListener('load', reportSelf);

        return;
    }

    // ========================================================================
    // PARENT SIDE: fixed overlay tab bar + iframe viewport over main content.
    // ========================================================================
    const state = {
        tabs: [],         // { id, url, title, iframeEl, tabEl, loading }
        activeId: null,   // null = overlay hidden (native Autotask visible)
        nextId: 1,
        bar: null,
        viewport: null,
        loader: null,
        homeCover: null,
        settingsButton: null,
        settingsModal: null,
        settingsBackdrop: null,
        homeTabEl: null,
        nativeFrame: null, // the Autotask content iframe we've attached `load` to
        nativeLastUrl: '',
        lastObservedTopHandledUrl: '',
        geometryRaf: 0,
        geometryPollId: 0,
        rootResizeObserver: null,
        geometryBurstUntil: 0,
        geometryBurstTimerId: 0,
        rootMutationObserver: null,
        shellHidden: false,
    };

    function createTabIframe(url) {
        const iframeEl = document.createElement('iframe');
        iframeEl.src = url;
        iframeEl.addEventListener('load', function () {
            const tab = state.tabs.find(t => t.iframeEl === iframeEl);
            if (!tab) return;
            tab.loading = false;
            updateLoaderVisibility();
            requestSyncGeometry();
        });
        return iframeEl;
    }

    function updateLoaderVisibility() {
        if (!state.loader) return;
        const active = state.tabs.find(t => t.id === state.activeId);
        state.loader.classList.toggle('show', !!(active && active.loading));
    }

    function injectStyles() {
        if (document.getElementById('at-tabs-style')) return;
        const style = document.createElement('style');
        style.id = 'at-tabs-style';
        style.textContent = `
            .at-tabs-bar {
                position: fixed;
                top: 56px;
                left: 240px;
                width: 686px;
                height: 65px;
                display: flex;
                align-items: stretch;
                gap: 0;
                padding: 0;
                background: #ffffff;
                border-bottom: 1px solid #e2e8f0;
                overflow-x: auto;
                overflow-y: hidden;
                z-index: 220;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
                box-sizing: border-box;
            }
            .at-tabs-bar-inner {
                min-width: 100%;
                display: flex;
                align-items: stretch;
            }
            .at-tabs-viewport {
                position: fixed;
                top: 93px;
                left: 240px;
                width: 686px;
                bottom: 0;
                background: #fff;
                z-index: 219;
            }
            .at-tabs-home-cover {
                position: fixed;
                top: 56px;
                left: 240px;
                width: 686px;
                height: 65px;
                background: #ffffff;
                border-bottom: 1px solid #e2e8f0;
                z-index: 218;
                pointer-events: none;
            }
            .at-tabs-viewport.empty { display: none; }
            .at-tabs-shell-hidden .at-tabs-bar,
            .at-tabs-shell-hidden .at-tabs-viewport,
            .at-tabs-shell-hidden .at-tabs-home-cover {
                display: none !important;
            }
            .at-tabs-viewport > iframe {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                border: 0;
            }
            .at-tabs-viewport > iframe.hidden {
                visibility: hidden;
                pointer-events: none;
            }
            .at-tabs-loader {
                position: absolute;
                inset: 0;
                z-index: 2;
                display: none;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.85);
                pointer-events: none;
            }
            .at-tabs-loader.show { display: flex; }
            .at-tabs-loader::before {
                content: "";
                width: 36px;
                height: 36px;
                border: 3px solid #cbd5e1;
                border-top-color: #376A94;
                border-radius: 50%;
                animation: at-tabs-spin 0.8s linear infinite;
            }
            @keyframes at-tabs-spin { to { transform: rotate(360deg); } }
            .at-tab {
                display: inline-flex;
                align-items: stretch;
                gap: 8px;
                width: 230px;
                padding: 6px 8px 6px 10px;
                background: transparent;
                border: none;
                border-bottom: 3px solid transparent;
                color: #334155;
                cursor: pointer;
                user-select: none;
                position: relative;
                flex: 0 0 auto;
                box-sizing: border-box;
                font-size: 11px;
                line-height: 1.25;
            }
            .at-tab:hover { background: #f1f5f9; }
            /* Thin separator between two adjacent unselected tabs. */
            .at-tab:not(.active) + .at-tab:not(.active)::before {
                content: "";
                position: absolute;
                left: 0;
                top: 14px;
                bottom: 14px;
                width: 1px;
                background: #e2e8f0;
            }
            .at-tab.active {
                background: #E2E8EE;
                border-bottom-color: #376A94;
                color: #0f172a;
            }
            .at-tab .icon {
                flex: 0 0 auto;
                width: 18px;
                height: 18px;
                align-self: center;
                color: #475569;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }
            .at-tab.active .icon { color: #0f172a; }
            .at-tab .icon svg {
                width: 18px;
                height: 18px;
                display: block;
            }
            .at-tab .meta {
                display: flex;
                flex-direction: column;
                justify-content: center;
                min-width: 0;
                flex: 1 1 auto;
                gap: 1px;
            }
            .at-tab .line {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .at-tab .line.title {
                font-weight: 600;
                font-size: 12px;
                color: inherit;
            }
            .at-tab .line.number {
                color: #64748b;
                font-variant-numeric: tabular-nums;
                font-size: 10.5px;
            }
            .at-tab .line.contact {
                color: #64748b;
                font-size: 10.5px;
            }
            .at-tab.active .line.title { color: #0f172a; }
            .at-tab .close {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 18px;
                height: 18px;
                border-radius: 4px;
                color: #64748b;
                font-size: 14px;
                line-height: 1;
                flex: 0 0 auto;
                align-self: flex-start;
                margin-top: 2px;
            }
            .at-tab .close:hover { background: #e2e8f0; color: #0f172a; }
            .at-tab.home {
                width: auto;
                padding: 0 14px;
                gap: 8px;
                align-items: center;
                font-size: 12px;
                font-weight: 500;
            }
            .at-tab.home .close { display: none; }
            .at-tabs-spacer {
                flex: 1 1 auto;
                min-width: 18px;
            }
            .at-tabs-settings-button {
                display: grid;
                place-items: center;
                width: 52px;
                height: 100%;
                border: none;
                border-left: 1px solid #e2e8f0;
                border-right: 1px solid #e2e8f0;
                background: #ffffff;
                color: #475569;
                cursor: pointer;
                flex: 0 0 auto;
                padding: 0;
                appearance: none;
                -webkit-appearance: none;
            }
            .at-tabs-settings-button:hover {
                background: #f8fafc;
                color: #0f172a;
            }
            .at-tabs-settings-button svg {
                width: 18px;
                height: 18px;
                display: block;
                margin: 0;
            }
            .at-tabs-settings-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, 0.16);
                z-index: 1300;
            }
            .at-tabs-settings-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 560px;
                max-width: calc(100vw - 32px);
                background: #ffffff;
                border: 1px solid #dbe2ea;
                border-radius: 14px;
                box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
                z-index: 1301;
                overflow: hidden;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
            }
            .at-tabs-settings-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 14px 16px;
                border-bottom: 1px solid #e2e8f0;
            }
            .at-tabs-settings-title {
                font-size: 14px;
                font-weight: 600;
                color: #0f172a;
                line-height: 1.3;
            }
            .at-tabs-settings-close {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                border: none;
                border-radius: 8px;
                background: transparent;
                color: #64748b;
                cursor: pointer;
                font-size: 18px;
                line-height: 1;
            }
            .at-tabs-settings-close:hover {
                background: #f1f5f9;
                color: #0f172a;
            }
            .at-tabs-settings-body {
                padding: 14px 16px 18px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .at-tabs-settings-footer {
                padding: 12px 16px 14px;
                border-top: 1px solid #e2e8f0;
                font-size: 11px;
                line-height: 1.4;
                color: #64748b;
                text-align: center;
            }
            .at-tabs-settings-section {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .at-tabs-settings-section-title {
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.04em;
                text-transform: uppercase;
                color: #64748b;
                padding: 2px 2px 0;
            }
            .at-tabs-setting-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 14px 14px;
                border-radius: 12px;
                border: 1px solid #e2e8f0;
                background: #ffffff;
            }
            .at-tabs-setting-row:hover {
                background: #f8fafc;
            }
            .at-tabs-setting-label {
                display: flex;
                flex-direction: column;
                gap: 2px;
                min-width: 0;
            }
            .at-tabs-setting-name {
                font-size: 13px;
                font-weight: 600;
                color: #0f172a;
            }
            .at-tabs-setting-desc {
                font-size: 12px;
                color: #64748b;
            }
            .at-tabs-setting-toggle {
                position: relative;
                display: inline-flex;
                align-items: center;
                width: 46px;
                height: 28px;
                flex: 0 0 auto;
            }
            .at-tabs-setting-toggle input {
                position: absolute;
                inset: 0;
                opacity: 0;
                margin: 0;
                cursor: pointer;
            }
            .at-tabs-setting-toggle-ui {
                position: relative;
                width: 46px;
                height: 28px;
                border-radius: 999px;
                background: #cbd5e1;
                transition: background 0.18s ease;
                box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06);
            }
            .at-tabs-setting-toggle-ui::after {
                content: "";
                position: absolute;
                top: 3px;
                left: 3px;
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background: #ffffff;
                box-shadow: 0 1px 3px rgba(15, 23, 42, 0.18);
                transition: transform 0.18s ease;
            }
            .at-tabs-setting-toggle input:checked + .at-tabs-setting-toggle-ui {
                background: #376A94;
            }
            .at-tabs-setting-toggle input:checked + .at-tabs-setting-toggle-ui::after {
                transform: translateX(18px);
            }
            .at-tabs-setting-toggle input:focus-visible + .at-tabs-setting-toggle-ui {
                outline: 2px solid #93c5fd;
                outline-offset: 2px;
            }
            .at-tabs-settings-note {
                font-size: 12px;
                color: #64748b;
                padding: 2px 2px 0;
            }

            /* Hide only the overlapping collapse arrow, not the restore/open arrow. */
            button.absolute.border-border-primary:has(> span.fa-chevron-left) {
                display: none !important;
            }

            /* Keep native Autotask top navigation dropdowns above the custom tab bar. */
            .o-dropdown-container,
            .o-dropdown-panel,
            .o-popper,
            .o-popover,
            .o-menu,
            .o-menu-panel,
            .ContextOverlayContainer,
            .ContextOverlay,
            .DropDownButtonOverlay2,
            .GridContextMenu,
            .MenuColumnSet1 {
                z-index: 1302 !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    function findContentIframe() {
        let best = null, bestArea = 0;
        for (const f of document.querySelectorAll('iframe')) {
            // Skip iframes we created (our own tab iframes).
            if (state.viewport && state.viewport.contains(f)) continue;
            const src = f.getAttribute('src') || '';
            // Skip the dialog overlay (it covers the whole viewport).
            if (/dialogiframeoverlay/i.test(src)) continue;
            const r = f.getBoundingClientRect();
            if (r.width < 300 || r.height < 300) continue;
            const area = r.width * r.height;
            if (area > bestArea) { bestArea = area; best = f; }
        }
        return best;
    }

    const BAR_H = 65;
    const STORAGE_KEY = 'autotask-tabs-v1';
    const SETTINGS_STORAGE_KEY = 'autotask-tabs-settings-v1';

    state.rememberTabsAfterClose = false;

    function hasChromeStorage() {
        return !!(
            typeof chrome !== 'undefined' &&
            chrome &&
            chrome.storage &&
            chrome.storage.local
        );
    }

    function readSessionTabsPayload() {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function writeSessionTabsPayload(payload) {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch (e) { /* ignore quota / access errors */ }
    }

    function clearSessionTabsPayload() {
        try {
            sessionStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
    }

    function buildTabsPayload() {
        return {
            tabs: state.tabs.map(t => ({
                url: t.url,
                title: t.title,
                number: t.number,
                contact: t.contact,
            })),
            activeIndex: state.activeId === null
                ? null
                : state.tabs.findIndex(t => t.id === state.activeId),
        };
    }

    function getChromeLocal(keys) {
        return new Promise(function (resolve) {
            try {
                chrome.storage.local.get(keys, resolve);
            } catch (e) {
                resolve({});
            }
        });
    }

    function setChromeLocal(values) {
        return new Promise(function (resolve) {
            try {
                chrome.storage.local.set(values, resolve);
            } catch (e) {
                resolve();
            }
        });
    }

    function removeChromeLocal(keys) {
        return new Promise(function (resolve) {
            try {
                chrome.storage.local.remove(keys, resolve);
            } catch (e) {
                resolve();
            }
        });
    }

    async function loadSettings() {
        if (hasChromeStorage()) {
            const stored = await getChromeLocal(SETTINGS_STORAGE_KEY);
            const settings = stored && stored[SETTINGS_STORAGE_KEY];
            state.rememberTabsAfterClose = !!(settings && settings.rememberTabsAfterClose);
            return;
        }

        try {
            const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
            const settings = raw ? JSON.parse(raw) : null;
            state.rememberTabsAfterClose = !!(settings && settings.rememberTabsAfterClose);
        } catch (e) {
            state.rememberTabsAfterClose = false;
        }
    }

    async function saveSettings() {
        const payload = { rememberTabsAfterClose: !!state.rememberTabsAfterClose };
        if (hasChromeStorage()) {
            await setChromeLocal({ [SETTINGS_STORAGE_KEY]: payload });
            return;
        }

        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
        } catch (e) {}
    }

    async function readTabsPayload() {
        if (state.rememberTabsAfterClose && hasChromeStorage()) {
            const stored = await getChromeLocal(STORAGE_KEY);
            return stored ? stored[STORAGE_KEY] || null : null;
        }
        return readSessionTabsPayload();
    }

    async function writeTabsPayload(payload) {
        if (state.rememberTabsAfterClose && hasChromeStorage()) {
            await setChromeLocal({ [STORAGE_KEY]: payload });
            clearSessionTabsPayload();
            return;
        }

        writeSessionTabsPayload(payload);
        if (hasChromeStorage()) {
            await removeChromeLocal(STORAGE_KEY);
        }
    }

    async function clearPersistedTabs() {
        clearSessionTabsPayload();
        if (hasChromeStorage()) {
            await removeChromeLocal(STORAGE_KEY);
        }
    }

    async function syncTabsPersistenceMode() {
        const payload = buildTabsPayload();
        if (!payload.tabs.length) {
            await clearPersistedTabs();
            return;
        }
        await writeTabsPayload(payload);
    }

    function handleNativeFrameLoad(event) {
        const frame = event.currentTarget;
        let url = '';
        try { url = frame.contentWindow.location.href; }
        catch (e) { url = frame.getAttribute('src') || ''; }
        if (!url || url === 'about:blank') return;

        // When Home is active, some Autotask flows (like Work List opens) navigate
        // the native content iframe directly instead of firing an onclick we can
        // intercept inside the child frame. Promote those handled pages into a tab.
        if (state.activeId === null && isHandledUrl(url)) {
            if (url !== state.nativeLastUrl) {
                openTab(url);
            }
            state.nativeLastUrl = url;
            return;
        }

        if (state.activeId === null) {
            state.nativeLastUrl = url;
            return;
        }

        const active = state.tabs.find(t => t.id === state.activeId);
        if (active && url !== active.url) activateHome();
        state.nativeLastUrl = url;
    }

    function trackNativeFrame(frame) {
        if (state.nativeFrame === frame) return;
        if (state.nativeFrame) {
            state.nativeFrame.removeEventListener('load', handleNativeFrameLoad);
        }
        state.nativeFrame = frame;
        if (frame) frame.addEventListener('load', handleNativeFrameLoad);
    }

    function saveTabs() {
        const payload = buildTabsPayload();
        void writeTabsPayload(payload);
    }

    async function restoreTabs() {
        let payload;
        try {
            payload = await readTabsPayload();
        } catch (e) { return; }
        if (!payload || !Array.isArray(payload.tabs) || payload.tabs.length === 0) return;

        for (const saved of payload.tabs) {
            if (!saved.url) continue;
            const iframeEl = createTabIframe(saved.url);
            state.viewport.appendChild(iframeEl);
            state.tabs.push({
                id: state.nextId++,
                url: saved.url,
                title: saved.title || 'Loading…',
                number: saved.number || '',
                contact: saved.contact || '',
                iframeEl,
                tabEl: null,
                loading: true,
            });
        }
        renderTabs();
        const idx = payload.activeIndex;
        if (typeof idx === 'number' && idx >= 0 && state.tabs[idx]) {
            activateTab(state.tabs[idx].id);
        } else {
            activateHome();
        }
    }

    function ensureNativeFrameSpacer(frame, enabled) {
        if (!frame) return;

        let doc;
        try {
            doc = frame.contentDocument;
        } catch (e) {
            return;
        }
        if (!doc || !doc.body) return;

        let style = doc.getElementById('at-native-frame-shell-style');
        const root = doc.documentElement;
        const body = doc.body;

        if (!enabled) {
            if (style) style.remove();
            if (root) root.classList.remove('at-native-frame-shell-offset');
            if (body) body.classList.remove('at-native-frame-shell-offset');
            return;
        }

        if (!style) {
            style = doc.createElement('style');
            style.id = 'at-native-frame-shell-style';
            style.textContent = `
                html.at-native-frame-shell-offset,
                body.at-native-frame-shell-offset {
                    box-sizing: border-box !important;
                }

                body.at-native-frame-shell-offset > :first-child,
                body.at-native-frame-shell-offset > .PageHeadingContainer:first-child,
                body.at-native-frame-shell-offset > .TabContainer:first-child,
                body.at-native-frame-shell-offset > .ActivityTabShell:first-child,
                body.at-native-frame-shell-offset > .Content:first-child {
                    margin-top: ${BAR_H}px !important;
                }
            `;
            (doc.head || doc.documentElement).appendChild(style);
        }

        if (root) root.classList.add('at-native-frame-shell-offset');
        if (body) body.classList.add('at-native-frame-shell-offset');
    }

    function syncGeometry() {
        state.geometryRaf = 0;
        if (!state.bar) return;
        const frame = findContentIframe();
        if (!frame) {
            state.bar.style.display = 'none';
            state.viewport.style.display = 'none';
            if (state.homeCover) state.homeCover.style.display = 'none';
            trackNativeFrame(null);
            return;
        }
        trackNativeFrame(frame);
        frame.style.removeProperty('margin-top');
        frame.style.removeProperty('height');
        const rect = frame.getBoundingClientRect();
        const base = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };

        if (state.shellHidden) {
            ensureNativeFrameSpacer(frame, false);
            state.bar.style.display = 'none';
            state.viewport.style.display = 'none';
            if (state.homeCover) state.homeCover.style.display = 'none';
            return;
        }

        ensureNativeFrameSpacer(frame, state.activeId === null);

        state.bar.style.display = '';
        state.viewport.style.display = '';
        if (state.homeCover) {
            state.homeCover.style.display = state.activeId === null ? '' : 'none';
            state.homeCover.style.left = base.left + 'px';
            state.homeCover.style.top = base.top + 'px';
            state.homeCover.style.width = base.width + 'px';
            state.homeCover.style.height = BAR_H + 'px';
        }
        state.bar.style.left = base.left + 'px';
        state.bar.style.top = base.top + 'px';
        state.bar.style.width = base.width + 'px';
        state.viewport.style.left = base.left + 'px';
        state.viewport.style.top = (base.top + BAR_H) + 'px';
        state.viewport.style.width = base.width + 'px';
        state.viewport.style.height = Math.max(0, base.height - BAR_H) + 'px';
        state.viewport.style.bottom = 'auto';
    }

    function requestSyncGeometry() {
        if (state.geometryRaf) return;
        state.geometryRaf = window.requestAnimationFrame(syncGeometry);
    }

    function startGeometryBurst(durationMs) {
        const until = Date.now() + durationMs;
        if (until > state.geometryBurstUntil) {
            state.geometryBurstUntil = until;
        }
        if (state.geometryBurstTimerId) return;

        state.geometryBurstTimerId = window.setInterval(function () {
            requestSyncGeometry();
            if (Date.now() >= state.geometryBurstUntil) {
                window.clearInterval(state.geometryBurstTimerId);
                state.geometryBurstTimerId = 0;
                state.geometryBurstUntil = 0;
            }
        }, 16);
    }

    function installGeometrySync() {
        window.addEventListener('resize', requestSyncGeometry, { passive: true });
        window.addEventListener('resize', function () { startGeometryBurst(220); }, { passive: true });
        window.addEventListener('transitionrun', function () { startGeometryBurst(450); }, true);
        window.addEventListener('transitionstart', function () { startGeometryBurst(450); }, true);
        window.addEventListener('transitionend', requestSyncGeometry, true);

        if ('ResizeObserver' in window && !state.rootResizeObserver) {
            state.rootResizeObserver = new ResizeObserver(requestSyncGeometry);
            state.rootResizeObserver.observe(document.documentElement);
            if (document.body) state.rootResizeObserver.observe(document.body);
        }

        if (!state.rootMutationObserver) {
            state.rootMutationObserver = new MutationObserver(function (mutations) {
                for (const mutation of mutations) {
                    if (mutation.type === 'attributes') {
                        startGeometryBurst(300);
                        return;
                    }
                }
            });
            state.rootMutationObserver.observe(document.body || document.documentElement, {
                attributes: true,
                subtree: true,
                attributeFilter: ['class', 'style'],
            });
        }

        // Slow fallback for Autotask layout shifts that happen without resize events.
        if (!state.geometryPollId) {
            state.geometryPollId = window.setInterval(requestSyncGeometry, 1500);
        }
    }

    function updateShellVisibility() {
        document.documentElement.classList.toggle('at-tabs-shell-hidden', state.shellHidden);
        requestSyncGeometry();
    }

    function toggleShellVisibility() {
        state.shellHidden = !state.shellHidden;
        updateShellVisibility();
    }

    async function mount() {
        if (state.bar) return;
        injectStyles();

        const bar = document.createElement('div');
        bar.className = 'at-tabs-bar';

        const viewport = document.createElement('div');
        viewport.className = 'at-tabs-viewport empty';

        const homeCover = document.createElement('div');
        homeCover.className = 'at-tabs-home-cover';

        const loader = document.createElement('div');
        loader.className = 'at-tabs-loader';
        viewport.appendChild(loader);

        const settingsButton = document.createElement('button');
        settingsButton.type = 'button';
        settingsButton.className = 'at-tabs-settings-button';
        settingsButton.title = 'Settings';
        settingsButton.innerHTML = ICONS.settings;
        settingsButton.addEventListener('click', function (event) {
            event.stopPropagation();
            toggleSettingsModal();
        });

        document.body.appendChild(homeCover);
        document.body.appendChild(viewport);
        document.body.appendChild(bar);

        state.bar = bar;
        state.viewport = viewport;
        state.homeCover = homeCover;
        state.loader = loader;
        state.settingsButton = settingsButton;

        renderHomeTab();
        renderTabs();
        await loadSettings();
        await restoreTabs();
        if (!state.tabs.length) {
            activateHome();
        }
        updateShellVisibility();
        syncGeometry();
        installGeometrySync();
    }

    const ICONS = {
        home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5L12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>',
        ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z"/><path d="M13 6v12" stroke-dasharray="2 2"/></svg>',
        contract: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/></svg>',
        account: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="1"/><path d="M9 6h1M14 6h1M9 10h1M14 10h1M9 14h1M14 14h1"/><path d="M10 22v-4h4v4"/></svg>',
        settings: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M13.5 2L13.9961 1.93798C13.9649 1.68777 13.7522 1.5 13.5 1.5V2ZM10.5 2V1.5C10.2478 1.5 10.0351 1.68777 10.0039 1.93798L10.5 2ZM13.7747 4.19754L13.2786 4.25955C13.3047 4.46849 13.4589 4.63867 13.6642 4.68519L13.7747 4.19754ZM16.2617 5.22838L15.995 5.6513C16.1731 5.76362 16.4024 5.75233 16.5687 5.62306L16.2617 5.22838ZM18.0104 3.86826L18.364 3.51471C18.1857 3.3364 17.9025 3.31877 17.7034 3.47359L18.0104 3.86826ZM20.1317 5.98958L20.5264 6.29655C20.6812 6.09751 20.6636 5.81434 20.4853 5.63603L20.1317 5.98958ZM18.7716 7.73831L18.3769 7.43134C18.2477 7.59754 18.2364 7.82693 18.3487 8.00503L18.7716 7.73831ZM19.8025 10.2253L19.3148 10.3358C19.3613 10.5411 19.5315 10.6953 19.7404 10.7214L19.8025 10.2253ZM22 10.5H22.5C22.5 10.2478 22.3122 10.0351 22.062 10.0039L22 10.5ZM22 13.5L22.062 13.9961C22.3122 13.9649 22.5 13.7522 22.5 13.5H22ZM19.8025 13.7747L19.7404 13.2786C19.5315 13.3047 19.3613 13.4589 19.3148 13.6642L19.8025 13.7747ZM18.7716 16.2617L18.3487 15.995C18.2364 16.1731 18.2477 16.4025 18.3769 16.5687L18.7716 16.2617ZM20.1317 18.0104L20.4853 18.364C20.6636 18.1857 20.6812 17.9025 20.5264 17.7034L20.1317 18.0104ZM18.0104 20.1317L17.7034 20.5264C17.9025 20.6812 18.1857 20.6636 18.364 20.4853L18.0104 20.1317ZM16.2617 18.7716L16.5687 18.3769C16.4024 18.2477 16.1731 18.2364 15.995 18.3487L16.2617 18.7716ZM13.7747 19.8025L13.6642 19.3148C13.4589 19.3613 13.3047 19.5315 13.2786 19.7404L13.7747 19.8025ZM13.5 22V22.5C13.7522 22.5 13.9649 22.3122 13.9961 22.062L13.5 22ZM10.5 22L10.0039 22.062C10.0351 22.3122 10.2478 22.5 10.5 22.5V22ZM10.2253 19.8025L10.7214 19.7404C10.6953 19.5315 10.5411 19.3613 10.3358 19.3148L10.2253 19.8025ZM7.73832 18.7716L8.00504 18.3487C7.82694 18.2364 7.59756 18.2477 7.43135 18.3769L7.73832 18.7716ZM5.98959 20.1317L5.63604 20.4853C5.81435 20.6636 6.09752 20.6812 6.29656 20.5264L5.98959 20.1317ZM3.86827 18.0104L3.4736 17.7034C3.31878 17.9025 3.33641 18.1857 3.51472 18.364L3.86827 18.0104ZM5.22839 16.2617L5.62307 16.5687C5.75234 16.4025 5.76363 16.1731 5.65131 15.995L5.22839 16.2617ZM4.19754 13.7747L4.68519 13.6642C4.63867 13.4589 4.46849 13.3047 4.25955 13.2786L4.19754 13.7747ZM2 13.5H1.5C1.5 13.7522 1.68777 13.9649 1.93798 13.9961L2 13.5ZM2 10.5L1.93798 10.0039C1.68777 10.0351 1.5 10.2478 1.5 10.5H2ZM4.19754 10.2253L4.25955 10.7214C4.46849 10.6953 4.63867 10.5411 4.68519 10.3358L4.19754 10.2253ZM5.22839 7.73831L5.65131 8.00503C5.76363 7.82693 5.75234 7.59755 5.62307 7.43134L5.22839 7.73831ZM3.86827 5.98959L3.51472 5.63603C3.33641 5.81434 3.31878 6.09751 3.47359 6.29656L3.86827 5.98959ZM5.98959 3.86827L6.29656 3.47359C6.09752 3.31878 5.81434 3.33641 5.63604 3.51471L5.98959 3.86827ZM7.73832 5.22839L7.43135 5.62306C7.59755 5.75233 7.82694 5.76363 8.00504 5.6513L7.73832 5.22839ZM10.2253 4.19754L10.3358 4.68519C10.5411 4.63867 10.6953 4.46849 10.7214 4.25955L10.2253 4.19754ZM13.5 1.5H10.5V2.5H13.5V1.5ZM14.2708 4.13552L13.9961 1.93798L13.0039 2.06202L13.2786 4.25955L14.2708 4.13552ZM16.5284 4.80547C15.7279 4.30059 14.8369 3.92545 13.8851 3.70989L13.6642 4.68519C14.503 4.87517 15.2886 5.20583 15.995 5.6513L16.5284 4.80547ZM16.5687 5.62306L18.3174 4.26294L17.7034 3.47359L15.9547 4.83371L16.5687 5.62306ZM17.6569 4.22182L19.7782 6.34314L20.4853 5.63603L18.364 3.51471L17.6569 4.22182ZM19.7371 5.68261L18.3769 7.43134L19.1663 8.04528L20.5264 6.29655L19.7371 5.68261ZM20.2901 10.1149C20.0746 9.16313 19.6994 8.27213 19.1945 7.47158L18.3487 8.00503C18.7942 8.71138 19.1248 9.49695 19.3148 10.3358L20.2901 10.1149ZM22.062 10.0039L19.8645 9.72917L19.7404 10.7214L21.938 10.9961L22.062 10.0039ZM22.5 13.5V10.5H21.5V13.5H22.5ZM19.8645 14.2708L22.062 13.9961L21.938 13.0039L19.7404 13.2786L19.8645 14.2708ZM19.1945 16.5284C19.6994 15.7279 20.0746 14.8369 20.2901 13.8851L19.3148 13.6642C19.1248 14.503 18.7942 15.2886 18.3487 15.995L19.1945 16.5284ZM20.5264 17.7034L19.1663 15.9547L18.3769 16.5687L19.7371 18.3174L20.5264 17.7034ZM18.364 20.4853L20.4853 18.364L19.7782 17.6569L17.6569 19.7782L18.364 20.4853ZM15.9547 19.1663L17.7034 20.5264L18.3174 19.7371L16.5687 18.3769L15.9547 19.1663ZM13.8851 20.2901C14.8369 20.0746 15.7279 19.6994 16.5284 19.1945L15.995 18.3487C15.2886 18.7942 14.503 19.1248 13.6642 19.3148L13.8851 20.2901ZM13.9961 22.062L14.2708 19.8645L13.2786 19.7404L13.0039 21.938L13.9961 22.062ZM10.5 22.5H13.5V21.5H10.5V22.5ZM9.72917 19.8645L10.0039 22.062L10.9961 21.938L10.7214 19.7404L9.72917 19.8645ZM7.4716 19.1945C8.27214 19.6994 9.16314 20.0746 10.1149 20.2901L10.3358 19.3148C9.49696 19.1248 8.71139 18.7942 8.00504 18.3487L7.4716 19.1945ZM6.29656 20.5264L8.04529 19.1663L7.43135 18.3769L5.68262 19.7371L6.29656 20.5264ZM3.51472 18.364L5.63604 20.4853L6.34315 19.7782L4.22183 17.6569L3.51472 18.364ZM4.83372 15.9547L3.4736 17.7034L4.26295 18.3174L5.62307 16.5687L4.83372 15.9547ZM3.70989 13.8851C3.92545 14.8369 4.30059 15.7279 4.80547 16.5284L5.65131 15.995C5.20584 15.2886 4.87517 14.503 4.68519 13.6642L3.70989 13.8851ZM1.93798 13.9961L4.13552 14.2708L4.25955 13.2786L2.06202 13.0039L1.93798 13.9961ZM1.5 10.5V13.5H2.5V10.5H1.5ZM4.13552 9.72917L1.93798 10.0039L2.06202 10.9961L4.25955 10.7214L4.13552 9.72917ZM4.80547 7.47159C4.30059 8.27213 3.92545 9.16313 3.70989 10.1149L4.68519 10.3358C4.87517 9.49696 5.20583 8.71138 5.65131 8.00503L4.80547 7.47159ZM3.47359 6.29656L4.83371 8.04528L5.62307 7.43134L4.26295 5.68262L3.47359 6.29656ZM5.63604 3.51471L3.51472 5.63603L4.22182 6.34314L6.34314 4.22182L5.63604 3.51471ZM8.04529 4.83371L6.29656 3.47359L5.68262 4.26294L7.43135 5.62306L8.04529 4.83371ZM10.1149 3.70989C9.16313 3.92545 8.27214 4.30059 7.4716 4.80547L8.00504 5.6513C8.71139 5.20583 9.49696 4.87517 10.3358 4.68519L10.1149 3.70989Z" fill="currentColor"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-linejoin="round"/></svg>',
    };

    function tabTypeForUrl(url) {
        const p = pathOf(url);
        if (p === '/mvc/servicedesk/ticketdetail.mvc') return 'ticket';
        if (p === '/mvc/crm/accountdetail.mvc') return 'account';
        if (p.startsWith('/contracts/views/contract')) return 'contract';
        return 'ticket';
    }

    function renderHomeTab() {
        const el = document.createElement('div');
        el.className = 'at-tab home active';
        el.title = 'Autotask home';

        const icon = document.createElement('span');
        icon.className = 'icon';
        icon.innerHTML = ICONS.home;

        const label = document.createElement('span');
        label.textContent = 'Home';

        el.appendChild(icon);
        el.appendChild(label);
        el.addEventListener('click', activateHome);
        state.homeTabEl = el;
    }

    function buildTabEl(tab) {
        const el = document.createElement('div');
        el.className = 'at-tab' + (tab.id === state.activeId ? ' active' : '');
        el.title = tab.url;

        const icon = document.createElement('span');
        icon.className = 'icon';
        icon.innerHTML = ICONS[tabTypeForUrl(tab.url)] || ICONS.ticket;
        el.appendChild(icon);

        const meta = document.createElement('div');
        meta.className = 'meta';

        const title = document.createElement('div');
        title.className = 'line title';
        title.textContent = tab.title || 'Loading…';

        const number = document.createElement('div');
        number.className = 'line number';
        number.textContent = tab.number || '';

        const contact = document.createElement('div');
        contact.className = 'line contact';
        contact.textContent = tab.contact || '';

        meta.appendChild(title);
        meta.appendChild(number);
        meta.appendChild(contact);

        const close = document.createElement('span');
        close.className = 'close';
        close.textContent = '×';
        close.title = 'Close tab';
        close.addEventListener('click', function (ev) {
            ev.stopPropagation();
            closeTab(tab.id);
        });

        el.appendChild(meta);
        el.appendChild(close);
        el.addEventListener('click', function () { activateTab(tab.id); });
        el.addEventListener('auxclick', function (ev) {
            if (ev.button === 1) { ev.preventDefault(); closeTab(tab.id); }
        });

        return el;
    }

    function renderTabs() {
        state.bar.innerHTML = '';
        const inner = document.createElement('div');
        inner.className = 'at-tabs-bar-inner';
        inner.appendChild(state.homeTabEl);
        for (const tab of state.tabs) {
            tab.tabEl = buildTabEl(tab);
            inner.appendChild(tab.tabEl);
        }
        const spacer = document.createElement('div');
        spacer.className = 'at-tabs-spacer';
        inner.appendChild(spacer);
        inner.appendChild(state.settingsButton);
        state.bar.appendChild(inner);
        updateHomeTabActive();
    }

    function closeSettingsModal() {
        if (state.settingsModal) {
            state.settingsModal.remove();
            state.settingsModal = null;
        }
        if (state.settingsBackdrop) {
            state.settingsBackdrop.remove();
            state.settingsBackdrop = null;
        }
    }

    function openSettingsModal() {
        if (state.settingsModal) return;

        const backdrop = document.createElement('div');
        backdrop.className = 'at-tabs-settings-backdrop';
        backdrop.addEventListener('click', closeSettingsModal);

        const modal = document.createElement('div');
        modal.className = 'at-tabs-settings-modal';

        const header = document.createElement('div');
        header.className = 'at-tabs-settings-header';

        const title = document.createElement('div');
        title.className = 'at-tabs-settings-title';
        title.textContent = 'Autotask Enhancement Suite - Settings';

        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'at-tabs-settings-close';
        close.textContent = '×';
        close.title = 'Close settings';
        close.addEventListener('click', closeSettingsModal);

        header.appendChild(title);
        header.appendChild(close);

        const body = document.createElement('div');
        body.className = 'at-tabs-settings-body';

        const section = document.createElement('div');
        section.className = 'at-tabs-settings-section';

        const sectionTitle = document.createElement('div');
        sectionTitle.className = 'at-tabs-settings-section-title';
        sectionTitle.textContent = 'Tabbar settings';

        const row = document.createElement('label');
        row.className = 'at-tabs-setting-row';

        const label = document.createElement('span');
        label.className = 'at-tabs-setting-label';

        const name = document.createElement('span');
        name.className = 'at-tabs-setting-name';
        name.textContent = 'Hide tab bar';

        label.appendChild(name);

        const toggle = document.createElement('span');
        toggle.className = 'at-tabs-setting-toggle';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = state.shellHidden;
        input.addEventListener('change', function () {
            state.shellHidden = input.checked;
            updateShellVisibility();
        });

        const toggleUi = document.createElement('span');
        toggleUi.className = 'at-tabs-setting-toggle-ui';

        toggle.appendChild(input);
        toggle.appendChild(toggleUi);

        row.appendChild(label);
        row.appendChild(toggle);

        const persistRow = document.createElement('label');
        persistRow.className = 'at-tabs-setting-row';

        const persistLabel = document.createElement('span');
        persistLabel.className = 'at-tabs-setting-label';

        const persistName = document.createElement('span');
        persistName.className = 'at-tabs-setting-name';
        persistName.textContent = 'Remember tabs after closing browser';

        persistLabel.appendChild(persistName);

        const persistToggle = document.createElement('span');
        persistToggle.className = 'at-tabs-setting-toggle';

        const persistInput = document.createElement('input');
        persistInput.type = 'checkbox';
        persistInput.checked = state.rememberTabsAfterClose;
        persistInput.addEventListener('change', function () {
            state.rememberTabsAfterClose = persistInput.checked;
            void saveSettings().then(syncTabsPersistenceMode);
        });

        const persistToggleUi = document.createElement('span');
        persistToggleUi.className = 'at-tabs-setting-toggle-ui';

        persistToggle.appendChild(persistInput);
        persistToggle.appendChild(persistToggleUi);

        persistRow.appendChild(persistLabel);
        persistRow.appendChild(persistToggle);

        const note = document.createElement('div');
        note.className = 'at-tabs-settings-note';
        note.textContent = 'More settings can be added here over time.';

        section.appendChild(sectionTitle);
        section.appendChild(row);
        section.appendChild(persistRow);
        section.appendChild(note);
        body.appendChild(section);

        const footer = document.createElement('div');
        footer.className = 'at-tabs-settings-footer';
        footer.textContent = 'Developed by QNTN.dev with help of Generative AI';

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);

        document.body.appendChild(backdrop);
        document.body.appendChild(modal);

        state.settingsBackdrop = backdrop;
        state.settingsModal = modal;
    }

    function toggleSettingsModal() {
        if (state.settingsModal) closeSettingsModal();
        else openSettingsModal();
    }

    function updateTabEl(tab) {
        if (!tab.tabEl) return;
        const t = tab.tabEl.querySelector('.line.title');
        const n = tab.tabEl.querySelector('.line.number');
        const c = tab.tabEl.querySelector('.line.contact');
        if (t) t.textContent = tab.title || 'Loading…';
        if (n) n.textContent = tab.number || '';
        if (c) c.textContent = tab.contact || '';
        tab.tabEl.title = tab.url;
    }

    function updateHomeTabActive() {
        if (!state.homeTabEl) return;
        state.homeTabEl.classList.toggle('active', state.activeId === null);
    }

    function activateHome() {
        state.activeId = null;
        for (const tab of state.tabs) {
            if (tab.tabEl) tab.tabEl.classList.remove('active');
            tab.iframeEl.classList.add('hidden');
        }
        state.viewport.classList.add('empty');
        updateHomeTabActive();
        saveTabs();
    }

    function activateTab(id) {
        state.activeId = id;
        for (const tab of state.tabs) {
            const isActive = tab.id === id;
            if (tab.tabEl) tab.tabEl.classList.toggle('active', isActive);
            tab.iframeEl.classList.toggle('hidden', !isActive);
        }
        state.viewport.classList.remove('empty');
        state.viewport.style.display = '';
        updateHomeTabActive();
        updateLoaderVisibility();
        requestSyncGeometry();
        saveTabs();
    }

    function closeTab(id) {
        const idx = state.tabs.findIndex(t => t.id === id);
        if (idx === -1) return;
        const [removed] = state.tabs.splice(idx, 1);
        try { removed.iframeEl.remove(); } catch (e) {}
        if (state.activeId === id) {
            const next = state.tabs[Math.min(idx, state.tabs.length - 1)];
            if (next) activateTab(next.id);
            else activateHome();
        }
        renderTabs();
        saveTabs();
    }

    function findTabFromWindow(win) {
        for (const tab of state.tabs) {
            let w = win;
            try {
                while (w) {
                    if (w === tab.iframeEl.contentWindow) return tab;
                    if (w.parent === w) break;
                    w = w.parent;
                }
            } catch (e) { /* cross-origin, skip */ }
        }
        return null;
    }

    function openTab(url) {
        const existing = state.tabs.find(t => t.url === url);
        if (existing) { activateTab(existing.id); return; }

        const iframeEl = createTabIframe(url);
        state.viewport.appendChild(iframeEl);

        const tab = {
            id: state.nextId++,
            url,
            title: 'Loading…',
            number: '',
            contact: '',
            iframeEl,
            tabEl: null,
            loading: true,
        };
        state.tabs.push(tab);
        renderTabs();
        activateTab(tab.id);
        requestSyncGeometry();
        saveTabs();
    }

    function installTopLevelNavigationInterception() {
        if (window.__atTabsNavInterceptInstalled) return;
        window.__atTabsNavInterceptInstalled = true;

        const originalPushState = history.pushState.bind(history);
        const originalReplaceState = history.replaceState.bind(history);

        function intercept(originalFn, stateArg, unusedTitle, urlArg) {
            const handledUrl = urlArg ? extractHandledUrlFromLandingPageUrl(urlArg) : null;
            if (handledUrl) {
                mount();
                openTab(handledUrl);
                return;
            }
            return originalFn(stateArg, unusedTitle, urlArg);
        }

        history.pushState = function (stateArg, unusedTitle, urlArg) {
            return intercept(originalPushState, stateArg, unusedTitle, urlArg);
        };

        history.replaceState = function (stateArg, unusedTitle, urlArg) {
            return intercept(originalReplaceState, stateArg, unusedTitle, urlArg);
        };
    }

    function maybePromoteTopLevelLandingRoute() {
        const handledUrl = extractHandledUrlFromLandingPageUrl(location.href);
        if (!handledUrl) {
            state.lastObservedTopHandledUrl = '';
            return;
        }

        if (handledUrl === state.lastObservedTopHandledUrl) return;
        state.lastObservedTopHandledUrl = handledUrl;

        if (state.activeId === null) {
            mount();
            openTab(handledUrl);
        }
    }

    function handleMessage(event) {
        const data = event.data;
        if (!data || data.__ns !== MSG_NS) return;

        if (data.type === 'open' && data.url) {
            mount();
            openTab(data.url);
            return;
        }

        if (data.type === 'nav') {
            const tab = findTabFromWindow(event.source);
            if (!tab) return;
            if (data.url) tab.url = data.url;
            if (data.title) tab.title = data.title;
            if (data.number !== undefined) tab.number = data.number;
            if (data.contact !== undefined) tab.contact = data.contact;
            updateTabEl(tab);
            saveTabs();
        }
    }

    window.addEventListener('message', handleMessage);
    installTopLevelNavigationInterception();

    // Mount proactively so the bar is ready when the first tab opens.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount, { once: true });
    } else {
        mount();
    }

    window.addEventListener('popstate', maybePromoteTopLevelLandingRoute);
    window.addEventListener('hashchange', maybePromoteTopLevelLandingRoute);
    setInterval(maybePromoteTopLevelLandingRoute, 250);
    maybePromoteTopLevelLandingRoute();
})();
