(function () {
    'use strict';

    const AES = window.__AES__;
    if (!AES || AES.ticketLinksInitialized) return;
    AES.ticketLinksInitialized = true;

    const TICKET_LINK_CLASS = 'aes-ticket-link';
    const SCANNED_ATTR = 'data-aes-ticket-scanned';
    // Autotask default ticket number format: T<6-10 digit date-like
    // prefix>.<1-8 digit sequence>. The leading "T" and the dot
    // separator are the universal markers across regional hosts.
    const TICKET_PATTERN = /T\d{6,10}\.\d{1,8}/g;
    const SKIP_SELECTOR = [
        'a',
        'script',
        'style',
        'textarea',
        'input',
        'select',
        'option',
        'button',
        '[contenteditable="true"]',
        '.at-tabs-bar',
        '.at-tabs-viewport',
        '.at-tabs-settings-modal',
    ].join(',');
    const TICKET_HREF_PATH = '/Mvc/ServiceDesk/TicketDetail.mvc/TicketByTicketNumber?ticketNumber=';

    let observer = null;
    let scanTimer = 0;
    let styleInjected = false;

    // Bubble-phase listener: capture-phase handlers (notably the AES
    // iframe-bridge's anchor-click interceptor) have already had
    // their shot, so the ticket has been routed into an AES tab.
    // Stopping bubble propagation here keeps the click from also
    // triggering the surrounding row/cell's onclick (e.g. opening a
    // different ticket in a list view).
    document.addEventListener('click', function (event) {
        const ticketLink = event.target.closest && event.target.closest('a.' + TICKET_LINK_CLASS);
        if (!ticketLink) return;
        event.stopPropagation();
    }, false);

    function injectStyle() {
        if (styleInjected || document.getElementById('aes-ticket-link-style')) return;
        styleInjected = true;
        const style = document.createElement('style');
        style.id = 'aes-ticket-link-style';
        style.textContent = `
            a.${TICKET_LINK_CLASS} {
                color: inherit;
                text-decoration: underline;
                text-decoration-style: dotted;
                text-underline-offset: 2px;
                cursor: pointer;
            }
            a.${TICKET_LINK_CLASS}:hover {
                color: var(--aes-accent-link-color, #1d4ed8);
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    function shouldSkipNode(node) {
        const parent = node && node.parentElement;
        if (!parent) return true;
        if (parent.closest(SKIP_SELECTOR)) return true;
        // Quick reject: text without a "T<digit>" sequence can't
        // contain a ticket number, so don't waste a regex scan.
        return !node.nodeValue || !/T\d/.test(node.nodeValue);
    }

    function hasSafeBoundary(text, start, end) {
        const before = start > 0 ? text[start - 1] : '';
        const after = end < text.length ? text[end] : '';
        if (before && /[A-Za-z0-9]/.test(before)) return false;
        if (after && /[A-Za-z0-9.]/.test(after)) return false;
        return true;
    }

    function buildFragment(text) {
        TICKET_PATTERN.lastIndex = 0;
        let match;
        let lastIndex = 0;
        let changed = false;
        const fragment = document.createDocumentFragment();

        while ((match = TICKET_PATTERN.exec(text)) !== null) {
            const raw = match[0];
            if (!hasSafeBoundary(text, match.index, match.index + raw.length)) continue;

            if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
            }

            const link = document.createElement('a');
            link.className = TICKET_LINK_CLASS;
            link.href = TICKET_HREF_PATH + encodeURIComponent(raw);
            link.textContent = raw;
            link.title = 'Open ticket ' + raw;
            fragment.appendChild(link);

            lastIndex = match.index + raw.length;
            changed = true;
        }

        if (!changed) return null;
        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
        return fragment;
    }

    function linkTextNode(node) {
        if (shouldSkipNode(node)) return;
        const fragment = buildFragment(node.nodeValue);
        if (!fragment) return;
        node.parentNode.replaceChild(fragment, node);
    }

    function scan(root) {
        if (!AES.state.ticketLinksEnabled) return;
        const scanRoot = root && root.nodeType === Node.ELEMENT_NODE ? root : document.body;
        if (!scanRoot || scanRoot.getAttribute(SCANNED_ATTR) === 'true') return;

        injectStyle();
        const walker = document.createTreeWalker(scanRoot, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                return shouldSkipNode(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
            },
        });

        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(linkTextNode);

        if (scanRoot !== document.body) {
            scanRoot.setAttribute(SCANNED_ATTR, 'true');
        }
    }

    function scheduleScan(root) {
        if (!AES.state.ticketLinksEnabled) return;
        clearTimeout(scanTimer);
        scanTimer = setTimeout(function () {
            scan(root || document.body);
        }, 120);
    }

    function unlinkTicketLinks() {
        document.querySelectorAll('a.' + TICKET_LINK_CLASS).forEach(function (link) {
            link.replaceWith(document.createTextNode(link.textContent || ''));
        });
        document.querySelectorAll('[' + SCANNED_ATTR + ']').forEach(function (el) {
            el.removeAttribute(SCANNED_ATTR);
        });
    }

    function startObserver() {
        if (observer || !document.body) return;
        observer = new MutationObserver(function (mutations) {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        linkTextNode(node);
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        scheduleScan(node);
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function stopObserver() {
        if (!observer) return;
        observer.disconnect();
        observer = null;
    }

    AES.setTicketLinksEnabled = function setTicketLinksEnabled(enabled) {
        AES.state.ticketLinksEnabled = !!enabled;
        if (AES.state.ticketLinksEnabled) {
            scheduleScan(document.body);
            startObserver();
        } else {
            stopObserver();
            unlinkTicketLinks();
        }
    };

    AES.initTicketLinks = function initTicketLinks() {
        if (AES.featuresEnabled && !AES.featuresEnabled()) {
            AES.setTicketLinksEnabled(false);
            return;
        }
        if (!AES.state.ticketLinksEnabled) return;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                AES.setTicketLinksEnabled(true);
            }, { once: true });
            return;
        }
        AES.setTicketLinksEnabled(true);
    };

    if (AES.hasChromeStorage() && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener(function (changes, areaName) {
            if (areaName !== 'local') return;
            const change = changes[AES.SETTINGS_STORAGE_KEY];
            const settings = change && change.newValue;
            if (!settings) return;
            if (settings.extensionEnabled === false) {
                AES.setTicketLinksEnabled(false);
                return;
            }
            if (typeof settings.ticketLinksEnabled !== 'boolean') return;
            AES.setTicketLinksEnabled(settings.ticketLinksEnabled);
        });
    }
})();
