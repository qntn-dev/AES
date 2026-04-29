(function () {
    'use strict';

    const AES = window.__AES__;
    if (!AES || AES.isTop || AES.iframeBridgeInitialized) return;
    if (AES.isAllowedHost && !AES.isAllowedHost(location.href)) return;
    AES.iframeBridgeInitialized = true;
    let featureEnabled = !(AES.featuresEnabled && !AES.featuresEnabled());

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
        if (!featureEnabled
            && payload.type !== 'dark-enhancer-request'
            && payload.type !== 'feature-enabled-request'
            && payload.type !== 'timesheet-ui-enhancement-request'
            && payload.type !== 'preferences-ui-enhancement-request'
            && payload.type !== 'workspace-queues-ui-enhancement-request') return;
        try { window.top.postMessage({ __ns: AES.MSG_NS, ...payload }, '*'); }
        catch (e) {}
    }

    function extractHandledNavigationUrlFromEventTarget(target) {
        const anchor = target && target.closest ? target.closest('a[href]') : null;
        const anchorTargetUrl = extractAnchorUrl(anchor);
        if (anchorTargetUrl) return anchorTargetUrl;

        const el = target && target.closest ? target.closest('td[onclick], a[onclick], div[onclick]') : null;
        if (!el) return null;
        const onclickText = el.getAttribute('onclick') || '';
        if (!onclickText.includes('NewWindowPage') && !onclickText.includes('window.open')) return null;

        const targetUrl = extractUrlFromOnclick(onclickText) || extractWindowOpenUrl(onclickText);
        return targetUrl ? AES.toAbsoluteUrl(targetUrl) : null;
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
            'body.FullScroll > .PageHeadingContainer,',
            '.PageHeadingContainer {',
            '    background-color: #ffffff !important;',
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
        script.src = chrome.runtime.getURL('src/aes-page-bridge.js');
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

    // Read the value of a `.ReadOnlyData` quick-edit field whose label matches
    // any of the given names. Used to pull Priority / Status from ticket pages.
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
            // The visible value sits in `.ReadOnlyValueContainer .Value`. The
            // colored ColorBand layout puts the readable label in
            // `.Text.ColorSample`, but plainer fields just have a `.Value` text
            // node; cover both by querying the value container's textContent.
            const valueContainer = data.querySelector('.ReadOnlyValueContainer .Value');
            if (!valueContainer) continue;
            const colorSample = valueContainer.querySelector('.Right .Text.ColorSample');
            const raw = colorSample ? colorSample.textContent : valueContainer.textContent;
            const value = cleanText(raw);
            if (value) return value;
        }
        return '';
    }

    // The ticket activity feed renders newest-first. The first
    // `.ConversationChunk .ConversationItem .Footer .Timestamp` is therefore
    // the most-recent activity timestamp (notes, time entries, attachments).
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
        // Project pages typically have an Organization / Account field linking
        // the project to its customer — surface it as the tab's secondary line
        // so users can tell which client a project belongs to at a glance.
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
        if (p === '/mvc/projects/taskdetail.mvc') {
            return extractGenericInfo('Task');
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
    //   #192229 (lighter, elevated card)  -> #1F2227 (lighter replacement)
    const ENHANCER_BG_MAP = {
        'rgb(17, 27, 34)': '#090B0D',
        'rgba(17, 27, 34, 1)': '#090B0D',
        'rgb(25, 34, 41)': '#1F2227',
        'rgba(25, 34, 41, 1)': '#1F2227',
        // Some ticket pages / stale enhanced sessions can already expose the
        // desired canvas color or the previous elevated replacement as their
        // computed value. Normalize those too so ticket pages stay consistent.
        'rgb(9, 11, 13)': '#090B0D',
        'rgba(9, 11, 13, 1)': '#090B0D',
        'rgb(38, 42, 48)': '#1F2227',
        'rgba(38, 42, 48, 1)': '#1F2227',
        'rgb(38, 42, 49)': '#1F2227',
        'rgba(38, 42, 49, 1)': '#1F2227',
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

    const TIMESHEET_UI_STYLE_ID = 'aes-timesheet-ui-enhancement-style';
    let timesheetUiEnhancementEnabled = false;
    let timesheetUiEnhancementActiveTheme = false;

    function isReadonlyTimesheetFrame() {
        const path = (location.pathname || '').toLowerCase();
        return path.endsWith('/timesheets/views/readonly/tmsreadonly_100.asp')
            || path.endsWith('/timesheets/views/readonly/wrkreadonlyframemid.asp')
            || path.endsWith('/home/timeentry/reportviews/wrktimesheetview.asp');
    }

    function removeTimesheetUiEnhancementStyle() {
        removeStyleById(TIMESHEET_UI_STYLE_ID);
        document.documentElement.classList.remove('aes-timesheet-ui-enhancement-active');
        document.documentElement.classList.remove('aes-timesheet-ui-enhancement-dark');
        document.documentElement.classList.remove('aes-timesheet-ui-enhancement-light');
    }

    function applyTimesheetUiEnhancementTheme() {
        document.documentElement.classList.toggle(
            'aes-timesheet-ui-enhancement-dark',
            !!timesheetUiEnhancementActiveTheme
        );
        document.documentElement.classList.toggle(
            'aes-timesheet-ui-enhancement-light',
            !timesheetUiEnhancementActiveTheme
        );
    }

    function injectTimesheetUiEnhancementStyle() {
        if (!isReadonlyTimesheetFrame()) return;
        document.documentElement.classList.add('aes-timesheet-ui-enhancement-active');
        applyTimesheetUiEnhancementTheme();
        if (document.getElementById(TIMESHEET_UI_STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = TIMESHEET_UI_STYLE_ID;
        style.textContent = [
            'html.aes-timesheet-ui-enhancement-active {',
            '    --aes-ts-canvas: #FFFFFF;',
            '    --aes-ts-panel: #FFFFFF;',
            '    --aes-ts-panel-alt: #F6F7F8;',
            '    --aes-ts-header: #E5E5E5;',
            '    --aes-ts-title: #1F2227;',
            '    --aes-ts-text: #3F464F;',
            '    --aes-ts-muted: #66707A;',
            '    --aes-ts-border: #D9DDE2;',
            '    --aes-ts-grid-border: #E5E5E5;',
            '    --aes-ts-row-border: #E5E5E5;',
            '    --aes-ts-hover: #ECEFF2;',
            '    --aes-ts-menu-hover: #E5E5E5;',
            '    --aes-ts-link: #376A94;',
            '    --aes-ts-link-hover: #24475f;',
            '    --aes-ts-button-bg: #376A94;',
            '    --aes-ts-button-bg-hover: #2c567a;',
            '    --aes-ts-button-bg-active: #24475f;',
            '    --aes-ts-button-border: #2c567a;',
            '    --aes-ts-shadow: 0 12px 28px rgba(31,34,39,0.10);',
            '    --aes-ts-button-shadow: 0 1px 0 rgba(255,255,255,0.25) inset, 0 1px 2px rgba(31,34,39,0.12);',
            '    --aes-ts-input: #FFFFFF;',
            '    --aes-ts-icon-filter: brightness(0) invert(1) opacity(0.92);',
            '}',
            'html.aes-timesheet-ui-enhancement-active.aes-timesheet-ui-enhancement-dark {',
            '    --aes-ts-canvas: #090B0D;',
            '    --aes-ts-panel: #1F2227;',
            '    --aes-ts-panel-alt: #1A1C20;',
            '    --aes-ts-header: #17191D;',
            '    --aes-ts-title: #F2F3F5;',
            '    --aes-ts-text: #DDE1E6;',
            '    --aes-ts-muted: #A9A9A9;',
            '    --aes-ts-border: #48505A;',
            '    --aes-ts-grid-border: #343941;',
            '    --aes-ts-row-border: #2D3138;',
            '    --aes-ts-hover: #2A2F36;',
            '    --aes-ts-menu-hover: #2A2F36;',
            '    --aes-ts-link: #7DB8EA;',
            '    --aes-ts-link-hover: #A9D7FF;',
            '    --aes-ts-button-bg: #376A94;',
            '    --aes-ts-button-bg-hover: #2c567a;',
            '    --aes-ts-button-bg-active: #24475f;',
            '    --aes-ts-button-border: #2c567a;',
            '    --aes-ts-shadow: 0 12px 28px rgba(0,0,0,0.22);',
            '    --aes-ts-button-shadow: 0 1px 0 rgba(255,255,255,0.08) inset;',
            '    --aes-ts-input: #17191D;',
            '    --aes-ts-icon-filter: brightness(0) invert(1) opacity(0.92);',
            '}',
            'html.aes-timesheet-ui-enhancement-active,',
            'html.aes-timesheet-ui-enhancement-active body {',
            '    background: var(--aes-ts-canvas) !important;',
            '    color: var(--aes-ts-text) !important;',
            '    font-family: Roboto, Arial, Helvetica, Tahoma, sans-serif !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active iframe {',
            '    display: block !important;',
            '    border: 0 !important;',
            '    background: var(--aes-ts-canvas) !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active .HeaderRow {',
            '    height: 36px !important;',
            '    margin: 0 0 6px !important;',
            '    padding-left: 12px !important;',
            '    box-sizing: border-box !important;',
            '    background: var(--aes-ts-canvas) !important;',
            '    border-bottom: 1px solid var(--aes-ts-row-border) !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active .HeaderRow tr {',
            '    height: 36px !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active .HeaderRow span {',
            '    top: 8px !important;',
            '    width: calc(100% - 24px) !important;',
            '    color: var(--aes-ts-title) !important;',
            '    font-size: 14px !important;',
            '    font-weight: 800 !important;',
            '    letter-spacing: 0.01em !important;',
            '    text-transform: none !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active .HeaderRow .SecondaryTitle {',
            '    color: var(--aes-ts-muted) !important;',
            '    font-weight: 500 !important;',
            '    text-transform: none !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active .ButtonBar {',
            '    background: var(--aes-ts-canvas) !important;',
            '    padding: 0 12px 6px !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active .ButtonBar ul {',
            '    display: flex !important;',
            '    align-items: center !important;',
            '    gap: 6px !important;',
            '    height: 30px !important;',
            '    overflow: hidden !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active .ButtonBar ul li {',
            '    float: none !important;',
            '    margin: 0 !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active .ButtonBar ul li a,',
            'html.aes-timesheet-ui-enhancement-active .ButtonBar ul li a:visited {',
            '    display: inline-flex !important;',
            '    align-items: center !important;',
            '    justify-content: center !important;',
            '    gap: 5px !important;',
            '    height: 28px !important;',
            '    min-height: 28px !important;',
            '    padding: 5px 16px !important;',
            '    box-sizing: border-box !important;',
            '    border-radius: 6px !important;',
            '    background-color: var(--aes-ts-button-bg) !important;',
            '    background-image: none !important;',
            '    border: 1px solid var(--aes-ts-button-border) !important;',
            '    color: #FFFFFF !important;',
            '    box-shadow: var(--aes-ts-button-shadow) !important;',
            '    transition: background-color 150ms ease, transform 150ms ease, box-shadow 150ms ease !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active .ButtonBar ul li a:hover {',
            '    background-color: var(--aes-ts-button-bg-hover) !important;',
            '    color: #FFFFFF !important;',
            '    transform: translateY(-1px) !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active .ButtonBar ul li a:active,',
            'html.aes-timesheet-ui-enhancement-active .ButtonBar ul li a.SelectedState {',
            '    background-color: var(--aes-ts-button-bg-active) !important;',
            '    color: #FFFFFF !important;',
            '    transform: translateY(0) !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active .ButtonBar ul li a span.Text {',
            '    color: #FFFFFF !important;',
            '    font-weight: 800 !important;',
            '    line-height: 1 !important;',
            '    padding: 0 !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active .ButtonBar img {',
            '    filter: var(--aes-ts-icon-filter) !important;',
            '    margin: 0 !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active .DropDownMenu {',
            '    background: var(--aes-ts-panel) !important;',
            '    border: 1px solid var(--aes-ts-border) !important;',
            '    border-radius: 12px !important;',
            '    padding: 8px !important;',
            '    box-shadow: var(--aes-ts-shadow) !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active .DropDownMenuItemText,',
            'html.aes-timesheet-ui-enhancement-active .DropDownMenuItemThirdColumn,',
            'html.aes-timesheet-ui-enhancement-active .DropDownMenuItemTextHighlight,',
            'html.aes-timesheet-ui-enhancement-active .DropDownMenuItemThirdColumnHighlight {',
            '    color: var(--aes-ts-text) !important;',
            '    background: transparent !important;',
            '    border-radius: 7px !important;',
            '    padding: 7px 12px !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active .DropDownMenuItemHighlight .DropDownMenuItemTextHighlight,',
            'html.aes-timesheet-ui-enhancement-active .DropDownMenuItem:hover .DropDownMenuItemText {',
            '    background: var(--aes-ts-menu-hover) !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active body > div:first-child {',
            '    margin: 0 12px 8px !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active .SubTitle {',
            '    color: var(--aes-ts-title) !important;',
            '    font-size: 14px !important;',
            '    font-weight: 800 !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active input[type="checkbox"] {',
            '    accent-color: #376A94 !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active .SearchResultContainer {',
            '    margin: 0 12px 12px !important;',
            '    border: 0 !important;',
            '    background: transparent !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active .grid.GridContainer {',
            '    margin: 0 !important;',
            '    background: var(--aes-ts-panel) !important;',
            '    border: 1px solid var(--aes-ts-border) !important;',
            '    border-radius: 12px !important;',
            '    overflow: hidden !important;',
            '    box-shadow: var(--aes-ts-shadow) !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active #listTable {',
            '    width: 100% !important;',
            '    background: var(--aes-ts-panel) !important;',
            '    border: 0 !important;',
            '    border-collapse: separate !important;',
            '    border-spacing: 0 !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active #listTable thead {',
            '    background: var(--aes-ts-header) !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active #listTable thead td {',
            '    position: sticky !important;',
            '    top: 0 !important;',
            '    z-index: 2 !important;',
            '    background: var(--aes-ts-header) !important;',
            '    color: var(--aes-ts-title) !important;',
            '    border: 0 !important;',
            '    border-bottom: 1px solid var(--aes-ts-border) !important;',
            '    padding: 8px 9px !important;',
            '    font-size: 12px !important;',
            '    font-weight: 800 !important;',
            '    line-height: 1.25 !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active #listTable tbody td,',
            'html.aes-timesheet-ui-enhancement-active #listTable tfoot td {',
            '    background: var(--aes-ts-panel) !important;',
            '    color: var(--aes-ts-text) !important;',
            '    border: 0 !important;',
            '    border-left: 1px solid var(--aes-ts-grid-border) !important;',
            '    border-bottom: 1px solid var(--aes-ts-row-border) !important;',
            '    padding: 8px 9px !important;',
            '    line-height: 1.35 !important;',
            '    vertical-align: top !important;',
            '    transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active #listTable tbody tr td:first-child,',
            'html.aes-timesheet-ui-enhancement-active #listTable tfoot tr td:first-child {',
            '    border-left: 0 !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active #listTable tbody tr:nth-child(even) td {',
            '    background: var(--aes-ts-panel-alt) !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active #listTable tbody tr:hover td {',
            '    background: var(--aes-ts-hover) !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active #TotalRow td,',
            'html.aes-timesheet-ui-enhancement-active #LastRow td {',
            '    background: var(--aes-ts-header) !important;',
            '    color: var(--aes-ts-title) !important;',
            '    font-weight: 800 !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active #listTable a {',
            '    color: var(--aes-ts-link) !important;',
            '    font-weight: 800 !important;',
            '    text-decoration: none !important;',
            '    border-bottom: 1px solid rgba(125,184,234,0.35) !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active #listTable a:hover {',
            '    color: var(--aes-ts-link-hover) !important;',
            '    border-bottom-color: rgba(169,215,255,0.75) !important;',
            '}',
            'html.aes-timesheet-ui-enhancement-active textarea,',
            'html.aes-timesheet-ui-enhancement-active input[type="text"],',
            'html.aes-timesheet-ui-enhancement-active select {',
            '    background: var(--aes-ts-input) !important;',
            '    color: var(--aes-ts-text) !important;',
            '    border: 1px solid var(--aes-ts-border) !important;',
            '    border-radius: 8px !important;',
            '}',
        ].join('\n');
        function attach() {
            (document.head || document.documentElement).appendChild(style);
        }
        if (document.head || document.documentElement) attach();
        else document.addEventListener('DOMContentLoaded', attach, { once: true });
    }

    function syncTimesheetUiEnhancement() {
        if (timesheetUiEnhancementEnabled && isReadonlyTimesheetFrame()) {
            injectTimesheetUiEnhancementStyle();
        } else {
            removeTimesheetUiEnhancementStyle();
        }
    }

    function handleTimesheetUiEnhancementMessage(data) {
        timesheetUiEnhancementEnabled = !!data.enabled;
        timesheetUiEnhancementActiveTheme = !!data.dark;
        syncTimesheetUiEnhancement();
    }

    function requestTimesheetUiEnhancementState() {
        postToTop({ type: 'timesheet-ui-enhancement-request' });
    }

    const PREFERENCES_UI_STYLE_ID = 'aes-preferences-ui-enhancement-style';
    const PREFERENCES_UI_STYLE_ATTR = 'data-aes-preferences-ui-style';
    const PREFERENCES_UI_STYLE_PROPS = [
        'background-color',
        'color',
        'border',
        'border-color',
        'border-bottom',
        'border-radius',
        'box-shadow',
        'padding',
        'margin',
        'opacity',
    ];
    let preferencesUiEnhancementEnabled = false;
    let preferencesUiEnhancementActiveTheme = false;
    let preferencesUiObserver = null;
    let preferencesUiInlineScheduled = false;

    function isPreferencesFrame() {
        const path = (location.pathname || '').toLowerCase();
        return path === '/mvc/user/preferences.mvc/index'
            || path.endsWith('/mvc/user/preferences.mvc/index');
    }

    function preferencesUiPalette() {
        if (preferencesUiEnhancementActiveTheme) {
            return {
                canvas: '#090B0D',
                panel: '#1F2227',
                panelAlt: '#17191D',
                elevated: '#24282E',
                input: '#17191D',
                inputMuted: '#343941',
                text: '#F2F3F5',
                title: '#FFFFFF',
                muted: '#A9A9A9',
                border: '#48505A',
                borderSubtle: '#343941',
                hover: '#2A2F36',
                selected: '#2D3138',
                primary: '#376A94',
                primaryHover: '#2c567a',
                primaryActive: '#24475f',
                shadow: '0 14px 30px rgba(0,0,0,0.24)',
                overlayShadow: '0 18px 42px rgba(0,0,0,0.34)',
                buttonShadow: '0 1px 0 rgba(255,255,255,0.08) inset',
            };
        }

        return {
            canvas: '#FFFFFF',
            panel: '#FFFFFF',
            panelAlt: '#F6F7F8',
            elevated: '#FFFFFF',
            input: '#FFFFFF',
            inputMuted: '#F1F3F5',
            text: '#1F2227',
            title: '#1F2227',
            muted: '#66707A',
            border: '#D9DDE2',
            borderSubtle: '#E5E5E5',
            hover: '#ECEFF2',
            selected: '#E5E5E5',
            primary: '#376A94',
            primaryHover: '#2c567a',
            primaryActive: '#24475f',
            shadow: '0 14px 30px rgba(31,34,39,0.10)',
            overlayShadow: '0 18px 42px rgba(31,34,39,0.18)',
            buttonShadow: '0 1px 0 rgba(255,255,255,0.35) inset, 0 1px 2px rgba(31,34,39,0.10)',
        };
    }

    function preferencesUiStyleToken(prop) {
        return prop.replace(/[^a-z0-9]+/gi, '-');
    }

    function setPreferencesUiStyle(el, prop, value) {
        if (!el || !el.style) return;
        const token = preferencesUiStyleToken(prop);
        const valueAttr = 'data-aes-preferences-prev-' + token;
        const priorityAttr = valueAttr + '-priority';
        if (!el.hasAttribute(valueAttr)) {
            el.setAttribute(valueAttr, el.style.getPropertyValue(prop) || '');
            el.setAttribute(priorityAttr, el.style.getPropertyPriority(prop) || '');
        }
        el.setAttribute(PREFERENCES_UI_STYLE_ATTR, '1');
        el.style.setProperty(prop, value, 'important');
    }

    function restorePreferencesUiInlineStyles() {
        const elements = document.querySelectorAll('[' + PREFERENCES_UI_STYLE_ATTR + ']');
        elements.forEach(function (el) {
            PREFERENCES_UI_STYLE_PROPS.forEach(function (prop) {
                const token = preferencesUiStyleToken(prop);
                const valueAttr = 'data-aes-preferences-prev-' + token;
                const priorityAttr = valueAttr + '-priority';
                if (!el.hasAttribute(valueAttr)) return;
                const previous = el.getAttribute(valueAttr) || '';
                const priority = el.getAttribute(priorityAttr) || '';
                if (previous) el.style.setProperty(prop, previous, priority);
                else el.style.removeProperty(prop);
                el.removeAttribute(valueAttr);
                el.removeAttribute(priorityAttr);
            });
            el.removeAttribute(PREFERENCES_UI_STYLE_ATTR);
        });
    }

    function paintPreferencesUi(selector, styles) {
        document.querySelectorAll(selector).forEach(function (el) {
            Object.keys(styles).forEach(function (prop) {
                setPreferencesUiStyle(el, prop, styles[prop]);
            });
        });
    }

    function removePreferencesUiEnhancementStyle() {
        removeStyleById(PREFERENCES_UI_STYLE_ID);
        document.documentElement.classList.remove('aes-preferences-ui-enhancement-active');
        document.documentElement.classList.remove('aes-preferences-ui-enhancement-dark');
        document.documentElement.classList.remove('aes-preferences-ui-enhancement-light');
        if (preferencesUiObserver) {
            preferencesUiObserver.disconnect();
            preferencesUiObserver = null;
        }
        preferencesUiInlineScheduled = false;
        restorePreferencesUiInlineStyles();
    }

    function applyPreferencesUiEnhancementTheme() {
        document.documentElement.classList.toggle(
            'aes-preferences-ui-enhancement-dark',
            !!preferencesUiEnhancementActiveTheme
        );
        document.documentElement.classList.toggle(
            'aes-preferences-ui-enhancement-light',
            !preferencesUiEnhancementActiveTheme
        );
    }

    function injectPreferencesUiEnhancementStyle() {
        if (!isPreferencesFrame()) return;
        document.documentElement.classList.add('aes-preferences-ui-enhancement-active');
        applyPreferencesUiEnhancementTheme();
        if (document.getElementById(PREFERENCES_UI_STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = PREFERENCES_UI_STYLE_ID;
        style.textContent = [
            'html.aes-preferences-ui-enhancement-active {',
            '    --aes-pref-canvas: #FFFFFF;',
            '    --aes-pref-panel: #FFFFFF;',
            '    --aes-pref-panel-alt: #F6F7F8;',
            '    --aes-pref-elevated: #FFFFFF;',
            '    --aes-pref-input: #FFFFFF;',
            '    --aes-pref-input-muted: #F1F3F5;',
            '    --aes-pref-title: #1F2227;',
            '    --aes-pref-text: #1F2227;',
            '    --aes-pref-muted: #66707A;',
            '    --aes-pref-border: #D9DDE2;',
            '    --aes-pref-border-subtle: #E5E5E5;',
            '    --aes-pref-hover: #ECEFF2;',
            '    --aes-pref-selected: #E5E5E5;',
            '    --aes-pref-primary: #376A94;',
            '    --aes-pref-primary-hover: #2c567a;',
            '    --aes-pref-primary-active: #24475f;',
            '    --aes-pref-shadow: 0 14px 30px rgba(31,34,39,0.10);',
            '    --aes-pref-overlay-shadow: 0 18px 42px rgba(31,34,39,0.18);',
            '    --aes-pref-button-shadow: 0 1px 0 rgba(255,255,255,0.35) inset, 0 1px 2px rgba(31,34,39,0.10);',
            '}',
            'html.aes-preferences-ui-enhancement-active.aes-preferences-ui-enhancement-dark {',
            '    --aes-pref-canvas: #090B0D;',
            '    --aes-pref-panel: #1F2227;',
            '    --aes-pref-panel-alt: #17191D;',
            '    --aes-pref-elevated: #24282E;',
            '    --aes-pref-input: #17191D;',
            '    --aes-pref-input-muted: #343941;',
            '    --aes-pref-title: #FFFFFF;',
            '    --aes-pref-text: #F2F3F5;',
            '    --aes-pref-muted: #A9A9A9;',
            '    --aes-pref-border: #48505A;',
            '    --aes-pref-border-subtle: #343941;',
            '    --aes-pref-hover: #2A2F36;',
            '    --aes-pref-selected: #2D3138;',
            '    --aes-pref-shadow: 0 14px 30px rgba(0,0,0,0.24);',
            '    --aes-pref-overlay-shadow: 0 18px 42px rgba(0,0,0,0.34);',
            '    --aes-pref-button-shadow: 0 1px 0 rgba(255,255,255,0.08) inset;',
            '}',
            'html.aes-preferences-ui-enhancement-active,',
            'html.aes-preferences-ui-enhancement-active body {',
            '    background: var(--aes-pref-canvas) !important;',
            '    color: var(--aes-pref-text) !important;',
            '    font-family: Roboto, Arial, Helvetica, Tahoma, sans-serif !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .PageContentContainer,',
            'html.aes-preferences-ui-enhancement-active .PageHeadingContainer,',
            'html.aes-preferences-ui-enhancement-active .TabbedContentContainer,',
            'html.aes-preferences-ui-enhancement-active .ScrollingContentContainer,',
            'html.aes-preferences-ui-enhancement-active .ScrollingContainer {',
            '    background: var(--aes-pref-canvas) !important;',
            '    color: var(--aes-pref-text) !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .PageHeadingContainer {',
            '    padding: 8px 10px 0 !important;',
            '    box-sizing: border-box !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .TabBar {',
            '    display: flex !important;',
            '    align-items: center !important;',
            '    gap: 8px !important;',
            '    height: auto !important;',
            '    margin: 0 0 12px !important;',
            '    padding: 0 !important;',
            '    border-bottom: 1px solid var(--aes-pref-border-subtle) !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .TabBar a.Button.ButtonIcon {',
            '    display: inline-flex !important;',
            '    align-items: center !important;',
            '    justify-content: center !important;',
            '    height: 34px !important;',
            '    min-height: 34px !important;',
            '    padding: 0 14px !important;',
            '    margin: 0 !important;',
            '    border: 1px solid transparent !important;',
            '    border-radius: 10px 10px 0 0 !important;',
            '    background: transparent !important;',
            '    color: var(--aes-pref-muted) !important;',
            '    box-shadow: none !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .TabBar a.Button.ButtonIcon.SelectedState {',
            '    background: var(--aes-pref-panel) !important;',
            '    border-color: var(--aes-pref-border-subtle) !important;',
            '    border-bottom-color: var(--aes-pref-panel) !important;',
            '    color: var(--aes-pref-title) !important;',
            '    transform: translateY(1px) !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .TabBar a.Button.ButtonIcon:hover {',
            '    background: var(--aes-pref-hover) !important;',
            '    color: var(--aes-pref-title) !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .TabBar .Text {',
            '    color: currentColor !important;',
            '    font-size: 12px !important;',
            '    font-weight: 800 !important;',
            '    line-height: 1 !important;',
            '    padding: 0 !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .TabHeadingContainer {',
            '    height: auto !important;',
            '    padding: 0 10px 10px !important;',
            '    box-sizing: border-box !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .ToolBar {',
            '    display: flex !important;',
            '    align-items: center !important;',
            '    gap: 8px !important;',
            '    min-height: 34px !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .ToolBarItem {',
            '    margin: 0 !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .ToolBar .Button2.NormalBackground:not(.ButtonIcon2) {',
            '    display: inline-flex !important;',
            '    align-items: center !important;',
            '    justify-content: center !important;',
            '    height: 32px !important;',
            '    min-height: 32px !important;',
            '    padding: 0 14px !important;',
            '    border: 1px solid var(--aes-pref-border) !important;',
            '    border-radius: 6px !important;',
            '    background: var(--aes-pref-panel-alt) !important;',
            '    color: var(--aes-pref-text) !important;',
            '    box-shadow: var(--aes-pref-button-shadow) !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .ToolBar .Button2.NormalBackground:not(.ButtonIcon2):hover,',
            'html.aes-preferences-ui-enhancement-active .ToolBar .Button2.NormalBackground:not(.ButtonIcon2).HoverBackground {',
            '    background: var(--aes-pref-hover) !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .ToolBar .Button2.Disabled2 {',
            '    opacity: 0.58 !important;',
            '    cursor: default !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .ToolBar .Button2.NormalBackground:not(.ButtonIcon2) .Text2 {',
            '    color: var(--aes-pref-text) !important;',
            '    font-size: 12px !important;',
            '    font-weight: 800 !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .ScrollingContainer {',
            '    padding: 0 12px 18px !important;',
            '    box-sizing: border-box !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .Normal.Section {',
            '    overflow: hidden !important;',
            '    background: var(--aes-pref-panel) !important;',
            '    border: 1px solid var(--aes-pref-border-subtle) !important;',
            '    border-radius: 14px !important;',
            '    padding: 0 !important;',
            '    margin: 0 0 14px !important;',
            '    box-shadow: var(--aes-pref-shadow) !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .Normal.Section > .CollapsibleSectionContainer > .HeadingContainer {',
            '    background: var(--aes-pref-panel-alt) !important;',
            '    border-bottom: 1px solid var(--aes-pref-border-subtle) !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .Normal.Section > .CollapsibleSectionContainer > .HeadingContainer .Heading {',
            '    min-height: 38px !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .Normal.Section > .CollapsibleSectionContainer > .HeadingContainer .Text .PrimaryText {',
            '    color: var(--aes-pref-title) !important;',
            '    font-size: 13px !important;',
            '    font-weight: 900 !important;',
            '    letter-spacing: 0.01em !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .Normal.Section > .CollapsibleSectionContainer > .ContentContainer > .Content {',
            '    padding: 16px 28px 20px !important;',
            '    box-sizing: border-box !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .EditorLabelContainer1 {',
            '    margin-bottom: 6px !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .LabelContainer1 .PrimaryText,',
            'html.aes-preferences-ui-enhancement-active .Paragraph {',
            '    color: var(--aes-pref-text) !important;',
            '    font-size: 12px !important;',
            '    font-weight: 700 !important;',
            '    line-height: 1.35 !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .Paragraph {',
            '    color: var(--aes-pref-muted) !important;',
            '    font-weight: 600 !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .SingleItemSelector2 > .ContentContainer {',
            '    background: var(--aes-pref-input) !important;',
            '    border: 1px solid var(--aes-pref-border) !important;',
            '    border-radius: 8px !important;',
            '    box-shadow: none !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .SingleItemSelector2 .SelectionDisplay {',
            '    background: var(--aes-pref-input) !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .SingleItemSelector2 .TargetPreview,',
            'html.aes-preferences-ui-enhancement-active .SingleItemSelector2 .SelectionDisplay .Text,',
            'html.aes-preferences-ui-enhancement-active .SingleItemSelector2 .SelectionDisplay span,',
            'html.aes-preferences-ui-enhancement-active .SingleItemSelector2 input[type="text"] {',
            '    color: var(--aes-pref-text) !important;',
            '    font-size: 12px !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .SingleItemSelector2 .Triangle {',
            '    border-left: 1px solid var(--aes-pref-border-subtle) !important;',
            '    background: var(--aes-pref-panel-alt) !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .ContextOverlay.SingleItemSelectorDropDownOverlay {',
            '    background: var(--aes-pref-panel) !important;',
            '    border: 1px solid var(--aes-pref-border) !important;',
            '    border-radius: 12px !important;',
            '    padding: 6px !important;',
            '    box-shadow: var(--aes-pref-overlay-shadow) !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .ContextOverlay.SingleItemSelectorDropDownOverlay .Item {',
            '    border-radius: 8px !important;',
            '    color: var(--aes-pref-text) !important;',
            '    padding: 6px 8px !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .ContextOverlay.SingleItemSelectorDropDownOverlay .Item:hover,',
            'html.aes-preferences-ui-enhancement-active .ContextOverlay.SingleItemSelectorDropDownOverlay .Item[data-is-targeted="true"] {',
            '    background: var(--aes-pref-hover) !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .ContextOverlay.SingleItemSelectorDropDownOverlay .Item[data-is-selected="true"] {',
            '    background: var(--aes-pref-selected) !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .ContextOverlay.SingleItemSelectorDropDownOverlay .Text,',
            'html.aes-preferences-ui-enhancement-active .ContextOverlay.SingleItemSelectorDropDownOverlay span {',
            '    color: var(--aes-pref-text) !important;',
            '    font-size: 12px !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .Checkbox2 .TabIndexHack,',
            'html.aes-preferences-ui-enhancement-active .RadioButton .TabIndexHack.RadioButtonItem {',
            '    box-sizing: border-box !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .Checkbox2 .TabIndexHack.Unchecked {',
            '    background: var(--aes-pref-input) !important;',
            '    border: 1px solid var(--aes-pref-border) !important;',
            '    border-radius: 3px !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .Checkbox2 .TabIndexHack.Checked {',
            '    background: var(--aes-pref-primary) !important;',
            '    border: 1px solid var(--aes-pref-primary) !important;',
            '    border-radius: 3px !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .Checkbox2 .Checkmark path {',
            '    fill: #FFFFFF !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .RadioButton .TabIndexHack.RadioButtonItem {',
            '    border: 1px solid var(--aes-pref-border) !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .RadioButton .TabIndexHack.RadioButtonItem.Selected {',
            '    border-color: var(--aes-pref-primary) !important;',
            '}',
            'html.aes-preferences-ui-enhancement-active .RadioButton .TabIndexHack.RadioButtonItem.Selected .Fill {',
            '    background: var(--aes-pref-primary) !important;',
            '}',
        ].join('\n');
        function attach() {
            (document.head || document.documentElement).appendChild(style);
        }
        if (document.head || document.documentElement) attach();
        else document.addEventListener('DOMContentLoaded', attach, { once: true });
    }

    function applyPreferencesUiInlineStyles() {
        if (!preferencesUiEnhancementEnabled || !isPreferencesFrame()) return;
        const palette = preferencesUiPalette();

        paintPreferencesUi('html, body, .PageContentContainer, .PageHeadingContainer, .TabbedContentContainer, .ScrollingContentContainer, .ScrollingContainer', {
            'background-color': palette.canvas,
            color: palette.text,
        });
        paintPreferencesUi('.Normal.Section', {
            'background-color': palette.panel,
            color: palette.text,
            border: '1px solid ' + palette.borderSubtle,
            'border-radius': '14px',
            padding: '0',
            margin: '0 0 14px',
            'box-shadow': palette.shadow,
        });
        paintPreferencesUi('.Normal.Section > .CollapsibleSectionContainer > .HeadingContainer', {
            'background-color': palette.panelAlt,
            'border-bottom': '1px solid ' + palette.borderSubtle,
        });
        paintPreferencesUi('.Normal.Section > .CollapsibleSectionContainer > .ContentContainer', {
            'background-color': palette.panel,
            color: palette.text,
        });
        paintPreferencesUi('.SingleItemSelector2 > .ContentContainer', {
            'background-color': palette.input,
            color: palette.text,
            border: '1px solid ' + palette.border,
            'border-radius': '8px',
            'box-shadow': 'none',
        });
        paintPreferencesUi('.SingleItemSelector2 .SelectionDisplay', {
            'background-color': palette.input,
            color: palette.text,
        });
        paintPreferencesUi('.ContextOverlay.SingleItemSelectorDropDownOverlay', {
            'background-color': palette.panel,
            color: palette.text,
            border: '1px solid ' + palette.border,
            'border-radius': '12px',
            padding: '6px',
            'box-shadow': palette.overlayShadow,
        });
        paintPreferencesUi('.ToolBar .Button2.NormalBackground:not(.ButtonIcon2)', {
            'background-color': palette.panelAlt,
            color: palette.text,
            border: '1px solid ' + palette.border,
            'border-radius': '6px',
            'box-shadow': palette.buttonShadow,
        });
        paintPreferencesUi('.ToolBar .Button2.NormalBackground:not(.ButtonIcon2) .Text2', {
            color: palette.text,
        });
        paintPreferencesUi('.ToolBar .Button2.Disabled2', {
            opacity: '0.58',
        });
        paintPreferencesUi('.Checkbox2 .TabIndexHack.Unchecked', {
            'background-color': palette.input,
            border: '1px solid ' + palette.border,
            'border-radius': '3px',
        });
        paintPreferencesUi('.Checkbox2 .TabIndexHack.Checked', {
            'background-color': palette.primary,
            border: '1px solid ' + palette.primary,
            'border-radius': '3px',
        });
        paintPreferencesUi('.RadioButton .TabIndexHack.RadioButtonItem', {
            border: '1px solid ' + palette.border,
        });
        paintPreferencesUi('.RadioButton .TabIndexHack.RadioButtonItem.Selected', {
            border: '1px solid ' + palette.primary,
        });
    }

    function schedulePreferencesUiInlineStyles() {
        if (preferencesUiInlineScheduled) return;
        preferencesUiInlineScheduled = true;
        const run = function () {
            preferencesUiInlineScheduled = false;
            applyPreferencesUiInlineStyles();
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', run, { once: true });
            return;
        }
        const raf = window.requestAnimationFrame || function (callback) { return window.setTimeout(callback, 16); };
        raf(run);
    }

    function startPreferencesUiObserver() {
        if (preferencesUiObserver || !document.body || !window.MutationObserver) return;
        preferencesUiObserver = new MutationObserver(function () {
            schedulePreferencesUiInlineStyles();
        });
        preferencesUiObserver.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    function syncPreferencesUiEnhancement() {
        if (preferencesUiEnhancementEnabled && isPreferencesFrame()) {
            injectPreferencesUiEnhancementStyle();
            schedulePreferencesUiInlineStyles();
            if (document.body) startPreferencesUiObserver();
            else document.addEventListener('DOMContentLoaded', startPreferencesUiObserver, { once: true });
        } else {
            removePreferencesUiEnhancementStyle();
        }
    }

    function handlePreferencesUiEnhancementMessage(data) {
        preferencesUiEnhancementEnabled = !!data.enabled;
        preferencesUiEnhancementActiveTheme = !!data.dark;
        syncPreferencesUiEnhancement();
    }

    function requestPreferencesUiEnhancementState() {
        postToTop({ type: 'preferences-ui-enhancement-request' });
    }

    const WORKSPACE_QUEUES_UI_STYLE_ID = 'aes-workspace-queues-ui-enhancement-style';
    const WORKSPACE_QUEUES_UI_STYLE_ATTR = 'data-aes-workspace-queues-ui-style';
    const WORKSPACE_QUEUES_UI_STYLE_PROPS = [
        'background-color',
        'color',
        'border',
        'border-color',
        'border-radius',
        'box-shadow',
        'padding',
        'margin',
    ];
    let workspaceQueuesUiEnhancementEnabled = false;
    let workspaceQueuesUiEnhancementActiveTheme = false;
    let workspaceQueuesUiObserver = null;
    let workspaceQueuesUiInlineScheduled = false;

    function isWorkspaceQueuesFrame() {
        const path = (location.pathname || '').toLowerCase();
        return path === '/mvc/servicedesk/myworkspaceandqueuestickets.mvc/summary'
            || path.endsWith('/mvc/servicedesk/myworkspaceandqueuestickets.mvc/summary');
    }

    function workspaceQueuesUiPalette() {
        if (workspaceQueuesUiEnhancementActiveTheme) {
            return {
                canvas: '#090B0D',
                panel: '#1F2227',
                panelAlt: '#17191D',
                elevated: '#24282E',
                text: '#F2F3F5',
                title: '#FFFFFF',
                muted: '#A9A9A9',
                border: '#48505A',
                borderSubtle: '#343941',
                hover: '#2A2F36',
                selected: '#2D3138',
                input: '#17191D',
                shadow: '0 14px 30px rgba(0,0,0,0.24)',
                overlayShadow: '0 18px 42px rgba(0,0,0,0.34)',
            };
        }

        return {
            canvas: '#FFFFFF',
            panel: '#FFFFFF',
            panelAlt: '#F6F7F8',
            elevated: '#FFFFFF',
            text: '#1F2227',
            title: '#1F2227',
            muted: '#66707A',
            border: '#D9DDE2',
            borderSubtle: '#E5E5E5',
            hover: '#ECEFF2',
            selected: '#E5E5E5',
            input: '#FFFFFF',
            shadow: '0 14px 30px rgba(31,34,39,0.10)',
            overlayShadow: '0 18px 42px rgba(31,34,39,0.18)',
        };
    }

    function workspaceQueuesUiStyleToken(prop) {
        return prop.replace(/[^a-z0-9]+/gi, '-');
    }

    function setWorkspaceQueuesUiStyle(el, prop, value) {
        if (!el || !el.style) return;
        const token = workspaceQueuesUiStyleToken(prop);
        const valueAttr = 'data-aes-workspace-queues-prev-' + token;
        const priorityAttr = valueAttr + '-priority';
        if (!el.hasAttribute(valueAttr)) {
            el.setAttribute(valueAttr, el.style.getPropertyValue(prop) || '');
            el.setAttribute(priorityAttr, el.style.getPropertyPriority(prop) || '');
        }
        el.setAttribute(WORKSPACE_QUEUES_UI_STYLE_ATTR, '1');
        el.style.setProperty(prop, value, 'important');
    }

    function restoreWorkspaceQueuesUiInlineStyles() {
        document.querySelectorAll('[' + WORKSPACE_QUEUES_UI_STYLE_ATTR + ']').forEach(function (el) {
            WORKSPACE_QUEUES_UI_STYLE_PROPS.forEach(function (prop) {
                const token = workspaceQueuesUiStyleToken(prop);
                const valueAttr = 'data-aes-workspace-queues-prev-' + token;
                const priorityAttr = valueAttr + '-priority';
                if (!el.hasAttribute(valueAttr)) return;
                const previous = el.getAttribute(valueAttr) || '';
                const priority = el.getAttribute(priorityAttr) || '';
                if (previous) el.style.setProperty(prop, previous, priority);
                else el.style.removeProperty(prop);
                el.removeAttribute(valueAttr);
                el.removeAttribute(priorityAttr);
            });
            el.removeAttribute(WORKSPACE_QUEUES_UI_STYLE_ATTR);
        });
    }

    function paintWorkspaceQueuesUi(selector, styles) {
        document.querySelectorAll(selector).forEach(function (el) {
            Object.keys(styles).forEach(function (prop) {
                setWorkspaceQueuesUiStyle(el, prop, styles[prop]);
            });
        });
    }

    function removeWorkspaceQueuesUiEnhancementStyle() {
        removeStyleById(WORKSPACE_QUEUES_UI_STYLE_ID);
        document.documentElement.classList.remove('aes-workspace-queues-ui-enhancement-active');
        document.documentElement.classList.remove('aes-workspace-queues-ui-enhancement-dark');
        document.documentElement.classList.remove('aes-workspace-queues-ui-enhancement-light');
        if (workspaceQueuesUiObserver) {
            workspaceQueuesUiObserver.disconnect();
            workspaceQueuesUiObserver = null;
        }
        workspaceQueuesUiInlineScheduled = false;
        restoreWorkspaceQueuesUiInlineStyles();
    }

    function applyWorkspaceQueuesUiEnhancementTheme() {
        document.documentElement.classList.toggle(
            'aes-workspace-queues-ui-enhancement-dark',
            !!workspaceQueuesUiEnhancementActiveTheme
        );
        document.documentElement.classList.toggle(
            'aes-workspace-queues-ui-enhancement-light',
            !workspaceQueuesUiEnhancementActiveTheme
        );
    }

    function injectWorkspaceQueuesUiEnhancementStyle() {
        if (!isWorkspaceQueuesFrame()) return;
        document.documentElement.classList.add('aes-workspace-queues-ui-enhancement-active');
        applyWorkspaceQueuesUiEnhancementTheme();
        if (document.getElementById(WORKSPACE_QUEUES_UI_STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = WORKSPACE_QUEUES_UI_STYLE_ID;
        style.textContent = [
            'html.aes-workspace-queues-ui-enhancement-active {',
            '    --aes-wq-canvas: #FFFFFF;',
            '    --aes-wq-panel: #FFFFFF;',
            '    --aes-wq-panel-alt: #F6F7F8;',
            '    --aes-wq-elevated: #FFFFFF;',
            '    --aes-wq-title: #1F2227;',
            '    --aes-wq-text: #1F2227;',
            '    --aes-wq-muted: #66707A;',
            '    --aes-wq-border: #D9DDE2;',
            '    --aes-wq-border-subtle: #E5E5E5;',
            '    --aes-wq-hover: #ECEFF2;',
            '    --aes-wq-selected: #E5E5E5;',
            '    --aes-wq-input: #FFFFFF;',
            '    --aes-wq-shadow: 0 14px 30px rgba(31,34,39,0.10);',
            '    --aes-wq-overlay-shadow: 0 18px 42px rgba(31,34,39,0.18);',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active.aes-workspace-queues-ui-enhancement-dark {',
            '    --aes-wq-canvas: #090B0D;',
            '    --aes-wq-panel: #1F2227;',
            '    --aes-wq-panel-alt: #17191D;',
            '    --aes-wq-elevated: #24282E;',
            '    --aes-wq-title: #FFFFFF;',
            '    --aes-wq-text: #F2F3F5;',
            '    --aes-wq-muted: #A9A9A9;',
            '    --aes-wq-border: #48505A;',
            '    --aes-wq-border-subtle: #343941;',
            '    --aes-wq-hover: #2A2F36;',
            '    --aes-wq-selected: #2D3138;',
            '    --aes-wq-input: #17191D;',
            '    --aes-wq-shadow: 0 14px 30px rgba(0,0,0,0.24);',
            '    --aes-wq-overlay-shadow: 0 18px 42px rgba(0,0,0,0.34);',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active,',
            'html.aes-workspace-queues-ui-enhancement-active body {',
            '    background: var(--aes-wq-canvas) !important;',
            '    color: var(--aes-wq-text) !important;',
            '    font-family: Roboto, Arial, Helvetica, Tahoma, sans-serif !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .PageContentContainer,',
            'html.aes-workspace-queues-ui-enhancement-active .PageHeadingContainer,',
            'html.aes-workspace-queues-ui-enhancement-active .MainContainer1,',
            'html.aes-workspace-queues-ui-enhancement-active .PrimaryContentContainer1,',
            'html.aes-workspace-queues-ui-enhancement-active .StandardViewContainer1,',
            'html.aes-workspace-queues-ui-enhancement-active .GridViewContainer1,',
            'html.aes-workspace-queues-ui-enhancement-active .VerticalContainer {',
            '    background: var(--aes-wq-canvas) !important;',
            '    color: var(--aes-wq-text) !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .MainContainer1 {',
            '    gap: 12px !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .PageHeadingContainer {',
            '    padding: 8px 10px 0 !important;',
            '    box-sizing: border-box !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .MenuContainer1,',
            'html.aes-workspace-queues-ui-enhancement-active .SummaryMenu1 {',
            '    background: var(--aes-wq-panel) !important;',
            '    border: 1px solid var(--aes-wq-border-subtle) !important;',
            '    border-radius: 14px !important;',
            '    box-shadow: var(--aes-wq-shadow) !important;',
            '    overflow: hidden !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .SummaryGroupMenuItem1 {',
            '    background: var(--aes-wq-panel-alt) !important;',
            '    color: var(--aes-wq-title) !important;',
            '    border-bottom: 1px solid var(--aes-wq-border-subtle) !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .GroupMenuItemText1,',
            'html.aes-workspace-queues-ui-enhancement-active .SummaryGroupMenuItem1 .SecondaryText {',
            '    color: var(--aes-wq-title) !important;',
            '    font-weight: 900 !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .SummaryMenuItem1 {',
            '    color: var(--aes-wq-text) !important;',
            '    border-radius: 8px !important;',
            '    margin: 2px 6px !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .SummaryMenuItem1:hover,',
            'html.aes-workspace-queues-ui-enhancement-active .SummaryMenuItem1.Selected,',
            'html.aes-workspace-queues-ui-enhancement-active .SummaryMenuItem1.SelectedState {',
            '    background: var(--aes-wq-hover) !important;',
            '    color: var(--aes-wq-title) !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .SummaryMenuItem1 .SecondaryText {',
            '    color: var(--aes-wq-muted) !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .ToolBar {',
            '    background: var(--aes-wq-canvas) !important;',
            '    padding: 8px 10px !important;',
            '    gap: 8px !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .ToolBar .Button2,',
            'html.aes-workspace-queues-ui-enhancement-active .ContextOverlay .Button2.NormalBackground {',
            '    border: 1px solid var(--aes-wq-border) !important;',
            '    border-radius: 7px !important;',
            '    background: var(--aes-wq-panel-alt) !important;',
            '    color: var(--aes-wq-text) !important;',
            '    min-height: 32px !important;',
            '    box-shadow: none !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .ToolBar .Button2:hover,',
            'html.aes-workspace-queues-ui-enhancement-active .ToolBar .Button2.HoverBackground,',
            'html.aes-workspace-queues-ui-enhancement-active .ContextOverlay .Button2.NormalBackground:hover {',
            '    background: var(--aes-wq-hover) !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .Button2 .Text2,',
            'html.aes-workspace-queues-ui-enhancement-active .Button .Text {',
            '    color: var(--aes-wq-text) !important;',
            '    font-weight: 800 !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .SearchResultContainer,',
            'html.aes-workspace-queues-ui-enhancement-active .GridContainer,',
            'html.aes-workspace-queues-ui-enhancement-active .grid {',
            '    background: var(--aes-wq-panel) !important;',
            '    border-color: var(--aes-wq-border-subtle) !important;',
            '    border-radius: 14px !important;',
            '    box-shadow: var(--aes-wq-shadow) !important;',
            '    overflow: hidden !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .grid thead td,',
            'html.aes-workspace-queues-ui-enhancement-active .grid tr.Heading td {',
            '    background: var(--aes-wq-panel-alt) !important;',
            '    color: var(--aes-wq-title) !important;',
            '    border-color: var(--aes-wq-border-subtle) !important;',
            '    font-weight: 900 !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .grid tbody td {',
            '    background: var(--aes-wq-panel) !important;',
            '    color: var(--aes-wq-text) !important;',
            '    border-color: var(--aes-wq-border-subtle) !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .grid tbody tr:nth-child(even) td {',
            '    background: var(--aes-wq-panel-alt) !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .grid tbody tr:hover td {',
            '    background: var(--aes-wq-hover) !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active input,',
            'html.aes-workspace-queues-ui-enhancement-active select,',
            'html.aes-workspace-queues-ui-enhancement-active textarea {',
            '    background: var(--aes-wq-input) !important;',
            '    color: var(--aes-wq-text) !important;',
            '    border: 1px solid var(--aes-wq-border) !important;',
            '    border-radius: 8px !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .ContextOverlay {',
            '    background: var(--aes-wq-panel) !important;',
            '    color: var(--aes-wq-text) !important;',
            '    border: 1px solid var(--aes-wq-border) !important;',
            '    border-radius: 12px !important;',
            '    box-shadow: var(--aes-wq-overlay-shadow) !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .ContextOverlay .Heading1 .Text1 {',
            '    color: var(--aes-wq-muted) !important;',
            '    font-weight: 900 !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .ContextOverlay a.Button {',
            '    background: transparent !important;',
            '    color: var(--aes-wq-text) !important;',
            '    border-radius: 8px !important;',
            '}',
            'html.aes-workspace-queues-ui-enhancement-active .ContextOverlay a.Button:hover {',
            '    background: var(--aes-wq-hover) !important;',
            '}',
        ].join('\n');
        function attach() {
            (document.head || document.documentElement).appendChild(style);
        }
        if (document.head || document.documentElement) attach();
        else document.addEventListener('DOMContentLoaded', attach, { once: true });
    }

    function applyWorkspaceQueuesUiInlineStyles() {
        if (!workspaceQueuesUiEnhancementEnabled || !isWorkspaceQueuesFrame()) return;
        const palette = workspaceQueuesUiPalette();

        paintWorkspaceQueuesUi('html, body, .PageContentContainer, .PageHeadingContainer, .MainContainer1, .PrimaryContentContainer1, .StandardViewContainer1, .GridViewContainer1, .VerticalContainer', {
            'background-color': palette.canvas,
            color: palette.text,
        });
        paintWorkspaceQueuesUi('.MenuContainer1, .SummaryMenu1, .SearchResultContainer, .GridContainer, .grid', {
            'background-color': palette.panel,
            color: palette.text,
            border: '1px solid ' + palette.borderSubtle,
            'border-radius': '14px',
            'box-shadow': palette.shadow,
        });
        paintWorkspaceQueuesUi('.SummaryGroupMenuItem1, .grid thead td, .grid tr.Heading td', {
            'background-color': palette.panelAlt,
            color: palette.title,
            'border-color': palette.borderSubtle,
        });
        paintWorkspaceQueuesUi('.ToolBar .Button2, .ContextOverlay .Button2.NormalBackground', {
            'background-color': palette.panelAlt,
            color: palette.text,
            border: '1px solid ' + palette.border,
            'border-radius': '7px',
            'box-shadow': 'none',
        });
        paintWorkspaceQueuesUi('.ContextOverlay', {
            'background-color': palette.panel,
            color: palette.text,
            border: '1px solid ' + palette.border,
            'border-radius': '12px',
            'box-shadow': palette.overlayShadow,
        });
        paintWorkspaceQueuesUi('input, select, textarea', {
            'background-color': palette.input,
            color: palette.text,
            border: '1px solid ' + palette.border,
            'border-radius': '8px',
        });
    }

    function scheduleWorkspaceQueuesUiInlineStyles() {
        if (workspaceQueuesUiInlineScheduled) return;
        workspaceQueuesUiInlineScheduled = true;
        const run = function () {
            workspaceQueuesUiInlineScheduled = false;
            applyWorkspaceQueuesUiInlineStyles();
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', run, { once: true });
            return;
        }
        const raf = window.requestAnimationFrame || function (callback) { return window.setTimeout(callback, 16); };
        raf(run);
    }

    function startWorkspaceQueuesUiObserver() {
        if (workspaceQueuesUiObserver || !document.body || !window.MutationObserver) return;
        workspaceQueuesUiObserver = new MutationObserver(function () {
            scheduleWorkspaceQueuesUiInlineStyles();
        });
        workspaceQueuesUiObserver.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    function syncWorkspaceQueuesUiEnhancement() {
        if (workspaceQueuesUiEnhancementEnabled && isWorkspaceQueuesFrame()) {
            injectWorkspaceQueuesUiEnhancementStyle();
            scheduleWorkspaceQueuesUiInlineStyles();
            if (document.body) startWorkspaceQueuesUiObserver();
            else document.addEventListener('DOMContentLoaded', startWorkspaceQueuesUiObserver, { once: true });
        } else {
            removeWorkspaceQueuesUiEnhancementStyle();
        }
    }

    function handleWorkspaceQueuesUiEnhancementMessage(data) {
        workspaceQueuesUiEnhancementEnabled = !!data.enabled;
        workspaceQueuesUiEnhancementActiveTheme = !!data.dark;
        syncWorkspaceQueuesUiEnhancement();
    }

    function requestWorkspaceQueuesUiEnhancementState() {
        postToTop({ type: 'workspace-queues-ui-enhancement-request' });
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
            if (data && data.__ns === AES.MSG_NS && data.type === 'timesheet-ui-enhancement') {
                handleTimesheetUiEnhancementMessage(data);
                return;
            }
            if (data && data.__ns === AES.MSG_NS && data.type === 'preferences-ui-enhancement') {
                handlePreferencesUiEnhancementMessage(data);
                return;
            }
            if (data && data.__ns === AES.MSG_NS && data.type === 'workspace-queues-ui-enhancement') {
                handleWorkspaceQueuesUiEnhancementMessage(data);
                return;
            }
            if (data && data.__ns === AES.MSG_NS && data.type === 'feature-enabled') {
                featureEnabled = data.enabled !== false;
                if (!featureEnabled) {
                    handleDarkEnhancerMessage({ enabled: false, dark: false });
                    handleTimesheetUiEnhancementMessage({ enabled: false });
                    handlePreferencesUiEnhancementMessage({ enabled: false });
                    handleWorkspaceQueuesUiEnhancementMessage({ enabled: false });
                }
                return;
            }

            if (event.source !== window) return;
            if (event.origin !== location.origin) return;
            if (!data || data.__ns !== AES.MSG_NS) return;
            if (!featureEnabled) return;
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
        requestTimesheetUiEnhancementState();
        requestPreferencesUiEnhancementState();
        requestWorkspaceQueuesUiEnhancementState();
        postToTop({ type: 'feature-enabled-request' });
        window.setTimeout(requestDarkEnhancerState, 250);
        window.setTimeout(requestDarkEnhancerState, 1000);
        window.setTimeout(requestDarkEnhancerState, 2500);
        window.setTimeout(requestTimesheetUiEnhancementState, 250);
        window.setTimeout(requestTimesheetUiEnhancementState, 1000);
        window.setTimeout(requestTimesheetUiEnhancementState, 2500);
        window.setTimeout(requestPreferencesUiEnhancementState, 250);
        window.setTimeout(requestPreferencesUiEnhancementState, 1000);
        window.setTimeout(requestPreferencesUiEnhancementState, 2500);
        window.setTimeout(requestWorkspaceQueuesUiEnhancementState, 250);
        window.setTimeout(requestWorkspaceQueuesUiEnhancementState, 1000);
        window.setTimeout(requestWorkspaceQueuesUiEnhancementState, 2500);
        startMapButtonEnhancement();

        function armMapOpenFromEvent(event) {
            if (!featureEnabled) return;
            if (event.target.closest('.InlineIconButton.Map, .InlineIcon.Map')) {
                pendingMapOpenUntil = Date.now() + 5000;
            }
        }

        document.addEventListener('pointerdown', armMapOpenFromEvent, true);
        document.addEventListener('mousedown', armMapOpenFromEvent, true);
        document.addEventListener('mousedown', function (event) {
            if (!featureEnabled) return;
            if (event.button !== 1) return;
            const targetUrl = extractHandledNavigationUrlFromEventTarget(event.target);
            if (!targetUrl) return;
            event.preventDefault();
        }, true);

        document.addEventListener('click', function (event) {
            if (!featureEnabled) return;
            armMapOpenFromEvent(event);

            const targetUrl = extractHandledNavigationUrlFromEventTarget(event.target);
            if (!targetUrl) return;

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            postToTop({ type: 'open', url: targetUrl });
        }, true);

        document.addEventListener('auxclick', function (event) {
            if (!featureEnabled) return;
            if (event.button !== 1) return;

            const targetUrl = extractHandledNavigationUrlFromEventTarget(event.target);
            if (!targetUrl) return;

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            postToTop({ type: 'open-duplicate', url: targetUrl });
        }, true);

        if (!window.__AESWindowOpenInterceptInstalled) {
            window.__AESWindowOpenInterceptInstalled = true;
            const originalOpen = window.open;
            window.open = function (url, target, features) {
                if (!featureEnabled) return originalOpen.call(window, url, target, features);
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
