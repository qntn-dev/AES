(function () {
    'use strict';

    const AES = window.__AES__;
    if (!AES || AES.isTop || AES.iframeBridgeInitialized) return;
    AES.iframeBridgeInitialized = true;

    function decodeUrl(url) {
        return (url || '').replace(/\\u0026/g, '&').replace(/&amp;/g, '&');
    }

    function extractWindowOpenUrl(onclickText) {
        if (!onclickText) return null;
        const match = onclickText.match(/window\.open\s*\(\s*['"]([^'"]+)['"]/i);
        if (!match) return null;

        const rawUrl = decodeUrl(match[1] || '');
        const absoluteUrl = AES.toAbsoluteUrl(rawUrl);
        return AES.isHandledUrl(absoluteUrl) ? absoluteUrl : null;
    }

    function extractAnchorUrl(anchor) {
        if (!anchor) return null;
        const href = anchor.getAttribute('href') || '';
        if (!href || href === '#') return null;

        const absoluteUrl = AES.toAbsoluteUrl(decodeUrl(href));
        return AES.isHandledUrl(absoluteUrl) ? absoluteUrl : null;
    }

    function extractUrlFromOnclick(onclickText) {
        if (!onclickText) return null;
        const m = onclickText.match(
            /NewWindowPage\s*\(\s*'[^']*'\s*,\s*'([^']+)'\s*,\s*(?:true|false)\s*,\s*'([^']+)'\s*,\s*'([^']+)'/
        );
        if (!m) return null;
        const baseUrl = decodeUrl(m[1] || '');
        const path = baseUrl.split('?')[0];
        if (!AES.isHandledUrl(path)) return null;
        const sep = baseUrl.includes('?') ? '&' : '?';
        return baseUrl + sep + encodeURIComponent(m[2]) + '=' + encodeURIComponent(m[3]);
    }

    function postToTop(payload) {
        try { window.top.postMessage({ __ns: AES.MSG_NS, ...payload }, '*'); }
        catch (e) {}
    }

    // Style Autotask legacy-page primary-action buttons that use the
    // `Button2 ButtonIcon2 NormalBackground` class names (rendered as
    // `<div>`s with `.Spacer` / `.Icon2` / `.Text2` children, even though
    // they live on legacy ASP/MVC pages — they happen to reuse the modern
    // Onyx class names but the markup is legacy). Gated by the shell's
    // "Autotask UI Enhancement" setting. The walker is configured to skip
    // these and their descendants so this stylesheet wins the cascade.
    function injectModernButtonStyles() {
        const STYLE_ID = 'aes-modern-button-style';
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        const BUTTON_BG = '#376A94';
        const BUTTON_BG_HOVER = '#2c567a';
        const BUTTON_BG_ACTIVE = '#24475f';
        const BUTTON_FG = '#ffffff';
        style.textContent = [
            '.Button2.ButtonIcon2.NormalBackground {',
            '    background-color: ' + BUTTON_BG + ' !important;',
            '    background-image: none !important;',
            '    color: ' + BUTTON_FG + ' !important;',
            '    border-radius: 6px !important;',
            '}',
            '.Button2.ButtonIcon2.NormalBackground:hover,',
            '.Button2.ButtonIcon2.NormalBackground.HoverBackground {',
            '    background-color: ' + BUTTON_BG_HOVER + ' !important;',
            '    color: ' + BUTTON_FG + ' !important;',
            '}',
            '.Button2.ButtonIcon2.NormalBackground:active,',
            '.Button2.ButtonIcon2.NormalBackground.PressedBackground {',
            '    background-color: ' + BUTTON_BG_ACTIVE + ' !important;',
            '    color: ' + BUTTON_FG + ' !important;',
            '}',
            // Inner text + label always white.
            '.Button2.ButtonIcon2.NormalBackground .Text2,',
            '.Button2.ButtonIcon2.NormalBackground .Spacer,',
            '.Button2.ButtonIcon2.NormalBackground .Icon2 {',
            '    color: ' + BUTTON_FG + ' !important;',
            '}',
            // The icon glyph inside Onyx buttons is rendered via
            // `.StandardButtonIcon` (sprite/background-image). Push it to white
            // so it stays visible on the brand-blue button face.
            '.Button2.ButtonIcon2.NormalBackground .StandardButtonIcon {',
            '    filter: brightness(0) invert(1) !important;',
            '}',
            // Exemption for tabs (`.TabBar`) and dropdown menus
            // (`.ContextOverlay`) — when the same button class is reused as
            // a tab or a menu item, revert our overrides so Autotask's own
            // styling shows through.
            ':is(.TabBar, .ContextOverlay) .Button2.ButtonIcon2.NormalBackground,',
            ':is(.TabBar, .ContextOverlay) .Button2.ButtonIcon2.NormalBackground:hover,',
            ':is(.TabBar, .ContextOverlay) .Button2.ButtonIcon2.NormalBackground.HoverBackground,',
            ':is(.TabBar, .ContextOverlay) .Button2.ButtonIcon2.NormalBackground:active,',
            ':is(.TabBar, .ContextOverlay) .Button2.ButtonIcon2.NormalBackground.PressedBackground {',
            '    background-color: revert !important;',
            '    background-image: revert !important;',
            '    color: revert !important;',
            '    border-radius: revert !important;',
            '}',
            ':is(.TabBar, .ContextOverlay) .Button2.ButtonIcon2.NormalBackground .Text2,',
            ':is(.TabBar, .ContextOverlay) .Button2.ButtonIcon2.NormalBackground .Spacer,',
            ':is(.TabBar, .ContextOverlay) .Button2.ButtonIcon2.NormalBackground .Icon2 {',
            '    color: revert !important;',
            '}',
            ':is(.TabBar, .ContextOverlay) .Button2.ButtonIcon2.NormalBackground .StandardButtonIcon {',
            '    filter: revert !important;',
            '}',
        ].join('\n');
        function attach() {
            (document.head || document.documentElement).appendChild(style);
        }
        if (document.head || document.documentElement) attach();
        else document.addEventListener('DOMContentLoaded', attach, { once: true });
    }

    // Hide redundant legacy Autotask chrome inside iframes that the custom
    // tab system already covers, and tighten the surrounding spacing that
    // Autotask's own CSS reserved for that chrome.
    //   - Hide `.TitleBar.TitleBarNavigation` (ticket / detail title + 1-of-N
    //     nav arrows + bookmark/help — duplicated by the custom tab bar).
    //   - Hide `.TitleBar.Active:not(.TitleBarNavigation)` (the organization
    //     / contact-style title bar without nav arrows — also redundant with
    //     the custom tab bar).
    //   - Reduce `body.FullScroll` `padding-top` from 105px → 50px so the
    //     ticket body doesn't sit in the empty space left by the hidden bar.
    //   - Reduce `EntityNew/Edit/Detail > MainContainer > SecondaryContainer`
    //     `padding-top` from its default to 10px (consistent tightening).
    //   - Move the `body.FullScroll > .QuickLaunchBar` from its default
    //     position to `top: 60px` so it follows the reduced body padding.
    // Only the listed properties are overridden; everything else on those
    // selectors retains Autotask's default values.
    function injectLegacyChromeOverrides() {
        const STYLE_ID = 'aes-legacy-chrome-overrides-style';
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = [
            '.TitleBar.TitleBarNavigation {',
            '    display: none !important;',
            '}',
            '.TitleBar.Active:not(.TitleBarNavigation) {',
            '    display: none !important;',
            '}',
            'body.FullScroll {',
            '    padding-top: 50px !important;',
            '}',
            '.EntityNew > .MainContainer > .SecondaryContainer,',
            '.EntityEdit > .MainContainer > .SecondaryContainer,',
            '.EntityDetail > .MainContainer > .SecondaryContainer {',
            '    padding-top: 10px !important;',
            '}',
            'body.FullScroll > .QuickLaunchBar {',
            '    top: 60px !important;',
            '}',
            'body.SummaryPage1 > .PageContentContainer > .MainContainer1 > .PrimaryContentContainer1 > .StandardViewContainer1,',
            'body.SummaryPage1 > .PageContentContainer > .MainContainer1 > .PrimaryContentContainer1 > .GridViewContainer1,',
            'body.SummaryPage1 > .PageContentContainer > .MainContainer1 > .PrimaryContentContainer1 > .GanttViewContainer1,',
            'body.SummaryPage1 > .PageContentContainer > .MainContainer1 > .PrimaryContentContainer1 > .StandardViewContainer1 > .VerticalContainer,',
            'body.SummaryPage1 > .PageContentContainer > .MainContainer1 > .PrimaryContentContainer1 > .GridViewContainer1 > .VerticalContainer,',
            'body.SummaryPage1 > .PageContentContainer > .MainContainer1 > .PrimaryContentContainer1 > .GanttViewContainer1 > .VerticalContainer {',
            '    padding-top: 12px !important;',
            '}',
        ].join('\n');
        function attach() {
            (document.head || document.documentElement).appendChild(style);
        }
        if (document.head || document.documentElement) attach();
        else document.addEventListener('DOMContentLoaded', attach, { once: true });
    }

    // Replace native OS scrollbars in the iframe's document with a thin
    // translucent styled scrollbar. Selectors use :where() so they have
    // zero specificity — anything Autotask styles with a normal selector
    // (e.g. `.SomeGrid::-webkit-scrollbar`) wins automatically and keeps
    // its own custom scrollbar untouched.
    function injectScrollbarStyles() {
        const STYLE_ID = 'aes-custom-scrollbar-style';
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = [
            ':where(html) {',
            '    scrollbar-color: rgba(125, 167, 201, 0.5) transparent;',
            '    scrollbar-width: thin;',
            '}',
            ':where(*)::-webkit-scrollbar {',
            '    width: 10px;',
            '    height: 10px;',
            '}',
            ':where(*)::-webkit-scrollbar-track {',
            '    background: transparent;',
            '}',
            ':where(*)::-webkit-scrollbar-thumb {',
            '    background-color: rgba(125, 167, 201, 0.5);',
            '    border-radius: 999px;',
            '    border: 2px solid transparent;',
            '    background-clip: content-box;',
            '}',
            ':where(*)::-webkit-scrollbar-thumb:hover {',
            '    background-color: rgba(125, 167, 201, 0.75);',
            '    background-clip: content-box;',
            '}',
            ':where(*)::-webkit-scrollbar-corner {',
            '    background: transparent;',
            '}',
        ].join('\n');
        function attach() {
            (document.head || document.documentElement).appendChild(style);
        }
        if (document.head || document.documentElement) attach();
        else document.addEventListener('DOMContentLoaded', attach, { once: true });
    }

    // Push this iframe's own content down by BAR_H so the shell bar in the
    // top document never visually overlaps what's inside. Runs from INSIDE
    // each iframe so it works regardless of whether the shell's
    // findContentIframe identified this iframe.
    //
    // Three-step strategy, tried in order, one of them wins:
    //   1. If <body> is a <frameset> (legacy ASP pages) → pad <html>.
    //   2. Else if <body> already has >= BAR_H of padding-top (Autotask's
    //      own layout, e.g. MVC pages with a fixed PageHeadingContainer)
    //      → do nothing. Content is already below where our bar sits.
    //   3. Otherwise try padding <body>. After layout settles, re-measure.
    //      If body's padding-top still computed to < BAR_H (Autotask's CSS
    //      won specificity, or body layout ignores padding), fall back to
    //      <html> padding.
    //
    // <html> padding with box-sizing: border-box + height: 100vh is the
    // strongest mechanism: it reduces the containing block for everything
    // inside, including absolutely-positioned root fills and frameset docs.
    //
    // Skipped when: this iframe lives inside the shell's tab viewport, or
    // is nested more than one level deep (outer wrapper already pushed).
    function applyShellBarBodyPadding() {
        try {
            const fe = window.frameElement;
            if (fe && fe.closest && fe.closest('.at-tabs-viewport')) return;
        } catch (e) {
            return;
        }
        try { if (window.parent !== window.top) return; } catch (e) { return; }

        const doc = document;
        const STYLE_ID = 'aes-native-body-shell-padding-style';
        const BODY_CLASS = 'aes-native-body-shell-padding';
        const HTML_CLASS = 'aes-native-html-shell-padding';

        // 0.3.22: content-inside-iframe padding could not reliably move
        // Autotask pages with absolute/fixed root containers. The shell now
        // offsets the native iframe itself, which is layout-agnostic. Keep this
        // bridge path as cleanup only so previous spacer classes do not stack.
        const staleStyle = doc.getElementById(STYLE_ID);
        if (staleStyle) staleStyle.remove();
        if (doc.documentElement) doc.documentElement.classList.remove(HTML_CLASS);
        if (doc.body) doc.body.classList.remove(BODY_CLASS);
        return;

        function ensureStyle() {
            if (doc.getElementById(STYLE_ID)) return;
            const style = doc.createElement('style');
            style.id = STYLE_ID;
            style.textContent = `
                /* Body padding + position:relative makes <body> the containing
                   block for its absolutely-positioned descendants, so absolute
                   children with top:0 (e.g. Autotask's .PageContentContainer)
                   resolve to body's padding box top — 65px below body's top —
                   instead of the viewport top. Trying to establish containing
                   block on <html> via position:relative / transform does NOT
                   work reliably on root elements in Chromium. Body does. */
                body.${BODY_CLASS} {
                    padding-top: ${AES.BAR_H}px !important;
                    box-sizing: border-box !important;
                    position: relative !important;
                }
                /* Frameset-only fallback. <frameset> doesn't respect any body
                   technique, so we pad <html> and size it to the viewport. */
                html.${HTML_CLASS} {
                    padding-top: ${AES.BAR_H}px !important;
                    box-sizing: border-box !important;
                    height: 100vh !important;
                }
            `;
            (doc.head || doc.documentElement).appendChild(style);
        }

        function padHtml() {
            if (doc.documentElement) {
                doc.documentElement.classList.add(HTML_CLASS);
            }
        }

        function currentBodyPaddingTop() {
            try {
                const cs = window.getComputedStyle(doc.body);
                return parseFloat(cs.paddingTop) || 0;
            } catch (e) { return 0; }
        }

        function apply() {
            ensureStyle();

            const body = doc.body;
            if (!body) return; // wait for body — apply will run again at DOMContentLoaded

            // Case 1: frameset doc — body ignores padding, pad html.
            if (body.tagName === 'FRAMESET') {
                padHtml();
                return;
            }

            // Case 2: Autotask already offsets body enough. Leave alone.
            if (currentBodyPaddingTop() >= AES.BAR_H) {
                return;
            }

            // Case 3: apply body padding + position:relative. This covers:
            //   - Normal flow content (padding shifts it down)
            //   - Absolute root containers with top:0 (body becomes their
            //     containing block, so padding-box top — below bar — applies)
            body.classList.add(BODY_CLASS);

            // Verify after layout settles. If body's computed padding-top is
            // still < BAR_H, our class lost a specificity fight (rare); fall
            // back to html padding.
            window.requestAnimationFrame(function () {
                window.requestAnimationFrame(function () {
                    if (currentBodyPaddingTop() < AES.BAR_H) {
                        body.classList.remove(BODY_CLASS);
                        padHtml();
                    }
                });
            });
        }

        if (doc.body) {
            apply();
        } else if (doc.readyState === 'loading') {
            doc.addEventListener('DOMContentLoaded', apply, { once: true });
        } else {
            // Past loading but body is still null — keep polling briefly.
            apply();
        }
    }

    let pendingMapOpenUntil = 0;

    function isPendingMapOpen() {
        return pendingMapOpenUntil && Date.now() < pendingMapOpenUntil;
    }

    function isMapUrl(url) {
        const targetUrl = AES.toAbsoluteUrl(decodeUrl(String(url || '')));
        if (!targetUrl) return false;
        try {
            const parsed = new URL(targetUrl);
            return /(^|\.)maps\.google\./i.test(parsed.hostname) ||
                /(^|\.)google\.[^/]+$/i.test(parsed.hostname) && parsed.pathname.toLowerCase().includes('/maps') ||
                /(^|\.)openstreetmap\.org$/i.test(parsed.hostname);
        } catch (e) {
            return /\bmaps\.google\.|openstreetmap\.org/i.test(targetUrl);
        }
    }

    function createMapWindow(url) {
        const targetUrl = AES.toAbsoluteUrl(decodeUrl(String(url || '')));
        return {
            closed: false,
            opener: window,
            focus: function () {
                if (targetUrl) postToTop({ type: 'map', url: targetUrl });
            },
            blur: function () {},
            close: function () { this.closed = true; },
        };
    }

    function injectPageBridge() {
        if (document.documentElement.dataset.aesPageBridgeInjected === 'true') return;
        document.documentElement.dataset.aesPageBridgeInjected = 'true';

        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('aes-page-bridge.js');
        script.onload = function () { script.remove(); };
        (document.documentElement || document.head).appendChild(script);
    }

    function injectMapButtonStyles() {
        if (document.getElementById('aes-map-button-style')) return;
        const style = document.createElement('style');
        style.id = 'aes-map-button-style';
        style.textContent = `
            /* The EntityHeadingIconButton wrapper ships with fixed width/margins
               for the original 16px icon. Reset it so our button sits inline
               with the address text baseline. */
            .EntityHeadingIconButton:has(> .InlineIconButton.InlineIcon.Map[data-aes-map-enhanced="true"]) {
                width: auto !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                display: inline-flex !important;
                align-items: center !important;
                vertical-align: middle !important;
            }
            /* Match Autotask's native primary button (e.g. "Assign & Schedule"):
               rounded, brand blue fill, white text, medium-weight 13px label. */
            .InlineIconButton.InlineIcon.Map[data-aes-map-enhanced="true"] {
                width: auto !important;
                height: auto !important;
                min-width: 0 !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 6px !important;
                padding: 4px 10px !important;
                margin: 0 !important;
                border: 1px solid transparent !important;
                border-radius: 6px !important;
                background: #2c567a !important;
                box-shadow: none !important;
                color: #ffffff !important;
                cursor: pointer !important;
                box-sizing: border-box !important;
                vertical-align: middle !important;
                transform: none !important;
                font: 500 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif !important;
                text-indent: 0 !important;
                overflow: visible !important;
                user-select: none !important;
            }
            .InlineIconButton.InlineIcon.Map[data-aes-map-enhanced="true"]:hover,
            .InlineIconButton.InlineIcon.Map[data-aes-map-enhanced="true"].HoverState {
                background: #24475f !important;
                color: #ffffff !important;
                box-shadow: none !important;
            }
            .InlineIconButton.InlineIcon.Map[data-aes-map-enhanced="true"]:active {
                background: #1d3a4d !important;
            }
            .InlineIconButton.InlineIcon.Map[data-aes-map-enhanced="true"] .aes-map-button-icon,
            .InlineIconButton.InlineIcon.Map[data-aes-map-enhanced="true"] .aes-map-button-text {
                pointer-events: none !important;
            }
            .InlineIconButton.InlineIcon.Map[data-aes-map-enhanced="true"] .aes-map-button-icon {
                width: 14px !important;
                height: 14px !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                flex: 0 0 auto !important;
            }
            .InlineIconButton.InlineIcon.Map[data-aes-map-enhanced="true"] .aes-map-button-icon svg {
                width: 14px !important;
                height: 14px !important;
                display: block !important;
            }
            .InlineIconButton.InlineIcon.Map[data-aes-map-enhanced="true"] .aes-map-button-text {
                display: inline-block !important;
                line-height: 1 !important;
                letter-spacing: 0.01em !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    function enhanceMapButtons(root) {
        const scope = root && root.querySelectorAll ? root : document;
        const buttons = scope.querySelectorAll('.InlineIconButton.InlineIcon.Map:not([data-aes-map-enhanced])');
        for (const button of buttons) {
            button.dataset.aesMapEnhanced = 'true';
            button.title = button.title || 'Open organization location';
            button.setAttribute('role', button.getAttribute('role') || 'button');
            button.setAttribute('aria-label', button.getAttribute('aria-label') || 'Open organization location');
            button.innerHTML = '<span class="aes-map-button-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/></svg></span><span class="aes-map-button-text">Map</span>';
        }
    }

    function startMapButtonEnhancement() {
        injectMapButtonStyles();
        enhanceMapButtons(document);
        const obs = new MutationObserver(function (mutations) {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) enhanceMapButtons(node);
                }
            }
        });
        obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
    }

    function cleanText(s) {
        return (s || '').replace(/\s+/g, ' ').trim();
    }

    function collectAccessibleDocuments(rootDoc, maxDepth) {
        const docs = [];
        const seen = new Set();

        function walk(doc, depth) {
            if (!doc || seen.has(doc)) return;
            seen.add(doc);
            docs.push(doc);
            if (depth >= maxDepth) return;

            for (const frame of doc.querySelectorAll('iframe, frame')) {
                try {
                    const childDoc = frame.contentDocument;
                    if (childDoc) walk(childDoc, depth + 1);
                } catch (e) {}
            }
        }

        walk(rootDoc, 0);
        return docs;
    }

    function queryAcrossAccessibleDocuments(selector, maxDepth) {
        const docs = collectAccessibleDocuments(document, maxDepth || 2);
        for (const doc of docs) {
            try {
                const el = doc.querySelector(selector);
                if (el) return el;
            } catch (e) {}
        }
        return null;
    }

    function findFieldValue(labelText) {
        const rows = document.querySelectorAll('.ReadOnlyData');
        const wanted = labelText.toLowerCase();
        for (const row of rows) {
            const primary = row.querySelector('.ReadOnlyLabelContainer .PrimaryText');
            if (!primary) continue;
            if (cleanText(primary.textContent).toLowerCase() !== wanted) continue;
            const valueEl = row.querySelector('.ReadOnlyValueContainer, .ValueContainer, .DataContainer, .Value');
            if (valueEl) {
                const link = valueEl.querySelector('a');
                return cleanText((link || valueEl).textContent);
            }
            const clone = row.cloneNode(true);
            const lbl = clone.querySelector('.ReadOnlyLabelContainer');
            if (lbl) lbl.remove();
            return cleanText(clone.textContent);
        }
        return '';
    }

    function findReadOnlyValueByLabel(labelNames) {
        const wanted = labelNames.map(function (n) { return n.toLowerCase(); });
        const labels = document.querySelectorAll(
            '.ReadOnlyData .ReadOnlyLabelContainer .PrimaryText'
        );
        for (const label of labels) {
            const text = (label.textContent || '').trim().toLowerCase();
            if (wanted.indexOf(text) === -1) continue;
            const data = label.closest('.ReadOnlyData');
            if (!data) continue;
            const valueContainer = data.querySelector('.ReadOnlyValueContainer .Value');
            if (!valueContainer) continue;
            const colorSample = valueContainer.querySelector('.Right .Text.ColorSample');
            const raw = colorSample ? colorSample.textContent : valueContainer.textContent;
            const value = cleanText(raw);
            if (value) return value;
        }
        return '';
    }

    function extractTicketLastActivity() {
        const ts = document.querySelector(
            '.ConversationChunk .ConversationItem .Footer .Timestamp'
        );
        return cleanText(ts && ts.textContent);
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
        const priority = findReadOnlyValueByLabel(['Priority']);
        const status = findReadOnlyValueByLabel(['Status']);
        const lastActivity = extractTicketLastActivity();

        return {
            title: title || 'Ticket',
            number: number.slice(0, 40),
            contact: organization.slice(0, 80),
            primaryResource: extractPrimaryResourceInfo(),
            priority: priority.slice(0, 40),
            status: status.slice(0, 40),
            lastActivity: lastActivity.slice(0, 40),
        };
    }

    function extractRecurringTicketInfo() {
        const params = new URLSearchParams(location.search);
        const id = (params.get('recurring_ticket_id') || params.get('recurringTicketId') || '').trim();
        const heading = document.querySelector('.EntityHeadingContainer, .PageHeadingContainer, .TitleBar');
        let title = '';

        if (heading) {
            const titleEl = heading.querySelector('.Title > .Text, .TitleBarItem.Title .Text, .Text');
            if (titleEl) title = cleanText(titleEl.textContent);
        }

        if (!title) {
            title = cleanText(document.title)
                .replace(/^Autotask\s*[-–]\s*/i, '')
                .replace(/^Recurring\s+Ticket\s*[-–]?\s*/i, '');
        }

        return {
            title: title || 'Recurring Ticket',
            number: id ? ('Recurring ' + id).slice(0, 40) : '',
            contact: '',
            primaryResource: null,
        };
    }

    function extractPrimaryResourceInfo() {
        try {
            const root = document.querySelector('.PrimaryResource');
            if (!root) return null;

            const nameEl = root.querySelector('.Name .Text2') || root.querySelector('.Name');
            const imgEl = root.querySelector('.Left img[src], img[src]');
            const photoUrl = imgEl ? AES.toAbsoluteUrl(decodeUrl(imgEl.getAttribute('src') || '')) : '';
            const initialsEl = root.querySelector('.Initials');
            const initials = cleanText(initialsEl && initialsEl.textContent).slice(0, 4);
            if (!initials && !photoUrl) return null;

            const className = initialsEl ? String(initialsEl.className || '') : '';
            const colorClassMatch = className.match(/\bColor\d+\b/);
            let bgColor = '';
            let textColor = '';
            let borderColor = '';

            if (initialsEl) try {
                const styles = window.getComputedStyle(initialsEl);
                bgColor = styles.backgroundColor || '';
                textColor = styles.color || '';
                borderColor = styles.borderColor || '';
            } catch (e) {}

            return {
                initials: initials,
                name: cleanText(nameEl && nameEl.textContent).slice(0, 80),
                photoUrl: photoUrl,
                colorClass: colorClassMatch ? colorClassMatch[0] : '',
                bgColor: bgColor,
                textColor: textColor,
                borderColor: borderColor,
            };
        } catch (e) {
            console.warn('AES: primary resource metadata extraction failed', e);
            return null;
        }
    }

    function extractContractInfo() {
        const params = new URLSearchParams(location.search);
        const urlName = (params.get('ContractName') || '').trim();
        const urlId = (params.get('contractID') || '').trim();
        const urlOrg = (params.get('ClientName') || '').trim();

        let name = urlName;
        let id = urlId;
        let org = urlOrg;

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
            title: name || 'Contract',
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
            title: title || 'Organization',
            number: number.slice(0, 40),
            contact: classification.slice(0, 80),
        };
    }

    function extractPersonInfo() {
        const heading = document.querySelector('.EntityHeadingContainer');
        let number = '', title = '';
        if (heading) {
            const idEl = heading.querySelector('.IdentificationText');
            if (idEl) number = cleanText(idEl.textContent).replace(/^ID:\s*/i, '');
            const titleEl = heading.querySelector('.Title > .Text');
            if (titleEl) title = cleanText(titleEl.textContent);
        }
        const organization = findFieldValue('Organization') ||
            findFieldValue('Organization Name') ||
            findFieldValue('Company') ||
            findFieldValue('Company Name') ||
            findFieldValue('Account') ||
            findFieldValue('Account Name') ||
            findFieldValue('Customer') ||
            findFieldValue('Client');
        return {
            title: title || cleanText(document.title) || 'Person',
            number: number.slice(0, 40),
            contact: organization.slice(0, 80),
        };
    }

    function extractProjectInfo() {
        const heading = document.querySelector('.EntityHeadingContainer');
        let number = '', title = '';
        if (heading) {
            const idEl = heading.querySelector('.IdentificationText');
            if (idEl) number = cleanText(idEl.textContent).replace(/^ID:\s*/i, '');
            const titleEl = heading.querySelector('.Title > .Text');
            if (titleEl) title = cleanText(titleEl.textContent);
        }
        const organization = findFieldValue('Organization') ||
            findFieldValue('Organization Name') ||
            findFieldValue('Account') ||
            findFieldValue('Account Name') ||
            findFieldValue('Customer');
        return {
            title: title || cleanText(document.title) || 'Project',
            number: number.slice(0, 40),
            contact: organization.slice(0, 80),
        };
    }

    function extractGenericInfo(fallbackTitle) {
        const heading = document.querySelector('.EntityHeadingContainer .Title > .Text, .PageHeadingContainer .Title .Text, h1, .Title');
        const title = cleanText(heading && heading.textContent) ||
            cleanText(document.title).replace(/^Autotask\s*[-–]\s*/i, '');
        return {
            title: title || fallbackTitle || 'Autotask page',
            number: '',
            contact: '',
            primaryResource: null,
        };
    }

    function extractSecondaryName(text) {
        const txt = cleanText(text);
        if (!txt) return '';

        const dashMatch = txt.match(/^(?:[-\u2010-\u2015\u2212])\s*(.+?)(?:\s*\(|$)/);
        if (dashMatch) {
            return dashMatch[1].trim().slice(0, 80);
        }

        const parenMatch = txt.match(/^(.+?)\s*\(/);
        if (parenMatch) {
            return parenMatch[1].trim().slice(0, 80);
        }

        return txt.slice(0, 80);
    }

    function extractSecondaryDate(text) {
        const txt = cleanText(text);
        if (!txt) return '';
        const match = txt.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
        return match ? match[1] : '';
    }

    function extractTimesheetInfo() {
        const info = extractGenericInfo('Timesheet');
        const secondary = queryAcrossAccessibleDocuments('.SecondaryTitle', 3);
        if (!secondary) return info;

        info.number = extractSecondaryDate(secondary.textContent).slice(0, 40);
        info.contact = extractSecondaryName(secondary.textContent);
        return info;
    }

    function extractInfo() {
        const p = AES.normalizeHandledPath(AES.pathOf(location.href));
        if (p === '/mvc/inventory/costitem.mvc/shipping') {
            return extractGenericInfo('Shipping');
        }
        if (p === '/timesheets/views/readonly/tmsreadonly_100.asp') {
            return extractTimesheetInfo();
        }
        if (p === '/contracts/views/contractview.asp' || p === '/contracts/views/contractsummary.asp') {
            return extractContractInfo();
        }
        if (p === '/autotask/popups/tickets/recurring_ticket.aspx') {
            return extractRecurringTicketInfo();
        }
        if (p === '/mvc/crm/accountdetail.mvc') {
            return extractAccountInfo();
        }
        if (p === '/mvc/projects/projectdetail.mvc/projectdetail') {
            return extractProjectInfo();
        }
        if (p.includes('/contactdetail') || p.includes('/resourcedetail') || p.includes('/persondetail') || p === '/autotask35/grapevine/profile.aspx') {
            return extractPersonInfo();
        }
        return extractTicketInfo();
    }

    let lastSent = '';
    function reportSelf() {
        if (!AES.isHandledUrl(location.href)) return;
        let info;
        try {
            info = extractInfo();
        } catch (e) {
            console.warn('AES: tab metadata extraction failed', e);
            info = {
                title: cleanText(document.title) || 'Autotask page',
                number: '',
                contact: '',
                primaryResource: null,
            };
        }
        const primaryResource = info.primaryResource || null;
        const priority = info.priority || '';
        const status = info.status || '';
        const lastActivity = info.lastActivity || '';
        const sig = [
            info.title, info.number, info.contact,
            JSON.stringify(primaryResource),
            priority, status, lastActivity,
        ].join('|');
        if (sig === lastSent) return;
        lastSent = sig;
        postToTop({
            type: 'nav',
            url: location.href,
            title: info.title,
            number: info.number,
            contact: info.contact,
            primaryResource: primaryResource,
            priority: priority,
            status: status,
            lastActivity: lastActivity,
        });
    }

    function startWatching() {
        if (!AES.isHandledUrl(location.href)) return;
        reportSelf();
        const obs = new MutationObserver(() => reportSelf());
        obs.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true,
            characterData: true,
        });
        setTimeout(() => obs.disconnect(), 15000);
    }

    // ============================================================
    // Dark mode enhancer for legacy iframe pages
    // ============================================================
    // Every Autotask page that runs inside an iframe is legacy (modern
    // Autotask renders top-level, not iframed). The shell broadcasts
    // { type: 'dark-enhancer', enabled, dark } whenever either setting
    // changes. When both are true, the bridge walks the iframe's DOM and:
    //   1. For every element whose computed background-color is #111b22
    //      → set inline `background-color: #22272B !important`.
    //   2. For every element whose computed color is #a9a9a9
    //      → set inline `color: #f2f3f5 !important`.
    // Walking computed styles (instead of CSS rules / attribute selectors)
    // catches values defined via CSS variables and selectors we'd never
    // be able to enumerate. A MutationObserver re-applies on DOM updates.

    // Surgical color swaps — Autotask's two known dark surfaces map to two
    // different replacement greys so the depth hierarchy (page background
    // vs. cards/tables/grids on top of it) stays visible after the swap.
    //   #111b22 (darker, page/canvas)     -> #090B0D (darker replacement)
    //   #192229 (lighter, elevated card)  -> #1E2227 (lighter replacement)
    const ENHANCER_BG_MAP = {
        'rgb(17, 27, 34)': '#090B0D',
        'rgba(17, 27, 34, 1)': '#090B0D',
        'rgb(25, 34, 41)': '#1E2227',
        'rgba(25, 34, 41, 1)': '#1E2227',
        // Some ticket pages / stale enhanced sessions can already expose the
        // desired canvas color or the previous elevated replacement as their
        // computed value. Normalize those too so ticket pages stay consistent.
        'rgb(9, 11, 13)': '#090B0D',
        'rgba(9, 11, 13, 1)': '#090B0D',
        'rgb(38, 42, 48)': '#1E2227',
        'rgba(38, 42, 48, 1)': '#1E2227',
        'rgb(38, 42, 49)': '#1E2227',
        'rgba(38, 42, 49, 1)': '#1E2227',
    };
    const ENHANCER_FG_TARGET = 'rgb(169, 169, 169)'; // #a9a9a9
    // Used when the legacy threshold pass (white-ish bg → dark surface) fires.
    // No depth signal available there, so all near-white surfaces collapse
    // onto the primary darker background.
    const REPLACEMENT_BG = '#090B0D';
    const REPLACEMENT_FG = '#f2f3f5';
    // Threshold-based pass for very-legacy pages (classic ASP) that have no
    // dark mode at all and rely on the browser's default white background.
    const ENHANCER_BG_LUM_HIGH = 0.7;   // anything brighter is treated as white-ish
    const ENHANCER_FG_LUM_LOW = 0.3;    // anything darker is treated as black-ish text
    const ENHANCER_GRAY_SAT_MAX = 0.35; // saturation above this is considered "color" (preserve)
    const ENHANCER_ROOT_STYLE_ID = 'aes-dark-enhancer-root-style';

    let enhancerObserver = null;
    let enhancerScheduled = false;

    function surgicalBackgroundReplacement(value) {
        if (!value) return null;
        // Computed style returns rgb()/rgba() — normalize whitespace.
        const v = value.replace(/\s+/g, ' ').trim().toLowerCase();
        return Object.prototype.hasOwnProperty.call(ENHANCER_BG_MAP, v)
            ? ENHANCER_BG_MAP[v]
            : null;
    }

    function isExactForegroundMatch(value) {
        if (!value) return false;
        const v = value.replace(/\s+/g, ' ').trim().toLowerCase();
        return v === ENHANCER_FG_TARGET || v === 'rgba(169, 169, 169, 1)';
    }

    function parseEnhancerRgb(value) {
        if (!value) return null;
        const m = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+))?\s*\)/i);
        if (!m) return null;
        return {
            r: +m[1],
            g: +m[2],
            b: +m[3],
            a: m[4] !== undefined ? +m[4] : 1,
        };
    }

    function relativeLuminance(r, g, b) {
        function f(c) {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        }
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    }

    function hslSaturation(r, g, b) {
        const rN = r / 255, gN = g / 255, bN = b / 255;
        const max = Math.max(rN, gN, bN);
        const min = Math.min(rN, gN, bN);
        if (max === min) return 0;
        const l = (max + min) / 2;
        const d = max - min;
        return l > 0.5 ? d / (2 - max - min) : d / (max + min);
    }

    function isLegacyLightBackground(rgb) {
        if (!rgb || rgb.a < 0.5) return false;
        if (hslSaturation(rgb.r, rgb.g, rgb.b) >= ENHANCER_GRAY_SAT_MAX) return false;
        return relativeLuminance(rgb.r, rgb.g, rgb.b) > ENHANCER_BG_LUM_HIGH;
    }

    function isLegacyDarkForeground(rgb) {
        if (!rgb || rgb.a < 0.5) return false;
        if (hslSaturation(rgb.r, rgb.g, rgb.b) >= ENHANCER_GRAY_SAT_MAX) return false;
        return relativeLuminance(rgb.r, rgb.g, rgb.b) < ENHANCER_FG_LUM_LOW;
    }

    function iframeSrc(el) {
        if (!el || el.tagName !== 'IFRAME') return '';
        return el.getAttribute('src') || el.src || '';
    }

    function isExcludedEmbeddedFrame(el) {
        if (!el || el.tagName !== 'IFRAME') return false;
        if (el.classList && el.classList.contains('PrintFriendlyFrame')) return true;
        const src = iframeSrc(el);
        try {
            return !!(src && AES.isExcludedUrl && AES.isExcludedUrl(AES.toAbsoluteUrl(src)));
        } catch (e) {
            return false;
        }
    }

    function clearElementEnhancement(el) {
        if (!el || !el.dataset) return;
        if (el.dataset.aesEnhancerBg === '1') {
            el.style.removeProperty('background-color');
            delete el.dataset.aesEnhancerBg;
        }
        if (el.dataset.aesEnhancerFg === '1') {
            el.style.removeProperty('color');
            delete el.dataset.aesEnhancerFg;
        }
    }

    function ensureRootDarkBackground() {
        // Without an explicit root background, transparent legacy elements
        // show through to the browser default (white). Set html + body to
        // the dark surface so transparent descendants render dark.
        // Also inject overrides for legacy button selectors whose face is
        // painted by a CSS gradient/image (which the JS walker can't see) —
        // force brand-blue background + white text/icon.
        if (document.getElementById(ENHANCER_ROOT_STYLE_ID)) return;
        const BUTTON_BG = '#376A94';
        const BUTTON_BG_HOVER = '#2c567a';
        const BUTTON_BG_ACTIVE = '#24475f';
        const BUTTON_BORDER = '#2c567a';
        const BUTTON_FG = '#ffffff';
        const baseButtonSelectors = [
            // Autotask legacy ASP button anchors
            'a.ImgLink',          // icon + text
            'a.NoImgLink',        // text only
            'a.OnlyImageButton',  // icon only
            'a.Button',
            'a.buttons',          // primary submit-style button (e.g. "Generate")
            'a.btn',
            '.PageButton',
            // Form-element buttons
            'button',
            'input[type="button"]',
            'input[type="submit"]',
            'input[type="reset"]',
        ];
        const buttonSelectors = baseButtonSelectors
            .map(s => 'html.aes-dark-enhancer-active ' + s).join(',\n');
        const buttonHoverSelectors = baseButtonSelectors
            .map(s => 'html.aes-dark-enhancer-active ' + s + ':hover').join(',\n');
        const buttonActiveSelectors = baseButtonSelectors
            .map(s => 'html.aes-dark-enhancer-active ' + s + ':active').join(',\n');
        // Autotask reuses button classes in two contexts where the brand-blue
        // override is wrong:
        //   - `.TabBar > a.Button.ButtonIcon` — visual tabs
        //   - `.ContextOverlay` (dropdown menus, popovers) — menu items
        // Exempt anything descended from those by reverting all our overrides.
        // Higher specificity (extra ancestor class) wins the cascade.
        const EXEMPT_ANCESTOR = ':is(.TabBar, .ContextOverlay)';
        const tabBarResetSelectors = baseButtonSelectors
            .map(s => 'html.aes-dark-enhancer-active ' + EXEMPT_ANCESTOR + ' ' + s).join(',\n');
        const tabBarResetHoverSelectors = baseButtonSelectors
            .map(s => 'html.aes-dark-enhancer-active ' + EXEMPT_ANCESTOR + ' ' + s + ':hover').join(',\n');
        const tabBarResetActiveSelectors = baseButtonSelectors
            .map(s => 'html.aes-dark-enhancer-active ' + EXEMPT_ANCESTOR + ' ' + s + ':active').join(',\n');
        const style = document.createElement('style');
        style.id = ENHANCER_ROOT_STYLE_ID;
        style.textContent = [
            'html.aes-dark-enhancer-active, html.aes-dark-enhancer-active body {',
            '    background-color: ' + REPLACEMENT_BG + ' !important;',
            '}',
            buttonSelectors + ' {',
            '    background-color: ' + BUTTON_BG + ' !important;',
            '    background-image: none !important;',
            '    color: ' + BUTTON_FG + ' !important;',
            '    border: 1px solid ' + BUTTON_BORDER + ' !important;',
            '    border-radius: 6px !important;',
            '    padding: 4px 10px !important;',
            '}',
            // Icon-only buttons get tighter padding so the icon stays centered.
            'html.aes-dark-enhancer-active a.OnlyImageButton {',
            '    padding: 4px 6px !important;',
            '}',
            // Inner label/icon text inside Autotask legacy ASP buttons.
            // The JS walker tagged these with inline `color: #f2f3f5`;
            // bumping to pure white so it sits cleanly on brand blue.
            'html.aes-dark-enhancer-active a.ImgLink .Text,',
            'html.aes-dark-enhancer-active a.NoImgLink .Text,',
            'html.aes-dark-enhancer-active a.OnlyImageButton .Text,',
            'html.aes-dark-enhancer-active a.buttons .Text {',
            '    color: ' + BUTTON_FG + ' !important;',
            '}',
            buttonHoverSelectors + ' {',
            '    background-color: ' + BUTTON_BG_HOVER + ' !important;',
            '    color: ' + BUTTON_FG + ' !important;',
            '}',
            buttonActiveSelectors + ' {',
            '    background-color: ' + BUTTON_BG_ACTIVE + ' !important;',
            '    color: ' + BUTTON_FG + ' !important;',
            '}',
            // TabBar exemption: revert all our button overrides so Autotask's
            // tab styling shows through.
            tabBarResetSelectors + ',\n'
                + tabBarResetHoverSelectors + ',\n'
                + tabBarResetActiveSelectors + ' {',
            '    background-color: revert !important;',
            '    background-image: revert !important;',
            '    color: revert !important;',
            '    border: revert !important;',
            '    border-radius: revert !important;',
            '    padding: revert !important;',
            '}',
            'html.aes-dark-enhancer-active ' + EXEMPT_ANCESTOR + ' a.ImgLink .Text,',
            'html.aes-dark-enhancer-active ' + EXEMPT_ANCESTOR + ' a.NoImgLink .Text,',
            'html.aes-dark-enhancer-active ' + EXEMPT_ANCESTOR + ' a.OnlyImageButton .Text,',
            'html.aes-dark-enhancer-active ' + EXEMPT_ANCESTOR + ' a.buttons .Text,',
            'html.aes-dark-enhancer-active ' + EXEMPT_ANCESTOR + ' a.Button .Text {',
            '    color: revert !important;',
            '}',
        ].join('\n');
        (document.head || document.documentElement).appendChild(style);
        document.documentElement.classList.add('aes-dark-enhancer-active');
    }

    function removeRootDarkBackground() {
        const style = document.getElementById(ENHANCER_ROOT_STYLE_ID);
        if (style) style.remove();
        document.documentElement.classList.remove('aes-dark-enhancer-active');
    }

    function enhanceElement(el) {
        if (!el || el.nodeType !== 1) return;
        const tag = el.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IMG' || tag === 'VIDEO'
            || tag === 'CANVAS' || tag === 'SVG' || tag === 'PICTURE') return;

        if (isExcludedEmbeddedFrame(el)) {
            clearElementEnhancement(el);
            return;
        }

        // Skip Onyx primary action buttons + their descendants. We style
        // these via injectModernButtonStyles() (gated by the Autotask UI
        // Enhancement toggle) so they look brand-blue in both light and
        // dark mode whenever the toggle is on; if the walker tagged them
        // with inline `!important` first, the stylesheet couldn't win the
        // cascade.
        if (el.closest && el.closest('.Button2.ButtonIcon2.NormalBackground')) return;

        const cs = window.getComputedStyle(el);
        const bgValue = cs.backgroundColor;
        const fgValue = cs.color;

        // Background swap. Surgical match wins (mapped per-input so the two
        // known dark surfaces produce slightly different replacement greys
        // and keep their depth hierarchy). Otherwise the threshold pass
        // catches white-ish gray backgrounds on truly-legacy pages.
        // Saturated colors (status pills, brand backgrounds, etc.) preserved.
        if (el.dataset.aesEnhancerBg !== '1') {
            const surgicalBg = surgicalBackgroundReplacement(bgValue);
            const legacyBg = !surgicalBg && isLegacyLightBackground(parseEnhancerRgb(bgValue));
            const replacement = surgicalBg || (legacyBg ? REPLACEMENT_BG : null);
            if (replacement) {
                el.dataset.aesEnhancerBg = '1';
                el.style.setProperty('background-color', replacement, 'important');
            }
        }

        // Foreground swap. Same idea: exact `#a9a9a9` first, then threshold
        // for black/dark-gray text on legacy pages. Brand-blue text + colored
        // status text are preserved by the saturation gate.
        if (el.dataset.aesEnhancerFg !== '1') {
            const surgicalFg = isExactForegroundMatch(fgValue);
            const legacyFg = !surgicalFg && isLegacyDarkForeground(parseEnhancerRgb(fgValue));
            if (surgicalFg || legacyFg) {
                el.dataset.aesEnhancerFg = '1';
                el.style.setProperty('color', REPLACEMENT_FG, 'important');
            }
        }
    }

    function enhanceTree(root) {
        if (!root) return;
        if (root.nodeType === 1) enhanceElement(root);
        if (!root.querySelectorAll) return;
        const all = root.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) enhanceElement(all[i]);
    }

    function scheduleEnhanceTree() {
        if (enhancerScheduled) return;
        enhancerScheduled = true;
        const run = function () {
            enhancerScheduled = false;
            try { enhanceTree(document.body || document.documentElement); }
            catch (e) {}
        };
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(run, { timeout: 200 });
        } else {
            window.requestAnimationFrame(run);
        }
    }

    function removeDarkEnhancerStyle() {
        if (enhancerObserver) {
            try { enhancerObserver.disconnect(); } catch (e) {}
            enhancerObserver = null;
        }
        removeRootDarkBackground();
        const tagged = document.querySelectorAll('[data-aes-enhancer-bg], [data-aes-enhancer-fg]');
        for (let i = 0; i < tagged.length; i++) {
            clearElementEnhancement(tagged[i]);
        }
    }

    function applyDarkEnhancerStyle() {
        if (!document.body) return;
        ensureRootDarkBackground();
        scheduleEnhanceTree();
        if (enhancerObserver) return;
        // Re-enhance only when new nodes are added (grid rows, dialogs, etc.).
        // Watching attribute changes too would create a feedback loop, since
        // our own inline-style writes count as attribute mutations.
        enhancerObserver = new MutationObserver(function (mutations) {
            for (const m of mutations) {
                if (m.addedNodes && m.addedNodes.length) {
                    scheduleEnhanceTree();
                    return;
                }
            }
        });
        enhancerObserver.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    let darkEnhancerEnabled = false;
    let darkEnhancerActiveTheme = false;

    function removeStyleById(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }
    function removeModernButtonStyles() {
        removeStyleById('aes-modern-button-style');
    }
    function removeLegacyChromeOverrides() {
        removeStyleById('aes-legacy-chrome-overrides-style');
    }

    // The "Autotask UI Enhancement" toggle gates three sets of overrides:
    //   1. Always when enabled, regardless of theme:
    //      - Brand-blue legacy/Onyx-style buttons (injectModernButtonStyles)
    //      - Hidden TitleBarNavigation + tightened body padding
    //        (injectLegacyChromeOverrides)
    //   2. Only when enabled AND the effective theme is dark:
    //      - Surgical/threshold dark color swap (applyDarkEnhancerStyle)
    // When the toggle flips off, every override is removed cleanly.
    function syncDarkEnhancer() {
        if (darkEnhancerEnabled) {
            injectModernButtonStyles();
            injectLegacyChromeOverrides();
        } else {
            removeModernButtonStyles();
            removeLegacyChromeOverrides();
        }

        if (darkEnhancerEnabled && darkEnhancerActiveTheme) {
            // Defer to DOMContentLoaded so document.styleSheets is populated
            // and our scan picks up class-based rules.
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', applyDarkEnhancerStyle, { once: true });
            } else {
                applyDarkEnhancerStyle();
            }
        } else {
            removeDarkEnhancerStyle();
        }
    }

    function handleDarkEnhancerMessage(data) {
        darkEnhancerEnabled = !!data.enabled;
        darkEnhancerActiveTheme = !!data.dark;
        syncDarkEnhancer();
    }

    function requestDarkEnhancerState() {
        postToTop({ type: 'dark-enhancer-request' });
    }

    AES.initIframeBridge = function initIframeBridge() {
        window.addEventListener('message', function (event) {
            const data = event.data;

            // Top-shell broadcast for dark mode enhancer state. Coming from
            // the top window, namespaced via AES.MSG_NS.
            if (data && data.__ns === AES.MSG_NS && data.type === 'dark-enhancer') {
                handleDarkEnhancerMessage(data);
                return;
            }

            if (event.source !== window) return;
            if (event.origin !== location.origin) return;
            if (!data || data.__ns !== AES.MSG_NS) return;
            if (data.type === 'open' && data.url && AES.isHandledUrl(data.url)) {
                postToTop({ type: 'open', url: data.url });
            }
            if (data.type === 'map' && data.url) {
                postToTop({ type: 'map', url: data.url });
            }
        }, true);

        injectPageBridge();
        applyShellBarBodyPadding();
        injectScrollbarStyles();
        // injectModernButtonStyles() and injectLegacyChromeOverrides() are
        // gated by the "Autotask UI Enhancement" toggle and applied via
        // syncDarkEnhancer() when the shell broadcasts the current state.
        requestDarkEnhancerState();
        window.setTimeout(requestDarkEnhancerState, 250);
        window.setTimeout(requestDarkEnhancerState, 1000);
        window.setTimeout(requestDarkEnhancerState, 2500);
        startMapButtonEnhancement();

        function armMapOpenFromEvent(event) {
            if (event.target.closest('.InlineIconButton.Map, .InlineIcon.Map')) {
                pendingMapOpenUntil = Date.now() + 5000;
            }
        }

        document.addEventListener('pointerdown', armMapOpenFromEvent, true);
        document.addEventListener('mousedown', armMapOpenFromEvent, true);

        document.addEventListener('click', function (event) {
            armMapOpenFromEvent(event);

            const anchor = event.target.closest('a[href]');
            const anchorTargetUrl = extractAnchorUrl(anchor);
            if (anchorTargetUrl) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                postToTop({ type: 'open', url: anchorTargetUrl });
                return;
            }

            const el = event.target.closest('td[onclick], a[onclick], div[onclick]');
            if (!el) return;
            const onclickText = el.getAttribute('onclick') || '';
            if (!onclickText.includes('NewWindowPage') && !onclickText.includes('window.open')) return;

            const targetUrl = extractUrlFromOnclick(onclickText) || extractWindowOpenUrl(onclickText);
            if (!targetUrl) return;

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            postToTop({ type: 'open', url: AES.toAbsoluteUrl(targetUrl) });
        }, true);

        if (!window.__AESWindowOpenInterceptInstalled) {
            window.__AESWindowOpenInterceptInstalled = true;
            const originalOpen = window.open;
            window.open = function (url, target, features) {
                const targetUrl = url ? AES.toAbsoluteUrl(decodeUrl(String(url))) : '';
                if (targetUrl && (isPendingMapOpen() || isMapUrl(targetUrl))) {
                    pendingMapOpenUntil = 0;
                    postToTop({ type: 'map', url: targetUrl });
                    return createMapWindow(targetUrl);
                }
                if (targetUrl && AES.isHandledUrl(targetUrl)) {
                    postToTop({ type: 'open', url: targetUrl });
                    return null;
                }
                return originalOpen.call(window, url, target, features);
            };
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startWatching, { once: true });
        } else {
            startWatching();
        }
        window.addEventListener('load', reportSelf);

        // Let the top shell know this iframe is about to navigate away, so it
        // can show a loader on the Home tab until the new native page finishes
        // loading. The shell filters these out for our own tab iframes and
        // only surfaces the loader when the source is native Autotask chrome.
        window.addEventListener('beforeunload', function () {
            postToTop({ type: 'nav-start' });
        });

        // Report this iframe's <title> to the top shell. The shell uses it
        // for the Home-tab label when this is the native (non-tab) iframe;
        // for tab iframes the shell ignores the message and relies on the
        // existing 'nav' metadata path. We re-report on title mutations so
        // the Home label tracks the current page's title live.
        let lastReportedTitle = '';
        function postNativeTitle() {
            const title = (document.title || '').trim();
            if (title === lastReportedTitle) return;
            lastReportedTitle = title;
            postToTop({ type: 'native-title', title: title });
        }
        function startNativeTitleWatcher() {
            postNativeTitle();
            const head = document.head;
            if (!head) return;
            const obs = new MutationObserver(postNativeTitle);
            obs.observe(head, { childList: true, subtree: true, characterData: true });
        }
        if (document.head) {
            startNativeTitleWatcher();
        } else {
            document.addEventListener('DOMContentLoaded', startNativeTitleWatcher, { once: true });
        }
        window.addEventListener('load', postNativeTitle);
    };
})();
