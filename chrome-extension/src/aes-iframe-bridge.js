(function () {
    'use strict';

    const AES = window.__AES__;
    if (!AES || AES.isTop || AES.iframeBridgeInitialized) return;

    /**
     * Purpose: iframe-side AES bridge and behavior core.
     * Owns: iframe URL forwarding, metadata extraction, iframe UI interception, and state requests.
     * Must not own: top-level tab rendering, settings modal UI, or shell geometry.
     * Companion files: aes-iframe-runtime.js, aes-page-bridge.js, aes-shared.js.
     */
    const iframeRuntime = AES.IframeRuntime || (AES.IframeRuntime = {});
    if (AES.isAllowedHost && !AES.isAllowedHost(location.href)) return;
    AES.iframeBridgeInitialized = true;
    iframeRuntime.initialized = true;
    let featureEnabled = !(AES.featuresEnabled && !AES.featuresEnabled());
    let improvedScrollbarsEnabled = false;
    let mapButtonEnhancementStarted = false;

    function isAesPeekFrame() {
        try {
            const fe = window.frameElement;
            return !!(fe && fe.classList && (
                fe.classList.contains('at-tabs-peek-frame') ||
                (fe.closest && fe.closest('.at-tabs-peek-wrapper'))
            ));
        } catch (e) {
            return false;
        }
    }

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
        const contactMatch = href.match(/OpenContactDetail\s*\(\s*(\d+)\s*\)/i);
        if (contactMatch) {
            return AES.toAbsoluteUrl('/opportunity/contacts/Contact.asp?contactID=' + encodeURIComponent(contactMatch[1]));
        }

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
            && payload.type !== 'all-state-request'
            && payload.type !== 'feature-enabled-request'
            && payload.type !== 'improved-scrollbars-request') return;
        try { window.top.postMessage({ __ns: AES.MSG_NS, ...payload }, '*'); }
        catch (e) {}
    }

    function isPeekPopupUrl(url) {
        // Second Peek routing gate. aes-page-bridge.js can prevent the native
        // popup and post "open-peek", but this iframe bridge must also allow
        // the URL or the request is intentionally dropped before reaching shell.
        const targetUrl = AES.toAbsoluteUrl(url || '');
        if (!targetUrl) return false;
        try {
            const parsed = new URL(targetUrl);
            const path = AES.normalizeHandledPath(AES.pathOf(parsed.href));
            if ((path === '/mvc/inventory/receipthistory.mvc' ||
                path === '/mvc/inventory/emailpurchaseorder.mvc/emailpurchaseorder') &&
                parsed.searchParams.has('purchaseOrderId')) return true;
            if (path === '/autotask/column_chooser.aspx') return true;
            if (path.includes('contract') && (
                path.includes('service') ||
                path.includes('discount') ||
                path.includes('exclusion') ||
                path.includes('selector') ||
                path.includes('installedproduct') ||
                path.includes('contract_products')
            )) return true;
            return path === '/autotask35/dataselectorhandlers/ticketdataselectorpopup.aspx' ||
                path === '/mvc/projects/importticket.mvc/copytickettoproject' ||
                path === '/servicedesk/popups/forward/svcforward.asp' ||
                path === '/servicedesk/reports/togoreportframe.asp' ||
                path === '/mvc/servicedesk/tickethistory.mvc/servicetickethistory' ||
                path === '/popups/work/svcdetail.asp' ||
                path === '/administrator/roles/tabroleview.asp' ||
                path === '/autotask/views/administration/companysetup/neweditallocationcode.aspx' ||
                path === '/mvc/administrationsetup/invoicetemplate.mvc/editproperties' ||
                path === '/mvc/contracts/contract.mvc/edit' ||
                path === '/mvc/contracts/newcontractwizard.mvc/renewcontractwizard' ||
                path === '/mvc/contracts/contractnote.mvc/newcontractnote' ||
                path === '/mvc/contracts/contracthistory.mvc/entitychangehistory' ||
                (path === '/popups/journals/jrnpop.asp' && parsed.searchParams.get('action') === 'showCompliance');
        } catch (e) {
            return false;
        }
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

    // Replace native OS scrollbars in the iframe's document with a thin
    // translucent styled scrollbar when the shell setting is enabled.
    function injectScrollbarStyles() {
        const STYLE_ID = 'aes-custom-scrollbar-style';
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = [
            'html.aes-improved-scrollbars,',
            'html.aes-improved-scrollbars body,',
            'html.aes-improved-scrollbars * {',
            '    scrollbar-color: rgba(125, 167, 201, 0.5) transparent !important;',
            '    scrollbar-width: thin !important;',
            '    scrollbar-gutter: auto !important;',
            '}',
            'html.aes-improved-scrollbars::-webkit-scrollbar,',
            'html.aes-improved-scrollbars body::-webkit-scrollbar,',
            'html.aes-improved-scrollbars *::-webkit-scrollbar {',
            '    background: transparent !important;',
            '    background-color: transparent !important;',
            '    width: 4px !important;',
            '    height: 4px !important;',
            '}',
            'html.aes-improved-scrollbars::-webkit-scrollbar-track,',
            'html.aes-improved-scrollbars body::-webkit-scrollbar-track,',
            'html.aes-improved-scrollbars *::-webkit-scrollbar-track {',
            '    background: transparent !important;',
            '    background-color: transparent !important;',
            '    border: 0 !important;',
            '    box-shadow: none !important;',
            '}',
            'html.aes-improved-scrollbars::-webkit-scrollbar-track-piece,',
            'html.aes-improved-scrollbars body::-webkit-scrollbar-track-piece,',
            'html.aes-improved-scrollbars *::-webkit-scrollbar-track-piece {',
            '    background: transparent !important;',
            '    background-color: transparent !important;',
            '    border: 0 !important;',
            '    box-shadow: none !important;',
            '}',
            'html.aes-improved-scrollbars::-webkit-scrollbar-thumb,',
            'html.aes-improved-scrollbars body::-webkit-scrollbar-thumb,',
            'html.aes-improved-scrollbars *::-webkit-scrollbar-thumb {',
            '    background-color: rgba(125, 167, 201, 0.5) !important;',
            '    border-radius: 999px !important;',
            '    border: 1px solid transparent !important;',
            '    background-clip: content-box !important;',
            '}',
            'html.aes-improved-scrollbars::-webkit-scrollbar-thumb:hover,',
            'html.aes-improved-scrollbars body::-webkit-scrollbar-thumb:hover,',
            'html.aes-improved-scrollbars *::-webkit-scrollbar-thumb:hover {',
            '    background-color: rgba(125, 167, 201, 0.75) !important;',
            '    background-clip: content-box !important;',
            '}',
            'html.aes-improved-scrollbars::-webkit-scrollbar-corner,',
            'html.aes-improved-scrollbars body::-webkit-scrollbar-corner,',
            'html.aes-improved-scrollbars *::-webkit-scrollbar-corner {',
            '    background: transparent !important;',
            '    background-color: transparent !important;',
            '}',
            'html.aes-improved-scrollbars::-webkit-scrollbar-button,',
            'html.aes-improved-scrollbars body::-webkit-scrollbar-button,',
            'html.aes-improved-scrollbars *::-webkit-scrollbar-button,',
            'html.aes-improved-scrollbars::-webkit-resizer,',
            'html.aes-improved-scrollbars body::-webkit-resizer,',
            'html.aes-improved-scrollbars *::-webkit-resizer {',
            '    display: none !important;',
            '    background: transparent !important;',
            '    background-color: transparent !important;',
            '    width: 0 !important;',
            '    height: 0 !important;',
            '}',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme {',
            '    scrollbar-color: rgba(125, 167, 201, 0.58) #0f141a !important;',
            '}',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme::-webkit-scrollbar-track,',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme body::-webkit-scrollbar-track,',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme *::-webkit-scrollbar-track {',
            '    background: transparent !important;',
            '}',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme::-webkit-scrollbar-thumb,',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme body::-webkit-scrollbar-thumb,',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme *::-webkit-scrollbar-thumb {',
            '    background-color: rgba(125, 167, 201, 0.58) !important;',
            '    border-color: #0f141a !important;',
            '}',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme::-webkit-scrollbar-thumb:hover,',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme body::-webkit-scrollbar-thumb:hover,',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme *::-webkit-scrollbar-thumb:hover {',
            '    background-color: rgba(125, 167, 201, 0.82) !important;',
            '}',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme::-webkit-scrollbar-corner,',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme body::-webkit-scrollbar-corner,',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme *::-webkit-scrollbar-corner {',
            '    background: transparent !important;',
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
        if (isAesPeekFrame()) return;
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

        const mount = document.documentElement || document.head;
        const routesScript = document.createElement('script');
        const bridgeScript = document.createElement('script');

        routesScript.src = chrome.runtime.getURL('src/aes-routes.js');
        bridgeScript.src = chrome.runtime.getURL('src/aes-page-bridge.js');
        routesScript.onload = function () {
            routesScript.remove();
            mount.appendChild(bridgeScript);
        };
        routesScript.onerror = function () {
            routesScript.remove();
            mount.appendChild(bridgeScript);
        };
        bridgeScript.onload = function () { bridgeScript.remove(); };
        mount.appendChild(routesScript);
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

    function findReadOnlyColorFieldByLabel(labelNames) {
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
            const value = cleanText(colorSample ? colorSample.textContent : valueContainer.textContent);
            if (!value) continue;
            const colorSource = valueContainer.querySelector('.Left.ColorSample, .BackgroundPatch.ColorSample, .ColorBand.ColorSwatch, .ColorSample');
            const color = colorSource ? window.getComputedStyle(colorSource).backgroundColor : '';
            return { value: value, color: color };
        }
        return { value: '', color: '' };
    }

    function isGenericOpportunityTitle(value) {
        const text = cleanText(value).toLowerCase();
        return !text ||
            text === 'opportunity' ||
            text === 'view opportunity' ||
            text === 'edit opportunity';
    }

    function findOpportunityTitle() {
        const copyButton = document.querySelector(
            '.CopyTextButton[title*="opportunity ID"], .CopyTextButton[title*="opportunity URL"]'
        );
        const copyTitle = copyButton && copyButton.closest('.Title');
        const copyTitleText = copyTitle && copyTitle.querySelector(':scope > .Text, .Text');
        const copyCandidate = cleanText(copyTitleText && copyTitleText.textContent);
        if (!isGenericOpportunityTitle(copyCandidate)) return copyCandidate;

        const candidates = document.querySelectorAll(
            '.EntityHeadingContainer .Title > .Text, ' +
            '.PageHeadingContainer .Title > .Text, ' +
            '.TitleBarItem.Title > .Text, ' +
            '.Title > .Text'
        );
        for (const candidate of candidates) {
            const text = cleanText(candidate.textContent);
            if (!isGenericOpportunityTitle(text)) return text;
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
        const contactName = findReadOnlyValueByLabel(['Contact', 'Contact Name']) ||
            findFieldValue('Contact') ||
            findFieldValue('Contact Name');
        const priorityField = findReadOnlyColorFieldByLabel(['Priority']);
        const statusField = findReadOnlyColorFieldByLabel(['Status']);
        const priority = priorityField.value || findReadOnlyValueByLabel(['Priority']);
        const status = statusField.value || findReadOnlyValueByLabel(['Status']);
        const lastActivity = extractTicketLastActivity();
        const primaryResource = extractPrimaryResourceInfo();
        const hoverFields = [
            { label: 'Ticket number', value: number.slice(0, 40) },
            { label: 'Status', value: status.slice(0, 40) },
            { label: 'Priority', value: priority.slice(0, 40) },
            { label: 'Last activity', value: lastActivity.slice(0, 40) },
        ].filter(field => field.value);

        return {
            title: title || 'Ticket',
            number: 'Ticket',
            contact: organization.slice(0, 80),
            primaryResource: primaryResource,
            priority: priority.slice(0, 40),
            status: status.slice(0, 40),
            lastActivity: lastActivity.slice(0, 40),
            hoverFields: hoverFields,
            metadataFields: {
                type: 'Ticket',
                number: number.slice(0, 40),
                organization: organization.slice(0, 80),
                contact: contactName.slice(0, 80),
                status: status.slice(0, 40),
                statusColor: statusField.color,
                priority: priority.slice(0, 40),
                priorityColor: priorityField.color,
                lastActivity: lastActivity.slice(0, 40),
                primaryResource: primaryResource && primaryResource.name || '',
            },
        };
    }

    function extractTaskInfo() {
        const heading = document.querySelector('.EntityHeadingContainer');
        let number = '';
        let title = '';

        if (heading) {
            const idEl = heading.querySelector('.IdentificationText');
            if (idEl) number = cleanText(idEl.textContent);

            const titleEl = heading.querySelector('.Title > .Text');
            if (titleEl) title = cleanText(titleEl.textContent);
        }

        if (!title) {
            title = cleanText(document.title)
                .replace(/^Task\s*[-–]\s*/i, '')
                .replace(number, '')
                .replace(/^\s*[-–]\s*/, '');
        }

        const organization = findFieldValue('Organization') || findReadOnlyValueByLabel(['Organization']);
        const contactName = findReadOnlyValueByLabel(['Contact', 'Contact Name']) ||
            findFieldValue('Contact') ||
            findFieldValue('Contact Name');
        const priorityField = findReadOnlyColorFieldByLabel(['Priority']);
        const statusField = findReadOnlyColorFieldByLabel(['Status']);
        const priority = priorityField.value || findReadOnlyValueByLabel(['Priority']);
        const status = statusField.value || findReadOnlyValueByLabel(['Status']);
        const lastActivity = extractTicketLastActivity();
        const primaryResource = extractPrimaryResourceInfo();
        const hoverFields = [
            { label: 'Task ID', value: number.slice(0, 40) },
            { label: 'Status', value: status.slice(0, 40) },
            { label: 'Priority', value: priority.slice(0, 40) },
            { label: 'Last activity', value: lastActivity.slice(0, 40) },
        ].filter(field => field.value);

        return {
            title: title || 'Task',
            number: 'Task',
            contact: organization.slice(0, 80),
            primaryResource: primaryResource,
            priority: priority.slice(0, 40),
            status: status.slice(0, 40),
            lastActivity: lastActivity.slice(0, 40),
            hoverFields: hoverFields,
            metadataFields: {
                type: 'Task',
                number: number.slice(0, 40),
                organization: organization.slice(0, 80),
                contact: contactName.slice(0, 80),
                status: status.slice(0, 40),
                statusColor: statusField.color,
                priority: priority.slice(0, 40),
                priorityColor: priorityField.color,
                lastActivity: lastActivity.slice(0, 40),
                primaryResource: primaryResource && primaryResource.name || '',
            },
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
            number: id ? ('ID ' + id).slice(0, 40) : 'Recurring Ticket',
            contact: '',
            primaryResource: null,
            metadataFields: {
                type: 'Ticket',
                id: id ? ('ID ' + id).slice(0, 40) : '',
            },
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

        function findContractField(labelText) {
            const wanted = String(labelText || '').toLowerCase();
            for (const td of document.querySelectorAll('td.FieldLabels')) {
                const label = cleanText(td.textContent).toLowerCase();
                if (label !== wanted) continue;
                const valueTd = td.nextElementSibling;
                return valueTd ? cleanText(valueTd.textContent) : '';
            }
            return '';
        }

        const contractType = findContractField('Contract Type');
        const contractCategory = findContractField('Contract Category');
        const purchaseOrderNumber = findContractField('Purchase Order Number');
        const accountManager = findContractField('Account Manager');
        const contactName = findContractField('Contact Name');
        const serviceLevelAgreement = findContractField('Service Level Agreement');
        const opportunity = findContractField('Opportunity');
        const defaultServiceDeskContract = findContractField('Default Service Desk Contract');
        const startDate = findContractField('Start Date');
        const endDate = findContractField('End Date');
        const period = findContractField('Contract Period Type');
        const hoverFields = [
            { label: 'Account Manager', value: accountManager },
            { label: 'Contact Name', value: contactName },
            { label: 'Service Level Agreement', value: serviceLevelAgreement },
            { label: 'Opportunity', value: opportunity },
            { label: 'Default SD Contract', value: defaultServiceDeskContract },
            { label: 'Contract Type', value: contractType },
            { label: 'Category', value: contractCategory },
            { label: 'Start date', value: startDate },
            { label: 'End date', value: endDate },
            { label: 'Period', value: period },
        ].filter(field => field.value);

        return {
            title: name || 'Contract',
            number: id ? ('ID ' + id).slice(0, 40) : 'Contract',
            contact: org.slice(0, 80),
            hoverFields: hoverFields,
            metadataFields: {
                type: 'Contract',
                id: id ? ('ID ' + id).slice(0, 40) : '',
                organization: org.slice(0, 80),
                contractType: contractType.slice(0, 80),
                contractCategory: contractCategory.slice(0, 80),
                purchaseOrderNumber: purchaseOrderNumber.slice(0, 80),
                accountManager: accountManager.slice(0, 80),
                contactName: contactName.slice(0, 80),
                serviceLevelAgreement: serviceLevelAgreement.slice(0, 80),
                opportunity: opportunity.slice(0, 120),
                defaultServiceDeskContract: defaultServiceDeskContract.slice(0, 80),
                startDate: startDate.slice(0, 80),
                endDate: endDate.slice(0, 80),
                period: period.slice(0, 80),
            },
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
            number: number ? ('ID ' + number).slice(0, 40) : 'Organization',
            contact: classification.slice(0, 80),
            metadataFields: {
                type: 'Organization',
                id: number ? ('ID ' + number).slice(0, 40) : '',
            },
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
            number: number ? ('ID ' + number).slice(0, 40) : 'Person',
            contact: organization.slice(0, 80),
            metadataFields: {
                type: 'Person',
                id: number ? ('ID ' + number).slice(0, 40) : '',
                organization: organization.slice(0, 80),
            },
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
            number: number ? ('ID ' + number).slice(0, 40) : 'Project',
            contact: organization.slice(0, 80),
            metadataFields: {
                type: 'Project',
                id: number ? ('ID ' + number).slice(0, 40) : '',
                organization: organization.slice(0, 80),
            },
        };
    }

    function extractInstalledProductInfo() {
        const hostname = findReadOnlyValueByLabel(['Hostname']) ||
            findFieldValue('Hostname');
        const deviceTitle = cleanText(document.querySelector('.Title > .Text')?.textContent);
        const serialNumber = findReadOnlyValueByLabel(['Serial Number']) ||
            findFieldValue('Serial Number');
        const organization = findReadOnlyValueByLabel(['Organization']) ||
            findFieldValue('Organization') ||
            findFieldValue('Organization Name') ||
            findFieldValue('Account') ||
            findFieldValue('Account Name');
        const deviceType = findReadOnlyValueByLabel(['Type']) || findFieldValue('Type');
        const manufacturer = findReadOnlyValueByLabel(['Manufacturer']) || findFieldValue('Manufacturer');
        const model = findReadOnlyValueByLabel(['Model']) || findFieldValue('Model');
        const internalIp = findReadOnlyValueByLabel(['Internal IP Address']) || findFieldValue('Internal IP Address');
        const antivirusStatus = findReadOnlyValueByLabel(['Antivirus Status']) || findFieldValue('Antivirus Status');
        const patchStatus = findReadOnlyValueByLabel(['Patch Status']) || findFieldValue('Patch Status');
        const hoverFields = [
            { label: 'Serial Number', value: serialNumber },
            { label: 'Device type', value: deviceType },
            { label: 'Manufacturer', value: manufacturer },
            { label: 'Model', value: model },
            { label: 'Internal IP', value: internalIp },
            { label: 'Antivirus', value: antivirusStatus },
            { label: 'Patch status', value: patchStatus },
        ].map(field => ({
            label: field.label,
            value: cleanText(field.value).slice(0, 120),
        })).filter(field => field.value);
        return {
            title: hostname || deviceTitle || cleanText(document.title) || 'Device',
            number: 'Device',
            contact: organization.slice(0, 80),
            hoverFields: hoverFields,
            metadataFields: {
                type: 'Device',
                serialNumber: serialNumber.slice(0, 80),
                organization: organization.slice(0, 80),
                deviceType: cleanText(deviceType).slice(0, 80),
                manufacturer: cleanText(manufacturer).slice(0, 80),
                model: cleanText(model).slice(0, 120),
                internalIp: cleanText(internalIp).slice(0, 80),
                antivirusStatus: cleanText(antivirusStatus).slice(0, 80),
                patchStatus: cleanText(patchStatus).slice(0, 80),
            },
        };
    }

    function extractNoteInfo() {
        const secondaryEl = document.querySelector('.TitleBarItem.Title .SecondaryText, .Title .SecondaryText');
        const secondary = cleanText(secondaryEl && secondaryEl.textContent);
        let title = '';
        let organization = '';

        if (secondary) {
            const titleMatch = secondary.match(/^-\s*(.+?)\s*\(/);
            if (titleMatch) title = titleMatch[1].trim();
            const orgMatch = secondary.match(/\(([^()]*)\)\s*$/);
            if (orgMatch) organization = orgMatch[1].trim();
        }

        const opportunity = findReadOnlyValueByLabel(['Opportunity']) ||
            findFieldValue('Opportunity');

        return {
            title: title || cleanText(document.title).replace(/^View Note\s*[-–]?\s*/i, '') || 'Note',
            number: 'Note',
            contact: organization.slice(0, 80),
            hoverFields: opportunity ? [{ label: 'Opportunity', value: opportunity.slice(0, 120) }] : [],
            metadataFields: {
                type: 'Note',
                opportunity: opportunity.slice(0, 120),
                organization: organization.slice(0, 80),
            },
        };
    }

    function cleanSecondaryTitleText(text) {
        return cleanText(text)
            .replace(/^[-–]\s*/, '')
            .replace(/\s*\([^)]*\)\s*$/, '')
            .trim();
    }

    function firstVisibleTextFallback() {
        const candidates = document.querySelectorAll('h1, h2, h3, [role="heading"], header, div, span');
        for (const el of candidates) {
            const tagName = String(el.tagName || '').toLowerCase();
            if (tagName === 'script' || tagName === 'style' || tagName === 'noscript') continue;
            const text = cleanText(el.textContent);
            if (!text || text.length < 2) continue;
            const style = window.getComputedStyle ? window.getComputedStyle(el) : null;
            if (style && (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0')) continue;
            const rects = typeof el.getClientRects === 'function' ? el.getClientRects() : [];
            if (!rects || rects.length === 0) continue;
            return text.slice(0, 120);
        }
        return '';
    }

    function extractInvoiceTemplateInfo() {
        const titleEl = document.querySelector('.TitleBarItem.Title .Text, .Title .Text');
        const secondaryEl = document.querySelector('.TitleBarItem.Title .SecondaryText, .Title .SecondaryText');
        const section = cleanText(titleEl && titleEl.textContent) ||
            cleanText(document.title).replace(/^Autotask\s*[-–]\s*/i, '') ||
            'Invoice Template';
        const stableSection = 'Invoice Template';
        const entityName = cleanSecondaryTitleText(secondaryEl && secondaryEl.textContent);
        const params = new URLSearchParams(location.search);
        const templateId = params.get('invoiceTemplateId') ||
            params.get('invoiceTemplateID') ||
            params.get('invoicetemplateid') ||
            '';
        const fallbackId = templateId ? ('ID ' + templateId).slice(0, 40) : '';

        return {
            title: entityName.slice(0, 120) || fallbackId || 'Invoice Template',
            number: stableSection,
            contact: '',
            metadataFields: {
                type: 'Administration',
                id: stableSection,
                secondaryTitle: stableSection,
            },
        };
    }

    function extractAdminTitlebarPageInfo(entityFallback, sectionFallback) {
        const titleEl = document.querySelector('.TitleBarItem.Title .Text, .Title .Text');
        const secondaryEl = document.querySelector('.TitleBarItem.Title .SecondaryText, .Title .SecondaryText, .SecondaryTitle');
        const section = cleanText(titleEl && titleEl.textContent) || sectionFallback || 'Administration';
        const entityName = cleanSecondaryTitleText(secondaryEl && secondaryEl.textContent) || entityFallback || section;

        return {
            title: entityName.slice(0, 120),
            number: section.slice(0, 120),
            contact: '',
            metadataFields: {
                type: 'Administration',
                id: section.slice(0, 120),
                secondaryTitle: section.slice(0, 120),
            },
        };
    }

    function extractAdminNamePageInfo(newTitle, editTitle, inputSelector) {
        const params = new URLSearchParams(location.search);
        const objectId = params.get('objectid') || params.get('objectId') || params.get('ObjectId') || '';
        const isEdit = !!objectId && objectId !== '0';
        const input = document.querySelector(inputSelector);
        const name = cleanText(input && input.value).slice(0, 120);

        return {
            title: isEdit ? editTitle : newTitle,
            number: isEdit ? name : '',
            contact: '',
            metadataFields: {
                type: 'Administration',
                id: isEdit ? name : '',
                secondaryTitle: isEdit ? name : '',
            },
        };
    }

    function extractResourceManagementInfo() {
        const params = new URLSearchParams(location.search);
        const webId = params.get('webID') || params.get('webId') || params.get('webid') || '';
        const secondary = cleanSecondaryTitleText(document.querySelector('.SecondaryTitle') && document.querySelector('.SecondaryTitle').textContent);
        const primary = webId ? secondary.slice(0, 120) : 'New User';

        return {
            title: primary,
            number: 'Resource Management',
            contact: '',
            metadataFields: {
                type: 'Administration',
                id: 'Resource Management',
                secondaryTitle: 'Resource Management',
            },
        };
    }

    function extractApiUserInfo() {
        const p = AES.normalizeHandledPath(AES.pathOf(location.href));
        const isEdit = p === '/mvc/administrationsetup/apiuser.mvc/editapiuser';
        const titleBar = document.querySelector('.TitleBarItem.Title, .Title');
        const titleEl = titleBar && titleBar.querySelector('.Text');
        const secondaryEl = titleBar && titleBar.querySelector('.SecondaryText');
        let secondary = cleanSecondaryTitleText(secondaryEl && secondaryEl.textContent);
        if (!secondary && titleBar) {
            const titleText = cleanText(titleEl && titleEl.textContent);
            secondary = cleanSecondaryTitleText(cleanText(titleBar.textContent).replace(titleText, ''));
        }
        const primary = isEdit ? (secondary.slice(0, 120) || 'API User') : 'New API User';

        return {
            title: primary,
            number: 'Resource Management',
            contact: '',
            metadataFields: {
                type: 'Administration',
                id: 'Resource Management',
                secondaryTitle: 'Resource Management',
            },
        };
    }

    function extractOpportunityInfo() {
        const heading = document.querySelector('.EntityHeadingContainer, .PageHeadingContainer');
        let title = findOpportunityTitle();
        let id = '';

        if (heading) {
            const idEl = heading.querySelector('.IdentificationText');
            if (idEl) id = cleanText(idEl.textContent);
        }

        if (!id) {
            const params = new URLSearchParams(location.search);
            const opportunityId = params.get('opportunityId') || params.get('opportunityid');
            if (opportunityId) id = 'ID ' + opportunityId;
        }

        const organization = findReadOnlyValueByLabel(['Organization']) ||
            findFieldValue('Organization') ||
            findFieldValue('Organization Name') ||
            findFieldValue('Account') ||
            findFieldValue('Account Name');

        return {
            title: title || (!isGenericOpportunityTitle(document.title) ? cleanText(document.title) : '') || 'Opportunity',
            number: id.slice(0, 40),
            contact: organization.slice(0, 80),
            primaryResource: extractPrimaryResourceInfo(),
            metadataFields: {
                type: 'Opportunity',
                id: id.slice(0, 40),
                organization: organization.slice(0, 80),
            },
        };
    }

    function extractSalesOrderInfo() {
        const secondaryEl = document.querySelector('#PageHeaderSecondaryLabel, .SecondaryTitle');
        const secondary = cleanText(secondaryEl && secondaryEl.textContent);
        let title = '';
        let id = '';
        let organization = '';

        if (secondary) {
            const match = secondary.match(/^-\s*(.+?)\s*\(ID:\s*([^)]+)\)\s*\|\s*(.+)$/i);
            if (match) {
                title = match[1].trim();
                id = 'ID ' + match[2].trim();
                organization = match[3].trim();
            }
        }

        if (!id) {
            const params = new URLSearchParams(location.search);
            const salesOrderId = params.get('salesorderid') || params.get('salesOrderId');
            if (salesOrderId) id = 'ID ' + salesOrderId;
        }

        return {
            title: title || cleanText(document.title) || 'Sales Order',
            number: id.slice(0, 40),
            contact: organization.slice(0, 80),
            metadataFields: {
                type: 'Sales Order',
                id: id.slice(0, 40),
                organization: organization.slice(0, 80),
            },
        };
    }

    function parsePurchaseOrderIdFromTitle(rawTitle) {
        const match = cleanText(rawTitle || '').match(/\(ID:\s*([^)]+)\)/i);
        if (!match || !match[1]) return '';
        return cleanText(match[1]).replace(/^ID\s*[:#-]?\s*/i, '');
    }

    function findLegacyPurchaseOrderValueByLabel(labelText) {
        const wanted = cleanText(labelText).toLowerCase();
        for (const label of document.querySelectorAll('td span.lblNormalClass')) {
            if (cleanText(label.textContent).toLowerCase() !== wanted) continue;
            const valueCell = label.closest('td')?.nextElementSibling;
            const input = valueCell && valueCell.querySelector('input');
            if (input) return cleanText(input.value);
            return cleanText(valueCell && valueCell.textContent);
        }
        return '';
    }

    function extractPurchaseOrderInfo() {
        const params = new URLSearchParams(location.search);
        const id = (
            params.get('id') ||
            params.get('ID') ||
            params.get('purchaseOrderId') ||
            params.get('purchaseorderid') ||
            params.get('purchaseOrderID') ||
            parsePurchaseOrderIdFromTitle(document.querySelector('.TitleContainer')?.textContent) ||
            parsePurchaseOrderIdFromTitle(document.title)
        ).trim();
        const vendor = cleanText(
            (document.getElementById('dataSelectorVendor_ATTextEdit') || {}).value
        ).slice(0, 120);
        const organization = cleanText(
            (document.getElementById('dataSelectorAccount_ATTextEdit') || {}).value
        ).slice(0, 120);
        const externalPoNumber = findLegacyPurchaseOrderValueByLabel('External P.O. #').slice(0, 120);

        const normalizedId = id ? ('ID ' + id) : '';
        return {
            title: 'Purchase Order',
            number: normalizedId,
            contact: organization.slice(0, 80),
            hoverFields: externalPoNumber ? [{ label: 'External P.O. #', value: externalPoNumber }] : [],
            metadataFields: {
                type: 'Purchase Order',
                id: normalizedId,
                externalPoNumber: externalPoNumber,
                organization: organization,
                vendor: vendor,
            },
        };
    }

    function findLegacyFieldLabelValue(labelText) {
        const wanted = labelText.toLowerCase();
        for (const cell of document.querySelectorAll('td.FieldLabels')) {
            const clone = cell.cloneNode(true);
            const div = clone.querySelector('div');
            if (div) div.remove();
            if (cleanText(clone.textContent).toLowerCase() !== wanted) continue;

            const valueDiv = cell.querySelector('div');
            if (!valueDiv) return '';
            const selected = valueDiv.querySelector('select option:checked');
            if (selected && cleanText(selected.textContent) && selected.value) {
                return cleanText(selected.textContent);
            }
            const input = valueDiv.querySelector('input');
            if (input) return cleanText(input.value);
            return cleanText(valueDiv.textContent);
        }
        return '';
    }

    function extractQuoteInfo() {
        const params = new URLSearchParams(location.search);
        const path = AES.normalizeHandledPath(AES.pathOf(location.href));
        const quoteId = params.get('QuoteID') ||
            params.get('quoteID') ||
            params.get('quoteId') ||
            params.get('objectID') ||
            findLegacyFieldLabelValue('Quote Number');
        let quoteName = '';
        let organization = '';

        if (path === '/opportunity/quotes/quote.asp') {
            const secondary = cleanText(document.querySelector('.SecondaryTitle')?.textContent);
            const match = secondary.match(/^-\s*(.+?)\s*\(\d+\)\s*$/);
            if (match) quoteName = match[1].trim();
        } else {
            quoteName = findLegacyFieldLabelValue('Opportunity Name');
            organization = findLegacyFieldLabelValue('Organization Name') ||
                findLegacyFieldLabelValue('Organization') ||
                findLegacyFieldLabelValue('Account Name') ||
                findLegacyFieldLabelValue('Account');
        }

        return {
            title: quoteId ? 'Quote ' + quoteId : 'Quote',
            number: 'Quote',
            contact: organization.slice(0, 80),
            hoverFields: quoteName ? [{ label: 'Quote name', value: quoteName.slice(0, 120) }] : [],
            metadataFields: {
                type: 'Quote',
                id: quoteId ? ('ID ' + quoteId).slice(0, 40) : '',
                quoteName: quoteName.slice(0, 120),
                organization: organization.slice(0, 80),
            },
        };
    }

    function extractContactGroupInfo() {
        const params = new URLSearchParams(location.search);
        const groupId = params.get('groupid') || params.get('groupId');
        const secondary = cleanText(document.querySelector('.SecondaryTitle')?.textContent)
            .replace(/^[-–]\s*/, '');
        const heading = cleanText(document.querySelector('.EntityHeadingContainer .Title > .Text, .PageHeadingContainer .Title .Text, h1, .Title')?.textContent);

        return {
            title: secondary || heading || (groupId && groupId !== '0' ? 'Contact Group' : 'New Contact Group'),
            number: groupId && groupId !== '0' ? ('ID ' + groupId).slice(0, 40) : 'Group',
            contact: '',
            metadataFields: {
                type: 'Group',
                id: groupId && groupId !== '0' ? ('ID ' + groupId).slice(0, 40) : '',
            },
        };
    }

    function extractGenericInfo(fallbackTitle) {
        const heading = document.querySelector('.TitleBarItem.Title > .Text, .EntityHeadingContainer .Title > .Text, .PageHeadingContainer .Title .Text, h1, .Title');
        const secondaryEl = document.querySelector('.TitleBarItem.Title .SecondaryText, .Title .SecondaryText, .SecondaryTitle');
        const title = cleanText(heading && heading.textContent) ||
            cleanText(document.title).replace(/^Autotask\s*[-–]\s*/i, '');
        const secondaryTitle = cleanSecondaryTitleText(secondaryEl && secondaryEl.textContent);
        const visibleFallback = title || secondaryTitle ? '' : firstVisibleTextFallback();
        return {
            title: title || visibleFallback || fallbackTitle || 'Autotask page',
            number: secondaryTitle || fallbackTitle || '',
            contact: '',
            primaryResource: null,
            metadataFields: {
                type: fallbackTitle || 'Unknown',
                secondaryTitle: secondaryTitle.slice(0, 120),
            },
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
        if (!secondary) {
            info.number = 'Timesheet';
            return info;
        }

        const date = extractSecondaryDate(secondary.textContent).slice(0, 40);
        info.number = 'Timesheet';
        info.contact = extractSecondaryName(secondary.textContent);
        info.hoverFields = date ? [{ label: 'Date', value: date }] : [];
        info.metadataFields = {
            type: 'Timesheet',
            date: date,
            contact: info.contact,
        };
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
        if (p === '/mvc/crm/installedproductdetail.mvc') {
            return extractInstalledProductInfo();
        }
        if (p === '/mvc/crm/note.mvc/view') {
            return extractNoteInfo();
        }
        if (p === '/mvc/servicedesk/ticketdetail.mvc') {
            return extractTicketInfo();
        }
        if (p === '/mvc/administrationsetup/invoicetemplate.mvc/editinvoicetemplate') {
            return extractInvoiceTemplateInfo();
        }
        if (p === '/mvc/administrationsetup/invoicetemplate.mvc/editproperties') {
            return extractAdminTitlebarPageInfo('Invoice Template', 'Invoice Template Properties');
        }
        if (p === '/mvc/contracts/invoiceemailtemplate.mvc/editinvoiceemailtemplate') {
            return extractAdminTitlebarPageInfo('Invoice Email Template', 'Invoice Email Template');
        }
        if (p === '/autotask/views/template/customizenotificationtemplate.aspx') {
            const info = extractAdminTitlebarPageInfo('Notification Template', 'Notification Templates');
            const legacyTitleContainer = document.querySelector('.TitleContainer');
            const legacySectionRaw = cleanText(legacyTitleContainer && Array.prototype.reduce.call(
                legacyTitleContainer.childNodes || [],
                function (text, node) {
                    return node && node.nodeType === Node.TEXT_NODE ? text + ' ' + node.textContent : text;
                },
                ''
            ));
            const legacySection = /^customize\s+notification\s+template$/i.test(legacySectionRaw)
                ? 'Notification Template'
                : legacySectionRaw || 'Notification Template';
            const nameInput = document.querySelector('#EmailTemplateHeaderUserControl_NameTextBox_ATTextEdit');
            const initialName = cleanText(nameInput && (
                nameInput.getAttribute('value') ||
                nameInput.defaultValue ||
                nameInput.value
            ));
            info.number = legacySection.slice(0, 120);
            info.metadataFields = Object.assign({}, info.metadataFields || {}, {
                id: info.number,
                secondaryTitle: info.number,
            });
            const extractedTitle = cleanText(info.title);
            const normalizedTitle = /^customize\s+notification\s+template$/i.test(extractedTitle)
                ? 'Notification Templates'
                : extractedTitle;
            info.title = (initialName || normalizedTitle || 'Notification Templates').slice(0, 120);
            info.metadataFields = Object.assign({}, info.metadataFields || {}, {
                entityName: info.title,
            });
            return info;
        }
        if (p === '/autotask/views/administration/companysetup/location_new_edit.aspx') {
            return extractAdminNamePageInfo('New Internal Location', 'Edit Internal Location', '#_ctl17_txt_location_name_ATTextEdit');
        }
        if (p === '/autotask/popups/administration/departmentdetails.aspx') {
            return extractAdminNamePageInfo('New Department', 'Edit Department', '#Summary_txtName_ATTextEdit');
        }
        if (p === '/autotask/views/administration/resources/resource.aspx') {
            return extractResourceManagementInfo();
        }
        if (p === '/mvc/administrationsetup/apiuser.mvc/newapiuser' || p === '/mvc/administrationsetup/apiuser.mvc/editapiuser') {
            return extractApiUserInfo();
        }
        if (p === '/mvc/crm/opportunitydetail.mvc') {
            return extractOpportunityInfo();
        }
        if (p === '/autotask35/crm/salesorder/salesorderdetail.aspx') {
            return extractSalesOrderInfo();
        }
        if (p === '/autotask/inventory/inventory_edit_order.aspx') {
            return extractPurchaseOrderInfo();
        }
        if (p === '/opportunity/quotes/quote.asp' || p === '/opportunity/quotes/newquote.asp') {
            return extractQuoteInfo();
        }
        if (p === '/mvc/crm/quotetemplate.mvc/editproperties') {
            return {
                title: 'Quote Template',
                number: '',
                contact: '',
            };
        }
        if (p === '/autotask/views/crm/contact_group_management.aspx' ||
            p === '/autotask35/crm/contactgroupmanager.aspx') {
            return extractContactGroupInfo();
        }
        if (p === '/mvc/projects/projectdetail.mvc/projectdetail') {
            return extractProjectInfo();
        }
        if (p === '/mvc/projects/taskdetail.mvc') {
            return extractTaskInfo();
        }
        if (p.includes('/contactdetail') || p.includes('/resourcedetail') || p.includes('/persondetail') || p === '/autotask35/grapevine/profile.aspx') {
            return extractPersonInfo();
        }
        return extractGenericInfo('');
    }

    let lastSent = '';
    function hasPageLevelWarning() {
        const warning = document.querySelector('table.PageLevelInstructions #errorSmall');
        return !!(warning && cleanText(warning.textContent));
    }

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
                hoverFields: [],
            };
        }
        const pageWarning = hasPageLevelWarning();
        const primaryResource = info.primaryResource || null;
        const priority = info.priority || '';
        const status = info.status || '';
        const lastActivity = info.lastActivity || '';
        const hoverFields = Array.isArray(info.hoverFields)
            ? info.hoverFields
                .map(field => ({
                    label: cleanText(field && field.label).slice(0, 40),
                    value: cleanText(field && field.value).slice(0, 160),
                }))
                .filter(field => field.label && field.value)
            : [];
        const metadataFields = {};
        if (info.metadataFields && typeof info.metadataFields === 'object') {
            Object.keys(info.metadataFields).forEach(key => {
                const value = cleanText(info.metadataFields[key]).slice(0, 160);
                if (value) metadataFields[key] = value;
            });
        }
        const sig = [
            info.title, info.number, info.contact,
            JSON.stringify(primaryResource),
            priority, status, lastActivity,
            pageWarning ? 'warning' : '',
            JSON.stringify(hoverFields),
            JSON.stringify(metadataFields),
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
            pageWarning: pageWarning,
            hoverFields: hoverFields,
            metadataFields: metadataFields,
        });
    }

    function startWatching() {
        if (!AES.isHandledUrl(location.href)) return;
        reportSelf();
        [250, 1000, 2500, 5000].forEach(delay => {
            setTimeout(reportSelf, delay);
        });
        const obs = new MutationObserver(() => reportSelf());
        obs.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true,
            characterData: true,
        });
        setTimeout(() => obs.disconnect(), 15000);
    }

    function handleImprovedScrollbarsMessage(data) {
        improvedScrollbarsEnabled = featureEnabled && !!data.enabled;
        document.documentElement.classList.toggle('aes-improved-scrollbars', improvedScrollbarsEnabled);
    }

    function requestImprovedScrollbarsState() {
        postToTop({ type: 'improved-scrollbars-request' });
    }

    AES.initIframeBridge = function initIframeBridge() {
        window.addEventListener('message', function (event) {
            const data = event.data;

            if (data && data.__ns === AES.MSG_NS && data.type === 'improved-scrollbars') {
                handleImprovedScrollbarsMessage(data);
                return;
            }
            if (data && data.__ns === AES.MSG_NS && data.type === 'metadata-refresh') {
                reportSelf();
                return;
            }
            if (data && data.__ns === AES.MSG_NS && data.type === 'feature-enabled') {
                featureEnabled = data.enabled !== false;
                if (!featureEnabled) {
                    handleImprovedScrollbarsMessage({ enabled: false });
                }
                return;
            }

            if (event.source !== window) return;
            if (event.origin !== location.origin) return;
            if (!data || data.__ns !== AES.MSG_NS) return;
            if (!featureEnabled) return;
            if (data.type === 'open' && data.url && AES.isHandledUrl(data.url)) {
                postToTop({ type: isPeekPopupUrl(data.url) ? 'open-peek' : 'open', url: data.url });
            }
            if (data.type === 'open-peek' && data.url && isPeekPopupUrl(data.url)) {
                postToTop({ type: 'open-peek', url: data.url });
            }
            if (data.type === 'map' && data.url) {
                postToTop({ type: 'map', url: data.url });
            }
            if (data.type === 'close-frame' || data.type === 'close-peek') {
                postToTop({ type: 'close-frame', target: data.target || '' });
            }
        }, true);

        function requestAllShellStates() {
            postToTop({ type: 'all-state-request' });
        }

        injectPageBridge();
        applyShellBarBodyPadding();
        injectScrollbarStyles();
        requestAllShellStates();
        window.setTimeout(requestAllShellStates, 500);
        window.setTimeout(requestAllShellStates, 1500);

        function armMapOpenFromEvent(event) {
            if (!featureEnabled) return;
            if (event.target.closest('.InlineIconButton.Map, .InlineIcon.Map')) {
                pendingMapOpenUntil = Date.now() + 5000;
            }
        }

        function postHandledNavigation(targetUrl) {
            postToTop({ type: isPeekPopupUrl(targetUrl) ? 'open-peek' : 'open', url: targetUrl });
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

            postHandledNavigation(targetUrl);
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
                if (targetUrl && (AES.isHandledUrl(targetUrl) || isPeekPopupUrl(targetUrl))) {
                    postHandledNavigation(targetUrl);
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

        function reportFrameInteraction() {
            postToTop({ type: 'frame-interaction' });
        }
        document.addEventListener('pointerdown', reportFrameInteraction, true);
        document.addEventListener('mousedown', reportFrameInteraction, true);
        document.addEventListener('focusin', reportFrameInteraction, true);

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
