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
    let brandEntityTitlebarObserver = null;
    let brandEntityTitlebarRaf = 0;

    function normalizeBrandColor(value) {
        const raw = String(value || '').trim();
        const short = raw.match(/^#([0-9a-f]{3})$/i);
        if (short) {
            return '#' + short[1].split('').map(function (char) { return char + char; }).join('').toLowerCase();
        }
        return /^#[0-9a-f]{6}$/i.test(raw) ? raw.toLowerCase() : '#376a94';
    }

    function hexToRgb(hex) {
        const normalized = String(hex || '').trim().replace('#', '');
        if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
        return {
            r: parseInt(normalized.slice(0, 2), 16),
            g: parseInt(normalized.slice(2, 4), 16),
            b: parseInt(normalized.slice(4, 6), 16)
        };
    }

    function colorToRgba(hex, alpha) {
        const rgb = hexToRgb(hex);
        if (!rgb) return '';
        return 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + alpha + ')';
    }

    function colorToSpriteFilter(hex) {
        const rgb = hexToRgb(hex);
        if (!rgb) return 'none';
        const max = Math.max(rgb.r, rgb.g, rgb.b);
        const min = Math.min(rgb.r, rgb.g, rgb.b);
        const lightness = (max + min) / 510;
        let hue = 0;
        const delta = max - min;
        if (delta) {
            if (max === rgb.r) hue = ((rgb.g - rgb.b) / delta) % 6;
            else if (max === rgb.g) hue = (rgb.b - rgb.r) / delta + 2;
            else hue = (rgb.r - rgb.g) / delta + 4;
            hue *= 60;
            if (hue < 0) hue += 360;
        }
        const saturation = max === min
            ? 0
            : delta / (255 - Math.abs((max + min) - 255));
        const brightness = Math.max(0.35, Math.min(1.65, 0.72 + lightness));
        const saturate = Math.max(0, Math.min(6, 0.55 + saturation * 4.2));
        return 'sepia(1) saturate(' + saturate.toFixed(2) + ') hue-rotate(' + (hue - 45).toFixed(0) + 'deg) brightness(' + brightness.toFixed(2) + ')';
    }

    function colorNeedsLightForeground(hex) {
        const rgb = hexToRgb(hex);
        if (!rgb) return false;
        const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
        return luminance < 0.54;
    }

    function colorToTitlebarIconFilter(hex) {
        return colorNeedsLightForeground(hex) ? 'brightness(0) invert(1)' : 'none';
    }

    function normalizeManagedBrandColor(value) {
        value = String(value || '').trim();
        if (/^[0-9a-f]{3}$/i.test(value) || /^[0-9a-f]{6}$/i.test(value)) {
            value = '#' + value;
        }
        const short = value.match(/^#([0-9a-f]{3})$/i);
        if (short) {
            return '#' + short[1].split('').map(function (char) { return char + char; }).join('').toLowerCase();
        }
        return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : '';
    }

    function applyEarlyBrandSettingsWithManaged(localSettings, managedSettings) {
        const settings = Object.assign({}, localSettings || {});
        const managedColor = normalizeManagedBrandColor(managedSettings && managedSettings.autotaskBrandColor);
        const hasManagedEnabled = managedSettings && typeof managedSettings.autotaskBrandColorEnabled === 'boolean';
        if (managedColor || hasManagedEnabled) {
            if (managedColor) settings.autotaskBrandColor = managedColor;
            settings.autotaskBrandColorEnabled = hasManagedEnabled
                ? managedSettings.autotaskBrandColorEnabled !== false
                : !!managedColor;
        }
        applyEarlyBrandSettings(settings);
    }

    function applyEarlyBrandSettings(settings) {
        if (!settings || settings.extensionEnabled === false || !settings.autotaskBrandColorEnabled) return;
        const color = normalizeBrandColor(settings.autotaskBrandColor);
        handleImprovedScrollbarsMessage({
            enabled: improvedScrollbarsEnabled,
            brandLinksEnabled: true,
            accentColor: color,
            iconFilter: colorToSpriteFilter(color),
            titlebarIconFilter: colorToTitlebarIconFilter(color),
            scrollbar: colorToRgba(color, 0.5),
            scrollbarHover: colorToRgba(color, 0.75),
            scrollbarDark: colorToRgba(color, 0.58),
            scrollbarDarkHover: colorToRgba(color, 0.82)
        });
    }

    function bootstrapBrandingFromStorage() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(AES.SETTINGS_STORAGE_KEY, function (result) {
                    const settings = result && result[AES.SETTINGS_STORAGE_KEY];
                    try {
                        if (chrome.storage.managed) {
                            chrome.storage.managed.get([
                                'autotaskBrandColor',
                                'autotaskBrandColorEnabled',
                            ], function (managed) {
                                try {
                                    if (chrome.runtime && chrome.runtime.lastError) {
                                        applyEarlyBrandSettings(settings);
                                        return;
                                    }
                                } catch (e) {
                                    applyEarlyBrandSettings(settings);
                                    return;
                                }
                                applyEarlyBrandSettingsWithManaged(settings, managed);
                            });
                            return;
                        }
                    } catch (e) {}
                    applyEarlyBrandSettings(settings);
                });
                return;
            }
        } catch (e) {}
        try {
            const raw = localStorage.getItem(AES.SETTINGS_STORAGE_KEY);
            applyEarlyBrandSettings(raw ? JSON.parse(raw) : null);
        } catch (e) {}
    }

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
            return path === '/mvc/servicedesk/timeentry.mvc/newtickettimeentrypage' ||
                path === '/mvc/servicedesk/note.mvc/newticketnotepage' ||
                path === '/billing/invoices/popups/wrkdetails.asp' ||
                path === '/opportunity/wizards/reassignlead/popwiz_frames.asp' ||
                path === '/mvc/projects/projectnote.mvc/newprojectnote' ||
                path === '/projects/calendar/prjcalendar.asp' ||
                path === '/mvc/file/attachment.mvc/projectattachment' ||
                path === '/mvc/projects/teammember.mvc/add' ||
                path === '/autotask/views/contracts/cost.aspx' ||
                path === '/autotask/views/projects/project_cost.aspx' ||
                path === '/mvc/timesheets/expense.mvc/createnewprojectexpense' ||
                path === '/projects/wizards/transformations/copyattributes/popwiz_frames.asp' ||
                path === '/projects/reports' ||
                path.startsWith('/projects/reports/') ||
                path === '/autotask35/dataselectorhandlers/ticketdataselectorpopup.aspx' ||
                path === '/mvc/projects/importticket.mvc/copytickettoproject' ||
                path === '/servicedesk/popups/forward/svcforward.asp' ||
                path === '/servicedesk/reports/togoreportframe.asp' ||
                path === '/mvc/servicedesk/tickethistory.mvc/servicetickethistory' ||
                path === '/mvc/crm/accounthistory.mvc/entitychangehistory' ||
                path === '/mvc/crm/documentmerge.mvc/accountdocumentmerge' ||
                path === '/mvc/crm/security.mvc/whocanviewaccount' ||
                path === '/popups/work/svcdetail.asp' ||
                path === '/popups/searches/srcclient.asp' ||
                path === '/administrator/roles/tabroleview.asp' ||
                path === '/autotask/views/administration/companysetup/neweditallocationcode.aspx' ||
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

        const el = target && target.closest ? target.closest('td[onclick], a[onclick], div[onclick], span[onclick]') : null;
        if (!el) return null;
        const onclickText = el.getAttribute('onclick') || '';
        const ticketByNumberMatch = onclickText.match(/openTicketByTicketNumber\s*\(\s*['"]([^'"]+)['"]/i);
        if (ticketByNumberMatch) {
            return AES.toAbsoluteUrl('/Mvc/ServiceDesk/TicketDetail.mvc/TicketByTicketNumber?ticketNumber=' + encodeURIComponent(ticketByNumberMatch[1]));
        }
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
            'html {',
            '    --aes-accent-link-color: #376A94;',
            '    --aes-accent-icon-filter: none;',
            '    --aes-titlebar-icon-filter: none;',
            '    --aes-accent-scrollbar: rgba(125, 167, 201, 0.5);',
            '    --aes-accent-scrollbar-hover: rgba(125, 167, 201, 0.75);',
            '    --aes-accent-scrollbar-dark: rgba(125, 167, 201, 0.58);',
            '    --aes-accent-scrollbar-dark-hover: rgba(125, 167, 201, 0.82);',
            '}',
            'html.aes-improved-scrollbars,',
            'html.aes-improved-scrollbars body,',
            'html.aes-improved-scrollbars * {',
            '    scrollbar-color: var(--aes-accent-scrollbar) transparent !important;',
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
            '    background-color: var(--aes-accent-scrollbar) !important;',
            '    border-radius: 999px !important;',
            '    border: 1px solid transparent !important;',
            '    background-clip: content-box !important;',
            '}',
            'html.aes-improved-scrollbars::-webkit-scrollbar-thumb:hover,',
            'html.aes-improved-scrollbars body::-webkit-scrollbar-thumb:hover,',
            'html.aes-improved-scrollbars *::-webkit-scrollbar-thumb:hover {',
            '    background-color: var(--aes-accent-scrollbar-hover) !important;',
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
            '    scrollbar-color: var(--aes-accent-scrollbar-dark) #0f141a !important;',
            '}',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme::-webkit-scrollbar-track,',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme body::-webkit-scrollbar-track,',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme *::-webkit-scrollbar-track {',
            '    background: transparent !important;',
            '}',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme::-webkit-scrollbar-thumb,',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme body::-webkit-scrollbar-thumb,',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme *::-webkit-scrollbar-thumb {',
            '    background-color: var(--aes-accent-scrollbar-dark) !important;',
            '    border-color: #0f141a !important;',
            '}',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme::-webkit-scrollbar-thumb:hover,',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme body::-webkit-scrollbar-thumb:hover,',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme *::-webkit-scrollbar-thumb:hover {',
            '    background-color: var(--aes-accent-scrollbar-dark-hover) !important;',
            '}',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme::-webkit-scrollbar-corner,',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme body::-webkit-scrollbar-corner,',
            'html.aes-improved-scrollbars.aes-autotask-dark-theme *::-webkit-scrollbar-corner {',
            '    background: transparent !important;',
            '}',
            'html.aes-brand-link-colors a[href],',
            'html.aes-brand-link-colors a.c-link,',
            'html.aes-brand-link-colors .c-link,',
            'html.aes-brand-link-colors .Link,',
            'html.aes-brand-link-colors td.Link,',
            'html.aes-brand-link-colors th.Link,',
            'html.aes-brand-link-colors .TextCell.Link,',
            'html.aes-brand-link-colors [onclick*="NewWindowPage"].Link,',
            'html.aes-brand-link-colors [onclick*="__openPage"].Link,',
            'html.aes-brand-link-colors .color-text-link,',
            'html.aes-brand-link-colors [class~="color-text-link"],',
            'html.aes-brand-link-colors .LinkButton2,',
            'html.aes-brand-link-colors .LinkButton2 .Text2,',
            'html.aes-brand-link-colors .LinkButtonContainer .Text2 {',
            '    color: var(--aes-accent-link-color) !important;',
            '}',
            'html.aes-brand-link-colors [class~="bg-background-selected"] {',
            '    background: var(--aes-accent-link-color) !important;',
            '    background-color: var(--aes-accent-link-color) !important;',
            '}',
            'html.aes-brand-link-colors [class~="color-text-selected"] {',
            '    color: #ffffff !important;',
            '}',
            'html.aes-brand-link-colors .o-tab.o-tab--is-selected:not(.o-tab--container-variant),',
            'html.aes-brand-link-colors .o-tab[aria-selected="true"]:not(.o-tab--container-variant),',
            'html.aes-brand-link-colors .o-tab.is-selected:not(.o-tab--container-variant) {',
            '    border-bottom-color: var(--aes-accent-link-color) !important;',
            '}',
            'html.aes-brand-link-colors .o-tab.o-tab--container-variant.o-tab--is-selected,',
            'html.aes-brand-link-colors .o-tab.o-tab--container-variant[aria-selected="true"],',
            'html.aes-brand-link-colors .o-tab.o-tab--container-variant.is-selected {',
            '    border-top-color: var(--aes-accent-link-color) !important;',
            '}',
            'html.aes-brand-link-colors .o-view-layout__body[style*="border-top"] {',
            '    border-top: 4px solid var(--aes-accent-link-color) !important;',
            '    border-top-color: var(--aes-accent-link-color) !important;',
            '}',
            'html.aes-brand-link-colors .o-view-layout__body .o-standard-icon[style*="light-dark"] {',
            '    color: var(--aes-accent-link-color) !important;',
            '}',
            'html.aes-brand-link-colors .Button.SelectedState,',
            'html.aes-brand-link-colors .Button2.SelectedState,',
            'html.aes-brand-link-colors a.Button.SelectedState,',
            'html.aes-brand-link-colors a.Button2.SelectedState {',
            '    border-bottom-color: var(--aes-accent-link-color) !important;',
            '}',
            'html.aes-brand-link-colors .Checkbox2 .TabIndexHack.Checked,',
            'html.aes-brand-link-colors .Checkbox2 .Checked {',
            '    background-color: var(--aes-accent-link-color) !important;',
            '    border-color: var(--aes-accent-link-color) !important;',
            '}',
            'html.aes-brand-link-colors input[type="checkbox"]:checked {',
            '    accent-color: var(--aes-accent-link-color) !important;',
            '}',
            'html.aes-brand-link-colors .o-checkbox-box--has-selection,',
            'html.aes-brand-link-colors .o-checkbox-box--is-selected {',
            '    color: var(--aes-accent-link-color) !important;',
            '    border-color: var(--aes-accent-link-color) !important;',
            '}',
            'html.aes-brand-link-colors .Checkbox2 .TabIndexHack.Checked .Checkmark,',
            'html.aes-brand-link-colors .Checkbox2 .Checked .Checkmark,',
            'html.aes-brand-link-colors .Checkbox2 .TabIndexHack.Checked .Checkmark path,',
            'html.aes-brand-link-colors .Checkbox2 .Checked .Checkmark path {',
            '    color: #ffffff !important;',
            '    fill: #ffffff !important;',
            '}',
            'html.aes-brand-link-colors .o-checkbox-box--has-selection span,',
            'html.aes-brand-link-colors .o-checkbox-box--is-selected span {',
            '    color: var(--aes-accent-link-color) !important;',
            '    fill: var(--aes-accent-link-color) !important;',
            '}',
            'html.aes-brand-link-colors .Button2.SuggestiveBackground,',
            'html.aes-brand-link-colors .Button.SuggestiveBackground,',
            'html.aes-brand-link-colors .Button2.Primary,',
            'html.aes-brand-link-colors .Button.Primary {',
            '    background: var(--aes-accent-link-color) !important;',
            '    background-color: var(--aes-accent-link-color) !important;',
            '    border-color: var(--aes-accent-link-color) !important;',
            '    color: var(--aes-brand-foreground-color, #ffffff) !important;',
            '}',
            'html.aes-brand-link-colors .Button2.SuggestiveBackground .Text2,',
            'html.aes-brand-link-colors .Button.SuggestiveBackground .Text,',
            'html.aes-brand-link-colors .Button2.Primary .Text2,',
            'html.aes-brand-link-colors .Button.Primary .Text {',
            '    color: #ffffff !important;',
            '}',
            'html.aes-brand-link-colors .Active.TitleBar.aes-brand-entity-titlebar,',
            'html.aes-brand-link-colors .TitleBar.Active.aes-brand-entity-titlebar {',
            '    background: var(--aes-accent-link-color) !important;',
            '    background-color: var(--aes-accent-link-color) !important;',
            '    border-color: var(--aes-accent-link-color) !important;',
            '    color: #ffffff !important;',
            '}',
            'html.aes-brand-link-colors .Active.TitleBar.aes-brand-entity-titlebar .Text,',
            'html.aes-brand-link-colors .Active.TitleBar.aes-brand-entity-titlebar .SecondaryText,',
            'html.aes-brand-link-colors .TitleBar.Active.aes-brand-entity-titlebar .Text,',
            'html.aes-brand-link-colors .TitleBar.Active.aes-brand-entity-titlebar .SecondaryText {',
            '    color: #ffffff !important;',
            '}',
            'html.aes-brand-link-colors .Active.TitleBar.aes-brand-entity-titlebar .TitleBarButton:hover,',
            'html.aes-brand-link-colors .TitleBar.Active.aes-brand-entity-titlebar .TitleBarButton:hover {',
            '    background-color: rgba(255, 255, 255, 0.18) !important;',
            '}',
            'html.aes-brand-link-colors .Active.TitleBar.aes-brand-entity-titlebar .TitleBarIcon,',
            'html.aes-brand-link-colors .TitleBar.Active.aes-brand-entity-titlebar .TitleBarIcon,',
            'html.aes-brand-link-colors .Active.TitleBar .TitleBarIcon.Star,',
            'html.aes-brand-link-colors .Active.TitleBar .TitleBarIcon.Help,',
            'html.aes-brand-link-colors .TitleBar.Active .TitleBarIcon.Star,',
            'html.aes-brand-link-colors .TitleBar.Active .TitleBarIcon.Help {',
            '    filter: var(--aes-titlebar-icon-filter, none) !important;',
            '}',
            'html.aes-brand-link-colors .EntityPageColorBar,',
            'html.aes-brand-link-colors .EntityPageColorBar.Ticket {',
            '    background: var(--aes-accent-link-color) !important;',
            '    background-color: var(--aes-accent-link-color) !important;',
            '    border-color: var(--aes-accent-link-color) !important;',
            '}',
            'html.aes-brand-link-colors .TabButton.Active,',
            'html.aes-brand-link-colors .TabButton.EntityPageTabIcon.Active {',
            '    border-bottom-color: var(--aes-accent-link-color) !important;',
            '}',
            'html.aes-brand-link-colors .TabButton.Active .Text,',
            'html.aes-brand-link-colors .TabButton.EntityPageTabIcon.Active .Text {',
            '    color: var(--aes-accent-link-color) !important;',
            '}',
            'html.aes-brand-link-colors .TabButton.Active .Icon,',
            'html.aes-brand-link-colors .TabButton.EntityPageTabIcon.Active .Icon {',
            '    filter: var(--aes-accent-icon-filter, none) !important;',
            '}',
        ].join('\n');
        function attach() {
            (document.head || document.documentElement).appendChild(style);
        }
        if (document.head || document.documentElement) attach();
        else document.addEventListener('DOMContentLoaded', attach, { once: true });
    }

    const BRANDABLE_ENTITY_TITLEBAR_TITLES = new Set([
        'organization',
        'contact',
        'ticket',
        'task',
        'opportunity',
        'device'
    ]);

    function updateBrandEntityTitlebars() {
        brandEntityTitlebarRaf = 0;
        const bars = document.querySelectorAll('.Active.TitleBar, .TitleBar.Active');
        bars.forEach(function (bar) {
            const titleEl = bar.querySelector('.TitleBarItem.Title > .Text, .Title > .Text, .TitleBarItem.Title .Text');
            const title = cleanText(titleEl && titleEl.textContent)
                .toLowerCase()
                .replace(/\s*[-–]\s*$/, '')
                .replace(/^edit\s+/, '')
                .replace(/^new\s+/, '');
            bar.classList.toggle('aes-brand-entity-titlebar', BRANDABLE_ENTITY_TITLEBAR_TITLES.has(title));
        });
    }

    function scheduleBrandEntityTitlebarUpdate() {
        if (brandEntityTitlebarRaf) return;
        brandEntityTitlebarRaf = window.requestAnimationFrame(updateBrandEntityTitlebars);
    }

    function startBrandEntityTitlebarWatcher() {
        scheduleBrandEntityTitlebarUpdate();
        if (brandEntityTitlebarObserver || !(document.body || document.documentElement)) return;
        brandEntityTitlebarObserver = new MutationObserver(scheduleBrandEntityTitlebarUpdate);
        brandEntityTitlebarObserver.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true,
            characterData: true,
        });
    }

    function stopBrandEntityTitlebarWatcher() {
        if (brandEntityTitlebarObserver) {
            brandEntityTitlebarObserver.disconnect();
            brandEntityTitlebarObserver = null;
        }
        if (brandEntityTitlebarRaf) {
            window.cancelAnimationFrame(brandEntityTitlebarRaf);
            brandEntityTitlebarRaf = 0;
        }
        document.querySelectorAll('.aes-brand-entity-titlebar').forEach(function (bar) {
            bar.classList.remove('aes-brand-entity-titlebar');
        });
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

    function createHandledWindow(url) {
        const targetUrl = AES.toAbsoluteUrl(decodeUrl(String(url || '')));
        return {
            closed: false,
            opener: window,
            location: { href: targetUrl || '' },
            focus: function () {},
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

    function isUmbrellaContractFrameUrl(url) {
        try {
            const parsed = new URL(url || location.href, location.origin);
            return parsed.pathname.toLowerCase() === '/autotaskonyx/landingpage' &&
                parsed.searchParams.get('view') === 'umbrella-contract-details';
        } catch (e) {
            return false;
        }
    }

    function isReportableFrameUrl(url) {
        return AES.isHandledUrl(url) || isUmbrellaContractFrameUrl(url);
    }

    function isLegacyContractViewUrl(url) {
        return AES.normalizeHandledPath(AES.pathOf(url || '')) === '/contracts/views/contractview.asp';
    }

    function isDialogPopOutFromDialogUrl(url) {
        const path = AES.normalizeHandledPath(AES.pathOf(url || ''));
        return path === '/mvc/servicedesk/timeentry.mvc/timeentrypopoutfromdialog' ||
            path === '/mvc/servicedesk/note.mvc/notepopoutfromdialog';
    }

    function umbrellaContractIdFromFrameUrl(url) {
        try {
            const parsed = new URL(url || location.href, location.origin);
            const rawViewData = parsed.searchParams.get('view-data') || '';
            if (!rawViewData) return '';
            const data = JSON.parse(atob(rawViewData));
            const contractId = data && data.contractId;
            return contractId === undefined || contractId === null ? '' : String(contractId);
        } catch (e) {
            return '';
        }
    }

    function findOnyxFieldValue(labelText) {
        const wanted = cleanText(labelText).toLowerCase();
        if (!wanted) return '';
        const labelsToReject = [
            'account',
            'organization',
            'account manager',
            'contact',
            'contact name',
            'contract type',
            'category',
            'contract category',
            'start date',
            'end date',
            'exclusions',
            'coverage',
            'activity',
        ];
        const isSaneFieldValue = function (value) {
            const text = cleanText(value);
            if (!text || text.toLowerCase() === wanted || text.length > 140) return false;
            const lower = text.toLowerCase();
            let labelHits = 0;
            labelsToReject.forEach(function (label) {
                if (lower.includes(label)) labelHits += 1;
            });
            return labelHits < 2;
        };
        const readPreferredValue = function (root) {
            if (!root) return '';
            const selectors = [
                '.LinkButton2 .Text2',
                '.LinkButton2',
                '.ReadOnlyValueContainer .Value > .Text2',
                '.ReadOnlyValueContainer .Value',
                '.Value > .Text2',
                '.Value > .Text',
                '.Value',
                'a',
                '[role="link"]',
                'input',
                'textarea',
                'select',
            ];
            for (const selector of selectors) {
                const el = root.matches && root.matches(selector) ? root : root.querySelector(selector);
                if (!el) continue;
                let value = '';
                if (el.matches && el.matches('input, textarea, select')) {
                    if (el.matches('select')) {
                        value = cleanText(el.selectedOptions && el.selectedOptions[0] && el.selectedOptions[0].textContent);
                    } else {
                        value = cleanText(el.value);
                    }
                } else {
                    value = cleanText(el.textContent);
                }
                if (isSaneFieldValue(value)) return value.slice(0, 120);
            }
            const clone = root.cloneNode(true);
            clone.querySelectorAll('button, svg, img, script, style, .WalkMeIconPlaceholder, [aria-hidden="true"]').forEach(function (el) {
                el.remove();
            });
            const value = cleanText(clone.textContent);
            return isSaneFieldValue(value) ? value.slice(0, 120) : '';
        };

        for (const row of document.querySelectorAll('.ReadOnlyData')) {
            const label = row.querySelector('.ReadOnlyLabelContainer .PrimaryText, .ReadOnlyLabelContainer .Text');
            if (!label || cleanText(label.textContent).toLowerCase() !== wanted) continue;
            const value = row.querySelector('.ReadOnlyValueContainer');
            const extracted = readPreferredValue(value);
            if (extracted) return extracted;
        }

        const candidates = Array.from(document.querySelectorAll('.o-label__text, label.o-label__text, label, .PrimaryText'))
            .filter(function (el) {
                return cleanText(el.textContent).toLowerCase() === wanted;
            });
        for (const label of candidates) {
            const labelCell = label.closest('.ReadOnlyLabelContainer, .o-flex-child, [class*="LabelContainer"]') || label.parentElement;
            const valueCell = labelCell && labelCell.nextElementSibling;
            const extracted = readPreferredValue(valueCell);
            if (extracted) return extracted;
        }
        return '';
    }

    function extractUmbrellaContractInfo() {
        const contractId = umbrellaContractIdFromFrameUrl(location.href);
        const titleEl = document.querySelector(
            '.o-view-layout__header h1, .o-font--page-title-bold, [class*="page-title"], h1'
        );
        const rawTitle = cleanText(titleEl && titleEl.textContent);
        const documentTitle = cleanText(document.title).replace(/^Autotask\s*[-–]\s*/i, '');
        const title = (rawTitle && rawTitle.length <= 140 ? rawTitle : '') ||
            (documentTitle && documentTitle.length <= 140 ? documentTitle : '') ||
            'Umbrella Contract';
        const account = findOnyxFieldValue('Account') || findOnyxFieldValue('Organization');
        const accountManager = findOnyxFieldValue('Account Manager');
        const contactName = findOnyxFieldValue('Contact Name') || findOnyxFieldValue('Contact');
        const contractType = findOnyxFieldValue('Contract Type');
        const category = findOnyxFieldValue('Category') || findOnyxFieldValue('Contract Category');
        const startDate = findOnyxFieldValue('Start date') || findOnyxFieldValue('Start Date');
        const endDate = findOnyxFieldValue('End date') || findOnyxFieldValue('End Date');
        const hoverFields = [
            { label: 'Account', value: account },
            { label: 'Account Manager', value: accountManager },
            { label: 'Contact Name', value: contactName },
            { label: 'Contract Type', value: contractType },
            { label: 'Category', value: category },
            { label: 'Start date', value: startDate },
            { label: 'End date', value: endDate },
        ].filter(field => field.value);

        return {
            title: title.slice(0, 120),
            number: contractId ? ('ID ' + contractId).slice(0, 40) : 'Umbrella Contract',
            contact: account.slice(0, 80),
            hoverFields: hoverFields,
            metadataFields: {
                type: 'Umbrella Contract',
                id: contractId ? ('ID ' + contractId).slice(0, 40) : '',
                organization: account.slice(0, 80),
                accountManager: accountManager.slice(0, 80),
                contactName: contactName.slice(0, 80),
                contractType: contractType.slice(0, 80),
                contractCategory: category.slice(0, 80),
                startDate: startDate.slice(0, 80),
                endDate: endDate.slice(0, 80),
            },
        };
    }

    let embeddedUmbrellaContractObserver = null;
    function applyEmbeddedUmbrellaContractChrome() {
        if (!isUmbrellaContractFrameUrl(location.href)) return;
        document.documentElement.classList.add('aes-embedded-umbrella-contract');
        if (document.body) document.body.classList.add('aes-embedded-umbrella-contract-body');

        let shell = null;
        try {
            shell = document.body && document.body.querySelector(':scope > .relative.w-full.h-full > .h-screen.flex.flex-col.bg-background-secondary');
        } catch (e) {}
        if (!shell) return;

        const topBar = shell.children && shell.children[0];
        if (topBar && topBar.style) topBar.style.setProperty('display', 'none', 'important');

        const contentRow = shell.children && shell.children[1];
        if (contentRow && contentRow.style) {
            contentRow.style.setProperty('height', '100vh', 'important');
            contentRow.style.setProperty('min-height', '0', 'important');
        }

        let sideNav = null;
        let content = null;
        try {
            sideNav = contentRow && contentRow.querySelector(':scope > .relative.z-1');
            content = contentRow && contentRow.querySelector(':scope > .min-w-0.flex-1');
        } catch (e) {}
        if (sideNav && sideNav.style) sideNav.style.setProperty('display', 'none', 'important');
        if (content && content.style) {
            content.style.setProperty('width', '100%', 'important');
            content.style.setProperty('height', '100%', 'important');
            content.style.setProperty('border-radius', '0', 'important');
            content.style.setProperty('box-shadow', 'none', 'important');
        }
    }

    function installEmbeddedUmbrellaContractChrome() {
        if (!isUmbrellaContractFrameUrl(location.href)) return;
        if (!document.getElementById('aes-embedded-umbrella-contract-style')) {
            const style = document.createElement('style');
            style.id = 'aes-embedded-umbrella-contract-style';
            style.textContent = `
html.aes-embedded-umbrella-contract,
html.aes-embedded-umbrella-contract body {
  width: 100% !important;
  height: 100% !important;
  overflow: hidden !important;
}
html.aes-embedded-umbrella-contract body > .relative.w-full.h-full,
html.aes-embedded-umbrella-contract body > .relative.w-full.h-full > .h-screen.flex.flex-col.bg-background-secondary {
  height: 100vh !important;
  min-height: 0 !important;
}
html.aes-embedded-umbrella-contract body > .relative.w-full.h-full > .h-screen.flex.flex-col.bg-background-secondary > div:first-child {
  display: none !important;
}
html.aes-embedded-umbrella-contract body > .relative.w-full.h-full > .h-screen.flex.flex-col.bg-background-secondary > .relative.min-h-0.flex-1.flex {
  height: 100vh !important;
  min-height: 0 !important;
}
html.aes-embedded-umbrella-contract body > .relative.w-full.h-full > .h-screen.flex.flex-col.bg-background-secondary > .relative.min-h-0.flex-1.flex > .relative.z-1 {
  display: none !important;
}
html.aes-embedded-umbrella-contract body > .relative.w-full.h-full > .h-screen.flex.flex-col.bg-background-secondary > .relative.min-h-0.flex-1.flex > .min-w-0.flex-1,
html.aes-embedded-umbrella-contract .o-view-layout {
  width: 100% !important;
  height: 100% !important;
  min-height: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}`;
            (document.head || document.documentElement).appendChild(style);
        }
        applyEmbeddedUmbrellaContractChrome();
        [100, 300, 800, 1600, 3000].forEach(function (delay) {
            window.setTimeout(applyEmbeddedUmbrellaContractChrome, delay);
        });
        if (embeddedUmbrellaContractObserver || !document.documentElement) return;
        embeddedUmbrellaContractObserver = new MutationObserver(applyEmbeddedUmbrellaContractChrome);
        embeddedUmbrellaContractObserver.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
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

    function extractTicketTitlebarInfo() {
        const secondaryEl = document.querySelector('.TitleBarItem.Title .SecondaryText, .Title .SecondaryText');
        const secondary = cleanText(secondaryEl && secondaryEl.textContent);
        const numberMatch = secondary.match(/\bT\d{8}\.\d{3,5}\b/);
        const organizationMatch = secondary.match(/\(([^()]*)\)\s*$/);
        const number = numberMatch ? numberMatch[0] : '';
        let title = secondary;
        if (number) title = title.replace(number, '');
        title = title
            .replace(/^\s*[-–]\s*/, '')
            .replace(/\s*\([^)]*\)\s*$/, '')
            .trim();
        return {
            number: number,
            title: title,
            organization: organizationMatch ? cleanText(organizationMatch[1]) : '',
        };
    }

    function extractTicketInfo() {
        const isTicketEditPage = AES.normalizeHandledPath(AES.pathOf(location.href)) === '/mvc/servicedesk/ticketedit.mvc';
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

        const titlebarInfo = extractTicketTitlebarInfo();
        if (!number) number = titlebarInfo.number;
        if (isTicketEditPage || !title || /^edit ticket\s*[-–]?$/i.test(title)) title = titlebarInfo.title || title;

        const organization = findFieldValue('Organization') || titlebarInfo.organization;
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

        const project = findReadOnlyValueByLabel(['Project']) || findFieldValue('Project');
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
            { label: 'Project', value: project.slice(0, 120) },
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
                project: project.slice(0, 120),
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

    function extractNewContractWizardInfo() {
        const info = extractGenericInfo('Contract');
        const titleEl = document.querySelector('.TitleBarItem.Title > .Text, .PageHeadingContainer .Title .Text, .Title .Text');
        const secondaryEl = document.querySelector('.TitleBarItem.Title .SecondaryText, .Title .SecondaryText, .SecondaryTitle');
        let title = cleanText(titleEl && titleEl.textContent) || info.title || 'New Contract Wizard';
        let secondaryTitle = cleanSecondaryTitleText(secondaryEl && secondaryEl.textContent) || info.number || '';

        if (!secondaryTitle && /\s+-\s+/.test(title)) {
            const parts = title.split(/\s+-\s+/);
            title = cleanText(parts.shift()) || title;
            secondaryTitle = cleanText(parts.join(' - '));
        } else if (secondaryTitle) {
            const suffix = new RegExp('\\s+-\\s+' + secondaryTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
            title = cleanText(title.replace(suffix, '')) || title;
        }

        return {
            title: title,
            number: secondaryTitle,
            contact: '',
            hoverFields: secondaryTitle ? [{ label: 'Contract type', value: secondaryTitle }] : [],
            metadataFields: Object.assign({}, info.metadataFields || {}, {
                type: 'Contract',
                secondaryTitle: secondaryTitle.slice(0, 120),
                contractType: secondaryTitle.slice(0, 80),
            }),
        };
    }

    function extractAccountInfo() {
        const heading = document.querySelector('.EntityHeadingContainer');
        let number = '', title = '';
        if (heading) {
            const idEl = heading.querySelector('.IdentificationText');
            if (idEl) number = cleanText(idEl.textContent).replace(/^ID\b\s*:?\s*/i, '');
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
            if (idEl) number = cleanText(idEl.textContent).replace(/^ID\b\s*:?\s*/i, '');
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
            if (idEl) number = cleanText(idEl.textContent).replace(/^ID\b\s*:?\s*/i, '');
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

    function extractInvoiceViewerInfo() {
        const params = new URLSearchParams(location.search);
        const invoiceId = params.get('invoiceId') || params.get('invoiceID') || params.get('invoiceid') || '';
        const batchId = params.get('batchId') || params.get('batchID') || params.get('batchid') || '';
        const titleEl = document.querySelector('.TitleBarItem.Title .Text, .Title .Text');
        const titleFromPage = cleanText(titleEl && titleEl.textContent);
        const selectedInvoiceOption = document.querySelector('.ToolBarItem.Pager select option[selected], .ToolBarItem.Pager select option:checked, .ToolBarItem.Pager select');
        const optionText = cleanText(selectedInvoiceOption && (selectedInvoiceOption.selectedOptions && selectedInvoiceOption.selectedOptions[0]
            ? selectedInvoiceOption.selectedOptions[0].textContent
            : selectedInvoiceOption.textContent));
        let organization = '';
        let purchaseOrder = '';
        const poMatch = optionText.match(/^(.*?)\s*\(PO:\s*(.*?)\)\s*$/i);
        if (poMatch) {
            organization = cleanText(poMatch[1]);
            purchaseOrder = cleanText(poMatch[2]);
        } else {
            organization = optionText;
        }
        const title = titleFromPage || organization || (invoiceId ? 'Invoice ' + invoiceId : batchId ? 'Invoice Batch ' + batchId : 'Invoice');
        return {
            title: title.slice(0, 120),
            number: purchaseOrder || (invoiceId ? 'ID ' + invoiceId : batchId ? 'Batch ' + batchId : 'Invoice'),
            contact: organization,
            metadataFields: {
                type: 'Invoice',
                id: invoiceId ? 'ID ' + invoiceId : '',
                purchaseOrder: purchaseOrder,
                organization: organization,
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

    function extractInventoryProductInfo() {
        const params = new URLSearchParams(location.search);
        const productMode = String(params.get('cmd') || '').toLowerCase();
        const titleEl = document.querySelector('.TitleBarItem.Title > .Text, .PageHeadingContainer .Title .Text, .Title .Text, h1');
        const chipText = cleanText(document.querySelector('.ChipList.SingleDataSelection .Chip .Text, .ChipList .Chip .Text')?.textContent);
        const legacyProductInput = document.getElementById('txtProductName_ATTextEdit');
        const legacyCategoryInput = document.getElementById('txtProductCategory_ATTextEdit');
        const activeCheckbox = document.getElementById('chkActive_ATCheckBox');
        const categoryText = cleanText(document.querySelector('.SelectionDisplay .Item[data-item-type="SingleText"] .Text, .SelectionDisplay .Item .Text')?.textContent) ||
            cleanText(legacyCategoryInput && legacyCategoryInput.value);
        const isInactiveChip = /\(\s*inactive\s*\)\s*$/i.test(chipText);
        const productName = cleanText(chipText.replace(/\(\s*inactive\s*\)\s*$/i, '')) ||
            cleanText(legacyProductInput && legacyProductInput.value);
        const isInactive = isInactiveChip || !!(activeCheckbox && !activeCheckbox.checked);
        const title = productName || cleanText(titleEl && titleEl.textContent) || 'New Inventory Product';
        const isNew = !productName;
        const isLegacyNew = productMode === 'new' || String(params.get('productID') || params.get('productId') || '').trim() === '0';
        return {
            title: isNew || isLegacyNew ? 'New Inventory Product' : title,
            number: categoryText,
            contact: '',
            primaryResource: null,
            hoverFields: categoryText ? [{ label: 'Category', value: categoryText.slice(0, 120) }] : [],
            metadataFields: {
                type: 'Inventory Product',
                productCategory: categoryText.slice(0, 120),
                productInactive: isInactive ? 'true' : '',
                productIsNew: isNew || isLegacyNew ? 'true' : '',
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


    function extractTicketActivityInfo() {
        const info = extractGenericInfo('Notes and Time Entries');
        const ticketNumber = cleanText(document.querySelector('.Left .IdentificationTextContainer .IdentificationText, .IdentificationText')?.textContent);
        const ticketTitle = cleanText(document.querySelector('.Left > .Title .Text, .IdentificationTextContainer + .Title .Text')?.textContent);
        const organizationMatch = ticketTitle.match(/\(([^()]*)\)\s*$/);
        const organization = cleanText(organizationMatch && organizationMatch[1]);

        info.number = ticketNumber || info.number || '';
        info.contact = organization || info.contact || '';
        info.hoverFields = ticketNumber ? [{ label: 'Ticket number', value: ticketNumber.slice(0, 40) }] : [];
        info.metadataFields = Object.assign({}, info.metadataFields || {}, {
            type: 'Notes and Time Entries',
            number: info.number,
            ticketTitle: ticketTitle,
            organization: organization,
        });
        return info;
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
        if (isUmbrellaContractFrameUrl(location.href)) {
            return extractUmbrellaContractInfo();
        }
        const p = AES.normalizeHandledPath(AES.pathOf(location.href));
        if (p === '/mvc/inventory/costitem.mvc/shipping') {
            return extractGenericInfo('Shipping');
        }
        if (p === '/home/timeentry/wrkentryframes.asp' ||
            p === '/timesheets/views/readonly/tmsreadonly_100.asp') {
            return extractTimesheetInfo();
        }
        if (p === '/mvc/contracts/newcontractwizard.mvc/newcontractwizard') {
            return extractNewContractWizardInfo();
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
        if (p === '/mvc/servicedesk/ticketdetail.mvc' || p === '/mvc/servicedesk/ticketedit.mvc') {
            return extractTicketInfo();
        }
        if (p === '/mvc/servicedesk/timeentry.mvc/newtickettimeentrypage' ||
            p === '/mvc/servicedesk/note.mvc/newticketnotepage') {
            return extractTicketActivityInfo();
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
        if (p === '/mvc/contracts/invoiceviewer.mvc' ||
            p === '/mvc/contracts/invoiceviewer.mvc/invoicebatchviewer' ||
            p === '/mvc/contracts/invoiceviewer.mvc/invoicepreviewviewer') {
            return extractInvoiceViewerInfo();
        }
        if (p === '/autotask/views/administration/products/product.aspx' ||
            p === '/mvc/inventory/inventoryproduct.mvc/create' ||
            p === '/mvc/inventory/inventoryproduct.mvc/edit') {
            return extractInventoryProductInfo();
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

    // Autotask renders an Access Denied state when the user lacks
    // permission to view the requested entity. This is intentionally
    // STRICT — earlier heuristics (substring class/id match, body
    // text scans) false-positived on innocent pages and broke tabs.
    // Only two signals trigger the override:
    //   1. URL pathname exactly equals the Authorization Failure
    //      endpoint Autotask redirects to.
    //   2. document.title begins with "Access Denied" (allowing
    //      trailing " - Autotask" style suffixes). This catches the
    //      inline render case where the URL stays on the entity.
    function isAccessDeniedPage() {
        try {
            const path = AES.normalizeHandledPath(location.pathname);
            if (path === '/mvc/security/authorization.mvc/failure') return true;
            const titleText = String(document.title || '').trim();
            if (/^access\s*denied\b/i.test(titleText)) return true;
        } catch (e) {}
        return false;
    }

    function reportSelf() {
        if (!isReportableFrameUrl(location.href)) return;
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
        if (isAccessDeniedPage()) {
            info.title = 'Access Denied';
            info.number = '';
            info.contact = '';
            info.primaryResource = null;
            info.priority = '';
            info.status = '';
            info.lastActivity = '';
            info.hoverFields = [];
            info.metadataFields = Object.assign({}, info.metadataFields || {}, {
                type: 'access denied',
            });
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
        const browserTitle = cleanText(document.title);
        const sig = [
            info.title, info.number, info.contact,
            browserTitle,
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
            browserTitle: browserTitle,
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
        if (!isReportableFrameUrl(location.href)) return;
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
        const root = document.documentElement;
        if (data.accentColor) root.style.setProperty('--aes-accent-link-color', data.accentColor);
        if (data.iconFilter) root.style.setProperty('--aes-accent-icon-filter', data.iconFilter);
        if (data.titlebarIconFilter) root.style.setProperty('--aes-titlebar-icon-filter', data.titlebarIconFilter);
        if (data.scrollbar) root.style.setProperty('--aes-accent-scrollbar', data.scrollbar);
        if (data.scrollbarHover) root.style.setProperty('--aes-accent-scrollbar-hover', data.scrollbarHover);
        if (data.scrollbarDark) root.style.setProperty('--aes-accent-scrollbar-dark', data.scrollbarDark);
        if (data.scrollbarDarkHover) root.style.setProperty('--aes-accent-scrollbar-dark-hover', data.scrollbarDarkHover);
        root.classList.toggle('aes-brand-link-colors', featureEnabled && !!data.brandLinksEnabled);
        if (featureEnabled && !!data.brandLinksEnabled) startBrandEntityTitlebarWatcher();
        else stopBrandEntityTitlebarWatcher();
        document.documentElement.classList.toggle('aes-improved-scrollbars', improvedScrollbarsEnabled);
    }

    function requestImprovedScrollbarsState() {
        postToTop({ type: 'improved-scrollbars-request' });
    }

    AES.initIframeBridge = function initIframeBridge() {
        installEmbeddedUmbrellaContractChrome();
        document.documentElement.classList.toggle(
            'aes-ticket-detail-page',
            AES.normalizeHandledPath(AES.pathOf(location.href)) === '/mvc/servicedesk/ticketdetail.mvc' ||
            AES.normalizeHandledPath(AES.pathOf(location.href)) === '/mvc/servicedesk/ticketedit.mvc'
        );

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
            if (data.type === 'contract-open' && data.url) {
                postToTop({ type: 'contract-open', url: data.url });
                return;
            }
            if (data.type === 'contract-open-duplicate' && data.url) {
                postToTop({ type: 'contract-open-duplicate', url: data.url });
                return;
            }
            if (data.type === 'umbrella-open' && data.url) {
                postToTop({ type: 'umbrella-open', url: data.url });
                return;
            }
            if (data.type === 'umbrella-open-duplicate' && data.url) {
                postToTop({ type: 'umbrella-open-duplicate', url: data.url });
                return;
            }
            if (data.type === 'open' && data.url && AES.isHandledUrl(data.url)) {
                postToTop({ type: isPeekPopupUrl(data.url) ? 'open-peek' : 'open', url: data.url });
            }
            if (data.type === 'open-peek' && data.url && isPeekPopupUrl(data.url)) {
                postToTop({ type: 'open-peek', url: data.url });
            }
            if (data.type === 'native-open' && data.url && AES.isNativeHomeUrl(data.url)) {
                postToTop({ type: 'native-open', url: data.url });
            }
            if (data.type === 'map' && data.url) {
                postToTop({ type: 'map', url: data.url });
            }
            if (data.type === 'close-frame' || data.type === 'close-peek') {
                postToTop({ type: 'close-frame', target: data.target || '' });
            }
            if (data.type === 'open-dialog-popout' && data.url && Array.isArray(data.fields)) {
                // The page-bridge caught a dialog PopOut form.submit() and
                // sent the payload our way. Forward it to the top shell
                // which will spin up an AES tab and re-POST the form
                // into it.
                postToTop({
                    type: 'open-dialog-popout',
                    url: data.url,
                    method: data.method || 'post',
                    fields: data.fields,
                });
            }
        }, true);

        function requestAllShellStates() {
            postToTop({ type: 'all-state-request' });
        }

        injectPageBridge();
        applyShellBarBodyPadding();
        injectScrollbarStyles();
        bootstrapBrandingFromStorage();
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
            postToTop({
                type: isPeekPopupUrl(targetUrl)
                    ? 'open-peek'
                    : isLegacyContractViewUrl(targetUrl) ? 'contract-open' : 'open',
                url: targetUrl,
            });
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

        let lastPeekSaveCloseClickAt = 0;
        function textFromElement(el) {
            return cleanText(el && (
                el.innerText ||
                el.textContent ||
                el.value ||
                el.getAttribute && (el.getAttribute('title') || el.getAttribute('aria-label')) ||
                ''
            ));
        }
        function isSaveCloseTrigger(target) {
            const el = target && target.closest
                ? target.closest('button,a,input,[role="button"],.Button,.Button2,.LinkButton2,[onclick]')
                : null;
            if (!el) return false;
            const text = textFromElement(el);
            return /\bsave\s*(?:&|and)\s*(?:close|quit)\b/i.test(text);
        }
        document.addEventListener('click', function (event) {
            if (!featureEnabled) return;
            if (!isPeekPopupUrl(location.href)) return;
            if (isSaveCloseTrigger(event.target)) {
                lastPeekSaveCloseClickAt = Date.now();
            }
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

        // Autotask's PopOut button on note / time-entry dialogs submits a
        // hidden POST form with target="_blank" — the response is what
        // becomes the standalone popout window. The endpoint can't be
        // opened with a bare GET because it depends on the form's
        // payload (session token, ticket id, dialog state). Cancel the
        // native submit and forward the full payload to the top shell,
        // which re-submits the same form into a fresh AES-tab iframe.
        document.addEventListener('submit', function (event) {
            if (!featureEnabled) return;
            const form = event.target;
            if (!form || form.tagName !== 'FORM') return;
            let actionUrl = '';
            try { actionUrl = new URL(form.action, location.href).href; }
            catch (e) { return; }
            if (!isDialogPopOutFromDialogUrl(actionUrl)) return;
            const target = (form.target || '').toLowerCase();
            if (target !== '_blank' && target !== 'new') return;
            event.preventDefault();
            event.stopPropagation();
            const fields = [];
            Array.prototype.forEach.call(form.elements, function (el) {
                if (!el || !el.name) return;
                if (el.disabled) return;
                const elType = (el.type || '').toLowerCase();
                if (elType === 'submit' || elType === 'button' || elType === 'reset'
                    || elType === 'image' || elType === 'file') return;
                if ((elType === 'checkbox' || elType === 'radio') && !el.checked) return;
                fields.push({
                    name: el.name,
                    value: typeof el.value === 'string' ? el.value : '',
                });
            });
            postToTop({
                type: 'open-dialog-popout',
                url: actionUrl,
                method: (form.method || 'post').toLowerCase(),
                fields: fields,
            });
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
                if (targetUrl && isDialogPopOutFromDialogUrl(targetUrl)) {
                    // Same reasoning as the page-bridge override:
                    // don't let popout URLs spawn a real browser tab
                    // here. The form.submit intercept in the
                    // page-bridge has already pushed the right POST
                    // payload to the shell so an AES tab is being
                    // created — opening a browser tab in parallel
                    // would just produce an Autotask error page.
                    return createHandledWindow(targetUrl);
                }
                if (targetUrl && (AES.isHandledUrl(targetUrl) || isPeekPopupUrl(targetUrl))) {
                    postHandledNavigation(targetUrl);
                    return createHandledWindow(targetUrl);
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
            if (isPeekPopupUrl(location.href) && lastPeekSaveCloseClickAt && Date.now() - lastPeekSaveCloseClickAt < 8000) {
                postToTop({ type: 'close-frame', target: 'peek' });
            }
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
