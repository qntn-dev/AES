(function () {
    'use strict';

    const AES = window.__AES__;
    if (!AES || AES.phoneLinksInitialized) return;
    AES.phoneLinksInitialized = true;

    const PHONE_LINK_CLASS = 'aes-phone-link';
    const SCANNED_ATTR = 'data-aes-phone-scanned';
    const DASH_CHARS = '\\-\\u2010\\u2011\\u2012\\u2013\\u2014\\u2015\\u2212';
    const PHONE_PATTERN = new RegExp('(?:\\+|00)?\\d(?:[\\d().' + DASH_CHARS + ']|\\s+(?=\\d)|\\s*[' + DASH_CHARS + '/]\\s*){5,}\\d', 'g');
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

    let observer = null;
    let scanTimer = 0;
    let styleInjected = false;

    document.addEventListener('click', function (event) {
        const phoneLink = event.target.closest && event.target.closest('a.' + PHONE_LINK_CLASS);
        if (!phoneLink) return;
        event.stopPropagation();
        event.stopImmediatePropagation();
    }, true);

    function injectStyle() {
        if (styleInjected || document.getElementById('aes-phone-link-style')) return;
        styleInjected = true;
        const style = document.createElement('style');
        style.id = 'aes-phone-link-style';
        style.textContent = `
            a.${PHONE_LINK_CLASS} {
                color: inherit;
                text-decoration: underline;
                text-decoration-style: dotted;
                text-underline-offset: 2px;
                cursor: pointer;
            }
            a.${PHONE_LINK_CLASS}:hover {
                color: #1d4ed8;
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    function shouldSkipNode(node) {
        const parent = node && node.parentElement;
        if (!parent) return true;
        if (parent.closest(SKIP_SELECTOR)) return true;
        return !node.nodeValue || !/\d/.test(node.nodeValue);
    }

    function normalizePhone(raw) {
        let value = (raw || '').trim();
        if (!value) return '';

        value = value.replace(/[\u2010-\u2015\u2212]/g, '-');
        value = value.replace(/\(0\)/g, '');
        const hasPlus = /^\s*\+/.test(value);
        const startsInternational = /^\s*00/.test(value);
        let digits = value.replace(/\D/g, '');

        if (startsInternational) digits = digits.replace(/^00/, '');
        if (digits.length < 7 || digits.length > 15) return '';
        if (/^0+$/.test(digits)) return '';

        return (hasPlus || startsInternational ? '+' : '') + digits;
    }

    function isProbablyPhone(raw) {
        const normalized = normalizePhone(raw);
        if (!normalized) return false;

        const digits = normalized.replace(/\D/g, '');
        if (digits.length < 7 || digits.length > 15) return false;

        const trimmed = raw.trim();
        if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/.test(trimmed)) return false;
        if (/^\d{4}[/-]\d{1,2}[/-]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/.test(trimmed)) return false;
        if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(trimmed)) return false;
        if (/^\d+(?:[.,]\d+)?$/.test(trimmed) && digits.length < 10) return false;

        return true;
    }

    function hasSafeBoundary(text, start, end) {
        const before = start > 0 ? text[start - 1] : '';
        const after = end < text.length ? text[end] : '';
        if (before && /[A-Za-z0-9]/.test(before)) return false;
        if (after && /[A-Za-z0-9]/.test(after)) return false;
        if (after === ':') return false;
        return true;
    }

    function buildFragment(text) {
        PHONE_PATTERN.lastIndex = 0;
        let match;
        let lastIndex = 0;
        let changed = false;
        const fragment = document.createDocumentFragment();

        while ((match = PHONE_PATTERN.exec(text)) !== null) {
            const raw = match[0];
            if (!hasSafeBoundary(text, match.index, match.index + raw.length)) continue;
            if (!isProbablyPhone(raw)) continue;

            if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
            }

            const link = document.createElement('a');
            link.className = PHONE_LINK_CLASS;
            link.href = 'tel:' + normalizePhone(raw);
            link.textContent = raw;
            link.title = 'Call ' + raw.trim();
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
        if (!AES.state.phoneLinksEnabled) return;
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
        if (!AES.state.phoneLinksEnabled) return;
        clearTimeout(scanTimer);
        scanTimer = setTimeout(function () {
            scan(root || document.body);
        }, 120);
    }

    function unlinkPhoneLinks() {
        document.querySelectorAll('a.' + PHONE_LINK_CLASS).forEach(function (link) {
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

    AES.setPhoneLinksEnabled = function setPhoneLinksEnabled(enabled) {
        AES.state.phoneLinksEnabled = !!enabled;
        if (AES.state.phoneLinksEnabled) {
            scheduleScan(document.body);
            startObserver();
        } else {
            stopObserver();
            unlinkPhoneLinks();
        }
    };

    AES.initPhoneLinks = function initPhoneLinks() {
        if (AES.featuresEnabled && !AES.featuresEnabled()) {
            AES.setPhoneLinksEnabled(false);
            return;
        }
        if (!AES.state.phoneLinksEnabled) return;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                AES.setPhoneLinksEnabled(true);
            }, { once: true });
            return;
        }
        AES.setPhoneLinksEnabled(true);
    };

    if (AES.hasChromeStorage() && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener(function (changes, areaName) {
            if (areaName !== 'local') return;
            const change = changes[AES.SETTINGS_STORAGE_KEY];
            const settings = change && change.newValue;
            if (!settings) return;
            if (settings.extensionEnabled === false) {
                AES.setPhoneLinksEnabled(false);
                return;
            }
            if (typeof settings.phoneLinksEnabled !== 'boolean') return;
            AES.setPhoneLinksEnabled(settings.phoneLinksEnabled);
        });
    }
})();
