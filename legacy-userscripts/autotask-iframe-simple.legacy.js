// ==UserScript==
// @name         Autotask Enhancement Suite
// @namespace    http://tampermonkey.net/
// @version      2026-04-23
// @description  Autotask Enhancement Suite: lightweight iframe navigation and quick controls
// @author       You
// @match        https://ww19.autotask.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=autotask.net
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const isInIframe = window.top !== window.self;
    const currentPath = (window.location.pathname || '').toLowerCase();
    const isContractDetailPage = currentPath === '/contracts/views/contractview.asp';
    const isSystemOverlayFrame = currentPath === '/mvc/framework/navigation.mvc/dialogiframeoverlay';
    let isWidgetFrame = false;
    try {
        // Normal case: only direct child iframe.
        // Contract detail is sometimes rendered in an extra nested iframe by Autotask,
        // so allow the widget there as well.
        isWidgetFrame =
            isInIframe &&
            !isSystemOverlayFrame &&
            (window.parent === window.top || isContractDetailPage);
    } catch (error) {
        isWidgetFrame = false;
    }
    const HISTORY_KEY = 'autotaskIframeNavHistory.v1';
    const PENDING_NAV_KEY = 'autotaskIframeNavPending.v1';

    const HANDLED_PATHS = new Set([
        '/Mvc/ServiceDesk/TicketDetail.mvc',
        '/Mvc/CRM/AccountDetail.mvc',
        '/contracts/views/contractView.asp',
    ]);

    function readHistoryState() {
        try {
            const raw = sessionStorage.getItem(HISTORY_KEY);
            const parsed = raw ? JSON.parse(raw) : null;
            if (!parsed || !Array.isArray(parsed.stack)) {
                return { stack: [], index: -1 };
            }
            const index = Number.isInteger(parsed.index) ? parsed.index : parsed.stack.length - 1;
            return { stack: parsed.stack, index: Math.max(-1, Math.min(index, parsed.stack.length - 1)) };
        } catch (error) {
            return { stack: [], index: -1 };
        }
    }

    function writeHistoryState(state) {
        try {
            sessionStorage.setItem(HISTORY_KEY, JSON.stringify(state));
        } catch (error) {
            // ignore storage edge cases
        }
    }

    function setPendingNavigation(url) {
        try {
            sessionStorage.setItem(PENDING_NAV_KEY, url);
        } catch (error) {
            // ignore storage edge cases
        }
    }

    function takePendingNavigation() {
        try {
            const value = sessionStorage.getItem(PENDING_NAV_KEY);
            sessionStorage.removeItem(PENDING_NAV_KEY);
            return value;
        } catch (error) {
            return null;
        }
    }

    function recordCurrentUrlInHistory() {
        const current = window.location.href;
        const pending = takePendingNavigation();

        // If this page load did not come from our own nav controls/interception,
        // start a fresh history baseline so "Back" is correctly disabled.
        if (!pending || pending !== current) {
            const reset = { stack: [current], index: 0 };
            writeHistoryState(reset);
            return reset;
        }

        const state = readHistoryState();
        const currentAtIndex = state.stack[state.index];
        if (currentAtIndex === current) return state;

        const existingIndex = state.stack.lastIndexOf(current);
        if (existingIndex !== -1) {
            state.index = existingIndex;
            writeHistoryState(state);
            return state;
        }

        if (state.index < state.stack.length - 1) {
            state.stack = state.stack.slice(0, state.index + 1);
        }
        state.stack.push(current);
        state.index = state.stack.length - 1;
        writeHistoryState(state);
        return state;
    }

    function navigateWithHistory(url) {
        const finalUrl = toAbsoluteUrl(url);
        const state = recordCurrentUrlInHistory();
        const currentAtIndex = state.stack[state.index];

        if (finalUrl !== currentAtIndex) {
            if (state.index < state.stack.length - 1) {
                state.stack = state.stack.slice(0, state.index + 1);
            }
            state.stack.push(finalUrl);
            state.index = state.stack.length - 1;
            writeHistoryState(state);
        }

        setPendingNavigation(finalUrl);
        console.log('[Autotask iframe] Navigating frame to:', finalUrl);
        window.location.href = finalUrl;
    }

    function goHistory(delta) {
        const state = readHistoryState();
        const targetIndex = state.index + delta;
        if (targetIndex < 0 || targetIndex >= state.stack.length) return;
        const targetUrl = state.stack[targetIndex];
        state.index = targetIndex;
        writeHistoryState(state);
        setPendingNavigation(targetUrl);
        window.location.href = targetUrl;
    }

    function createNavControls() {
        if (!isWidgetFrame) return;
        if (document.getElementById('at-iframe-nav-controls')) return;

        const style = document.createElement('style');
        style.id = 'at-iframe-nav-style';
        style.textContent = `
            #at-iframe-nav-controls {
                position: fixed;
                right: 44px;
                bottom: 58px;
                z-index: 2147483647;
                display: inline-flex;
                gap: 6px;
                padding: 6px;
                border: 1px solid #d1d5db;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.94);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
            }
            #at-iframe-nav-controls button {
                width: 30px;
                height: 30px;
                border: 1px solid #d1d5db;
                border-radius: 999px;
                background: #fff;
                color: #334155;
                font-size: 15px;
                line-height: 1;
                cursor: pointer;
            }
            #at-iframe-nav-controls button[disabled] {
                opacity: 0.4;
                cursor: default;
            }
        `;
        document.documentElement.appendChild(style);

        const wrap = document.createElement('div');
        wrap.id = 'at-iframe-nav-controls';

        const backBtn = document.createElement('button');
        backBtn.type = 'button';
        backBtn.textContent = '◀';
        backBtn.title = 'Back';

        const fwdBtn = document.createElement('button');
        fwdBtn.type = 'button';
        fwdBtn.textContent = '▶';
        fwdBtn.title = 'Forward';

        function refreshButtonState() {
            const state = readHistoryState();
            backBtn.disabled = state.index <= 0;
            fwdBtn.disabled = state.index >= state.stack.length - 1 || state.index < 0;
        }

        backBtn.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            goHistory(-1);
        });

        fwdBtn.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            goHistory(1);
        });

        wrap.appendChild(backBtn);
        wrap.appendChild(fwdBtn);
        document.body.appendChild(wrap);
        refreshButtonState();
    }

    function decodeAutotaskUrl(url) {
        if (!url) return url;
        return url
            .replace(/\\u0026/g, '&')
            .replace(/&amp;/g, '&');
    }

    function toAbsoluteUrl(url) {
        return new URL(url, location.origin).href;
    }

    function extractUrlFromOnclick(onclickText) {
        if (!onclickText) return null;
        // Autotask renders:
        // new Autotask.NewWindowPage('<pageName>', '<url>', false, '<idKey>', '<idValue>', true)
        const match = onclickText.match(
            /NewWindowPage\s*\(\s*'[^']*'\s*,\s*'([^']+)'\s*,\s*(?:true|false)\s*,\s*'([^']+)'\s*,\s*'([^']+)'/
        );
        if (!match) return null;

        const baseUrl = decodeAutotaskUrl(match[1] || '');
        const idKey = match[2];
        const idValue = match[3];

        const path = baseUrl.split('?')[0];
        if (!HANDLED_PATHS.has(path)) return null;

        const sep = baseUrl.includes('?') ? '&' : '?';
        return baseUrl + sep + encodeURIComponent(idKey) + '=' + encodeURIComponent(idValue);
    }

    document.addEventListener(
        'click',
        function (event) {
            if (!isWidgetFrame) return;

            const cell = event.target.closest('td[onclick]');
            if (!cell) return;
            const onclickText = cell.getAttribute('onclick') || '';
            if (!onclickText.includes('NewWindowPage')) return;

            const targetUrl = extractUrlFromOnclick(onclickText);
            if (!targetUrl) {
                console.warn('[Autotask iframe] Could not extract supported URL');
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            navigateWithHistory(targetUrl);
        },
        true
    );

    if (isWidgetFrame) {
        recordCurrentUrlInHistory();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createNavControls, { once: true });
        } else {
            createNavControls();
        }
    }

    console.log('[Autotask iframe] Click interception active');
})(); 
