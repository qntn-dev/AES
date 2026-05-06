(function () {
    'use strict';

    const AES = window.__AES__;
    if (!AES || !AES.isTop) return;

    /**
     * Purpose: AES shell bootstrap and behavior core.
     * Owns: tab lifecycle, layout, Peek, settings wiring, metadata display, and shell messages.
     * Must not own: static metadata option tables or the shell CSS payload.
     * Companion files: aes-shell-runtime.js, aes-shell-config.js, aes-shell-styles.js.
     */
    if (AES.isAllowedHost && !AES.isAllowedHost(location.href)) return;
    const AES_RUNTIME_BUILD_ID = '0.8.0-stable-1';
    const AES_RUNTIME_BUILD_STORAGE_KEY = 'aes-runtime-build-id';
    const AES_RUNTIME_BUILD_RELOAD_KEY = 'aes-runtime-build-reload-id';

    function readRuntimeBuildStorage(storage, key) {
        try { return storage.getItem(key) || ''; }
        catch (e) { return ''; }
    }

    function writeRuntimeBuildStorage(storage, key, value) {
        try { storage.setItem(key, value); }
        catch (e) {}
    }

    function requestRuntimeBuildReload(reason) {
        const alreadyReloaded = readRuntimeBuildStorage(sessionStorage, AES_RUNTIME_BUILD_RELOAD_KEY) === AES_RUNTIME_BUILD_ID;
        writeRuntimeBuildStorage(localStorage, AES_RUNTIME_BUILD_STORAGE_KEY, AES_RUNTIME_BUILD_ID);
        if (alreadyReloaded) return true;

        writeRuntimeBuildStorage(sessionStorage, AES_RUNTIME_BUILD_RELOAD_KEY, AES_RUNTIME_BUILD_ID);
        writeRuntimeBuildStorage(sessionStorage, AES_RUNTIME_BUILD_RELOAD_KEY + '-reason', reason || 'runtime-build-change');
        try { location.reload(); }
        catch (e) {}
        return false;
    }

    if (AES.shellInitialized) {
        if (AES.runtimeBuildId !== AES_RUNTIME_BUILD_ID) {
            requestRuntimeBuildReload('stale-shell-runtime');
        }
        return;
    }

    const previousRuntimeBuildId = readRuntimeBuildStorage(localStorage, AES_RUNTIME_BUILD_STORAGE_KEY);
    if (previousRuntimeBuildId && previousRuntimeBuildId !== AES_RUNTIME_BUILD_ID) {
        if (!requestRuntimeBuildReload('updated-runtime-build')) return;
    }

    writeRuntimeBuildStorage(localStorage, AES_RUNTIME_BUILD_STORAGE_KEY, AES_RUNTIME_BUILD_ID);
    AES.runtimeBuildId = AES_RUNTIME_BUILD_ID;
    AES.shellInitialized = true;

    const shellRuntime = AES.ShellRuntime || (AES.ShellRuntime = {});
    const shellConfig = shellRuntime.config || {};
    const CUSTOMIZABLE_TAB_TYPES = shellConfig.CUSTOMIZABLE_TAB_TYPES || [];
    const CUSTOM_FIELD_OPTIONS = shellConfig.CUSTOM_FIELD_OPTIONS || [];
    const getCustomizationFieldOptionLabel = shellConfig.getCustomizationFieldOptionLabel || function (_type, value) { return value; };
    const TAB_LINE_OPTIONS_BY_TYPE = shellConfig.TAB_LINE_OPTIONS_BY_TYPE || {};
    const TAB_LINE_DEFAULT_BY_TYPE = shellConfig.TAB_LINE_DEFAULT_BY_TYPE || {};
    const TAB_LINE_RECOMMENDED_BY_TYPE = shellConfig.TAB_LINE_RECOMMENDED_BY_TYPE || {};
    const TAB_TYPE_LABELS = shellConfig.TAB_TYPE_LABELS || {};
    const CUSTOMIZATION_TAB_TYPE_ICONS = shellConfig.CUSTOMIZATION_TAB_TYPE_ICONS || {};
    function normalizeTabType(type) {
        return typeof type === 'string' ? type.toLowerCase() : '';
    }

    function createRandomId(prefix) {
        try {
            if (window.crypto && typeof window.crypto.randomUUID === 'function') {
                return prefix + window.crypto.randomUUID();
            }
        } catch (e) {}
        return prefix + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    }

    const state = AES.state = Object.assign(AES.state || {}, {
        tabs: [],
        activeId: null,
        splitId: null,
        splitPairIds: Array.isArray(AES.state && AES.state.splitPairIds)
            ? AES.state.splitPairIds
            : null,
        splitPairColor: AES.state && typeof AES.state.splitPairColor === 'string'
            ? AES.state.splitPairColor
            : '',
        splitRatio: AES.state && typeof AES.state.splitRatio === 'number'
            ? AES.state.splitRatio
            : 0.5,
        splitRatios: Array.isArray(AES.state && AES.state.splitRatios)
            ? AES.state.splitRatios
            : [],
        activationHistory: [],
        restoreLoadTimers: [],
        tabsSyncClientId: createRandomId('client-'),
        tabsSyncApplyingRemote: false,
        tabsSyncLastSeenAt: 0,
        tabsSyncHasOwnedTabs: false,
        tabsSyncWatcherInstalled: false,
        nextId: 1,
        bar: null,
        viewport: null,
        loader: null,
        homeCover: null,
        settingsButton: null,
        nativeSettingsMenuItem: null,
        nativeSettingsObserver: null,
        nativeSettingsRaf: 0,
        nativeSettingsAvailable: false,
        resourcePlannerShortcutObserver: null,
        resourcePlannerShortcutRaf: 0,
        topLevelRouteWatchInstalled: false,
        tabScroll: null,
        scrollLeftButton: null,
        scrollRightButton: null,
        tabContextMenu: null,
        draggingTabId: null,
        dragOverTabId: null,
        dragInsertAfter: false,
        nativeReservedContainer: null,
        nonIframeReservedContainer: null,
        settingsModal: null,
        settingsBackdrop: null,
        settingsClosing: false,
        releaseNotesModal: null,
        releaseNotesBackdrop: null,
        releaseNotesClosing: false,
        releaseNotesLastSeenVersion: typeof (AES.state && typeof AES.state.releaseNotesLastSeenVersion === 'string')
            ? AES.state.releaseNotesLastSeenVersion
            : '',
        releaseNotesSnoozeVersion: typeof (AES.state && typeof AES.state.releaseNotesSnoozeVersion === 'string')
            ? AES.state.releaseNotesSnoozeVersion
            : '',
        githubReleaseCheckInFlight: false,
        mapModal: null,
        mapBackdrop: null,
        peekBackdrop: null,
        peekWrapper: null,
        peekModal: null,
        peekClosing: false,
        peekCloseConfirmShade: null,
        peekCloseConfirm: null,
        peekTabId: null,
        peekPrewarm: null,
        peekReuseIframe: null,
        peekReusePrevStyle: '',
        peekViewportPrevStyle: '',
        peekSyncOverlay: null,
        peekResizeObserver: null,
        hoverCard: null,
        hoverTabId: null,
        hoverCardHovered: false,
        hoverAnchorHovered: false,
        hoverAnchorEl: null,
        hoverShowTimer: 0,
        hoverHideTimer: 0,
        homeTabEl: null,
        nativeFrame: null,
        nativeLastUrl: '',
        homePersistedUrl: '',
        homePersistedTitle: '',
        lastObservedTopHref: '',
        lastObservedTopHandledUrl: '',
        homeLoadingAwaitingNativeLoad: false,
        homeLoadingClearTimer: 0,
        homeLoadingUrl: '',
        nativeFrameSrcObserver: null,
        nativeFrameObservedSrc: '',
        nonIframeTitleObserver: null,
        nonIframeTitleRaf: 0,
        lastGeometryHadNativeFrame: false,
        geometryRaf: 0,
        geometryPollId: 0,
        rootResizeObserver: null,
        geometryBurstUntil: 0,
        geometryBurstTimerId: 0,
        geometryResizeFinalizeTimerId: 0,
        lastGeometryViewportWidth: 0,
        lastGeometryViewportHeight: 0,
        rootMutationObserver: null,
        themeObserver: null,
        earlyAccessObserver: null,
        shellHidden: false,
        mountTime: 0,
        homeLoading: false,
        rememberTabsAfterClose: !!(AES.state && AES.state.rememberTabsAfterClose),
        openNewTabsAtStart: !!(AES.state && AES.state.openNewTabsAtStart),
        phoneLinksEnabled: AES.state && typeof AES.state.phoneLinksEnabled === 'boolean'
            ? AES.state.phoneLinksEnabled
            : true,
        improvedScrollbarsEnabled: AES.state && typeof AES.state.improvedScrollbarsEnabled === 'boolean'
            ? AES.state.improvedScrollbarsEnabled
            : true,
        themePreference: 'auto',
        extensionEnabled: !(AES.state && AES.state.extensionEnabled === false),
        barOrientation: AES.state && ['horizontal', 'vertical'].includes(AES.state.barOrientation)
            ? AES.state.barOrientation
            : 'horizontal',
        homeTitle: 'Home',
        hideEarlyAccessLabels: !!(AES.state && AES.state.hideEarlyAccessLabels),
        replaceCalendarWithResourcePlanner: !!(AES.state && AES.state.replaceCalendarWithResourcePlanner),
        showTabBarOnNonIframePages: !!(AES.state && AES.state.showTabBarOnNonIframePages),
        resizableTabBarEnabled: !!(AES.state && AES.state.resizableTabBarEnabled),
        horizontalCompactTabsEnabled: !!(AES.state && AES.state.horizontalCompactTabsEnabled),
        roundedPageFramesEnabled: !!(AES.state && AES.state.roundedPageFramesEnabled),
        skipPeekBackdropCloseWarning: !!(AES.state && AES.state.skipPeekBackdropCloseWarning),
        tabLine2Fields: normalizeTabLineSettings(AES.state && AES.state.tabLine2Fields, 2),
        tabLine3Fields: normalizeTabLineSettings(AES.state && AES.state.tabLine3Fields, 3),
        tabBarWidth: AES.state && typeof AES.state.tabBarWidth === 'number' ? AES.state.tabBarWidth : AES.BAR_W,
        tabBarHoverExpanded: false,
        tabBarExpandTimer: 0,
        tabBarResizeHandleHovered: false,
        tabBarResizing: false,
        splitResizeHandle: null,
        splitResizeHandles: [],
        splitResizeHandleIndex: 0,
        splitResizing: false,
        metadataRefreshTimerId: 0,
    });
    const METADATA_REFRESH_INTERVAL_MS = 7000;
    const METADATA_BACKGROUND_REFRESH_INTERVAL_MS = 60000;
    const IS_SAFARI_WEBKIT = navigator.vendor === 'Apple Computer, Inc.' &&
        /Safari/i.test(navigator.userAgent || '') &&
        !/(Chrome|Chromium|CriOS|FxiOS|Edg|OPR)\//i.test(navigator.userAgent || '');
    const RELEASE_NOTES_URL = 'https://github.com/qntn-dev/AES/releases/latest';
    const FEEDBACK_URL = 'https://github.com/qntn-dev/AES/issues/new';
    const GITHUB_LATEST_RELEASE_URL = 'https://github.com/qntn-dev/AES/releases/latest';
    const GITHUB_RELEASE_CHECK_STORAGE_KEY = 'aes-github-release-check-at';
    const GITHUB_RELEASE_DISMISS_STORAGE_KEY = 'aes-github-release-dismissed-version';
    const GITHUB_RELEASE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
    const RELEASE_NOTES = {
        version: '0.8.0',
        sections: [
            {
                title: 'Chrome Web Store',
                items: [
                    'Autotask Enhancement Suite is now available in the Chrome Web Store. Updates there may be delayed compared to GitHub, but if you prefer automatic updates, please install it from the Chrome Web Store: https://chromewebstore.google.com/detail/autotask-enhancement-suit/napjjjggbckindfanlddahkadnieglfh',
                ],
            },
            {
                title: 'Highlights',
                items: [
                    'More AES Supported entities.',
                    'Many bug fixes & improvements.',
                    'Major code refactor.',
                ],
            },
            {
                title: 'New features',
                items: [
                    'AES support for more Autotask components: Organization Settings & Users subsettings, Finance, Accounting & Invoicing subsettings, Legacy Dispatch Calendar, Notification Templates, and Workflow Rules.',
                    'Added a Provide feedback button in settings that opens GitHub issue creation.',
                ],
            },
            {
                title: 'Improvements',
                items: [
                    'Admin tabs now use clearer metadata: name first, section second, type third.',
                    'Resource Management, API User, Notification Template, and Workflow Rule tabs now use more specific icons and titles.',
                    'AES now handles more legacy close and Save & Close actions inside tabs and Peek windows.',
                    'Autotask help and knowledge base pages are now excluded from AES.',
                    'Reduced background work on busy Autotask pages.',
                    'Improved Firefox setup instructions and privacy policy details.',
                ],
            },
            {
                title: 'Fixes',
                items: [
                    'Fixed Home and active AES tabs not always restoring correctly after a browser refresh.',
                    'Fixed Peek windows causing page or Peek content jumps.',
                    'Fixed tab bar corruption after visiting some Autotask Onyx pages.',
                    'Fixed ticket, API User, Invoice Template, and Notification Template metadata issues.',
                    'Reduced Firefox add-on validation warnings for generated UI icons.',
                ],
            },
            {
                title: 'Behind the scenes',
                items: [
                    'Major project cleanup for easier maintenance: runtime sync, smaller focused modules, and safer settings internals.',
                ],
            },
        ],
    };

    function getRuntimeApi() {
        try {
            if (typeof browser !== 'undefined' && browser && browser.runtime) return browser.runtime;
        } catch (e) {}
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime) return chrome.runtime;
        } catch (e) {}
        return null;
    }

    function getExtensionVersion() {
        const runtime = getRuntimeApi();
        try {
            if (!runtime || typeof runtime.getManifest !== 'function') return '';
        } catch (e) {
            return '';
        }
        try {
            return String(runtime.getManifest().version || '');
        } catch (e) {
            return '';
        }
    }

    function sendRuntimeMessage(message) {
        const runtime = getRuntimeApi();
        try {
            if (!runtime || typeof runtime.sendMessage !== 'function') return Promise.resolve(null);
        } catch (e) {
            return Promise.resolve(null);
        }
        try {
            const sending = runtime.sendMessage(message);
            if (sending && typeof sending.then === 'function') {
                return sending.catch(function () { return null; });
            }
        } catch (e) {}
        return Promise.resolve(null);
    }

    function versionParts(version) {
        return String(version || '')
            .replace(/^v/i, '')
            .split('-')[0]
            .split('.')
            .map(function (part) {
                const parsed = parseInt(part, 10);
                return Number.isFinite(parsed) ? parsed : 0;
            });
    }

    function compareVersions(left, right) {
        const a = versionParts(left);
        const b = versionParts(right);
        const length = Math.max(a.length, b.length, 3);
        for (let i = 0; i < length; i += 1) {
            const av = a[i] || 0;
            const bv = b[i] || 0;
            if (av > bv) return 1;
            if (av < bv) return -1;
        }
        return 0;
    }

    function readLocalStorageNumber(key) {
        const value = parseInt(readRuntimeBuildStorage(window.localStorage, key), 10);
        return Number.isFinite(value) ? value : 0;
    }

    function writeLocalStorageValue(key, value) {
        writeRuntimeBuildStorage(window.localStorage, key, String(value || ''));
    }

    function faIcon(className) {
        return '<span class="' + className + ' flex justify-center items-center flex-shrink-0 w-1rem h-1rem override-$icon-override-font-size:font-size-3 line-height-5 override-$icon-override-color:color-icon-primary" aria-hidden="true"></span>';
    }

    function clearChildren(element) {
        if (!element) return;
        while (element.firstChild) element.removeChild(element.firstChild);
    }

    function createSvg(pathData, options) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const opts = options || {};
        svg.setAttribute('viewBox', opts.viewBox || '0 0 24 24');
        if (opts.ariaHidden !== false) svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('fill', opts.fill || 'none');
        svg.setAttribute('stroke', opts.stroke || 'currentColor');
        svg.setAttribute('stroke-width', opts.strokeWidth || '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        (Array.isArray(pathData) ? pathData : [pathData]).forEach(function (entry) {
            const node = document.createElementNS('http://www.w3.org/2000/svg', entry.circle ? 'circle' : entry.line ? 'line' : entry.rect ? 'rect' : 'path');
            Object.keys(entry).forEach(function (key) {
                if (key !== 'circle' && key !== 'line' && key !== 'rect') node.setAttribute(key, entry[key]);
            });
            svg.appendChild(node);
        });
        return svg;
    }

    function appendIconMarkup(element, html) {
        clearChildren(element);
        const value = String(html || '');
        const faMatch = value.match(/<span class="([^"]+)"/);
        if (faMatch) {
            const span = document.createElement('span');
            span.className = faMatch[1];
            span.setAttribute('aria-hidden', 'true');
            element.appendChild(span);
            return;
        }
        if (value.includes('M15 18l-6-6 6-6')) {
            element.appendChild(createSvg([{ d: 'M15 18l-6-6 6-6' }], { strokeWidth: '2.4', ariaHidden: false }));
            return;
        }
        if (value.includes('M9 18l6-6-6-6')) {
            element.appendChild(createSvg([{ d: 'M9 18l6-6-6-6' }], { strokeWidth: '2.4', ariaHidden: false }));
            return;
        }
        if (value.includes('M12 7.8v5.2')) {
            element.appendChild(createSvg([{ circle: true, cx: '12', cy: '12', r: '8.5' }, { d: 'M12 7.8v5.2' }, { d: 'M12 16.8h.01' }], { strokeWidth: '2.15' }));
            return;
        }
        if (value.includes('M10.3 3.9')) {
            element.appendChild(createSvg([{ d: 'M12 9v4' }, { d: 'M12 17h.01' }, { d: 'M10.3 3.9 1.8 18.4A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.6L13.7 3.9a2 2 0 0 0-3.4 0Z' }], { strokeWidth: '2.6' }));
            return;
        }
        if (value.includes('circle cx="12" cy="12" r="10"')) {
            element.appendChild(createSvg([{ circle: true, cx: '12', cy: '12', r: '10' }, { line: true, x1: '12', y1: '16', x2: '12', y2: '12' }, { line: true, x1: '12', y1: '8', x2: '12.01', y2: '8' }]));
            return;
        }
        if (value.includes('rect x="3" y="4"')) {
            element.appendChild(createSvg([{ rect: true, x: '3', y: '4', width: '18', height: '16', rx: '2' }, { d: 'M12 4v16' }], { strokeWidth: '2.1', ariaHidden: false }));
            return;
        }
        if (value.includes('at-tabs-settings-nav-name')) {
            const name = document.createElement('span');
            name.className = 'at-tabs-settings-nav-name';
            const arrow = document.createElement('span');
            arrow.className = 'at-tabs-settings-nav-arrow';
            arrow.textContent = '›';
            element.append(name, arrow);
            return;
        }
        element.textContent = '';
    }

    const ICONS = {
        home: faIcon('fa-house fa-regular'),
        ticket: faIcon('fa-ticket fa-regular'),
        contract: faIcon('fa-file-contract fa-regular'),
        account: faIcon('fa-user-group fa-regular'),
        device: faIcon('fa-laptop-mobile fa-regular'),
        note: faIcon('fa-laptop-mobile fa-regular'),
        opportunity: faIcon('fa-lightbulb fa-regular'),
        salesorder: faIcon('fa-cash-register fa-regular'),
        purchaseorder: faIcon('fa-receipt fa-regular'),
        quote: faIcon('fa-file-invoice-dollar fa-regular'),
        inventory: faIcon('fa-boxes-stacked fa-regular'),
        charge: faIcon('fa-file-plus-minus fa-regular'),
        timesheet: faIcon('fa-clock-five fa-regular'),
        livelink: faIcon('fa-link fa-regular'),
        person: faIcon('fa-address-book fa-regular'),
        group: faIcon('fa-users fa-regular'),
        project: faIcon('fa-folder fa-regular'),
        projectTask: faIcon('fa-folder-tree fa-regular'),
        calendar: faIcon('fa-calendar-lines fa-regular'),
        administration: faIcon('fa-gear fa-regular'),
        resourceManagement: faIcon('fa-user-gear fa-regular'),
        notificationTemplate: faIcon('fa-bell fa-regular'),
        workflowRule: faIcon('fa-diagram-project fa-regular'),
        pin: faIcon('fa-thumbtack fa-regular'),
        settings: faIcon('fa-puzzle-piece fa-regular'),
        refresh: faIcon('fa-arrows-rotate fa-regular'),
        split: faIcon('fa-table-columns fa-regular'),
        clearColor: faIcon('fa-border-none fa-regular'),
        colorTab: faIcon('fa-paintbrush fa-regular'),
        duplicate: faIcon('fa-clone fa-regular'),
        peek: faIcon('fa-eye fa-regular'),
        copy: faIcon('fa-clipboard fa-regular'),
    };

    const TAB_COLOR_PRESETS = [
        '#EF4444', '#F97316', '#F59E0B', '#EAB308',
        '#84CC16', '#22C55E', '#10B981', '#14B8A6',
        '#06B6D4', '#6366F1', '#8B5CF6', '#A16207',
        '#A855F7', '#EC4899', '#F43F5E', '#64748B',
    ];

    function createTabIframe(url, options) {
        const opts = options || {};
        const iframeEl = document.createElement('iframe');
        iframeEl.dataset.aesLoadStarted = opts.deferLoad ? 'false' : 'true';
        if (opts.deferLoad) {
            iframeEl.dataset.aesDeferredSrc = url;
        } else {
            iframeEl.src = url;
        }
        iframeEl.addEventListener('load', function () {
            const tab = state.tabs.find(t => t.iframeEl === iframeEl);
            if (!tab) return;
            if (tab.loadStarted === false || iframeEl.dataset.aesLoadStarted === 'false') return;
            tab.loading = false;
            const fallback = fallbackTabMetadataForUrl(tab.url);
            if (!tab.title && fallback.title) tab.title = fallback.title;
            if (!tab.number && fallback.number) tab.number = fallback.number;
            if (!tab.contact && fallback.contact) tab.contact = fallback.contact;
            updateTabEl(tab);
            updateLoaderVisibility();
            requestSyncGeometry();
            saveTabs();
        });
        return iframeEl;
    }

    function createTabPaneLoader() {
        const loaderEl = document.createElement('div');
        loaderEl.className = 'at-tabs-pane-loader hidden';
        loaderEl.setAttribute('aria-label', 'Loading');
        return loaderEl;
    }

    function requestTabMetadataRefresh(tab) {
        if (!tab || !tab.iframeEl || !tab.iframeEl.contentWindow) return;
        try {
            tab.iframeEl.contentWindow.postMessage({
                __ns: AES.MSG_NS,
                type: 'metadata-refresh',
            }, '*');
        } catch (e) {
            // Cross-frame refresh requests are best-effort; the next iframe
            // navigation/load will still update metadata through the bridge.
        }
    }

    function requestAllTabMetadataRefresh() {
        if (!featuresEnabled()) return;
        const now = Date.now();
        const refreshBackgroundTabs = now - (state.lastBackgroundMetadataRefreshAt || 0) >= METADATA_BACKGROUND_REFRESH_INTERVAL_MS;
        if (refreshBackgroundTabs) state.lastBackgroundMetadataRefreshAt = now;
        for (const tab of state.tabs) {
            if (!tab || tab.loading || !tab.iframeEl) continue;
            const isVisiblePane = !tab.iframeEl.classList.contains('hidden');
            if (!isVisiblePane && !refreshBackgroundTabs) continue;
            requestTabMetadataRefresh(tab);
        }
    }

    function startMetadataRefreshTimer() {
        if (state.metadataRefreshTimerId) return;
        state.metadataRefreshTimerId = window.setInterval(
            requestAllTabMetadataRefresh,
            METADATA_REFRESH_INTERVAL_MS
        );
        window.setTimeout(requestAllTabMetadataRefresh, 1000);
    }

    function refreshTabIframe(tab) {
        if (!tab || !tab.iframeEl) return;
        tab.loading = true;
        updateTabEl(tab);
        updateLoaderVisibility();
        try {
            tab.iframeEl.contentWindow.location.reload();
        } catch (e) {
            tab.iframeEl.src = tab.iframeEl.src || tab.url;
        }
    }

    function updateLoaderVisibility() {
        if (!state.loader) return;
        const active = state.tabs.find(t => t.id === state.activeId);
        const group = getSplitGroupIds();
        const activeMemberId = active ? active.id : null;
        const splitVisible = !!(group.includes(activeMemberId) && group.length >= 2);
        const roundedSingleVisible = !!(state.roundedPageFramesEnabled && active && !splitVisible);
        const visibleSplitLoading = group.includes(activeMemberId)
            ? group.some(function (id) {
                const tab = tabById(id);
                return !!(tab && tab.id !== state.activeId && tab.loading);
            })
            : false;
        state.loader.classList.toggle('show', !!(
            !splitVisible && !roundedSingleVisible && ((active && active.loading) || visibleSplitLoading)
        ));
        for (const tab of state.tabs) {
            if (!tab.loaderEl) continue;
            const show = !!tab.loading && (
                (splitVisible && group.includes(tab.id)) ||
                (roundedSingleVisible && tab.id === state.activeId)
            );
            tab.loaderEl.classList.toggle('show', show);
        }
    }

    function injectStyles() {
        if (document.getElementById('at-tabs-style')) return;
        const style = document.createElement('style');
        style.id = 'at-tabs-style';
        style.textContent = (shellRuntime.styles && shellRuntime.styles.shell) || '';
        (document.head || document.documentElement).appendChild(style);
    }

    function findContentIframe() {
        let best = null;
        let bestArea = 0;
        for (const f of document.querySelectorAll('iframe')) {
            if (state.viewport && state.viewport.contains(f)) continue;
            if (f.classList && f.classList.contains('at-tabs-peek-frame')) continue;
            if (f.closest && f.closest('.at-tabs-peek-wrapper')) continue;
            const src = f.getAttribute('src') || '';
            if (/dialogiframeoverlay/i.test(src)) continue;
            const r = f.getBoundingClientRect();
            if (r.width < 300 || r.height < 300) continue;
            const area = r.width * r.height;
            if (area > bestArea) {
                bestArea = area;
                best = f;
            }
        }
        return best;
    }

    function normalizeTabState(tab) {
        if (!tab) return tab;
        if (!tab.syncKey || typeof tab.syncKey !== 'string') {
            tab.syncKey = createRandomId('tab-');
        }
        tab.url = canonicalTabUrl(tab.url);
        tab.pinned = !!tab.pinned;
        tab.color = TAB_COLOR_PRESETS.includes(tab.color) ? tab.color : '';
        tab.pageWarning = !!tab.pageWarning;
        tab.hoverFields = normalizeHoverFields(tab.hoverFields);
        tab.metadataFields = normalizeMetadataFields(tab.metadataFields);
        return tab;
    }

    function canonicalTabUrl(url) {
        try {
            const parsed = new URL(url || '', location.origin);
            const path = parsed.pathname.toLowerCase();
            if (/\/contracts\/views\/contract(summary|side)\.asp$/i.test(path)) {
                const contractId = parsed.searchParams.get('contractID') || parsed.searchParams.get('contractId');
                if (contractId) {
                    const canonical = new URL('/contracts/views/contractView.asp', parsed.origin);
                    canonical.searchParams.set('contractID', contractId);
                    return canonical.href;
                }
            }
            return parsed.href;
        } catch (e) {
            return url || '';
        }
    }

    function getLineOptionsForType(type) {
        const normalizedType = normalizeTabType(type);
        const options = TAB_LINE_OPTIONS_BY_TYPE[normalizedType];
        if (Array.isArray(options) && options.length > 0) return options.slice();
        return CUSTOM_FIELD_OPTIONS.map(function (option) { return option.value; });
    }

    function getDefaultLineField(type, line) {
        const normalizedType = normalizeTabType(type);
        const defaultsByType = TAB_LINE_DEFAULT_BY_TYPE[normalizedType] || {};
        const lineKey = line === 2 || line === 'line2' ? 'line2' : 'line3';
        const fallback = defaultsByType[lineKey];
        const options = getLineOptionsForType(type);
        const optionSet = new Set(options);
        if (optionSet.has(fallback)) return fallback;
        if (optionSet.has('none')) return 'none';
        return options[0] || 'none';
    }

    function defaultTabLineSettings(line) {
        const settings = {};
        const target = line === 2 ? 'line2' : 'line3';
        CUSTOMIZABLE_TAB_TYPES.forEach(function (type) {
            settings[type] = getDefaultLineField(type, target);
        });
        return settings;
    }

    function normalizeTabLineSettings(settings, line) {
        const defaults = defaultTabLineSettings(line);
        CUSTOMIZABLE_TAB_TYPES.forEach(function (type) {
            const value = settings && settings[type];
            const options = getLineOptionsForType(type);
            if (options.includes(value)) defaults[type] = value;
        });
        return defaults;
    }

    function normalizeMetadataFields(fields) {
        if (!fields || typeof fields !== 'object') return {};
        const normalized = {};
        Object.keys(fields).forEach(function (key) {
            const value = String(fields[key] || '').trim();
            if (value) normalized[key] = value.slice(0, 160);
        });
        return normalized;
    }

    function normalizeHoverFields(fields) {
        if (!Array.isArray(fields)) return [];
        return fields
            .map(function (field) {
                return {
                    label: String(field && field.label || '').trim().slice(0, 40),
                    value: String(field && field.value || '').trim().slice(0, 160),
                };
            })
            .filter(function (field) { return field.label && field.value; });
    }

    function clearRestoreLoadTimers() {
        for (const timerId of state.restoreLoadTimers || []) {
            window.clearTimeout(timerId);
        }
        state.restoreLoadTimers = [];
    }

    function ensureTabIframeLoaded(tab) {
        if (!tab || !tab.iframeEl || tab.loadStarted !== false) return;
        tab.loadStarted = true;
        tab.loading = true;
        tab.iframeEl.dataset.aesLoadStarted = 'true';
        tab.iframeEl.removeAttribute('data-aes-deferred-src');
        tab.iframeEl.src = tab.url;
        updateTabEl(tab);
        updateLoaderVisibility();
    }

    function hexToRgb(hex) {
        const normalized = String(hex || '').trim().replace('#', '');
        if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
        return {
            r: parseInt(normalized.slice(0, 2), 16),
            g: parseInt(normalized.slice(2, 4), 16),
            b: parseInt(normalized.slice(4, 6), 16),
        };
    }

    function colorToRgba(hex, alpha) {
        const rgb = hexToRgb(hex);
        if (!rgb) return '';
        return 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + alpha + ')';
    }

    function buildTabsPayload() {
        const updatedAt = Date.now();
        return {
            updatedAt: updatedAt,
            clientId: state.tabsSyncClientId,
            tabs: state.tabs.map(t => ({
                syncKey: t.syncKey || (t.syncKey = createRandomId('tab-')),
                url: canonicalTabUrl(t.url),
                title: t.title,
                number: t.number,
                contact: t.contact,
                primaryResource: t.primaryResource || null,
                pinned: !!t.pinned,
                color: t.color || '',
                priority: t.priority || '',
                status: t.status || '',
                lastActivity: t.lastActivity || '',
                pageWarning: !!t.pageWarning,
                hoverFields: normalizeHoverFields(t.hoverFields),
                metadataFields: normalizeMetadataFields(t.metadataFields),
            })),
            activeIndex: state.activeId === null
                ? null
                : state.tabs.findIndex(t => t.id === state.activeId),
            splitIndex: state.splitId === null
                ? null
                : state.tabs.findIndex(t => t.id === state.splitId),
            splitPairIndexes: getSplitPairIndexes(),
            splitPairColor: TAB_COLOR_PRESETS.includes(state.splitPairColor) ? state.splitPairColor : '',
            splitRatio: normalizeSplitRatio(state.splitRatio),
            splitRatios: normalizeSplitRatios(state.splitRatios, getSplitGroupIds().length),
            home: {
                url: getPersistableHomeUrl(),
                title: state.activeId === null && hasResolvedHomeTitle()
                    ? state.homeTitle
                    : (state.homePersistedTitle || ''),
            },
        };
    }

    function getSplitPairIndexes() {
        const pair = normalizeSplitPairIds(state.splitPairIds);
        if (!pair) return null;
        const indexes = pair.map(id => state.tabs.findIndex(tab => tab.id === id));
        return indexes.every(index => index >= 0) ? indexes : null;
    }

    function normalizeSplitRatio(value) {
        const numeric = typeof value === 'number' && Number.isFinite(value) ? value : 0.5;
        return Math.min(0.8, Math.max(0.2, numeric));
    }

    function defaultSplitRatios(count) {
        if (count === 3) return [1 / 3, 2 / 3];
        if (count === 4) return [0.25, 0.5, 0.75];
        return [normalizeSplitRatio(state.splitRatio)];
    }

    function normalizeSplitRatios(values, count) {
        const expected = Math.max(1, Math.min(3, Number(count || 2) - 1));
        const defaults = defaultSplitRatios(count);
        const ratios = [];
        for (let i = 0; i < expected; i++) {
            const fallback = defaults[i] || ((i + 1) / (expected + 1));
            const raw = Array.isArray(values) && typeof values[i] === 'number' && Number.isFinite(values[i])
                ? values[i]
                : fallback;
            const min = i === 0 ? 0.12 : ratios[i - 1] + 0.12;
            const max = i === expected - 1 ? 0.88 : 1 - ((expected - i) * 0.12);
            ratios.push(Math.min(max, Math.max(min, raw)));
        }
        return ratios;
    }

    function applySplitRatio() {
        state.splitRatio = normalizeSplitRatio(state.splitRatio);
        if (state.viewport) {
            state.viewport.style.setProperty('--at-tabs-split-left', (state.splitRatio * 100).toFixed(2) + '%');
            const count = getSplitGroupIds().length || 2;
            state.splitRatios = normalizeSplitRatios(state.splitRatios, count);
            state.splitRatios.forEach(function (ratio, index) {
                state.viewport.style.setProperty('--at-tabs-split-b' + (index + 1), (ratio * 100).toFixed(2) + '%');
            });
        }
    }

    function getPersistableHomeUrl() {
        const url = state.activeId === null ? currentNativeFrameUrl() : state.homePersistedUrl;
        if (!url || url === 'about:blank') return '';
        return url;
    }

    function handleNativeFrameLoad(event) {
        const frame = event.currentTarget;
        // New native page finished loading — clear the Home-tab spinner.
        clearHomeLoading();
        let url = '';
        try { url = frame.contentWindow.location.href; }
        catch (e) { url = frame.getAttribute('src') || ''; }
        if (!url || url === 'about:blank') return;

        if (state.activeId === null && AES.isHandledUrl(url)) {
            if (url !== state.nativeLastUrl) {
                openTab(url);
            }
            state.nativeLastUrl = url;
            return;
        }

        if (state.activeId === null) {
            state.nativeLastUrl = url;
            state.homePersistedUrl = url;
            if (hasResolvedHomeTitle()) state.homePersistedTitle = state.homeTitle;
            saveTabs();
            return;
        }

        const active = state.tabs.find(t => t.id === state.activeId);
        if (active && url !== active.url) {
            // On a parent-page refresh, Autotask always paints its own default
            // iframe (dashboard / last visited list / etc.). That load fires
            // shortly after mount and would otherwise evict the restored active
            // tab. Give the initial page load a grace window before treating
            // native loads as user-driven navigation.
            const INITIAL_LOAD_GRACE_MS = 4000;
            if (Date.now() - state.mountTime < INITIAL_LOAD_GRACE_MS) {
                state.nativeLastUrl = url;
                return;
            }
            activateHome();
        }
        state.nativeLastUrl = url;
    }

    function currentNativeFrameUrl() {
        const frame = state.nativeFrame || findContentIframe();
        if (!frame) return '';
        try { return frame.contentWindow.location.href || frame.getAttribute('src') || ''; }
        catch (e) { return frame.getAttribute('src') || ''; }
    }

    function hasResolvedHomeTitle() {
        const title = (state.homeTitle || '').trim();
        return !!title && title !== 'Home' && !/dialogiframeoverlaypage/i.test(title);
    }

    function clearHomeLoading() {
        state.homeLoadingAwaitingNativeLoad = false;
        state.homeLoadingUrl = '';
        if (state.homeLoadingClearTimer) {
            window.clearTimeout(state.homeLoadingClearTimer);
            state.homeLoadingClearTimer = 0;
        }
        setHomeLoading(false);
    }

    function scheduleHomeLoadingFailsafe() {
        if (state.homeLoadingClearTimer) window.clearTimeout(state.homeLoadingClearTimer);
        state.homeLoadingClearTimer = window.setTimeout(function () {
            state.homeLoadingClearTimer = 0;
            if (!state.homeLoadingAwaitingNativeLoad) return;
            if (hasResolvedHomeTitle()) clearHomeLoading();
        }, 8000);
    }

    function startNativeHomeLoading() {
        if (state.activeId !== null) return;
        const currentUrl = currentNativeFrameUrl();
        if (!currentUrl && !findContentIframe() && state.showTabBarOnNonIframePages) {
            clearHomeLoading();
            scheduleNonIframeTitleUpdate();
            return;
        }
        if (hasResolvedHomeTitle() && currentUrl && currentUrl === state.nativeLastUrl) return;
        state.homeLoadingAwaitingNativeLoad = true;
        state.homeLoadingUrl = currentUrl || '';
        setHomeLoading(true);
        scheduleHomeLoadingFailsafe();
    }

    function isShellOwnedMutationTarget(target) {
        return !!(target && (
            target === state.viewport ||
            target === state.bar ||
            target === state.homeCover ||
            (state.viewport && state.viewport.contains(target)) ||
            (state.bar && state.bar.contains(target)) ||
            (state.homeCover && state.homeCover.contains(target))
        ));
    }

    function trackNativeFrame(frame) {
        if (state.nativeFrame === frame) return;
        if (state.nativeFrame) {
            state.nativeFrame.removeEventListener('load', handleNativeFrameLoad);
        }
        if (state.nativeFrameSrcObserver) {
            state.nativeFrameSrcObserver.disconnect();
            state.nativeFrameSrcObserver = null;
        }
        state.nativeFrame = frame;
        state.nativeFrameObservedSrc = frame ? (frame.getAttribute('src') || '') : '';
        if (frame) {
            frame.addEventListener('load', handleNativeFrameLoad);
            if (state.activeId === null && state.nativeFrameObservedSrc && state.nativeFrameObservedSrc !== state.nativeLastUrl) {
                startNativeHomeLoading();
            }
            state.nativeFrameSrcObserver = new MutationObserver(function () {
                const nextSrc = frame.getAttribute('src') || '';
                if (nextSrc === state.nativeFrameObservedSrc) return;
                state.nativeFrameObservedSrc = nextSrc;
                if (state.activeId === null) startNativeHomeLoading();
            });
            state.nativeFrameSrcObserver.observe(frame, { attributes: true, attributeFilter: ['src'] });
        }
    }

    function saveTabs() {
        if (state.tabsSyncApplyingRemote) return;
        if (!state.tabs.length && !state.tabsSyncHasOwnedTabs && !getPersistableHomeUrl()) return;
        const payload = buildTabsPayload();
        state.tabsSyncLastSeenAt = payload.updatedAt || Date.now();
        void AES.writeTabsPayload(payload);
    }

    function addTabToList(tab) {
        const normalized = normalizeTabState(tab);
        state.tabsSyncHasOwnedTabs = true;
        if (!state.openNewTabsAtStart || normalized.pinned) {
            state.tabs.push(normalized);
            return normalized;
        }

        const firstUnpinnedIndex = state.tabs.findIndex(function (candidate) {
            return !candidate.pinned;
        });
        const insertIndex = firstUnpinnedIndex === -1 ? state.tabs.length : firstUnpinnedIndex;
        state.tabs.splice(insertIndex, 0, normalized);
        return normalized;
    }

    async function restoreTabs() {
        let payload;
        try {
            payload = await AES.readTabsPayload();
        } catch (e) { return; }
        if (!payload || !Array.isArray(payload.tabs)) return;

        const savedHome = payload.home && typeof payload.home === 'object' ? payload.home : null;
        if (savedHome && savedHome.url) {
            state.nativeLastUrl = savedHome.url;
            state.homePersistedUrl = savedHome.url;
            state.homePersistedTitle = savedHome.title || '';
            if (savedHome.title) setHomeTitle(savedHome.title);
        }

        for (const saved of payload.tabs) {
            if (!saved.url) continue;
            const savedUrl = canonicalTabUrl(saved.url);
            const iframeEl = createTabIframe(savedUrl, { deferLoad: true });
            const loaderEl = createTabPaneLoader();
            state.viewport.appendChild(iframeEl);
            state.viewport.appendChild(loaderEl);
            state.tabs.push(normalizeTabState({
                id: state.nextId++,
                syncKey: saved.syncKey || '',
                url: savedUrl,
                title: saved.title || '',
                number: saved.number || '',
                contact: saved.contact || '',
                primaryResource: saved.primaryResource || null,
                pinned: !!saved.pinned,
                color: saved.color || '',
                priority: saved.priority || '',
                status: saved.status || '',
                lastActivity: saved.lastActivity || '',
                pageWarning: !!saved.pageWarning,
                hoverFields: normalizeHoverFields(saved.hoverFields),
                metadataFields: normalizeMetadataFields(saved.metadataFields),
                iframeEl,
                loaderEl,
                tabEl: null,
                loading: false,
                loadStarted: false,
            }));
        }
        state.tabsSyncHasOwnedTabs = state.tabs.length > 0;
        state.tabsSyncLastSeenAt = Number(payload.updatedAt) || Date.now();
        renderTabs();
        if (typeof payload.splitRatio === 'number') {
            state.splitRatio = normalizeSplitRatio(payload.splitRatio);
        }
        if (Array.isArray(payload.splitRatios)) {
            state.splitRatios = normalizeSplitRatios(payload.splitRatios, payload.splitPairIndexes && payload.splitPairIndexes.length || 2);
        }
        state.splitPairColor = TAB_COLOR_PRESETS.includes(payload.splitPairColor) ? payload.splitPairColor : '';
        const idx = payload.activeIndex;
        const splitIdx = payload.splitIndex;
        if (Array.isArray(payload.splitPairIndexes)
            && payload.splitPairIndexes.length >= 2) {
            const restoredSplitIds = [];
            payload.splitPairIndexes.slice(0, 4).forEach(function (splitIndex) {
                if (typeof splitIndex !== 'number' || !state.tabs[splitIndex]) return;
                const id = state.tabs[splitIndex].id;
                if (!restoredSplitIds.includes(id)) restoredSplitIds.push(id);
            });
            state.splitPairIds = restoredSplitIds.length >= 2 ? restoredSplitIds : null;
            state.splitId = state.splitPairIds ? state.splitPairIds.find(id => typeof idx !== 'number' || !state.tabs[idx] || id !== state.tabs[idx].id) || null : null;
        } else if (typeof idx === 'number' && idx >= 0 && state.tabs[idx]
            && typeof splitIdx === 'number' && splitIdx >= 0 && state.tabs[splitIdx]
            && idx !== splitIdx) {
            state.splitPairIds = [state.tabs[idx].id, state.tabs[splitIdx].id];
            state.splitId = state.tabs[splitIdx].id;
        } else {
            state.splitPairIds = null;
            state.splitId = null;
        }
        if (typeof idx === 'number' && idx >= 0 && state.tabs[idx]) {
            // Browser refresh should restore the selected tab as a live page, not
            // just a selected deferred iframe. `activateTab()` defaults to loading
            // the active tab, and if it belongs to a split group it also loads the
            // visible split partner(s). Background restored tabs remain lazy.
            activateTab(state.tabs[idx].id, { recordPrevious: false });
            clearHomeLoading();
        } else {
            activateHome();
            if (savedHome && savedHome.url) {
                const frame = state.nativeFrame || findContentIframe();
                if (frame) {
                    try {
                        if ((frame.getAttribute('src') || '') !== savedHome.url) frame.src = savedHome.url;
                    } catch (e) {}
                }
            }
        }
    }

    function createLazyTabFromSaved(saved) {
        const savedUrl = canonicalTabUrl(saved.url);
        const iframeEl = createTabIframe(savedUrl, { deferLoad: true });
        const loaderEl = createTabPaneLoader();
        state.viewport.appendChild(iframeEl);
        state.viewport.appendChild(loaderEl);
        return normalizeTabState({
            id: state.nextId++,
            syncKey: saved.syncKey || '',
            url: savedUrl,
            title: saved.title || '',
            number: saved.number || '',
            contact: saved.contact || '',
            primaryResource: saved.primaryResource || null,
            pinned: !!saved.pinned,
            color: saved.color || '',
            priority: saved.priority || '',
            status: saved.status || '',
            lastActivity: saved.lastActivity || '',
            pageWarning: !!saved.pageWarning,
            hoverFields: normalizeHoverFields(saved.hoverFields),
            metadataFields: normalizeMetadataFields(saved.metadataFields),
            iframeEl: iframeEl,
            loaderEl: loaderEl,
            tabEl: null,
            loading: false,
            loadStarted: false,
        });
    }

    function applySavedMetadataToTab(tab, saved) {
        tab.syncKey = saved.syncKey || tab.syncKey || createRandomId('tab-');
        tab.url = canonicalTabUrl(saved.url || tab.url);
        tab.title = saved.title || '';
        tab.number = saved.number || '';
        tab.contact = saved.contact || '';
        tab.primaryResource = saved.primaryResource || null;
        tab.pinned = !!saved.pinned;
        tab.color = saved.color || '';
        tab.priority = saved.priority || '';
        tab.status = saved.status || '';
        tab.lastActivity = saved.lastActivity || '';
        tab.pageWarning = !!saved.pageWarning;
        tab.hoverFields = normalizeHoverFields(saved.hoverFields);
        tab.metadataFields = normalizeMetadataFields(saved.metadataFields);
        return normalizeTabState(tab);
    }

    function takeReusableTab(saved, pools) {
        if (saved.syncKey && pools.byKey.has(saved.syncKey)) {
            const tab = pools.byKey.get(saved.syncKey);
            pools.byKey.delete(saved.syncKey);
            const urlPool = pools.byUrl.get(tab.url) || [];
            const urlIndex = urlPool.indexOf(tab);
            if (urlIndex >= 0) urlPool.splice(urlIndex, 1);
            return tab;
        }
        const candidates = pools.byUrl.get(saved.url) || [];
        return candidates.shift() || null;
    }

    function buildTabReusePools() {
        const byKey = new Map();
        const byUrl = new Map();
        state.tabs.forEach(function (tab) {
            if (tab.syncKey) byKey.set(tab.syncKey, tab);
            const list = byUrl.get(tab.url) || [];
            list.push(tab);
            byUrl.set(tab.url, list);
        });
        return { byKey, byUrl };
    }

    function applyRemoteTabsPayload(payload) {
        if (!featuresEnabled()) return;
        if (!payload || !Array.isArray(payload.tabs)) return;
        if (payload.clientId && payload.clientId === state.tabsSyncClientId) return;
        const updatedAt = Number(payload.updatedAt) || Date.now();
        if (updatedAt < state.tabsSyncLastSeenAt) return;
        state.tabsSyncLastSeenAt = updatedAt;
        state.tabsSyncApplyingRemote = true;
        clearRestoreLoadTimers();

        const previousActiveId = state.activeId;
        const reusable = buildTabReusePools();
        const nextTabs = [];
        const reused = new Set();
        payload.tabs.forEach(function (saved) {
            if (!saved || !saved.url) return;
            const existing = takeReusableTab(saved, reusable);
            const tab = existing
                ? applySavedMetadataToTab(existing, saved)
                : createLazyTabFromSaved(saved);
            reused.add(tab);
            nextTabs.push(tab);
        });

        state.tabs.forEach(function (tab) {
            if (reused.has(tab)) return;
            try { if (tab.iframeEl) tab.iframeEl.remove(); } catch (e) {}
            try { if (tab.loaderEl) tab.loaderEl.remove(); } catch (e) {}
        });

        state.tabs = nextTabs;
        state.tabsSyncHasOwnedTabs = state.tabs.length > 0;
        const maxId = state.tabs.reduce(function (max, tab) { return Math.max(max, tab.id || 0); }, 0);
        state.nextId = Math.max(state.nextId, maxId + 1);
        if (previousActiveId !== null && tabById(previousActiveId)) {
            state.activeId = previousActiveId;
        } else {
            state.activeId = null;
            state.splitId = null;
            state.splitPairIds = null;
        }
        if (state.splitPairIds) {
            const validSplitIds = state.splitPairIds.filter(function (id) { return !!tabById(id); });
            state.splitPairIds = validSplitIds.length >= 2 ? validSplitIds : null;
            if (!state.splitPairIds) {
                state.splitId = null;
                state.splitPairColor = '';
            }
        }
        state.activationHistory = state.activationHistory.filter(function (id) {
            return id === null || !!tabById(id);
        });

        renderTabs();
        syncTabPaneState();
        updateHomeTabActive();
        updateLoaderVisibility();
        requestSyncGeometry();
        ensureActiveTabVisible();
        updateTabScrollButtons();
        state.tabsSyncApplyingRemote = false;
    }

    function installTabsMetadataSyncWatcher() {
        if (state.tabsSyncWatcherInstalled) return;
        if (!AES.hasChromeStorage()) return;
        try {
            if (!chrome.storage || !chrome.storage.onChanged) return;
            chrome.storage.onChanged.addListener(function (changes, areaName) {
                if (areaName !== 'local') return;
                const change = changes && changes[AES.STORAGE_KEY];
                if (!change || !change.newValue) return;
                applyRemoteTabsPayload(change.newValue);
            });
            state.tabsSyncWatcherInstalled = true;
        } catch (e) {}
    }

    // The native Home iframe is shifted by syncGeometry itself. Keep this as a
    // cleanup path for older internal/external spacer attempts so stale classes
    // do not double-offset content after an extension reload.
    function ensureNativeFrameSpacer(frame) {
        if (!frame) return;

        let doc;
        try {
            doc = frame.contentDocument;
        } catch (e) {
            return;
        }
        if (!doc) return;

        const style = doc.getElementById('at-native-frame-shell-style');
        if (style) style.remove();
        const bridgeStyle = doc.getElementById('aes-native-body-shell-padding-style');
        if (bridgeStyle) bridgeStyle.remove();
        if (doc.documentElement) doc.documentElement.classList.remove('at-native-frame-shell-offset');
        if (doc.documentElement) doc.documentElement.classList.remove('aes-native-html-shell-padding');
        if (doc.body) {
            doc.body.classList.remove('at-native-frame-shell-offset');
            doc.body.classList.remove('aes-native-body-shell-padding');
        }
    }

    function rememberInlineStyle(el, prop, key) {
        if (!el || Object.prototype.hasOwnProperty.call(el.dataset, key)) return;
        el.dataset[key] = el.style.getPropertyValue(prop) || '';
        el.dataset[key + 'Priority'] = el.style.getPropertyPriority(prop) || '';
    }

    function restoreInlineStyle(el, prop, key) {
        if (!el || !Object.prototype.hasOwnProperty.call(el.dataset, key)) return;
        const value = el.dataset[key] || '';
        const priority = el.dataset[key + 'Priority'] || '';
        if (value) el.style.setProperty(prop, value, priority);
        else el.style.removeProperty(prop);
        delete el.dataset[key];
        delete el.dataset[key + 'Priority'];
    }

    function clearLegacyNativeFrameOffset(frame) {
        if (!frame) return;
        if (frame.dataset.aesNativeFrameOffset === 'true') {
            frame.style.removeProperty('margin-top');
            frame.style.removeProperty('translate');
            frame.style.removeProperty('height');
            frame.style.removeProperty('display');
            delete frame.dataset.aesNativeFrameOffset;
            return;
        }

        const marginTop = parseFloat(frame.style.getPropertyValue('margin-top')) || 0;
        if (Math.abs(marginTop - currentHorizontalBarHeight()) < 0.5 || Math.abs(marginTop - AES.BAR_H) < 0.5) frame.style.removeProperty('margin-top');
        if (frame.style.getPropertyValue('translate')) frame.style.removeProperty('translate');
    }

    function isVerticalBar() {
        return state.barOrientation === 'vertical';
    }

    function horizontalCompactTabsActive() {
        return !!state.horizontalCompactTabsEnabled && !isVerticalBar();
    }

    function currentHorizontalBarHeight() {
        return horizontalCompactTabsActive() ? 50 : AES.BAR_H;
    }

    function normalizedTabBarWidth(value) {
        const raw = Number(value);
        const fallback = AES.BAR_W || 240;
        const min = AES.BAR_W_MIN || 56;
        const max = AES.BAR_W_MAX || 420;
        if (!Number.isFinite(raw)) return fallback;
        return Math.max(min, Math.min(max, Math.round(raw)));
    }

    function currentVerticalBarWidth() {
        if (!state.resizableTabBarEnabled) return AES.BAR_W;
        return normalizedTabBarWidth(state.tabBarWidth);
    }

    function isCompactVerticalBar() {
        return state.resizableTabBarEnabled && isVerticalBar() && currentVerticalBarWidth() <= (AES.BAR_W_COMPACT || 96);
    }

    function updateResizableBarClasses() {
        document.documentElement.classList.toggle('aes-resizable-tabs', !!state.resizableTabBarEnabled);
        document.documentElement.classList.toggle('aes-horizontal-compact-tabs', !!state.horizontalCompactTabsEnabled);
        if (!state.bar) return;
        state.bar.classList.toggle('compact', isCompactVerticalBar());
        state.bar.classList.toggle('hover-expanded', isCompactVerticalBar() && !!state.tabBarHoverExpanded);
        state.bar.classList.toggle('resizing', !!state.tabBarResizing);
        state.bar.style.setProperty('--aes-expanded-bar-width', AES.BAR_W + 'px');
        state.bar.style.setProperty('--aes-collapsed-bar-width', currentVerticalBarWidth() + 'px');
    }

    function cancelTabBarExpandTimer() {
        if (!state.tabBarExpandTimer) return;
        window.clearTimeout(state.tabBarExpandTimer);
        state.tabBarExpandTimer = 0;
    }

    function isResizeHandleEvent(event) {
        return !!(event && event.target && event.target.closest && event.target.closest('.at-tabs-resize-handle'));
    }

    function scheduleTabBarHoverExpand(event) {
        if (!isCompactVerticalBar() || state.tabBarResizing) return;
        if (isResizeHandleEvent(event)) return;
        if (state.tabBarResizeHandleHovered) return;
        if (state.tabBarHoverExpanded || state.tabBarExpandTimer) return;
        state.tabBarExpandTimer = window.setTimeout(function () {
            state.tabBarExpandTimer = 0;
            if (!isCompactVerticalBar() || state.tabBarResizing) return;
            state.tabBarHoverExpanded = true;
            updateResizableBarClasses();
        }, 300);
    }

    function collapseTabBarHoverExpand() {
        cancelTabBarExpandTimer();
        if (!state.tabBarHoverExpanded || state.tabBarResizing) return;
        state.tabBarHoverExpanded = false;
        updateResizableBarClasses();
    }

    function reservationAxis(el) {
        // Returns the axis that's currently reserved on the given element via
        // our dataset markers, even if state.barOrientation has since changed.
        // 'horizontal' = padding-top reservation, 'vertical' = padding-left.
        if (!el || !el.dataset) return null;
        if (el.dataset.aesNativeChromeReservedAxis === 'vertical') return 'vertical';
        if (el.dataset.aesNativeChromeReservedAxis === 'horizontal') return 'horizontal';
        if (el.dataset.aesNativeChromeReserved === 'true') return 'horizontal';
        return null;
    }

    function nativeFrameReservationAmount(frame) {
        const container = frame && frame.parentElement;
        const axis = reservationAxis(container) || reservationAxis(frame);
        if (!axis) return { top: 0, left: 0 };
        const roundedInset = frame && frame.dataset && frame.dataset.aesNativeRoundedFrame === 'true' ? 8 : 0;
        if (axis === 'vertical') {
            return {
                top: roundedInset,
                left: currentVerticalBarWidth() + roundedInset,
                right: roundedInset,
                bottom: roundedInset,
            };
        }
        return {
            top: currentHorizontalBarHeight() + roundedInset,
            left: roundedInset,
            right: roundedInset,
            bottom: roundedInset,
        };
    }

    function nonIframeReservationAxis(el) {
        if (!el || !el.dataset) return null;
        if (el.dataset.aesNonIframeReservedAxis === 'vertical') return 'vertical';
        if (el.dataset.aesNonIframeReservedAxis === 'horizontal') return 'horizontal';
        if (el.dataset.aesNonIframeReserved === 'true') return 'horizontal';
        return null;
    }

    function findNonIframeContentContainer() {
        return document.querySelector('main') ||
            document.querySelector('[role="main"]') ||
            document.querySelector('.min-w-0.flex-1') ||
            null;
    }

    function findNonIframeContentSurface(container) {
        if (!container) return null;
        const children = Array.prototype.slice.call(container.children || []);
        let best = null;
        let bestArea = 0;
        children.forEach(function (child) {
            if (child.classList && Array.prototype.some.call(child.classList, function (className) {
                return className.indexOf('at-tabs-') === 0 || className.indexOf('aes-') === 0;
            })) return;
            const rect = child.getBoundingClientRect();
            const area = Math.max(0, rect.width) * Math.max(0, rect.height);
            if (area > bestArea) {
                best = child;
                bestArea = area;
            }
        });
        return best || null;
    }

    function applyNonIframeRoundedSurfaceStyles() {
        if (!state.roundedPageFramesEnabled || !state.nonIframeReservedContainer || state.activeId !== null) return;
        const clippingEnabled = state.roundedPageFramesEnabled;
        const selectors = [
            '[class~="bg-background-primary"][class~="h-full"][class~="flex"]',
            '[class~="bg-background-primary"][class~="flex-grow"][class~="h-full"]',
            '[class~="bg-background-primary"][class~="height:100%"]',
            '.o-view-layout',
        ];
        const candidates = [];
        selectors.forEach(function (selector) {
            Array.prototype.forEach.call(document.querySelectorAll(selector), function (el) {
                if (!el || el === document.body || el === document.documentElement || el === state.nonIframeReservedContainer) return;
                if (el.classList && Array.prototype.some.call(el.classList, function (className) {
                    return className.indexOf('at-tabs-') === 0 || className.indexOf('aes-') === 0;
                })) return;
                candidates.push(el);
            });
        });
        candidates.forEach(function (surface) {
            const rect = surface.getBoundingClientRect();
            if (rect.width < 200 || rect.height < 200) return;
            surface.style.setProperty('border-radius', '10px', 'important');
            if (clippingEnabled) {
                surface.style.setProperty('clip-path', 'inset(0 round 10px)', 'important');
                surface.style.setProperty('overflow', 'hidden', 'important');
            } else {
                surface.style.removeProperty('clip-path');
            }
        });
    }

    function scheduleNonIframeRoundedSurfaceStyles() {
        if (state.nonIframeRoundedSurfaceRaf) return;
        state.nonIframeRoundedSurfaceRaf = window.requestAnimationFrame(function () {
            state.nonIframeRoundedSurfaceRaf = 0;
            applyNonIframeRoundedSurfaceStyles();
        });
    }

    function readNoIframeBase(container) {
        const target = container || findNonIframeContentContainer();
        if (target) {
            const rect = target.getBoundingClientRect();
            return {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
            };
        }
        const left = 240;
        const top = 56;
        return {
            top: top,
            left: left,
            width: Math.max(0, window.innerWidth - left),
            height: Math.max(0, window.innerHeight - top),
        };
    }

    function readNativeFrameBase(frame) {
        const rect = frame.getBoundingClientRect();
        const off = nativeFrameReservationAmount(frame);
        return {
            top: rect.top - off.top,
            left: rect.left - off.left,
            width: rect.width + off.left + (off.right || 0),
            height: rect.height + off.top + (off.bottom || 0),
        };
    }

    function snapCssPixel(value) {
        const n = Number(value);
        if (!Number.isFinite(n)) return 0;
        const dpr = window.devicePixelRatio || 1;
        return Math.round(n * dpr) / dpr;
    }

    function cssPx(value) {
        return snapCssPixel(value) + 'px';
    }

    function setCssPx(el, property, value) {
        if (!el) return;
        el.style[property] = cssPx(value);
    }

    function clearNativeChromeReservation(frame) {
        const container = state.nativeReservedContainer ||
            (frame && frame.parentElement && reservationAxis(frame.parentElement)
                ? frame.parentElement
                : null);

        if (container) {
            restoreInlineStyle(container, 'padding-top', 'aesPrevPaddingTop');
            restoreInlineStyle(container, 'padding-left', 'aesPrevPaddingLeft');
            restoreInlineStyle(container, 'box-sizing', 'aesPrevBoxSizing');
            restoreInlineStyle(container, 'overflow', 'aesPrevOverflow');
            restoreInlineStyle(container, 'background', 'aesPrevBackground');
            restoreInlineStyle(container, 'width', 'aesPrevNativeSplitWidth');
            delete container.dataset.aesNativeChromeReserved;
            delete container.dataset.aesNativeChromeReservedAxis;
        }
        state.nativeReservedContainer = null;

        if (!frame) return;
        restoreInlineStyle(frame, 'margin-top', 'aesPrevMarginTop');
        restoreInlineStyle(frame, 'margin-left', 'aesPrevMarginLeft');
        restoreInlineStyle(frame, 'height', 'aesPrevHeight');
        restoreInlineStyle(frame, 'width', 'aesPrevWidth');
        restoreInlineStyle(frame, 'display', 'aesPrevDisplay');
        restoreInlineStyle(frame, 'border-radius', 'aesPrevBorderRadius');
        restoreInlineStyle(frame, 'border', 'aesPrevBorder');
        restoreInlineStyle(frame, 'box-shadow', 'aesPrevBoxShadow');
        restoreInlineStyle(frame, 'box-sizing', 'aesPrevFrameBoxSizing');
        restoreInlineStyle(frame, 'max-width', 'aesPrevNativeSplitMaxWidth');
        restoreInlineStyle(frame, 'clip-path', 'aesPrevNativeSplitClipPath');
        delete frame.dataset.aesNativeChromeReserved;
        delete frame.dataset.aesNativeChromeReservedAxis;
        delete frame.dataset.aesNativeRoundedFrame;
        clearLegacyNativeFrameOffset(frame);
    }

    function clearNonIframeReservation() {
        const container = state.nonIframeReservedContainer ||
            (findNonIframeContentContainer() && nonIframeReservationAxis(findNonIframeContentContainer())
                ? findNonIframeContentContainer()
                : null);
        const surface = state.nonIframeReservedSurface ||
            (container ? findNonIframeContentSurface(container) : null);
        if (surface) {
            restoreInlineStyle(surface, 'border-radius', 'aesPrevNonIframeSurfaceBorderRadius');
            restoreInlineStyle(surface, 'border', 'aesPrevNonIframeSurfaceBorder');
            restoreInlineStyle(surface, 'box-shadow', 'aesPrevNonIframeSurfaceBoxShadow');
            restoreInlineStyle(surface, 'box-sizing', 'aesPrevNonIframeSurfaceBoxSizing');
            restoreInlineStyle(surface, 'overflow', 'aesPrevNonIframeSurfaceOverflow');
            restoreInlineStyle(surface, 'clip-path', 'aesPrevNonIframeSurfaceClipPath');
        }
        state.nonIframeReservedSurface = null;
        if (!container) return;
        restoreInlineStyle(container, 'padding-top', 'aesPrevNonIframePaddingTop');
        restoreInlineStyle(container, 'padding-left', 'aesPrevNonIframePaddingLeft');
        restoreInlineStyle(container, 'padding-right', 'aesPrevNonIframePaddingRight');
        restoreInlineStyle(container, 'padding-bottom', 'aesPrevNonIframePaddingBottom');
        restoreInlineStyle(container, 'box-sizing', 'aesPrevNonIframeBoxSizing');
        restoreInlineStyle(container, 'overflow', 'aesPrevNonIframeOverflow');
        restoreInlineStyle(container, 'background', 'aesPrevNonIframeBackground');
        restoreInlineStyle(container, 'border', 'aesPrevNonIframeBorder');
        restoreInlineStyle(container, 'border-radius', 'aesPrevNonIframeBorderRadius');
        restoreInlineStyle(container, 'box-shadow', 'aesPrevNonIframeBoxShadow');
        restoreInlineStyle(container, 'clip-path', 'aesPrevNonIframeClipPath');
        restoreInlineStyle(container, 'position', 'aesPrevNonIframePosition');
        container.classList.remove('aes-non-iframe-rounded-frame');
        delete container.dataset.aesNonIframeReserved;
        delete container.dataset.aesNonIframeReservedAxis;
        state.nonIframeReservedContainer = null;
    }

    function applyNonIframeReservation(container) {
        if (!container) {
            clearNonIframeReservation();
            return;
        }
        if (state.shellHidden || !state.showTabBarOnNonIframePages || state.activeId !== null) {
            clearNonIframeReservation();
            return;
        }

        const targetAxis = isVerticalBar() ? 'vertical' : 'horizontal';
        const existingAxis = nonIframeReservationAxis(container);
        if (existingAxis && existingAxis !== targetAxis) {
            clearNonIframeReservation();
        }
        if (state.nonIframeReservedContainer && state.nonIframeReservedContainer !== container) {
            clearNonIframeReservation();
        }

        const surface = findNonIframeContentSurface(container);
        if (state.nonIframeReservedSurface && state.nonIframeReservedSurface !== surface) {
            clearNonIframeReservation();
        }
        const roundedFramesEnabled = state.roundedPageFramesEnabled;

        rememberInlineStyle(container, 'padding-top', 'aesPrevNonIframePaddingTop');
        rememberInlineStyle(container, 'padding-left', 'aesPrevNonIframePaddingLeft');
        rememberInlineStyle(container, 'padding-right', 'aesPrevNonIframePaddingRight');
        rememberInlineStyle(container, 'padding-bottom', 'aesPrevNonIframePaddingBottom');
        rememberInlineStyle(container, 'box-sizing', 'aesPrevNonIframeBoxSizing');
        rememberInlineStyle(container, 'overflow', 'aesPrevNonIframeOverflow');
        rememberInlineStyle(container, 'background', 'aesPrevNonIframeBackground');
        rememberInlineStyle(container, 'border', 'aesPrevNonIframeBorder');
        rememberInlineStyle(container, 'border-radius', 'aesPrevNonIframeBorderRadius');
        rememberInlineStyle(container, 'box-shadow', 'aesPrevNonIframeBoxShadow');
        rememberInlineStyle(container, 'clip-path', 'aesPrevNonIframeClipPath');
        rememberInlineStyle(container, 'position', 'aesPrevNonIframePosition');
        container.style.setProperty('box-sizing', 'border-box', 'important');
            container.style.setProperty('overflow', 'hidden', 'important');
        if (getComputedStyle(container).position === 'static') {
            container.style.setProperty('position', 'relative', 'important');
        }
        if (roundedFramesEnabled) {
            container.classList.add('aes-non-iframe-rounded-frame');
            container.style.setProperty('background', effectiveDarkMode() ? '#11161c' : '#f6f7f8', 'important');
            container.style.setProperty('padding-right', '8px', 'important');
            container.style.setProperty('padding-bottom', '8px', 'important');
            container.style.setProperty('border', '1px solid rgba(55, 106, 148, 0.24)', 'important');
            container.style.setProperty('border-radius', '10px', 'important');
            container.style.setProperty('box-shadow', effectiveDarkMode() ? '0 10px 28px rgba(0, 0, 0, 0.34)' : '0 14px 34px rgba(15, 23, 42, 0.22)', 'important');
            container.style.setProperty('clip-path', 'inset(0 round 10px)', 'important');
        } else {
            container.classList.remove('aes-non-iframe-rounded-frame');
            container.style.removeProperty('background');
            container.style.removeProperty('padding-right');
            container.style.removeProperty('padding-bottom');
            container.style.removeProperty('border');
            container.style.removeProperty('border-radius');
            container.style.removeProperty('box-shadow');
            container.style.removeProperty('clip-path');
        }

        if (surface) {
            rememberInlineStyle(surface, 'border-radius', 'aesPrevNonIframeSurfaceBorderRadius');
            rememberInlineStyle(surface, 'border', 'aesPrevNonIframeSurfaceBorder');
            rememberInlineStyle(surface, 'box-shadow', 'aesPrevNonIframeSurfaceBoxShadow');
            rememberInlineStyle(surface, 'box-sizing', 'aesPrevNonIframeSurfaceBoxSizing');
            rememberInlineStyle(surface, 'overflow', 'aesPrevNonIframeSurfaceOverflow');
            rememberInlineStyle(surface, 'clip-path', 'aesPrevNonIframeSurfaceClipPath');
            if (roundedFramesEnabled) {
                surface.style.setProperty('border-radius', '10px', 'important');
                surface.style.setProperty('border', '1px solid rgba(55, 106, 148, 0.24)', 'important');
                surface.style.setProperty('box-shadow', effectiveDarkMode() ? '0 10px 28px rgba(0, 0, 0, 0.34)' : '0 14px 34px rgba(15, 23, 42, 0.22)', 'important');
                surface.style.setProperty('box-sizing', 'border-box', 'important');
                surface.style.setProperty('overflow', 'hidden', 'important');
                surface.style.setProperty('clip-path', 'inset(0 round 10px)', 'important');
            } else {
                surface.style.removeProperty('border-radius');
                surface.style.removeProperty('border');
                surface.style.removeProperty('box-shadow');
                surface.style.removeProperty('box-sizing');
                surface.style.removeProperty('overflow');
                surface.style.removeProperty('clip-path');
            }
            state.nonIframeReservedSurface = surface;
        }

        if (targetAxis === 'vertical') {
            container.style.setProperty('padding-top', roundedFramesEnabled ? '8px' : '0', 'important');
            container.style.setProperty('padding-left', (currentVerticalBarWidth() + (roundedFramesEnabled ? 8 : 0)) + 'px', 'important');
        } else {
            container.style.setProperty('padding-left', roundedFramesEnabled ? '8px' : '0', 'important');
            container.style.setProperty('padding-top', (currentHorizontalBarHeight() + (roundedFramesEnabled ? 8 : 0)) + 'px', 'important');
        }

        container.dataset.aesNonIframeReserved = 'true';
        container.dataset.aesNonIframeReservedAxis = targetAxis;
        state.nonIframeReservedContainer = container;
        scheduleNonIframeRoundedSurfaceStyles();
    }

    function applyNativeChromeReservation(frame) {
        if (!frame) return;
        clearNonIframeReservation();
        if (state.shellHidden || state.activeId !== null) {
            clearNativeChromeReservation(frame);
            return;
        }

        const container = frame.parentElement;
        if (!container || container === document.body || container === document.documentElement) {
            clearNativeChromeReservation(frame);
            return;
        }

        // If orientation changed, the wrong axis may already be reserved.
        // Bail out and re-reserve from scratch on the next call.
        const targetAxis = isVerticalBar() ? 'vertical' : 'horizontal';
        const existingAxis = reservationAxis(container);
        if (existingAxis && existingAxis !== targetAxis) {
            clearNativeChromeReservation(frame);
        }
        if (state.nativeReservedContainer && state.nativeReservedContainer !== container) {
            clearNativeChromeReservation(frame);
        }
        const roundedFramesEnabled = state.roundedPageFramesEnabled;

        clearLegacyNativeFrameOffset(frame);

        rememberInlineStyle(container, 'padding-top', 'aesPrevPaddingTop');
        rememberInlineStyle(container, 'padding-left', 'aesPrevPaddingLeft');
        rememberInlineStyle(container, 'box-sizing', 'aesPrevBoxSizing');
        rememberInlineStyle(container, 'overflow', 'aesPrevOverflow');
        rememberInlineStyle(container, 'background', 'aesPrevBackground');
        rememberInlineStyle(container, 'width', 'aesPrevNativeSplitWidth');
        rememberInlineStyle(frame, 'margin-top', 'aesPrevMarginTop');
        rememberInlineStyle(frame, 'margin-left', 'aesPrevMarginLeft');
        rememberInlineStyle(frame, 'height', 'aesPrevHeight');
        rememberInlineStyle(frame, 'width', 'aesPrevWidth');
        rememberInlineStyle(frame, 'display', 'aesPrevDisplay');
        rememberInlineStyle(frame, 'border-radius', 'aesPrevBorderRadius');
        rememberInlineStyle(frame, 'border', 'aesPrevBorder');
        rememberInlineStyle(frame, 'box-shadow', 'aesPrevBoxShadow');
        rememberInlineStyle(frame, 'box-sizing', 'aesPrevFrameBoxSizing');
        rememberInlineStyle(frame, 'max-width', 'aesPrevNativeSplitMaxWidth');
        rememberInlineStyle(frame, 'clip-path', 'aesPrevNativeSplitClipPath');

        container.style.setProperty('box-sizing', 'border-box', 'important');
        container.style.setProperty('overflow', 'hidden', 'important');
        if (roundedFramesEnabled) {
            container.style.setProperty('background', effectiveDarkMode() ? '#11161c' : '#f6f7f8', 'important');
        } else {
            container.style.removeProperty('background');
        }
        frame.style.removeProperty('translate');
        frame.style.removeProperty('margin-top');
        frame.style.removeProperty('margin-left');
        frame.style.setProperty('display', 'block', 'important');

        if (targetAxis === 'vertical') {
            container.style.setProperty('padding-top', '0', 'important');
            container.style.setProperty('padding-left', currentVerticalBarWidth() + 'px', 'important');
        } else {
            container.style.setProperty('padding-left', '0', 'important');
            container.style.setProperty('padding-top', currentHorizontalBarHeight() + 'px', 'important');
        }

        container.style.removeProperty('width');

        if (roundedFramesEnabled) {
            frame.style.setProperty('margin-top', '8px', 'important');
            frame.style.setProperty('margin-left', '8px', 'important');
            frame.style.setProperty('width', 'calc(100% - 16px)', 'important');
            frame.style.setProperty('height', 'calc(100% - 16px)', 'important');
            frame.style.setProperty('border-radius', '10px', 'important');
            frame.style.setProperty('border', '1px solid rgba(55, 106, 148, 0.24)', 'important');
            frame.style.setProperty('box-shadow', effectiveDarkMode() ? '0 10px 28px rgba(0, 0, 0, 0.34)' : '0 14px 34px rgba(15, 23, 42, 0.22)', 'important');
            frame.style.setProperty('box-sizing', 'border-box', 'important');
            frame.dataset.aesNativeRoundedFrame = 'true';
        } else {
            frame.style.removeProperty('margin-top');
            frame.style.removeProperty('margin-left');
            frame.style.setProperty('width', '100%', 'important');
            frame.style.setProperty('height', '100%', 'important');
            frame.style.removeProperty('border-radius');
            frame.style.removeProperty('border');
            frame.style.removeProperty('box-shadow');
            frame.style.removeProperty('box-sizing');
            delete frame.dataset.aesNativeRoundedFrame;
        }

        frame.style.removeProperty('max-width');
        frame.style.removeProperty('clip-path');

        container.dataset.aesNativeChromeReserved = 'true';
        container.dataset.aesNativeChromeReservedAxis = targetAxis;
        frame.dataset.aesNativeChromeReserved = 'true';
        frame.dataset.aesNativeChromeReservedAxis = targetAxis;
        state.nativeReservedContainer = container;
    }

    function syncGeometry() {
        state.geometryRaf = 0;
        if (!state.bar) return;
        if (state.peekReuseIframe && state.peekSyncOverlay) {
            state.peekSyncOverlay();
            return;
        }
        const frame = findContentIframe();
        state.lastGeometryHadNativeFrame = !!frame;
        updateResizableBarClasses();
        if (!featuresEnabled()) {
            if (frame) clearNativeChromeReservation(frame);
            clearNonIframeReservation();
            state.bar.style.display = 'none';
            state.viewport.style.display = 'none';
            if (state.homeCover) state.homeCover.style.display = 'none';
            return;
        }
        if (!frame) {
            trackNativeFrame(null);
            if (state.shellHidden || !state.showTabBarOnNonIframePages) {
                stopNonIframeTitleWatcher();
                clearNonIframeReservation();
                state.bar.style.display = 'none';
                state.viewport.style.display = 'none';
                if (state.homeCover) state.homeCover.style.display = 'none';
                return;
            }

            const container = findNonIframeContentContainer();
            applyNonIframeReservation(container);
            const base = readNoIframeBase(container);
            state.bar.style.display = '';
            state.viewport.style.display = state.activeId === null ? 'none' : '';
            if (state.homeCover) state.homeCover.style.display = 'none';
            if (state.activeId === null) {
                ensureNonIframeTitleWatcher();
                updateHomeTitleFromTopLevelPage(true);
            } else {
                stopNonIframeTitleWatcher();
            }

            if (isVerticalBar()) {
                const barWidth = currentVerticalBarWidth();
                setCssPx(state.bar, 'left', base.left);
                setCssPx(state.bar, 'top', base.top);
                setCssPx(state.bar, 'width', barWidth);
                setCssPx(state.bar, 'height', base.height);
                setCssPx(state.viewport, 'left', base.left + barWidth);
                setCssPx(state.viewport, 'top', base.top);
                setCssPx(state.viewport, 'width', Math.max(0, base.width - barWidth));
                setCssPx(state.viewport, 'height', base.height);
                state.viewport.style.bottom = 'auto';
            } else {
                setCssPx(state.bar, 'left', base.left);
                setCssPx(state.bar, 'top', base.top);
                setCssPx(state.bar, 'width', base.width);
                const barHeight = currentHorizontalBarHeight();
                setCssPx(state.bar, 'height', barHeight);
                setCssPx(state.viewport, 'left', base.left);
                setCssPx(state.viewport, 'top', base.top + barHeight);
                setCssPx(state.viewport, 'width', base.width);
                setCssPx(state.viewport, 'height', Math.max(0, base.height - barHeight));
                state.viewport.style.bottom = 'auto';
            }
            updateTabScrollButtons();
            return;
        }
        stopNonIframeTitleWatcher();
        clearNonIframeReservation();
        trackNativeFrame(frame);
        const base = readNativeFrameBase(frame);

        if (state.shellHidden) {
            ensureNativeFrameSpacer(frame);
            applyNativeChromeReservation(frame);
            state.bar.style.display = 'none';
            state.viewport.style.display = 'none';
            if (state.homeCover) state.homeCover.style.display = 'none';
            return;
        }

        ensureNativeFrameSpacer(frame);
        applyNativeChromeReservation(frame);

        state.bar.style.display = '';
        state.viewport.style.display = '';
        const barTop = base.top;
        if (isVerticalBar()) {
            const barWidth = currentVerticalBarWidth();
            if (state.homeCover) {
                state.homeCover.style.display = state.activeId === null ? '' : 'none';
                setCssPx(state.homeCover, 'left', base.left);
                setCssPx(state.homeCover, 'top', barTop);
                setCssPx(state.homeCover, 'width', barWidth);
                setCssPx(state.homeCover, 'height', Math.max(0, base.height - 1));
            }
            setCssPx(state.bar, 'left', base.left);
            setCssPx(state.bar, 'top', barTop);
            setCssPx(state.bar, 'width', barWidth);
            setCssPx(state.bar, 'height', Math.max(0, base.height - 1));
            setCssPx(state.viewport, 'left', base.left + barWidth);
            setCssPx(state.viewport, 'top', base.top);
            setCssPx(state.viewport, 'width', Math.max(0, base.width - barWidth));
            setCssPx(state.viewport, 'height', base.height);
            state.viewport.style.bottom = 'auto';
        } else {
            if (state.homeCover) {
                state.homeCover.style.display = state.activeId === null ? '' : 'none';
                setCssPx(state.homeCover, 'left', base.left);
                setCssPx(state.homeCover, 'top', barTop);
                setCssPx(state.homeCover, 'width', base.width);
                const barHeight = currentHorizontalBarHeight();
                setCssPx(state.homeCover, 'height', barHeight);
            }
            setCssPx(state.bar, 'left', base.left);
            setCssPx(state.bar, 'top', barTop);
            setCssPx(state.bar, 'width', base.width);
            const barHeight = currentHorizontalBarHeight();
            setCssPx(state.bar, 'height', barHeight);
            setCssPx(state.viewport, 'left', base.left);
            setCssPx(state.viewport, 'top', base.top + barHeight);
            setCssPx(state.viewport, 'width', base.width);
            setCssPx(state.viewport, 'height', Math.max(0, base.height - barHeight));
            state.viewport.style.bottom = 'auto';
        }
        updateTabScrollButtons();
    }

    function requestSyncGeometry() {
        if (state.geometryRaf) return;
        state.geometryRaf = window.requestAnimationFrame(syncGeometry);
    }

    function requestResizeSyncGeometry() {
        const width = window.innerWidth || document.documentElement.clientWidth || 0;
        const height = window.innerHeight || document.documentElement.clientHeight || 0;
        if (
            Math.abs(width - state.lastGeometryViewportWidth) < 2 &&
            Math.abs(height - state.lastGeometryViewportHeight) < 2
        ) {
            return;
        }
        state.lastGeometryViewportWidth = width;
        state.lastGeometryViewportHeight = height;
        if (state.geometryResizeFinalizeTimerId) {
            window.clearTimeout(state.geometryResizeFinalizeTimerId);
        }
        state.geometryResizeFinalizeTimerId = window.setTimeout(function () {
            state.geometryResizeFinalizeTimerId = 0;
            requestSyncGeometry();
        }, 90);
    }

    function startGeometryBurst(durationMs) {
        const until = Date.now() + durationMs;
        if (until > state.geometryBurstUntil) state.geometryBurstUntil = until;
        if (state.geometryBurstTimerId) return;

        state.geometryBurstTimerId = window.setInterval(function () {
            requestSyncGeometry();
            if (Date.now() >= state.geometryBurstUntil) {
                window.clearInterval(state.geometryBurstTimerId);
                state.geometryBurstTimerId = 0;
                state.geometryBurstUntil = 0;
            }
        }, 80);
    }

    function installGeometrySync() {
        window.addEventListener('resize', requestResizeSyncGeometry, { passive: true });
        window.addEventListener('transitionrun', function () { startGeometryBurst(450); }, true);
        window.addEventListener('transitionstart', function () { startGeometryBurst(450); }, true);
        window.addEventListener('transitionend', requestSyncGeometry, true);

        if ('ResizeObserver' in window && !state.rootResizeObserver) {
            state.rootResizeObserver = new ResizeObserver(requestResizeSyncGeometry);
            state.rootResizeObserver.observe(document.documentElement);
            if (document.body) state.rootResizeObserver.observe(document.body);
        }

        if (!state.rootMutationObserver) {
            state.rootMutationObserver = new MutationObserver(function (mutations) {
                const noIframeTestMode = state.showTabBarOnNonIframePages && !state.lastGeometryHadNativeFrame;
                function nodeContainsFrame(node) {
                    return !!(node && (
                        node.nodeName === 'IFRAME' ||
                        node.nodeName === 'FRAME' ||
                        (node.querySelector && node.querySelector('iframe, frame'))
                    ));
                }

                for (const mutation of mutations) {
                    if (isShellOwnedMutationTarget(mutation.target)) continue;
                    if (mutation.type === 'childList') {
                        if (state.roundedPageFramesEnabled && state.nonIframeReservedContainer && state.activeId === null) {
                            scheduleNonIframeRoundedSurfaceStyles();
                        }
                        const nodes = [...mutation.addedNodes, ...mutation.removedNodes];
                        if (nodes.some(nodeContainsFrame)) {
                            if (state.activeId === null) startNativeHomeLoading();
                            startGeometryBurst(300);
                            return;
                        }
                        continue;
                    }
                    if (mutation.type === 'attributes') {
                        if (state.roundedPageFramesEnabled && state.nonIframeReservedContainer && state.activeId === null) {
                            scheduleNonIframeRoundedSurfaceStyles();
                        }
                        if (noIframeTestMode) continue;
                        const target = mutation.target;
                        const targetIsFrame = target && (target.nodeName === 'IFRAME' || target.nodeName === 'FRAME');
                        const targetIsRoot = target === document.body || target === document.documentElement;
                        const targetIsReservedSurface = state.nonIframeReservedContainer && target === state.nonIframeReservedContainer;
                        if (!targetIsFrame && !targetIsRoot && !targetIsReservedSurface) continue;
                        startGeometryBurst(300);
                        return;
                    }
                }
            });
            state.rootMutationObserver.observe(document.body || document.documentElement, {
                attributes: true,
                childList: true,
                subtree: true,
                attributeFilter: ['class', 'style'],
            });
        }

        if (!state.geometryPollId) {
            state.geometryPollId = window.setInterval(requestSyncGeometry, 5000);
        }
    }

    function updateShellVisibility() {
        document.documentElement.classList.toggle('at-tabs-shell-hidden', state.shellHidden || !state.extensionEnabled);
        requestSyncGeometry();
    }

    function featuresEnabled() {
        return state.extensionEnabled !== false;
    }

    function broadcastFeatureEnabledState() {
        const payload = { __ns: AES.MSG_NS, type: 'feature-enabled', enabled: featuresEnabled() };
        try { window.postMessage(payload, location.origin); } catch (e) {}
        try {
            for (let i = 0; i < window.frames.length; i++) {
                try { window.frames[i].postMessage(payload, '*'); } catch (e) {}
            }
        } catch (e) {}
    }

    function applyExtensionEnabledState(restoreOnEnable) {
        if (restoreOnEnable === undefined) restoreOnEnable = true;
        AES.state.extensionEnabled = featuresEnabled();
        if (!featuresEnabled()) {
            hideHoverCard(true);
            closeTabContextMenu();
            if (state.nativeFrame) clearNativeChromeReservation(state.nativeFrame);
            clearNonIframeReservation();
            stopNonIframeTitleWatcher();
            if (AES.setPhoneLinksEnabled) AES.setPhoneLinksEnabled(false);
            syncImprovedScrollbarsState();
            applyEarlyAccessLabelVisibility(document);
            applyResourcePlannerCalendarShortcut(document);
        } else {
            if (AES.initPhoneLinks) AES.initPhoneLinks();
            injectTopLevelPageBridgeFromShell();
            if (AES.installTopLevelNavigationInterception) AES.installTopLevelNavigationInterception();
            installTopLevelRouteWatchers();
            if (restoreOnEnable && !state.tabs.length) {
                void restoreTabs().then(function () {
                    if (!state.tabs.length) activateHome();
                    requestSyncGeometry();
                });
            }
            applyEarlyAccessLabelVisibility(document);
            applyResourcePlannerCalendarShortcut(document);
            syncImprovedScrollbarsState();
        }
        broadcastFeatureEnabledState();
        updateShellVisibility();
    }

    function tabById(id) {
        return state.tabs.find(t => t.id === id) || null;
    }

    function normalizeSplitPairIds(pair) {
        if (!Array.isArray(pair)) return null;
        const ids = [];
        for (const id of pair) {
            if (ids.includes(id)) continue;
            if (!tabById(id)) continue;
            ids.push(id);
            if (ids.length >= 4) break;
        }
        return ids.length >= 2 ? ids : null;
    }

    function syncTabPaneState() {
        if (!state.viewport) return;

        const active = tabById(state.activeId);
        let pair = normalizeSplitPairIds(state.splitPairIds);
        const activeMemberId = active ? active.id : null;
        let visibleSplitIds = pair && pair.includes(activeMemberId) ? pair.slice(0, 4) : [];
        if (visibleSplitIds.length) {
            state.splitPairIds = pair;
            state.splitId = visibleSplitIds.find(id => id !== activeMemberId) || null;
        } else {
            state.splitId = null;
            if (state.splitPairIds && !pair) {
                state.splitPairIds = null;
                pair = null;
            }
        }

        let splitSharedColor = '';
        if (pair) {
            const activePairTab = active && pair.includes(active.id) ? active : null;
            const firstPairTab = tabById(pair[0]);
            const secondPairTab = tabById(pair.find(id => !firstPairTab || id !== firstPairTab.id));
            splitSharedColor = TAB_COLOR_PRESETS.includes(state.splitPairColor)
                ? state.splitPairColor
                : activePairTab && TAB_COLOR_PRESETS.includes(activePairTab.color)
                ? activePairTab.color
                : (firstPairTab && TAB_COLOR_PRESETS.includes(firstPairTab.color)
                    ? firstPairTab.color
                    : (secondPairTab && TAB_COLOR_PRESETS.includes(secondPairTab.color) ? secondPairTab.color : ''));
            state.splitPairColor = splitSharedColor;
        } else {
            state.splitPairColor = '';
        }

        const splitActive = visibleSplitIds.length >= 2;
        state.viewport.classList.toggle('empty', !active);
        state.viewport.classList.toggle('split', splitActive);
        state.viewport.classList.toggle('split-count-2', splitActive && visibleSplitIds.length === 2);
        state.viewport.classList.toggle('split-count-3', splitActive && visibleSplitIds.length === 3);
        state.viewport.classList.toggle('split-count-4', splitActive && visibleSplitIds.length === 4);
        state.viewport.classList.toggle('split-resizing', splitActive && state.splitResizing);
        applySplitRatio();

        const visibleSet = new Set(visibleSplitIds);
        if (state.homeTabEl) state.homeTabEl.classList.toggle('split-target', false);

        for (const tab of state.tabs) {
            const isPrimary = !!(active && tab.id === active.id);
            const splitPaneIndex = splitActive ? visibleSplitIds.indexOf(tab.id) : -1;
            const isSplitMember = !!(pair && pair.includes(tab.id));
            const isVisibleSplitPane = splitPaneIndex >= 0;
            const isSplit = !!(splitActive && isVisibleSplitPane && !isPrimary);
            const isLeftPane = !!(splitActive && visibleSplitIds.length === 2 && splitPaneIndex === 0);
            const isRightPane = !!(splitActive && visibleSplitIds.length === 2 && splitPaneIndex === 1);

            tab.splitSharedColor = isSplitMember ? splitSharedColor : '';
            if (tab.tabEl) {
                tab.tabEl.classList.toggle('active', isPrimary);
                tab.tabEl.classList.toggle('split-member', isSplitMember);
                tab.tabEl.classList.toggle('split-target', isSplit);
                applyTabColorStyle(tab);
            }

            tab.iframeEl.classList.toggle('primary-pane', splitActive && isPrimary);
            tab.iframeEl.classList.toggle('split-pane', isSplit);
            tab.iframeEl.classList.toggle('left-pane', isLeftPane);
            tab.iframeEl.classList.toggle('right-pane', isRightPane);
            for (let i = 0; i < 4; i++) {
                tab.iframeEl.classList.toggle('split-pane-index-' + i, splitPaneIndex === i);
            }
            tab.iframeEl.classList.toggle('hidden', splitActive ? !visibleSet.has(tab.id) : !isPrimary);
            if (tab.loaderEl) {
                tab.loaderEl.classList.toggle('left-pane', isLeftPane);
                tab.loaderEl.classList.toggle('right-pane', isRightPane);
                for (let i = 0; i < 4; i++) {
                    tab.loaderEl.classList.toggle('split-pane-index-' + i, splitPaneIndex === i);
                }
            tab.loaderEl.classList.toggle('hidden', splitActive ? !visibleSet.has(tab.id) : !(state.roundedPageFramesEnabled && isPrimary));
            }
        }
    }

    function getSplitPaneIds() {
        const pair = normalizeSplitPairIds(state.splitPairIds);
        const activeMemberId = state.activeId;
        if (!pair || !pair.includes(activeMemberId) || pair.length !== 2) return null;
        const left = tabById(pair[0]);
        const right = tabById(pair[1]);
        if (!left || !right) return null;
        return { left: pair[0], right: pair[1] };
    }

    function getSplitGroupIds() {
        return normalizeSplitPairIds(state.splitPairIds) || [];
    }

    function splitGroupIncludesActive(group) {
        return state.activeId !== null && Array.isArray(group) && group.includes(state.activeId);
    }

    function canAddTabToSplit(tabId) {
        if (state.activeId === null || state.activeId === tabId || !tabById(tabId)) return false;
        const group = getSplitGroupIds();
        if (!group.length) return true;
        if (!splitGroupIncludesActive(group)) return true;
        return !group.includes(tabId) && group.length < 4;
    }

    function enableSplitScreen(tabId) {
        if (!canAddTabToSplit(tabId)) return false;
        const active = tabById(state.activeId);
        const split = tabById(tabId);
        const group = getSplitGroupIds();
        state.splitPairIds = splitGroupIncludesActive(group)
            ? group.concat(tabId).slice(0, 4)
            : [active.id, tabId];
        state.splitRatios = normalizeSplitRatios(state.splitRatios, state.splitPairIds.length);
        state.splitId = tabId;
        state.splitPairColor = TAB_COLOR_PRESETS.includes(state.splitPairColor)
            ? state.splitPairColor
            : TAB_COLOR_PRESETS.includes(active && active.color)
            ? active.color
            : (TAB_COLOR_PRESETS.includes(split && split.color) ? split.color : '');
        state.splitRatio = normalizeSplitRatio(state.splitRatio);
        ensureTabIframeLoaded(active);
        ensureTabIframeLoaded(split);
        syncTabPaneState();
        updateLoaderVisibility();
        updateTabScrollButtons();
        saveTabs();
        return true;
    }

    function disableSplitScreen() {
        if (state.splitId === null && !state.splitPairIds) return;
        state.splitId = null;
        state.splitPairIds = null;
        state.splitPairColor = '';
        state.splitResizing = false;
        syncTabPaneState();
        updateLoaderVisibility();
        updateTabScrollButtons();
        saveTabs();
    }

    function swapSplitTabs() {
        const panes = getSplitPaneIds();
        if (!panes) return;
        const leftIndex = state.tabs.findIndex(tab => tab.id === panes.left);
        const rightIndex = state.tabs.findIndex(tab => tab.id === panes.right);
        if (leftIndex < 0 || rightIndex < 0) return;
        const tmp = state.tabs[leftIndex];
        state.tabs[leftIndex] = state.tabs[rightIndex];
        state.tabs[rightIndex] = tmp;
        state.splitPairIds = [panes.right, panes.left];
        renderTabs();
        syncTabPaneState();
        updateLoaderVisibility();
        ensureActiveTabVisible();
        updateTabScrollButtons();
        saveTabs();
    }

    function detachSplitPane(side) {
        const panes = getSplitPaneIds();
        if (!panes) return;
        const tabId = side === 'left' ? panes.left : panes.right;
        detachSplitTab(tabId);
    }

    function detachSplitTab(tabId) {
        const group = getSplitGroupIds();
        if (!group.includes(tabId)) return;
        const nextGroup = group.filter(id => id !== tabId);
        const activeMemberId = state.activeId;
        const remainingId = nextGroup.includes(activeMemberId) ? activeMemberId : nextGroup[0];
        if (!remainingId) return;
        state.activeId = remainingId;
        state.splitId = null;
        state.splitPairIds = nextGroup.length >= 2 ? nextGroup : null;
        state.splitRatios = state.splitPairIds ? normalizeSplitRatios(state.splitRatios, state.splitPairIds.length) : [];
        if (!state.splitPairIds) state.splitPairColor = '';
        state.splitResizing = false;
        syncTabPaneState();
        updateHomeTabActive();
        updateLoaderVisibility();
        ensureActiveTabVisible();
        updateTabScrollButtons();
        saveTabs();
    }

    function openSplitHandleContextMenu(x, y) {
        if (!getSplitPaneIds()) return;
        closeTabContextMenu();

        const menu = document.createElement('div');
        menu.className = 'at-tabs-context-menu';
        menu.setAttribute('role', 'menu');
        menu.appendChild(createContextMenuItem(
            'Swap tabs',
            ICONS.split,
            function () {
                closeTabContextMenu();
                swapSplitTabs();
            }
        ));
        menu.appendChild(createContextMenuDivider());
        menu.appendChild(createContextMenuItem(
            'Detach left tab',
            '',
            function () {
                closeTabContextMenu();
                detachSplitPane('left');
            }
        ));
        menu.appendChild(createContextMenuItem(
            'Detach right tab',
            '',
            function () {
                closeTabContextMenu();
                detachSplitPane('right');
            }
        ));

        document.body.appendChild(menu);
        state.tabContextMenu = menu;
        positionContextMenu(menu, x, y);
    }

    function legacyRemovedSplitFunctionsAnchor() {
        return null;
    }

    function updateSplitRatioFromPointer(event) {
        if (!state.viewport) return;
        const rect = state.viewport.getBoundingClientRect();
        if (!rect.width) return;
        const ratio = (event.clientX - rect.left) / rect.width;
        const count = getSplitGroupIds().length || 2;
        if (count <= 2) {
            state.splitRatio = normalizeSplitRatio(ratio);
        } else {
            const index = Math.max(0, Math.min(count - 2, Number(state.splitResizeHandleIndex) || 0));
            const ratios = normalizeSplitRatios(state.splitRatios, count);
            const min = index === 0 ? 0.12 : ratios[index - 1] + 0.12;
            const max = index === ratios.length - 1 ? 0.88 : ratios[index + 1] - 0.12;
            ratios[index] = Math.min(max, Math.max(min, ratio));
            state.splitRatios = ratios;
        }
        applySplitRatio();
    }

    function stopSplitResize(event) {
        if (!state.splitResizing) return;
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        state.splitResizing = false;
        state.splitResizeHandleIndex = 0;
        if (state.viewport) state.viewport.classList.remove('split-resizing');
        document.removeEventListener('pointermove', updateSplitRatioFromPointer, true);
        document.removeEventListener('pointerup', stopSplitResize, true);
        document.removeEventListener('pointercancel', stopSplitResize, true);
        saveTabs();
    }

    function startSplitResize(event) {
        if (event.button !== 0) return;
        const count = getSplitGroupIds().length || 0;
        if (!state.viewport || count < 2 || count > 4) return;
        event.preventDefault();
        event.stopPropagation();
        state.splitResizeHandleIndex = Number(event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.splitHandle) || 0;
        state.splitResizing = true;
        state.viewport.classList.add('split-resizing');
        try {
            if (event.currentTarget && event.currentTarget.setPointerCapture) {
                event.currentTarget.setPointerCapture(event.pointerId);
            }
        } catch (e) { /* Pointer capture is best-effort. */ }
        updateSplitRatioFromPointer(event);
        document.addEventListener('pointermove', updateSplitRatioFromPointer, true);
        document.addEventListener('pointerup', stopSplitResize, true);
        document.addEventListener('pointercancel', stopSplitResize, true);
    }

    function activateHome() {
        if (state.activeId !== null && tabById(state.activeId)) {
            state.activationHistory = state.activationHistory.filter(id => id !== state.activeId);
            state.activationHistory.push(state.activeId);
        } else {
            state.activationHistory.push(null);
        }
        state.activeId = null;
        state.splitId = null;
        if (state.homeLoadingAwaitingNativeLoad && !findContentIframe() && state.showTabBarOnNonIframePages) {
            clearHomeLoading();
            scheduleNonIframeTitleUpdate();
        }
        if (!state.homeLoadingAwaitingNativeLoad) setHomeLoading(false);
        syncTabPaneState();
        updateHomeTabActive();
        updateLoaderVisibility();
        requestSyncGeometry();
        ensureActiveTabVisible();
        updateTabScrollButtons();
        saveTabs();
    }

    function activateTab(id, options) {
        const opts = options || {};
        const previousId = state.activeId;
        state.activeId = id;
        const pair = normalizeSplitPairIds(state.splitPairIds);
        state.splitId = pair && pair.includes(id)
            ? pair.find(candidateId => candidateId !== id) || null
            : null;
        if (previousId === null) {
            state.activationHistory = state.activationHistory.filter(historyId => historyId !== null);
            state.activationHistory.push(null);
        }
        if (opts.recordPrevious !== false && previousId !== null && previousId !== id && tabById(previousId)) {
            state.activationHistory = state.activationHistory.filter(candidateId => candidateId !== previousId);
            state.activationHistory.push(previousId);
        }
        if (opts.load !== false) {
            const activeSplitPair = pair && pair.includes(id) ? pair : null;
            if (activeSplitPair) {
                activeSplitPair.forEach(function (splitId) {
                    ensureTabIframeLoaded(tabById(splitId));
                });
            } else {
                ensureTabIframeLoaded(tabById(id));
            }
        }
        syncTabPaneState();
        state.viewport.style.display = '';
        updateHomeTabActive();
        updateLoaderVisibility();
        requestSyncGeometry();
        ensureActiveTabVisible();
        updateTabScrollButtons();
        saveTabs();
    }

    function closeTab(id) {
        const idx = state.tabs.findIndex(t => t.id === id);
        if (idx === -1) return;
        const removed = state.tabs.splice(idx, 1)[0];
        try { removed.iframeEl.remove(); } catch (e) {}
        try { if (removed.loaderEl) removed.loaderEl.remove(); } catch (e) {}
        if (state.splitId === id) state.splitId = null;
        if (state.splitPairIds && state.splitPairIds.includes(id)) {
            const nextGroup = state.splitPairIds.filter(candidateId => candidateId !== id);
            state.splitPairIds = nextGroup.length >= 2 ? nextGroup : null;
            state.splitRatios = state.splitPairIds ? normalizeSplitRatios(state.splitRatios, state.splitPairIds.length) : [];
            state.splitId = null;
            if (!state.splitPairIds) state.splitPairColor = '';
        }
        state.activationHistory = state.activationHistory.filter(candidateId => candidateId !== id);
        if (state.activeId === id) {
            const previousId = state.activationHistory.pop();
            if (previousId === null) {
                activateHome();
            } else {
                const previous = previousId ? tabById(previousId) : null;
                const next = previous || state.tabs[Math.min(idx, state.tabs.length - 1)];
                if (next) activateTab(next.id, { recordPrevious: false });
                else activateHome();
            }
        } else {
            syncTabPaneState();
        }
        renderTabs();
        syncTabPaneState();
        updateLoaderVisibility();
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
            } catch (e) {}
        }
        return null;
    }

    function windowBelongsToIframe(win, iframeEl) {
        if (!win || !iframeEl || !iframeEl.contentWindow) return false;
        let w = win;
        try {
            while (w) {
                if (w === iframeEl.contentWindow) return true;
                if (w.parent === w) break;
                w = w.parent;
            }
        } catch (e) {}
        return false;
    }

    function windowBelongsToPeek(win) {
        if (!state.peekWrapper) return false;
        const frames = state.peekWrapper.querySelectorAll('iframe');
        for (const frame of frames) {
            if (windowBelongsToIframe(win, frame)) return true;
        }
        return false;
    }

    function findNativeFrameFromWindow(win) {
        if (windowBelongsToIframe(win, state.nativeFrame)) return state.nativeFrame;
        const currentNativeFrame = findContentIframe();
        if (windowBelongsToIframe(win, currentNativeFrame)) return currentNativeFrame;
        return null;
    }

    function tabTypeForUrl(url) {
        const p = AES.normalizeHandledPath(AES.pathOf(url));
        if (p === '/mvc/servicedesk/ticketdetail.mvc') return 'ticket';
        if (p === '/mvc/servicedesk/ticketnew.mvc') return 'ticket';
        if (p === '/mvc/crm/accountdetail.mvc') return 'account';
        if (p === '/mvc/crm/installedproductdetail.mvc') return 'device';
        if (p === '/mvc/crm/note.mvc/view') return 'note';
        if (p === '/mvc/crm/opportunitydetail.mvc') return 'opportunity';
        if (p === '/autotask35/crm/salesorder/salesorderdetail.aspx') return 'salesorder';
        if (/\/inventory\/inventory_edit_order\.aspx$/i.test(p || '')) return 'purchaseorder';
        if (p === '/opportunity/quotes/quote.asp' ||
            p === '/opportunity/quotes/newquote.asp' ||
            p === '/mvc/crm/quotetemplate.mvc/editproperties') return 'quote';
        if (p.includes('/contactdetail') || p.includes('/resourcedetail') || p.includes('/persondetail') || p === '/autotask35/grapevine/profile.aspx') return 'person';
        if (p === '/autotask/views/crm/contact_group_management.aspx' ||
            p === '/autotask35/crm/contactgroupmanager.aspx') return 'group';
        if (p === '/timesheets/views/readonly/tmsreadonly_100.asp') return 'timesheet';
        if (p === '/mvc/inventory/costitem.mvc/shipping' ||
            p === '/mvc/inventory/receipthistory.mvc' ||
            p === '/mvc/inventory/emailpurchaseorder.mvc/emailpurchaseorder' ||
            p.includes('/picklistdetailforshippinggrid') ||
            p.includes('/packinglistdetailforshippinggrid')) return 'inventory';
        if (p === '/autotask/views/servicedesk/servicedeskticket/service_ticket_panel_edit.aspx') return 'charge';
        if (p === '/autotask35/dataselectorhandlers/ticketdataselectorpopup.aspx' ||
            p === '/mvc/projects/importticket.mvc/copytickettoproject' ||
            p === '/servicedesk/popups/forward/svcforward.asp' ||
            p === '/servicedesk/reports/togoreportframe.asp' ||
            p === '/mvc/servicedesk/tickethistory.mvc/servicetickethistory' ||
            p === '/popups/work/svcdetail.asp') return 'ticket';
        if (p === '/mvc/crm/contractbillingruleassociation.mvc/editcontact') return 'charge';
        if (p.includes('/billingproduct') ||
            p.includes('/billing_product') ||
            p.includes('/billingrule') ||
            p.includes('/billing_rule') ||
            p.includes('/billingassociation') ||
            p.includes('/billingproductassociation') ||
            p.includes('/billingruleassociation')) return 'charge';
        if (p.startsWith('/contracts/views/contract')) return 'contract';
        if (p === '/mvc/projects/projectdetail.mvc/projectdetail') return 'project';
        if (p === '/mvc/projects/taskdetail.mvc') return 'projecttask';
        if (p === '/autotask/views/dispatcherworkshop/dispatcherworkshopcontainer.aspx') return 'calendar';
        if (p === '/autotask/views/administration/companysetup/neweditallocationcode.aspx') return 'administration';
        if (p === '/autotask/views/administration/companysetup/location_new_edit.aspx') return 'administration';
        if (p === '/autotask/popups/administration/departmentdetails.aspx') return 'administration';
        if (p === '/autotask/views/administration/resources/resource.aspx') return 'administration';
        if (p === '/mvc/administrationsetup/apiuser.mvc/newapiuser') return 'administration';
        if (p === '/mvc/administrationsetup/apiuser.mvc/editapiuser') return 'administration';
        if (p === '/administrator/roles/tabroleview.asp') return 'administration';
        if (p === '/mvc/administrationsetup/invoicetemplate.mvc/editinvoicetemplate') return 'administration';
        if (p === '/mvc/administrationsetup/invoicetemplate.mvc/editproperties') return 'administration';
        if (p === '/mvc/contracts/invoiceemailtemplate.mvc/editinvoiceemailtemplate') return 'administration';
        if (p === '/autotask/views/template/customizenotificationtemplate.aspx') return 'administration';
        if (p === '/autotask/views/administration/products/product.aspx') return 'inventory';
        return 'unknown';
    }

    function tabTypeLabel(tabOrType) {
        const type = normalizeTabType(typeof tabOrType === 'string' ? tabOrType : tabTypeForUrl(tabOrType && tabOrType.url || ''));
        return TAB_TYPE_LABELS[type] || 'Tab';
    }

    function tabEffectiveType(tab) {
        const urlType = tabTypeForUrl(tab && tab.url || '');
        if (urlType !== 'unknown') return urlType;
        const metadataType = String(tab && tab.metadataFields && tab.metadataFields.type || '').trim().toLowerCase();
        if (metadataType === 'admin' || metadataType === 'administration') return 'administration';
        return urlType;
    }

    function tabMetadataFields(tab) {
        const type = tabEffectiveType(tab);
        const fields = Object.assign({}, normalizeMetadataFields(tab && tab.metadataFields));
        fields.type = tabTypeLabel(type);
        fields.secondaryTitle = fields.secondaryTitle || '';
        fields.number = fields.number || String(tab && tab.number || '').trim();
        fields.id = fields.id || (/^ID\b/i.test(fields.number) ? fields.number : '');
        fields.organization = fields.organization || String(tab && tab.contact || '').trim();
        fields.primaryResource = fields.primaryResource || String(tab && tab.primaryResource && tab.primaryResource.name || '').trim();
        if (type === 'administration') {
            fields.id = fields.id || fields.number || fields.secondaryTitle || '';
            fields.secondaryTitle = fields.secondaryTitle || fields.number || fields.id || '';
        }
        return fields;
    }

    function tabLineValue(tab, line) {
        if (!tab) return '';
        if (line === 3 && horizontalCompactTabsActive()) return '';
        const type = tabEffectiveType(tab);
        const settings = line === 2 ? state.tabLine2Fields : state.tabLine3Fields;
        const options = getLineOptionsForType(type);
        let key = settings && settings[type] || (line === 2 ? 'organization' : 'contact');
        if (!options.includes(key)) key = getDefaultLineField(type, line);
        const fields = tabMetadataFields(tab);
        if (type === 'administration' && line === 3 && (key === 'none' || key === 'type')) {
            const line2Settings = state.tabLine2Fields;
            const line2Options = getLineOptionsForType(type);
            let line2Key = line2Settings && line2Settings[type] || 'id';
            if (!line2Options.includes(line2Key)) line2Key = getDefaultLineField(type, 2);
            const line2Value = line2Key !== 'none' && line2Key !== 'type'
                ? String(fields[line2Key] || '').trim()
                : '';
            return line2Value ? fields.type : '';
        }
        if (key === 'none') return '';
        const value = String(fields[key] || '').trim();
        if (value) return value;
        return line === 2 && type !== 'unknown' ? fields.type : '';
    }

    function tabLineFieldKey(tab, line) {
        if (!tab) return '';
        const type = tabEffectiveType(tab);
        const settings = line === 2 ? state.tabLine2Fields : state.tabLine3Fields;
        const options = getLineOptionsForType(type);
        let key = settings && settings[type] || (line === 2 ? 'organization' : 'contact');
        if (!options.includes(key)) key = getDefaultLineField(type, line);
        return key;
    }

    function applyTabLineStyle(el, tab, line) {
        if (!el) return;
        el.style.removeProperty('color');
        if (!tab) return;
        const key = tabLineFieldKey(tab, line);
        if (key !== 'status' && key !== 'priority') return;
        const fields = tabMetadataFields(tab);
        const color = String(fields[key + 'Color'] || '').trim();
        if (/^rgba?\(\s*0\s*,\s*0\s*,\s*0\s*(?:,\s*0\s*)?\)$/i.test(color)) return;
        if (/^transparent$/i.test(color)) return;
        if (color) el.style.setProperty('color', color);
    }

    function fallbackMetadataFields(type, fallback) {
        return {
            type: tabTypeLabel(type),
            secondaryTitle: fallback.secondaryTitle || '',
            id: /^ID\b/i.test(fallback.number || '') ? fallback.number : '',
            number: fallback.number || '',
            organization: fallback.contact || '',
        };
    }

    function fallbackTabMetadataForUrl(url) {
        const path = AES.pathOf(url);
        let parsed = null;
        try { parsed = new URL(url, location.origin); } catch (e) {}
        const params = parsed ? parsed.searchParams : new URLSearchParams();

        if (path === '/mvc/servicedesk/ticketnew.mvc') {
            const ticketType = params.get('ticketType') || params.get('tickettype') || '';
            const typeLabel = ticketType === '2' ? 'Incident Ticket'
                : ticketType === '3' ? 'Problem Ticket'
                    : ticketType === '4' ? 'Change Request Ticket'
                        : ticketType ? 'Ticket Type ' + ticketType
                            : 'Ticket';
            return {
                title: 'New Ticket',
                number: typeLabel,
                contact: '',
            };
        }
        if (AES.normalizeHandledPath(path) === '/autotask/views/administration/companysetup/neweditallocationcode.aspx') {
            const allocationCodeId = params.get('allocationCodeID') || params.get('allocationCodeId') || params.get('allocationcodeid');
            return {
                title: 'Allocation Code',
                number: allocationCodeId ? `ID ${allocationCodeId}` : 'Administration',
                contact: ''
            };
        }
        if (AES.normalizeHandledPath(path) === '/administrator/roles/tabroleview.asp') {
            const roleId = params.get('ObjectId') || params.get('objectId') || params.get('objectid');
            return {
                title: 'Role',
                number: roleId ? `ID ${roleId}` : 'Administration',
                contact: ''
            };
        }
        if (AES.normalizeHandledPath(path) === '/mvc/administrationsetup/invoicetemplate.mvc/editinvoicetemplate') {
            const templateId = params.get('invoiceTemplateId') || params.get('invoiceTemplateID') || params.get('invoicetemplateid');
            return {
                title: 'Invoice Template',
                number: templateId ? `ID ${templateId}` : 'Design Invoice Template',
                contact: ''
            };
        }
        if (AES.normalizeHandledPath(path) === '/mvc/administrationsetup/invoicetemplate.mvc/editproperties') {
            const templateId = params.get('invoiceTemplateId') || params.get('invoiceTemplateID') || params.get('invoicetemplateid');
            return {
                title: 'Invoice Template Properties',
                number: templateId ? `ID ${templateId}` : 'Administration',
                contact: ''
            };
        }
        if (AES.normalizeHandledPath(path) === '/mvc/contracts/invoiceemailtemplate.mvc/editinvoiceemailtemplate') {
            const templateId = params.get('invoiceEmailTemplateId') || params.get('invoiceEmailTemplateID') || params.get('invoiceemailtemplateid');
            return {
                title: 'Invoice Email Template',
                number: templateId ? `ID ${templateId}` : 'Invoice Email Template',
                contact: ''
            };
        }
        if (AES.normalizeHandledPath(path) === '/autotask/views/administration/products/product.aspx') {
            const productMode = String(params.get('cmd') || '').toLowerCase();
            return {
                title: productMode === 'new' ? 'New Product' : 'Product',
                number: 'Inventory',
                contact: ''
            };
        }
        if (AES.normalizeHandledPath(path) === '/autotask/views/dispatcherworkshop/dispatcherworkshopcontainer.aspx') {
            return {
                title: 'Dispatcher Workshop',
                number: 'Calendar',
                contact: '',
            };
        }
        if (path.includes('/ticketprintview.mvc')) {
            return {
                title: 'Ticket Print View',
                number: params.get('ticketId') ? 'Ticket ID ' + params.get('ticketId') : '',
                contact: '',
            };
        }
        if (path.includes('/picklistdetailforshippinggrid')) {
            return {
                title: 'Pick List',
                number: 'Inventory',
                contact: params.get('accountId') ? 'Account ID ' + params.get('accountId') : '',
            };
        }
        if (path.includes('/packinglistdetailforshippinggrid')) {
            const account = params.get('accountIdWithIndex') || '';
            return {
                title: 'Packing List',
                number: 'Inventory',
                contact: account ? 'Account ' + account.split(':')[0] : '',
            };
        }
        if (path === '/autotask35/dataselectorhandlers/ticketdataselectorpopup.aspx') {
            const action = (params.get('selectionAction') || '').toLowerCase();
            const excludedTicketId = params.get('excludedTicketIds') || '';
            return {
                title: action === 'selectticketstomergeto'
                    ? 'Merge Ticket'
                    : action === 'selectticketstoabsorb'
                        ? 'Absorb Tickets'
                        : 'Select Tickets',
                number: excludedTicketId ? 'Ticket ' + excludedTicketId : '',
                contact: '',
            };
        }
        if (path === '/mvc/projects/importticket.mvc/copytickettoproject') {
            const taskId = params.get('taskIDs') || params.get('taskids') || '';
            return {
                title: 'Copy Ticket to Project',
                number: taskId ? 'Ticket ' + taskId : '',
                contact: '',
            };
        }
        if (path === '/servicedesk/popups/forward/svcforward.asp') {
            const taskId = params.get('taskIDs') || params.get('taskids') || '';
            return {
                title: 'Forward Ticket',
                number: taskId ? 'Ticket ' + taskId : '',
                contact: '',
            };
        }
        if (path === '/servicedesk/reports/togoreportframe.asp') {
            const ticketId = params.get('taskObjectID') || params.get('taskobjectid') || '';
            return {
                title: 'Ticket Report',
                number: ticketId ? 'Ticket ' + ticketId : '',
                contact: '',
            };
        }
        if (path === '/mvc/servicedesk/tickethistory.mvc/servicetickethistory') {
            const ticketId = params.get('ticketId') || params.get('ticketid') || '';
            return {
                title: params.get('slaTabSelected') ? 'SLA History' : 'Ticket History',
                number: ticketId ? 'Ticket ' + ticketId : '',
                contact: '',
            };
        }
        if (path === '/popups/work/svcdetail.asp') {
            const clientId = params.get('clientID') || params.get('clientid') || '';
            return {
                title: 'Work Detail',
                number: clientId ? 'Client ' + clientId : '',
                contact: '',
            };
        }
        if (path === '/mvc/crm/installedproductdetail.mvc') {
            const installedProductId = params.get('installedProductId') || params.get('installedproductid');
            return {
                title: 'Device',
                number: installedProductId ? 'ID ' + installedProductId : '',
                contact: '',
            };
        }
        if (path === '/mvc/crm/note.mvc/view') {
            const id = params.get('id') || params.get('ID');
            return {
                title: 'Note',
                number: id ? 'ID ' + id : '',
                contact: '',
            };
        }
        if (path === '/mvc/crm/opportunitydetail.mvc') {
            const opportunityId = params.get('opportunityId') || params.get('opportunityid');
            return {
                title: 'Opportunity',
                number: opportunityId ? 'ID ' + opportunityId : '',
                contact: '',
            };
        }
        if (path === '/autotask35/crm/salesorder/salesorderdetail.aspx') {
            const salesOrderId = params.get('salesorderid') || params.get('salesOrderId');
            return {
                title: 'Sales Order',
                number: salesOrderId ? 'ID ' + salesOrderId : '',
                contact: '',
            };
        }
        if (/\/inventory\/inventory_edit_order\.aspx/i.test(path || '')) {
            const purchaseOrderId = params.get('id') || params.get('ID') ||
                params.get('purchaseOrderId') || params.get('purchaseorderid') || params.get('purchaseOrderID');
            return {
                title: 'Purchase Order',
                number: purchaseOrderId ? 'ID ' + purchaseOrderId : 'Purchase Order',
                contact: '',
            };
        }
        if (path === '/mvc/inventory/receipthistory.mvc') {
            const purchaseOrderId = params.get('purchaseOrderId') || params.get('purchaseorderid') || params.get('purchaseOrderID');
            return {
                title: 'Vendor Invoice',
                number: purchaseOrderId ? 'Purchase Order ' + purchaseOrderId : 'Purchase Order',
                contact: '',
            };
        }
        if (path === '/mvc/inventory/emailpurchaseorder.mvc/emailpurchaseorder') {
            const purchaseOrderId = params.get('purchaseOrderId') || params.get('purchaseorderid') || params.get('purchaseOrderID');
            return {
                title: 'Email Purchase Order',
                number: purchaseOrderId ? 'Purchase Order ' + purchaseOrderId : 'Purchase Order',
                contact: '',
            };
        }
        if (path === '/opportunity/quotes/quote.asp' || path === '/opportunity/quotes/newquote.asp') {
            const quoteId = params.get('QuoteID') || params.get('quoteID') || params.get('quoteId') || params.get('objectID');
            return {
                title: quoteId ? 'Quote ' + quoteId : 'Quote',
                number: 'Quote',
                contact: '',
            };
        }
        if (path === '/mvc/crm/quotetemplate.mvc/editproperties') {
            return {
                title: 'Quote Template',
                number: 'Quote',
                contact: '',
            };
        }
        if (path === '/autotask/views/crm/contact_group_management.aspx' ||
            path === '/autotask35/crm/contactgroupmanager.aspx') {
            const groupId = params.get('groupid') || params.get('groupId');
            return {
                title: groupId && groupId !== '0' ? 'Contact Group' : 'New Contact Group',
                number: groupId && groupId !== '0' ? 'ID ' + groupId : 'Group',
                contact: '',
            };
        }
        if (path === '/mvc/inventory/costitem.mvc/shipping') {
            return {
                title: 'Shipping',
                number: 'Inventory',
                contact: '',
            };
        }
        if (path === '/autotask/views/servicedesk/servicedeskticket/service_ticket_panel_edit.aspx') {
            const ticketId = params.get('ticketID') || params.get('ticketId') || params.get('ticketid');
            const genericId = params.get('genericId') || params.get('genericid');
            return {
                title: 'Ticket Charge',
                number: ticketId ? 'Ticket ID ' + ticketId : (genericId ? 'Charge ID ' + genericId : ''),
                contact: '',
            };
        }
        if (path === '/mvc/crm/contractbillingruleassociation.mvc/editcontact') {
            return {
                title: 'Billing Products',
                number: 'Charge',
                contact: '',
            };
        }
        if (path.includes('/billingproduct') ||
            path.includes('/billing_product') ||
            path.includes('/billingrule') ||
            path.includes('/billing_rule') ||
            path.includes('/billingassociation') ||
            path.includes('/billingproductassociation') ||
            path.includes('/billingruleassociation')) {
            return {
                title: 'Billing Products',
                number: 'Charge',
                contact: '',
            };
        }
        if (path === '/mvc/projects/projectdetail.mvc/projectdetail') {
            const projectId = params.get('projectId') || params.get('projectid');
            return {
                title: 'Project',
                number: projectId ? 'ID ' + projectId : '',
                contact: '',
            };
        }
        if (path === '/mvc/projects/taskdetail.mvc') {
            const taskId = params.get('taskId') || params.get('taskid');
            return {
                title: 'Task',
                number: taskId ? 'ID ' + taskId : '',
                contact: '',
            };
        }
        return {
            title: '',
            number: '',
            contact: '',
        };
    }

    function tabIconKey(tab) {
        const title = typeof tab?.title === 'string' ? tab.title.toLowerCase() : '';
        if (title.includes('livelink')) return 'livelink';
        const path = AES.normalizeHandledPath(AES.pathOf(tab?.url || ''));
        if (path === '/mvc/projects/taskdetail.mvc') return 'projectTask';
        if (path === '/autotask/views/administration/resources/resource.aspx' ||
            path === '/mvc/administrationsetup/apiuser.mvc/newapiuser' ||
            path === '/mvc/administrationsetup/apiuser.mvc/editapiuser') return 'resourceManagement';
        if (path === '/autotask/views/template/customizenotificationtemplate.aspx') return 'notificationTemplate';
        if (path === '/autotask/popups/administration/workflow_rule.aspx') return 'workflowRule';
        return tabTypeForUrl(tab?.url || '');
    }

    function renderHomeTab() {
        const el = document.createElement('div');
        el.className = 'at-tab home active';
        el.style.setProperty('--aes-tab-rows', '1');
        if (state.homeLoading && state.activeId === null) el.classList.add('loading');

        const icon = document.createElement('span');
        icon.className = 'icon';
        appendIconMarkup(icon, ICONS.home);

        const spinner = document.createElement('span');
        spinner.className = 'home-spinner';
        spinner.setAttribute('aria-hidden', 'true');

        const label = document.createElement('span');
        label.className = 'home-label';
        label.textContent = state.homeTitle || 'Home';

        el.appendChild(icon);
        el.appendChild(spinner);
        el.appendChild(label);
        el.title = label.textContent;
        el.addEventListener('click', activateHome);
        state.homeTabEl = el;
    }

    function tabRowCount(tab) {
        let rows = 1;
        if (tab && tabLineValue(tab, 2)) rows += 1;
        if (tab && tabLineValue(tab, 3)) rows += 1;
        return Math.max(1, Math.min(2, rows));
    }

    function updateTabRowCount(tab) {
        if (!tab || !tab.tabEl) return;
        tab.tabEl.style.setProperty('--aes-tab-rows', String(tabRowCount(tab)));
    }

    function setHomeTitle(rawTitle) {
        const next = (rawTitle || '').trim() || 'Home';
        if (/dialogiframeoverlaypage/i.test(next)) {
            const current = (state.homeTitle || '').trim();
            const hasResolvedRealTitle = !!current &&
                current !== 'Home' &&
                !/dialogiframeoverlaypage/i.test(current);
            if (hasResolvedRealTitle) {
                clearHomeLoading();
                return;
            }
            if (state.homeLoadingAwaitingNativeLoad) {
                setHomeLoading(true);
            }
            return;
        }
        if (state.homeTabEl) {
            const label = state.homeTabEl.querySelector('.home-label');
            if (label) label.textContent = next;
            state.homeTabEl.title = next;
        }
        state.homeTitle = next;
        // A real native title means the Home tab has meaningful metadata again.
        // Let that win over late/stale nav-start messages so the tab cannot
        // get stuck showing only the spinner.
        if (state.activeId === null) {
            state.homePersistedTitle = next;
            if (!state.homePersistedUrl) state.homePersistedUrl = getPersistableHomeUrl();
            if (state.homePersistedUrl) saveTabs();
        }
        clearHomeLoading();
    }

    function setHomeLoading(loading) {
        const next = !!loading;
        state.homeLoading = next;
        updateHomeLoadingIndicator();
    }

    function updateHomeLoadingIndicator() {
        if (!state.homeTabEl) return;
        state.homeTabEl.classList.toggle('loading', !!(state.homeLoading && state.activeId === null));
    }

    function extractTopLevelPageTitle() {
        const selectors = [
            'span.text-page-title',
            '.c-text.o-font--page-title-medium.c-text--primary-color',
            '.PageHeadingContainer .Title .Text',
            '.EntityHeadingContainer .Title > .Text',
            'h1',
        ];
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            const text = (el && el.textContent ? el.textContent : '').replace(/\s+/g, ' ').trim();
            if (text) return text;
        }
        return '';
    }

    function updateHomeTitleFromTopLevelPage(skipFrameCheck) {
        if (!state.showTabBarOnNonIframePages) return;
        if (!skipFrameCheck && findContentIframe()) return;
        const title = extractTopLevelPageTitle();
        if (!title) return;
        clearHomeLoading();
        setHomeTitle(title);
    }

    function scheduleNonIframeTitleUpdate() {
        if (!state.showTabBarOnNonIframePages || state.nonIframeTitleRaf) return;
        state.nonIframeTitleRaf = window.requestAnimationFrame(function () {
            state.nonIframeTitleRaf = 0;
            updateHomeTitleFromTopLevelPage(true);
        });
    }

    function stopNonIframeTitleWatcher() {
        if (state.nonIframeTitleObserver) {
            state.nonIframeTitleObserver.disconnect();
            state.nonIframeTitleObserver = null;
        }
        if (state.nonIframeTitleRaf) {
            window.cancelAnimationFrame(state.nonIframeTitleRaf);
            state.nonIframeTitleRaf = 0;
        }
    }

    function ensureNonIframeTitleWatcher() {
        if (!state.showTabBarOnNonIframePages) {
            stopNonIframeTitleWatcher();
            return;
        }
        if (state.nonIframeTitleObserver) return;
        const root = findNonIframeContentContainer() || document.body || document.documentElement;
        if (!root) return;
        const observer = new MutationObserver(scheduleNonIframeTitleUpdate);
        observer.observe(root, {
            childList: true,
            subtree: true,
            characterData: true,
        });
        state.nonIframeTitleObserver = observer;
        scheduleNonIframeTitleUpdate();
    }

    function closeTabContextMenu() {
        if (!state.tabContextMenu) return;
        state.tabContextMenu.remove();
        state.tabContextMenu = null;
    }

    function clearTabDragIndicators() {
        state.dragOverTabId = null;
        state.dragInsertAfter = false;
        for (const tab of state.tabs) {
            if (!tab.tabEl) continue;
            tab.tabEl.classList.remove('drop-before', 'drop-after', 'dragging');
        }
    }

    function positionContextMenu(menu, x, y) {
        const margin = 8;
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        const rect = menu.getBoundingClientRect();
        const left = Math.min(Math.max(margin, x), window.innerWidth - rect.width - margin);
        const top = Math.min(Math.max(margin, y), window.innerHeight - rect.height - margin);
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
    }

    function createContextMenuIcon(svg) {
        const icon = document.createElement('span');
        icon.className = 'at-tabs-context-icon';
        appendIconMarkup(icon, svg);
        return icon;
    }

    function createContextMenuItem(labelText, svg, onClick) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'at-tabs-context-item';
        button.setAttribute('role', 'menuitem');
        button.appendChild(createContextMenuIcon(svg));
        const label = document.createElement('span');
        label.className = 'at-tabs-context-label';
        label.textContent = labelText;
        button.appendChild(label);
        if (typeof onClick === 'function') {
            button.addEventListener('click', function () {
                onClick();
            });
        }
        return button;
    }

    function createContextMenuDivider() {
        const divider = document.createElement('div');
        divider.className = 'at-tabs-context-divider';
        return divider;
    }

    function createTabColorSubmenu(tab) {
        const trigger = document.createElement('div');
        trigger.className = 'at-tabs-context-item at-tabs-context-submenu-trigger';
        trigger.setAttribute('role', 'menuitem');
        trigger.setAttribute('aria-haspopup', 'menu');
        trigger.tabIndex = 0;
        trigger.appendChild(createContextMenuIcon(ICONS.colorTab));

        const label = document.createElement('span');
        label.className = 'at-tabs-context-label';
        label.textContent = 'Color tab';
        trigger.appendChild(label);

        const arrow = document.createElement('span');
        arrow.className = 'at-tabs-context-submenu-arrow';
        arrow.textContent = '›';
        trigger.appendChild(arrow);

        const submenu = document.createElement('div');
        submenu.className = 'at-tabs-context-submenu';
        submenu.setAttribute('role', 'menu');

        const palette = document.createElement('div');
        palette.className = 'at-tabs-context-colors';
        for (const color of TAB_COLOR_PRESETS) {
            const swatch = document.createElement('button');
            swatch.type = 'button';
            swatch.className = 'at-tabs-color-swatch' + (tab.color === color ? ' selected' : '');
            swatch.title = color;
            swatch.style.setProperty('--aes-swatch', color);
            swatch.setAttribute('aria-label', 'Set tab color ' + color);
            swatch.addEventListener('click', function (event) {
                event.stopPropagation();
                closeTabContextMenu();
                setTabColor(tab.id, color);
            });
            palette.appendChild(swatch);
        }
        submenu.appendChild(palette);
        submenu.appendChild(createContextMenuDivider());
        submenu.appendChild(createContextMenuItem(
            'Clear tab color',
            ICONS.clearColor,
            function () {
                closeTabContextMenu();
                setTabColor(tab.id, '');
            }
        ));

        trigger.appendChild(submenu);
        return trigger;
    }

    function positionContextSubmenus(menu) {
        const submenus = menu.querySelectorAll('.at-tabs-context-submenu');
        submenus.forEach(function (submenu) {
            submenu.classList.remove('open-left');
            const parent = submenu.parentElement;
            if (!parent) return;
            const parentRect = parent.getBoundingClientRect();
            const submenuWidth = submenu.offsetWidth || 188;
            if (parentRect.right + submenuWidth + 14 > window.innerWidth) {
                submenu.classList.add('open-left');
            }
        });
    }

    function pinTab(tabId, pinned) {
        const tab = tabById(tabId);
        if (!tab || tab.pinned === !!pinned) return;
        tab.pinned = !!pinned;

        const without = state.tabs.filter(function (candidate) {
            return candidate.id !== tab.id;
        });
        if (tab.pinned) {
            const firstUnpinnedIndex = without.findIndex(function (candidate) {
                return !candidate.pinned;
            });
            const insertIndex = firstUnpinnedIndex === -1 ? without.length : firstUnpinnedIndex;
            without.splice(insertIndex, 0, tab);
        } else {
            without.push(tab);
        }
        state.tabs = without;
        renderTabs();
        syncTabPaneState();
        updateLoaderVisibility();
        ensureActiveTabVisible();
        updateTabScrollButtons();
        saveTabs();
    }

    function setTabColor(tabId, color) {
        const tab = tabById(tabId);
        if (!tab) return;
        const nextColor = TAB_COLOR_PRESETS.includes(color) ? color : '';
        const pair = normalizeSplitPairIds(state.splitPairIds);
        if (pair && pair.includes(tabId)) {
            state.splitPairColor = nextColor;
            for (const pairId of pair) {
                const pairTab = tabById(pairId);
                if (!pairTab) continue;
                pairTab.color = nextColor;
                updateTabEl(pairTab);
            }
            syncTabPaneState();
            saveTabs();
            return;
        }
        tab.color = nextColor;
        updateTabEl(tab);
        saveTabs();
    }

    function reorderTabs(draggedId, targetId, insertAfter) {
        if (draggedId === targetId) return false;
        const dragged = tabById(draggedId);
        const target = tabById(targetId);
        if (!dragged || !target) return false;

        const withoutDragged = state.tabs.filter(function (tab) {
            return tab.id !== draggedId;
        });

        let insertIndex = withoutDragged.length;
        if (dragged.pinned) {
            if (target.pinned) {
                insertIndex = withoutDragged.findIndex(function (tab) { return tab.id === targetId; });
                if (insertIndex === -1) insertIndex = withoutDragged.length;
                if (insertAfter) insertIndex += 1;
            } else {
                const lastPinnedIndex = withoutDragged.reduce(function (acc, tab, index) {
                    return tab.pinned ? index : acc;
                }, -1);
                insertIndex = lastPinnedIndex + 1;
            }
        } else {
            const firstUnpinnedIndex = withoutDragged.findIndex(function (tab) { return !tab.pinned; });
            if (!target.pinned) {
                insertIndex = withoutDragged.findIndex(function (tab) { return tab.id === targetId; });
                if (insertIndex === -1) {
                    insertIndex = firstUnpinnedIndex === -1 ? withoutDragged.length : firstUnpinnedIndex;
                } else if (insertAfter) {
                    insertIndex += 1;
                }
            } else {
                insertIndex = firstUnpinnedIndex === -1 ? withoutDragged.length : firstUnpinnedIndex;
            }
        }

        if (insertIndex < 0) insertIndex = 0;
        if (insertIndex > withoutDragged.length) insertIndex = withoutDragged.length;
        withoutDragged.splice(insertIndex, 0, dragged);
        state.tabs = withoutDragged;
        const splitPair = normalizeSplitPairIds(state.splitPairIds);
        if (splitPair) {
            const orderedSplitPair = state.tabs
                .map(function (tab) { return tab.id; })
                .filter(function (id) { return splitPair.includes(id); });
            state.splitPairIds = orderedSplitPair.length >= 2 ? orderedSplitPair : null;
            if (!state.splitPairIds) {
                state.splitId = null;
                state.splitPairColor = '';
            } else if (state.activeId !== null && state.splitPairIds.includes(state.activeId)) {
                state.splitId = state.splitPairIds.find(function (id) { return id !== state.activeId; }) || null;
            }
            state.splitRatios = state.splitPairIds ? normalizeSplitRatios(state.splitRatios, state.splitPairIds.length) : [];
        }
        renderTabs();
        syncTabPaneState();
        updateLoaderVisibility();
        ensureActiveTabVisible();
        updateTabScrollButtons();
        saveTabs();
        return true;
    }

    function openTabContextMenu(tab, x, y) {
        closeTabContextMenu();
        prewarmPeek(tab);

        const menu = document.createElement('div');
        menu.className = 'at-tabs-context-menu';
        menu.setAttribute('role', 'menu');

        const refreshButton = createContextMenuItem(
            'Refresh tab',
            ICONS.refresh,
            function () {
                closeTabContextMenu();
                refreshTabIframe(tab);
            }
        );

        const splitButton = createContextMenuItem(
            '',
            ICONS.split
        );
        const label = splitButton.querySelector('.at-tabs-context-label');

        const currentSplitGroup = getSplitGroupIds();
        if (currentSplitGroup.includes(tab.id)) {
            label.textContent = 'Close split screen';
            splitButton.addEventListener('click', function () {
                closeTabContextMenu();
                disableSplitScreen();
            });
        } else if (state.splitId !== null && tab.id === state.activeId) {
            label.textContent = 'Close split screen';
            splitButton.addEventListener('click', function () {
                closeTabContextMenu();
                disableSplitScreen();
            });
        } else {
            const group = getSplitGroupIds();
            const addingToExistingSplit = splitGroupIncludesActive(group) && group.length >= 2;
            label.textContent = addingToExistingSplit ? 'Add tab to split' : 'Open in split screen';
            const canSplit = canAddTabToSplit(tab.id);
            splitButton.disabled = !canSplit;
            splitButton.title = canSplit
                ? ''
                : (addingToExistingSplit && group.length >= 4
                    ? 'A split can contain up to 4 tabs.'
                    : 'Open another custom tab first, then split this tab beside it.');
            splitButton.addEventListener('click', function () {
                if (splitButton.disabled) return;
                closeTabContextMenu();
                enableSplitScreen(tab.id);
            });
        }

        const pinButton = createContextMenuItem(
            tab.pinned ? 'Unpin tab' : 'Pin tab',
            ICONS.pin,
            function () {
                closeTabContextMenu();
                pinTab(tab.id, !tab.pinned);
            }
        );

        menu.appendChild(refreshButton);
        menu.appendChild(splitButton);
        if (normalizeSplitPairIds(state.splitPairIds) && state.splitPairIds.includes(tab.id)) {
            menu.appendChild(createContextMenuItem(
                'Detach tab',
                ICONS.split,
                function () {
                    closeTabContextMenu();
                    detachSplitTab(tab.id);
                }
            ));
        }
        menu.appendChild(pinButton);
        menu.appendChild(createContextMenuDivider());
        menu.appendChild(createTabColorSubmenu(tab));

        // --- Tab actions: duplicate (any tab) + copy helpers (ticket tabs) ---
        menu.appendChild(createContextMenuDivider());

        const duplicateButton = createContextMenuItem(
            'Duplicate tab',
            ICONS.duplicate,
            function () {
                closeTabContextMenu();
                duplicateTab(tab);
            }
        );
        menu.appendChild(duplicateButton);

        const peekButton = createContextMenuItem(
            'Peek',
            ICONS.peek,
            function () {
                closeTabContextMenu();
                openPeekModal(tab, { allowOpenInTab: true });
            }
        );
        menu.appendChild(peekButton);

        document.body.appendChild(menu);
        state.tabContextMenu = menu;
        positionContextMenu(menu, x, y);
        positionContextSubmenus(menu);
    }

    function installTabContextMenuDismissal() {
        document.addEventListener('pointerdown', function (event) {
            if (!state.tabContextMenu || state.tabContextMenu.contains(event.target)) return;
            closeTabContextMenu();
        }, true);
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                if (state.releaseNotesModal) {
                    closeReleaseNotesModal();
                    return;
                }
                closeTabContextMenu();
                if (state.peekBackdrop) closePeekModal();
                hideHoverCard(true);
            }
        }, true);
        window.addEventListener('resize', function () {
            closeTabContextMenu();
            hideHoverCard(true);
        }, { passive: true });
        window.addEventListener('blur', function () {
            closeTabContextMenu();
            hideHoverCard(true);
        });
    }

    function buildTabEl(tab) {
        const el = document.createElement('div');
        el.className = 'at-tab' + (tab.id === state.activeId ? ' active' : '') + (tab.pinned ? ' pinned' : '');
        // No `title` attribute — the custom hover preview card replaces the
        // native browser tooltip (which was double-rendering on top of it).
        el.draggable = true;
        el.dataset.tabId = String(tab.id);

        const pinBadge = document.createElement('span');
        pinBadge.className = 'pin-badge';
        appendIconMarkup(pinBadge, ICONS.pin);
        el.appendChild(pinBadge);

        const icon = document.createElement('span');
        icon.className = 'icon';
        appendIconMarkup(icon, ICONS[tabIconKey(tab)] || ICONS.ticket);
        el.appendChild(icon);

        const meta = document.createElement('div');
        meta.className = 'meta';

        const title = document.createElement('div');
        title.className = 'line title';
        updateTabTitleEl(title, tab);

        const number = document.createElement('div');
        number.className = 'line number';
        number.textContent = tabLineValue(tab, 2);
        applyTabLineStyle(number, tab, 2);

        const contact = document.createElement('div');
        contact.className = 'line contact';
        contact.textContent = tabLineValue(tab, 3);
        applyTabLineStyle(contact, tab, 3);

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

        const resource = document.createElement('span');
        resource.className = 'resource-badge';
        updateTabResourceEl(resource, tab);

        const warning = document.createElement('span');
        warning.className = 'tab-warning-badge';
        updateTabWarningEl(warning, tab);

        const actions = document.createElement('div');
        actions.className = 'tab-actions';
        actions.appendChild(close);
        actions.appendChild(resource);
        actions.appendChild(warning);

        el.appendChild(meta);
        el.appendChild(actions);
        el.addEventListener('click', function () { activateTab(tab.id); });
        el.addEventListener('contextmenu', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            hideHoverCard(true);
            openTabContextMenu(tab, ev.clientX, ev.clientY);
        });
        el.addEventListener('mouseenter', function () {
            state.hoverAnchorHovered = true;
            scheduleHoverCard(tab, el);
            prewarmPeek(tab);
        });
        el.addEventListener('mouseleave', function () {
            state.hoverAnchorHovered = false;
            hideHoverCard(false);
        });
        el.addEventListener('dragstart', function (ev) {
            state.draggingTabId = tab.id;
            clearTabDragIndicators();
            hideHoverCard(true);
            el.classList.add('dragging');
            if (ev.dataTransfer) {
                ev.dataTransfer.effectAllowed = 'move';
                try { ev.dataTransfer.setData('text/plain', String(tab.id)); } catch (e) {}
            }
        });
        el.addEventListener('dragover', function (ev) {
            if (state.draggingTabId === null || state.draggingTabId === tab.id) return;
            ev.preventDefault();
            if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
            const rect = el.getBoundingClientRect();
            const after = isVerticalBar()
                ? ev.clientY > rect.top + (rect.height / 2)
                : ev.clientX > rect.left + (rect.width / 2);
            state.dragOverTabId = tab.id;
            state.dragInsertAfter = after;
            for (const candidate of state.tabs) {
                if (!candidate.tabEl) continue;
                candidate.tabEl.classList.toggle('drop-before', candidate.id === tab.id && !after);
                candidate.tabEl.classList.toggle('drop-after', candidate.id === tab.id && after);
            }
        });
        el.addEventListener('drop', function (ev) {
            if (state.draggingTabId === null || state.draggingTabId === tab.id) return;
            ev.preventDefault();
            const draggedId = state.draggingTabId;
            const targetId = tab.id;
            const insertAfter = state.dragInsertAfter;
            state.draggingTabId = null;
            clearTabDragIndicators();
            reorderTabs(draggedId, targetId, insertAfter);
        });
        el.addEventListener('dragend', function () {
            state.draggingTabId = null;
            clearTabDragIndicators();
        });
        el.addEventListener('auxclick', function (ev) {
            if (ev.button === 1) {
                ev.preventDefault();
                closeTab(tab.id);
            }
        });

        tab.tabEl = el;
        updateTabRowCount(tab);
        applyTabColorStyle(tab);
        return el;
    }

    function renderTabs() {
        state.bar.replaceChildren();
        state.tabScroll = null;
        clearTabDragIndicators();

        const scrollWrap = document.createElement('div');
        scrollWrap.className = 'at-tabs-scroll-wrap';

        const scroll = document.createElement('div');
        scroll.className = 'at-tabs-scroll';
        state.tabScroll = scroll;

        const inner = document.createElement('div');
        inner.className = 'at-tabs-bar-inner';
        inner.appendChild(state.homeTabEl);
        for (const tab of state.tabs) {
            tab.tabEl = buildTabEl(tab);
            inner.appendChild(tab.tabEl);
        }
        scroll.appendChild(inner);

        const leftButton = createScrollButton('left');
        const rightButton = createScrollButton('right');
        state.scrollLeftButton = leftButton;
        state.scrollRightButton = rightButton;

        scroll.addEventListener('scroll', updateTabScrollButtons, { passive: true });
        scrollWrap.appendChild(scroll);
        scrollWrap.appendChild(leftButton);
        scrollWrap.appendChild(rightButton);

        state.bar.appendChild(scrollWrap);
        state.bar.appendChild(createResizeHandle());
        syncTabPaneState();
        updateHomeTabActive();
        updateResizableBarClasses();
        requestAnimationFrame(function () {
            ensureActiveTabVisible();
            updateTabScrollButtons();
        });
    }

    function createResizeHandle() {
        const handle = document.createElement('div');
        handle.className = 'at-tabs-resize-handle';
        handle.title = 'Resize tab bar';
        handle.addEventListener('mousedown', startTabBarResize);
        handle.addEventListener('pointerdown', startTabBarResize);
        handle.addEventListener('mouseenter', function () {
            state.tabBarResizeHandleHovered = true;
            cancelTabBarExpandTimer();
        });
        handle.addEventListener('mouseleave', function () {
            state.tabBarResizeHandleHovered = false;
            if (state.bar && state.bar.matches(':hover')) {
                scheduleTabBarHoverExpand();
            }
        });
        handle.addEventListener('click', function (event) {
            event.stopPropagation();
        });
        return handle;
    }

    function startTabBarResize(event) {
        if (!state.resizableTabBarEnabled || !isVerticalBar() || !state.bar) return;
        if (state.tabBarResizing) return;
        if (event.type === 'mousedown' && event.button !== 0) return;
        if (event.type === 'pointerdown' && event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        hideHoverCard(true);
        cancelTabBarExpandTimer();
        state.tabBarResizing = true;
        state.tabBarHoverExpanded = false;
        updateResizableBarClasses();

        const barRect = state.bar.getBoundingClientRect();
        const pointerId = event.pointerId;
        if (event.type === 'pointerdown' && event.currentTarget.setPointerCapture && pointerId !== undefined) {
            try { event.currentTarget.setPointerCapture(pointerId); } catch (e) {}
        }
        const move = function (moveEvent) {
            const nextWidth = normalizedTabBarWidth(moveEvent.clientX - barRect.left);
            state.tabBarWidth = nextWidth;
            AES.state.tabBarWidth = nextWidth;
            updateResizableBarClasses();
            requestSyncGeometry();
        };
        const stop = function () {
            document.removeEventListener('mousemove', move, true);
            document.removeEventListener('mouseup', stop, true);
            document.removeEventListener('pointermove', move, true);
            document.removeEventListener('pointerup', stop, true);
            document.removeEventListener('pointercancel', stop, true);
            state.tabBarResizing = false;
            state.tabBarHoverExpanded = false;
            cancelTabBarExpandTimer();
            updateResizableBarClasses();
            void AES.saveSettings();
        };
        if (event.type === 'pointerdown') {
            document.addEventListener('pointermove', move, true);
            document.addEventListener('pointerup', stop, true);
            document.addEventListener('pointercancel', stop, true);
        } else {
            document.addEventListener('mousemove', move, true);
            document.addEventListener('mouseup', stop, true);
        }
    }

    function createScrollButton(direction) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'at-tabs-scroll-button ' + direction;
        button.title = direction === 'left' ? 'Scroll tabs left' : 'Scroll tabs right';
        appendIconMarkup(button, direction === 'left'
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>');
        button.addEventListener('click', function (event) {
            event.stopPropagation();
            scrollTabs(direction === 'left' ? -1 : 1);
        });
        return button;
    }

    function scrollTabs(direction) {
        if (!state.tabScroll) return;
        if (isVerticalBar()) {
            const distance = Math.max(120, Math.floor(state.tabScroll.clientHeight * 0.65));
            state.tabScroll.scrollBy({ top: direction * distance, behavior: 'smooth' });
        } else {
            const distance = Math.max(180, Math.floor(state.tabScroll.clientWidth * 0.65));
            state.tabScroll.scrollBy({ left: direction * distance, behavior: 'smooth' });
        }
    }

    function updateTabScrollButtons() {
        if (!state.tabScroll || !state.scrollLeftButton || !state.scrollRightButton) return;
        if (isVerticalBar()) {
            const maxScroll = state.tabScroll.scrollHeight - state.tabScroll.clientHeight;
            const hasOverflow = maxScroll > 2;
            state.scrollLeftButton.classList.toggle('visible', hasOverflow && state.tabScroll.scrollTop > 2);
            state.scrollRightButton.classList.toggle('visible', hasOverflow && state.tabScroll.scrollTop < maxScroll - 2);
        } else {
            const maxScroll = state.tabScroll.scrollWidth - state.tabScroll.clientWidth;
            const hasOverflow = maxScroll > 2;
            state.scrollLeftButton.classList.toggle('visible', hasOverflow && state.tabScroll.scrollLeft > 2);
            state.scrollRightButton.classList.toggle('visible', hasOverflow && state.tabScroll.scrollLeft < maxScroll - 2);
        }
    }

    function ensureActiveTabVisible() {
        if (!state.tabScroll) return;
        const activeEl = state.activeId === null
            ? state.homeTabEl
            : state.tabs.find(tab => tab.id === state.activeId)?.tabEl;
        if (!activeEl) return;

        const scrollRect = state.tabScroll.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        if (isVerticalBar()) {
            if (activeRect.top < scrollRect.top + 36) {
                state.tabScroll.scrollBy({ top: activeRect.top - scrollRect.top - 48, behavior: 'smooth' });
            } else if (activeRect.bottom > scrollRect.bottom - 36) {
                state.tabScroll.scrollBy({ top: activeRect.bottom - scrollRect.bottom + 48, behavior: 'smooth' });
            }
        } else {
            if (activeRect.left < scrollRect.left + 36) {
                state.tabScroll.scrollBy({ left: activeRect.left - scrollRect.left - 48, behavior: 'smooth' });
            } else if (activeRect.right > scrollRect.right - 36) {
                state.tabScroll.scrollBy({ left: activeRect.right - scrollRect.right + 48, behavior: 'smooth' });
            }
        }
    }

    function updateTabTitleEl(titleEl, tab) {
        titleEl.textContent = '';
        titleEl.classList.toggle('loading', !!tab.loading && !tab.title);
        if (tab.title) {
            titleEl.textContent = tab.title;
            return;
        }

        if (tab.loading) {
            const spinner = document.createElement('span');
            spinner.className = 'at-tab-title-spinner';
            spinner.setAttribute('aria-label', 'Loading');
            titleEl.appendChild(spinner);
        }
    }

    function applyTabColorStyle(tab) {
        if (!tab || !tab.tabEl) return;
        tab.tabEl.classList.toggle('pinned', !!tab.pinned);
        const ownColor = TAB_COLOR_PRESETS.includes(tab.color) ? tab.color : '';
        const sharedColor = TAB_COLOR_PRESETS.includes(tab.splitSharedColor) ? tab.splitSharedColor : '';
        const color = ownColor || sharedColor;
        if (!color) {
            tab.tabEl.dataset.aesColored = 'false';
            tab.tabEl.style.removeProperty('--aes-tab-border');
            tab.tabEl.style.removeProperty('--aes-tab-bg-idle');
            tab.tabEl.style.removeProperty('--aes-tab-bg-hover');
            tab.tabEl.style.removeProperty('--aes-tab-bg-active');
            tab.tabEl.style.removeProperty('--aes-tab-split-bg');
            tab.tabEl.style.removeProperty('--aes-tab-split-border');
            tab.tabEl.style.removeProperty('--aes-tab-split-ring');
            return;
        }

        const dark = document.documentElement.classList.contains('aes-dark');
        const splitColor = sharedColor || color;
        tab.tabEl.dataset.aesColored = 'true';
        tab.tabEl.style.setProperty('--aes-tab-border', splitColor);
        tab.tabEl.style.setProperty('--aes-tab-bg-idle', colorToRgba(splitColor, dark ? 0.18 : 0.14));
        tab.tabEl.style.setProperty('--aes-tab-bg-hover', colorToRgba(splitColor, dark ? 0.26 : 0.2));
        tab.tabEl.style.setProperty('--aes-tab-bg-active', colorToRgba(splitColor, dark ? 0.34 : 0.28));
        tab.tabEl.style.setProperty('--aes-tab-split-bg', colorToRgba(splitColor, dark ? 0.22 : 0.18));
        tab.tabEl.style.setProperty('--aes-tab-split-border', colorToRgba(splitColor, dark ? 0.7 : 0.62));
        tab.tabEl.style.setProperty('--aes-tab-split-ring', colorToRgba(splitColor, dark ? 0.34 : 0.28));
    }

    function isTransparentColor(value) {
        return !value ||
            value === 'transparent' ||
            /^rgba\([^)]*,\s*0(?:\.0+)?\)$/i.test(String(value).trim());
    }

    function updateTabResourceEl(resourceEl, tab) {
        if (!resourceEl) return;

        const resource = tab.primaryResource || null;
        const photoUrl = resource && typeof resource.photoUrl === 'string'
            ? resource.photoUrl.trim()
            : '';
        const initials = resource && typeof resource.initials === 'string'
            ? resource.initials.trim().slice(0, 4)
            : '';
        const tabType = tabTypeForUrl(tab.url);
        const shouldShow = (tabType === 'ticket' || tabType === 'opportunity') && !!(initials || photoUrl);

        resourceEl.className = 'resource-badge';
        resourceEl.textContent = shouldShow && !photoUrl ? initials : '';
        resourceEl.title = shouldShow
            ? (resource.name ? 'Primary resource: ' + resource.name : 'Primary resource')
            : '';
        resourceEl.dataset.colorClass = shouldShow && resource.colorClass ? resource.colorClass : '';
        resourceEl.style.removeProperty('background-image');
        resourceEl.style.removeProperty('background-color');
        resourceEl.style.removeProperty('color');
        resourceEl.style.removeProperty('border-color');

        if (!shouldShow) return;

        resourceEl.classList.add('visible');
        if (photoUrl) {
            resourceEl.classList.add('has-photo');
            resourceEl.style.backgroundImage = 'url("' + photoUrl.replace(/"/g, '\\"') + '")';
            return;
        }
        if (!isTransparentColor(resource.bgColor)) {
            resourceEl.style.backgroundColor = resource.bgColor;
        }
        if (!isTransparentColor(resource.textColor)) {
            resourceEl.style.color = resource.textColor;
        }
        if (!isTransparentColor(resource.borderColor)) {
            resourceEl.style.borderColor = resource.borderColor;
        }
    }

    function updateTabWarningEl(warningEl, tab) {
        if (!warningEl) return;
        warningEl.className = 'tab-warning-badge';
        warningEl.replaceChildren();
        warningEl.title = '';
        if (!tab || !tab.pageWarning) return;
        warningEl.classList.add('visible');
        if (tab.type === 'contract') {
            warningEl.classList.add('contract-warning');
            warningEl.title = 'Contract needs attention';
            appendIconMarkup(warningEl, '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.8v5.2"/><path d="M12 16.8h.01"/></svg>');
        } else {
            warningEl.title = 'Page warning';
            appendIconMarkup(warningEl, '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18.4A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.6L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>');
        }
    }

    function updateTabEl(tab) {
        if (!tab.tabEl) return;
        const t = tab.tabEl.querySelector('.line.title');
        const n = tab.tabEl.querySelector('.line.number');
        const c = tab.tabEl.querySelector('.line.contact');
        const r = tab.tabEl.querySelector('.resource-badge');
        const w = tab.tabEl.querySelector('.tab-warning-badge');
        if (t) updateTabTitleEl(t, tab);
        if (n) {
            n.textContent = tabLineValue(tab, 2);
            applyTabLineStyle(n, tab, 2);
        }
        if (c) {
            c.textContent = tabLineValue(tab, 3);
            applyTabLineStyle(c, tab, 3);
        }
        if (r) updateTabResourceEl(r, tab);
        if (w) updateTabWarningEl(w, tab);
        updateTabRowCount(tab);
        applyTabColorStyle(tab);
    }

    function updateHomeTabActive() {
        if (!state.homeTabEl) return;
        state.homeTabEl.classList.toggle('active', state.activeId === null);
        state.homeTabEl.classList.toggle('split-member', false);
        updateHomeLoadingIndicator();
        ensureActiveTabVisible();
        updateTabScrollButtons();
    }

    const AES_MODAL_EXIT_MS = 260;

    function prefersReducedMotion() {
        return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    function closeSettingsModal(immediate) {
        if (state.settingsClosing) return;
        if (immediate || prefersReducedMotion()) {
            if (state.settingsModal) {
                state.settingsModal.remove();
                state.settingsModal = null;
            }
            if (state.settingsBackdrop) {
                state.settingsBackdrop.remove();
                state.settingsBackdrop = null;
            }
            state.settingsClosing = false;
            return;
        }
        if (!state.settingsModal && !state.settingsBackdrop) return;
        state.settingsClosing = true;
        if (state.settingsModal) state.settingsModal.classList.add('closing');
        if (state.settingsBackdrop) state.settingsBackdrop.classList.add('closing');
        window.setTimeout(function () {
            if (state.settingsModal) {
                state.settingsModal.remove();
                state.settingsModal = null;
            }
            if (state.settingsBackdrop) {
                state.settingsBackdrop.remove();
                state.settingsBackdrop = null;
            }
            state.settingsClosing = false;
        }, AES_MODAL_EXIT_MS);
    }

    function closeReleaseNotesModal(immediate) {
        if (state.releaseNotesClosing) return;
        if (immediate || prefersReducedMotion()) {
            if (state.releaseNotesModal) {
                state.releaseNotesModal.remove();
                state.releaseNotesModal = null;
            }
            if (state.releaseNotesBackdrop) {
                state.releaseNotesBackdrop.remove();
                state.releaseNotesBackdrop = null;
            }
            state.releaseNotesClosing = false;
            return;
        }
        if (!state.releaseNotesModal && !state.releaseNotesBackdrop) return;
        state.releaseNotesClosing = true;
        if (state.releaseNotesModal) state.releaseNotesModal.classList.add('closing');
        if (state.releaseNotesBackdrop) state.releaseNotesBackdrop.classList.add('closing');
        window.setTimeout(function () {
            if (state.releaseNotesModal) {
                state.releaseNotesModal.remove();
                state.releaseNotesModal = null;
            }
            if (state.releaseNotesBackdrop) {
                state.releaseNotesBackdrop.remove();
                state.releaseNotesBackdrop = null;
            }
            state.releaseNotesClosing = false;
        }, AES_MODAL_EXIT_MS);
    }

    function markReleaseNotesAsSeen(version) {
        if (!version) return;
        state.releaseNotesLastSeenVersion = version;
        AES.state.releaseNotesLastSeenVersion = version;
        state.releaseNotesSnoozeVersion = '';
        AES.state.releaseNotesSnoozeVersion = '';
        void AES.saveSettings();
    }

    function markReleaseNotesAsSnoozed(version) {
        if (!version) return;
        state.releaseNotesSnoozeVersion = version;
        AES.state.releaseNotesSnoozeVersion = version;
        void AES.saveSettings();
    }

    function openReleaseNotesModal() {
        if (state.releaseNotesModal || state.releaseNotesClosing) return;

        const version = getExtensionVersion();
        const backdrop = document.createElement('div');
        backdrop.className = 'at-tabs-release-notes-backdrop';
        backdrop.addEventListener('click', function () {
            closeReleaseNotesModal();
            markReleaseNotesAsSeen(version);
        });

        const modal = document.createElement('div');
        modal.className = 'at-tabs-release-notes-modal';

        const header = document.createElement('div');
        header.className = 'at-tabs-release-notes-header';

        const title = document.createElement('div');
        title.className = 'at-tabs-release-notes-title';
        title.textContent = 'Autotask Enhancement Suite Release Notes';

        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'at-tabs-release-notes-close';
        close.textContent = '×';
        close.title = 'Close release notes';
        close.addEventListener('click', function () {
            closeReleaseNotesModal();
            markReleaseNotesAsSeen(version);
        });

        const body = document.createElement('div');
        body.className = 'at-tabs-release-notes-body';
        const intro = document.createElement('p');
        intro.className = 'at-tabs-release-notes-intro';
        intro.textContent = 'Version ' + (RELEASE_NOTES.version || version || 'latest');
        body.appendChild(intro);
        function appendReleaseNoteList(parent, items) {
            if (!Array.isArray(items) || !items.length) return;
            const list = document.createElement('ul');
            items.forEach(function (item) {
                const itemEl = document.createElement('li');
                if (typeof item === 'string') {
                    itemEl.textContent = item;
                } else if (item && typeof item === 'object' && item.text) {
                    itemEl.textContent = item.text;
                }
                list.appendChild(itemEl);
            });
            parent.appendChild(list);
        }

        RELEASE_NOTES.sections.forEach(function (section) {
            const sectionEl = document.createElement('section');
            sectionEl.className = 'at-tabs-release-notes-section';
            const sectionTitle = document.createElement('h3');
            sectionTitle.textContent = section.title;
            sectionEl.appendChild(sectionTitle);

            appendReleaseNoteList(sectionEl, section.items);

            if (Array.isArray(section.subsections)) {
                section.subsections.forEach(function (subsection) {
                    const subsectionEl = document.createElement('div');
                    subsectionEl.className = 'at-tabs-release-notes-subsection';
                    const subsectionTitle = document.createElement('h4');
                    subsectionTitle.textContent = subsection.title;
                    subsectionEl.appendChild(subsectionTitle);
                    appendReleaseNoteList(subsectionEl, subsection.items);
                    sectionEl.appendChild(subsectionEl);
                });
            }

            body.appendChild(sectionEl);
        });

        const actions = document.createElement('div');
        actions.className = 'at-tabs-release-notes-actions';

        const openButton = document.createElement('button');
        openButton.type = 'button';
        openButton.className = 'at-tabs-release-notes-action at-tabs-release-notes-open';
        openButton.textContent = 'View release notes on GitHub';
        openButton.addEventListener('click', function () {
            markReleaseNotesAsSeen(version);
            closeReleaseNotesModal(true);
            try {
                window.open(RELEASE_NOTES_URL, '_blank', 'noopener,noreferrer');
            } catch (e) {}
        });

        const remindButton = document.createElement('button');
        remindButton.type = 'button';
        remindButton.className = 'at-tabs-release-notes-action';
        remindButton.textContent = 'Remind me next time';
        remindButton.addEventListener('click', function () {
            closeReleaseNotesModal(true);
        });

        const dontShowButton = document.createElement('button');
        dontShowButton.type = 'button';
        dontShowButton.className = 'at-tabs-release-notes-action at-tabs-release-notes-snooze';
        dontShowButton.textContent = "Don\'t show until next release";
        dontShowButton.addEventListener('click', function () {
            markReleaseNotesAsSnoozed(version);
            closeReleaseNotesModal(true);
        });

        actions.appendChild(openButton);
        actions.appendChild(remindButton);
        actions.appendChild(dontShowButton);
        header.appendChild(title);
        header.appendChild(close);

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(actions);

        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
        state.releaseNotesBackdrop = backdrop;
        state.releaseNotesModal = modal;
    }

    function maybeShowReleaseNotesModalOnUpdate() {
        const version = getExtensionVersion();
        if (!version) return;
        if (state.releaseNotesLastSeenVersion === version) return;
        if (state.releaseNotesSnoozeVersion === version) return;
        openReleaseNotesModal();
    }

    function markGithubReleaseReminderChecked() {
        writeLocalStorageValue(GITHUB_RELEASE_CHECK_STORAGE_KEY, Date.now());
    }

    function dismissGithubReleaseVersion(version) {
        if (!version) return;
        writeLocalStorageValue(GITHUB_RELEASE_DISMISS_STORAGE_KEY, version);
    }

    function openGithubReleaseAvailableModal(release) {
        if (!release || !release.version || state.releaseNotesModal || state.releaseNotesClosing) return;

        const installedVersion = getExtensionVersion();
        const releaseUrl = release.htmlUrl || GITHUB_LATEST_RELEASE_URL;
        const backdrop = document.createElement('div');
        backdrop.className = 'at-tabs-release-notes-backdrop';
        backdrop.addEventListener('click', function () {
            markGithubReleaseReminderChecked();
            closeReleaseNotesModal();
        });

        const modal = document.createElement('div');
        modal.className = 'at-tabs-release-notes-modal';

        const header = document.createElement('div');
        header.className = 'at-tabs-release-notes-header';

        const title = document.createElement('div');
        title.className = 'at-tabs-release-notes-title';
        title.textContent = 'New AES version available';

        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'at-tabs-release-notes-close';
        close.textContent = '×';
        close.title = 'Close update notification';
        close.addEventListener('click', function () {
            markGithubReleaseReminderChecked();
            closeReleaseNotesModal();
        });

        const body = document.createElement('div');
        body.className = 'at-tabs-release-notes-body';
        const intro = document.createElement('p');
        intro.className = 'at-tabs-release-notes-intro';
        intro.textContent = 'Version ' + release.version + ' is available on GitHub. You are running ' + (installedVersion || 'an older version') + '.';
        body.appendChild(intro);

        const actions = document.createElement('div');
        actions.className = 'at-tabs-release-notes-actions';

        const openButton = document.createElement('button');
        openButton.type = 'button';
        openButton.className = 'at-tabs-release-notes-action at-tabs-release-notes-open';
        openButton.textContent = 'View release on GitHub';
        openButton.addEventListener('click', function () {
            dismissGithubReleaseVersion(release.version);
            closeReleaseNotesModal(true);
            try {
                window.open(releaseUrl, '_blank', 'noopener,noreferrer');
            } catch (e) {}
        });

        const remindButton = document.createElement('button');
        remindButton.type = 'button';
        remindButton.className = 'at-tabs-release-notes-action';
        remindButton.textContent = 'Remind me tomorrow';
        remindButton.addEventListener('click', function () {
            markGithubReleaseReminderChecked();
            closeReleaseNotesModal(true);
        });

        const dontShowButton = document.createElement('button');
        dontShowButton.type = 'button';
        dontShowButton.className = 'at-tabs-release-notes-action at-tabs-release-notes-snooze';
        dontShowButton.textContent = "Don\'t show this version";
        dontShowButton.addEventListener('click', function () {
            dismissGithubReleaseVersion(release.version);
            closeReleaseNotesModal(true);
        });

        actions.appendChild(openButton);
        actions.appendChild(remindButton);
        actions.appendChild(dontShowButton);
        header.appendChild(title);
        header.appendChild(close);

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(actions);

        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
        state.releaseNotesBackdrop = backdrop;
        state.releaseNotesModal = modal;
    }

    function maybeCheckGithubReleaseUpdate() {
        if (state.githubReleaseCheckInFlight || state.releaseNotesModal || state.releaseNotesClosing) return;
        const lastCheckAt = readLocalStorageNumber(GITHUB_RELEASE_CHECK_STORAGE_KEY);
        if (lastCheckAt && Date.now() - lastCheckAt < GITHUB_RELEASE_CHECK_INTERVAL_MS) return;

        state.githubReleaseCheckInFlight = true;
        markGithubReleaseReminderChecked();
        sendRuntimeMessage({
            __aesReleaseCheck: true,
            type: 'latest-release',
        }).then(function (release) {
            state.githubReleaseCheckInFlight = false;
            if (!release || !release.ok || !release.version || String(release.version).includes('-')) return;
            const installedVersion = getExtensionVersion();
            if (!installedVersion || compareVersions(release.version, installedVersion) <= 0) return;
            if (readRuntimeBuildStorage(window.localStorage, GITHUB_RELEASE_DISMISS_STORAGE_KEY) === release.version) return;
            openGithubReleaseAvailableModal(release);
        }).catch(function () {
            state.githubReleaseCheckInFlight = false;
        });
    }

    const SETTING_INFO_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

    function createSettingInfo(text) {
        const span = document.createElement('span');
        span.className = 'at-tabs-setting-info';
        span.title = text;
        span.setAttribute('aria-label', text);
        span.setAttribute('role', 'img');
        appendIconMarkup(span, SETTING_INFO_SVG);
        return span;
    }

    const settingsUi = AES.SettingsUi || {};

    function createSettingsToggleRow(config) {
        return settingsUi.createToggleRow(Object.assign({ createInfo: createSettingInfo }, config));
    }

    function createSettingsSelectRow(config) {
        return settingsUi.createSelectRow(Object.assign({ createInfo: createSettingInfo }, config));
    }

    function createSettingsFooterButton(config) {
        return settingsUi.createFooterButton(config);
    }

    function defaultSettingsState() {
        return {
            extensionEnabled: true,
            rememberTabsAfterClose: true,
            openNewTabsAtStart: false,
            phoneLinksEnabled: true,
            themePreference: 'auto',
            barOrientation: 'horizontal',
            hideEarlyAccessLabels: false,
            replaceCalendarWithResourcePlanner: false,
            showTabBarOnNonIframePages: true,
            resizableTabBarEnabled: true,
            horizontalCompactTabsEnabled: false,
            roundedPageFramesEnabled: false,
            improvedScrollbarsEnabled: true,
            skipPeekBackdropCloseWarning: false,
            tabLine2Fields: defaultTabLineSettings(2),
            tabLine3Fields: defaultTabLineSettings(3),
            tabBarWidth: AES.BAR_W || 240,
        };
    }

    function openSettingsModal() {
        if (state.settingsModal || state.settingsClosing) return;

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

        const generalSection = document.createElement('div');
        generalSection.className = 'at-tabs-settings-section';

        const enabledReloadNote = document.createElement('div');
        enabledReloadNote.className = 'at-tabs-setting-reload-note';
        const enabledReloadText = document.createElement('span');
        enabledReloadText.textContent = 'Refresh this browser tab to fully apply the extension enable/disable change.';
        const enabledReloadButton = document.createElement('button');
        enabledReloadButton.type = 'button';
        enabledReloadButton.className = 'at-tabs-setting-reload-button';
        enabledReloadButton.textContent = 'Refresh now';
        enabledReloadButton.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            void AES.saveSettings().then(function () {
                window.location.reload();
            });
        });
        enabledReloadNote.appendChild(enabledReloadText);
        enabledReloadNote.appendChild(enabledReloadButton);

        const enabledControl = createSettingsToggleRow({
            name: 'Enable Autotask Enhancement Suite',
            info: 'Turns all AES enhancements on or off. Refresh the browser tab after changing this so all injected page features fully start or stop.',
            checked: featuresEnabled(),
            onChange: function (input) {
                state.extensionEnabled = input.checked;
                applyExtensionEnabledState();
                enabledReloadNote.classList.add('visible');
                void AES.saveSettings();
            }
        });
        const enabledRow = enabledControl.row;
        const enabledInput = enabledControl.input;

        const earlyAccessControl = createSettingsToggleRow({
            name: 'Hide early access labels',
            info: 'Hide Early Access badges in the native Autotask navigation menu',
            checked: !!state.hideEarlyAccessLabels,
            onChange: function (input) {
                state.hideEarlyAccessLabels = input.checked;
                AES.state.hideEarlyAccessLabels = input.checked;
                applyEarlyAccessLabelVisibility(document);
                void AES.saveSettings();
            }
        });
        const earlyAccessRow = earlyAccessControl.row;
        const earlyAccessInput = earlyAccessControl.input;

        const resourcePlannerControl = createSettingsToggleRow({
            name: 'Replace legacy Dispatch Calendar with Resource Planner',
            info: 'Changes the native Calendar button into a Resource Planner shortcut.',
            checked: !!state.replaceCalendarWithResourcePlanner,
            onChange: function (input) {
                state.replaceCalendarWithResourcePlanner = input.checked;
                AES.state.replaceCalendarWithResourcePlanner = input.checked;
                applyResourcePlannerCalendarShortcut(document);
                void AES.saveSettings();
            }
        });
        const resourcePlannerRow = resourcePlannerControl.row;
        const resourcePlannerInput = resourcePlannerControl.input;

        const roundedPageFramesControl = createSettingsToggleRow({
            name: 'Rounded page frames',
            info: 'Rounds the visible Autotask page frame corners.',
            checked: !!state.roundedPageFramesEnabled,
            onChange: function (input) {
                state.roundedPageFramesEnabled = input.checked;
                AES.state.roundedPageFramesEnabled = input.checked;
                applyPageFrameClass();
                requestSyncGeometry();
                void AES.saveSettings();
            }
        });
        const roundedPageFramesRow = roundedPageFramesControl.row;
        const roundedPageFramesInput = roundedPageFramesControl.input;

        const improvedScrollbarsControl = createSettingsToggleRow({
            name: 'Improved scrollbars',
            info: 'Uses thinner AES styled scrollbars where supported.',
            checked: !!state.improvedScrollbarsEnabled,
            onChange: function (input) {
                state.improvedScrollbarsEnabled = input.checked;
                AES.state.improvedScrollbarsEnabled = input.checked;
                syncImprovedScrollbarsState();
                void AES.saveSettings();
            }
        });
        const improvedScrollbarsRow = improvedScrollbarsControl.row;
        const improvedScrollbarsInput = improvedScrollbarsControl.input;

        const phoneControl = createSettingsToggleRow({
            name: 'Clickable phone numbers',
            info: 'Turns detected phone numbers into clickable tel links.',
            checked: !!state.phoneLinksEnabled,
            onChange: function (input) {
                state.phoneLinksEnabled = input.checked;
                AES.state.phoneLinksEnabled = input.checked;
                if (AES.setPhoneLinksEnabled) AES.setPhoneLinksEnabled(input.checked);
                void AES.saveSettings();
            }
        });
        const phoneRow = phoneControl.row;
        const phoneInput = phoneControl.input;

        // Tabbar section --------------------------------------------------
        const section = document.createElement('div');
        section.className = 'at-tabs-settings-section';

        // Tab bar position row (horizontal/vertical).
        function currentTabBarPositionValue() {
            if (state.barOrientation === 'vertical') return 'vertical-left';
            return state.horizontalCompactTabsEnabled ? 'horizontal-compact' : 'horizontal';
        }

        const orientationControl = createSettingsSelectRow({
            name: 'Tab bar position',
            info: 'Choose the tab bar layout. Compact horizontal tabs hide Line 3 and reduce tab height.',
            value: currentTabBarPositionValue(),
            options: [
                { value: 'horizontal', label: 'Horizontal' },
                { value: 'horizontal-compact', label: 'Horizontal (Compact)' },
                { value: 'vertical-left', label: 'Vertical (left)' },
                { value: 'vertical-right', label: 'Vertical (right) (coming in a future update)', disabled: true },
            ],
            onChange: function (select) {
                if (select.value === 'vertical-right') {
                    select.value = currentTabBarPositionValue();
                    return;
                }
                const compact = select.value === 'horizontal-compact';
                const nextOrientation = select.value === 'vertical-left' ? 'vertical' : 'horizontal';
                state.horizontalCompactTabsEnabled = compact;
                AES.state.horizontalCompactTabsEnabled = compact;
                setBarOrientation(nextOrientation);
                updateResizableBarClasses();
                state.tabs.forEach(updateTabEl);
                updateCustomizationCompactState();
                requestSyncGeometry();
                saveTabs();
                void AES.saveSettings();
            }
        });
        const orientationRow = orientationControl.row;
        const orientationSelect = orientationControl.select;

        const resizeControl = createSettingsToggleRow({
            name: 'Allow resizing of the vertical tab bar',
            info: 'Allows the resizing of the vertical AES Tab Bar by dragging the line on the right side. May cause visual issues on the content',
            checked: !!state.resizableTabBarEnabled,
            onChange: function (input) {
                state.resizableTabBarEnabled = input.checked;
                AES.state.resizableTabBarEnabled = input.checked;
                updateResizableBarClasses();
                requestSyncGeometry();
                void AES.saveSettings();
            }
        });
        const resizeRow = resizeControl.row;
        const resizeInput = resizeControl.input;

        const hideControl = createSettingsToggleRow({
            name: 'Hide tab bar',
            info: 'Manually disable the tab bar that gets added by this extension',
            checked: state.shellHidden,
            onChange: function (input) {
                state.shellHidden = input.checked;
                updateShellVisibility();
            }
        });
        const hideRow = hideControl.row;
        const hideInput = hideControl.input;

        const persistControl = createSettingsToggleRow({
            name: 'Remember tabs after closing browser',
            info: 'By default the tabs are not remembered after closing the browser, by enabling this the tabs will be saved in persistent memory (may cause tab mess!)',
            checked: state.rememberTabsAfterClose,
            onChange: function (input) {
                state.rememberTabsAfterClose = input.checked;
                void AES.saveSettings().then(function () {
                    return AES.syncTabsPersistenceMode(buildTabsPayload());
                });
            }
        });
        const persistRow = persistControl.row;
        const persistInput = persistControl.input;

        const openAtStartControl = createSettingsToggleRow({
            name: 'Open new tabs at the start',
            info: 'Adds new tabs near the start of the tab bar: left in horizontal mode, top in vertical mode. Pinned tabs stay first.',
            checked: !!state.openNewTabsAtStart,
            onChange: function (input) {
                state.openNewTabsAtStart = input.checked;
                AES.state.openNewTabsAtStart = input.checked;
                void AES.saveSettings();
            }
        });
        const openAtStartRow = openAtStartControl.row;
        const openAtStartInput = openAtStartControl.input;

        const everywhereControl = createSettingsToggleRow({
            name: 'Show tab bar on all Autotask pages',
            info: 'Show the AES Tab Bar on all Autotask pages independent of the usage of iFrames, for example: Umbrella Contracts or Resource Planner. Note that new Autotask Onyx pages will always show on the Home tab because the tabs depend on iFrames.',
            checked: !!state.showTabBarOnNonIframePages,
            onChange: function (input) {
                state.showTabBarOnNonIframePages = input.checked;
                AES.state.showTabBarOnNonIframePages = input.checked;
                if (state.showTabBarOnNonIframePages) {
                    ensureNonIframeTitleWatcher();
                    scheduleNonIframeTitleUpdate();
                } else {
                    stopNonIframeTitleWatcher();
                }
                requestSyncGeometry();
                void AES.saveSettings();
            }
        });
        const everywhereRow = everywhereControl.row;
        const everywhereInput = everywhereControl.input;

        const peekConfirmControl = createSettingsToggleRow({
            name: 'Confirm before closing Peek by outside click',
            info: 'Shows a confirmation when closing a Peek window by clicking outside it. Disable this to keep the “Do not show this again” behavior.',
            checked: !state.skipPeekBackdropCloseWarning,
            onChange: function (input) {
                state.skipPeekBackdropCloseWarning = !input.checked;
                AES.state.skipPeekBackdropCloseWarning = state.skipPeekBackdropCloseWarning;
                void AES.saveSettings();
            }
        });
        const peekConfirmRow = peekConfirmControl.row;
        const peekConfirmInput = peekConfirmControl.input;

        const customizationSection = document.createElement('div');
        customizationSection.className = 'at-tabs-settings-section';

        const customizationHeader = document.createElement('div');
        customizationHeader.className = 'at-tabs-customization-header';
        customizationHeader.appendChild(document.createElement('span'));
        const customizationHeaderLines = document.createElement('span');
        customizationHeaderLines.className = 'at-tabs-customization-header-lines';
        ['Line 2', 'Line 3'].forEach(function (labelText, index) {
            const label = document.createElement('span');
            label.textContent = labelText;
            if (index === 1) label.dataset.tabLineHeader = '3';
            customizationHeaderLines.appendChild(label);
        });
        customizationHeader.appendChild(customizationHeaderLines);
        customizationSection.appendChild(customizationHeader);

        function createLineSelect(type, line) {
            const select = document.createElement('select');
            select.className = 'at-tabs-setting-select';
            select.dataset.tabType = type;
            select.dataset.tabLine = String(line);
            const settings = line === 2 ? state.tabLine2Fields : state.tabLine3Fields;
            const lineOptions = getLineOptionsForType(type);
            const fallback = line === 2 ? getDefaultLineField(type, 'line2') : getDefaultLineField(type, 'line3');
            const currentValue = lineOptions.includes(settings[type]) ? settings[type] : fallback;
            lineOptions.forEach(function (value) {
                const optionEl = document.createElement('option');
                optionEl.value = value;
                optionEl.textContent = getCustomizationFieldOptionLabel(type, value);
                if (currentValue === value) optionEl.selected = true;
                select.appendChild(optionEl);
            });
            select.addEventListener('change', function () {
                if (line === 2) {
                    state.tabLine2Fields[type] = select.value;
                    AES.state.tabLine2Fields = state.tabLine2Fields;
                } else {
                    state.tabLine3Fields[type] = select.value;
                    AES.state.tabLine3Fields = state.tabLine3Fields;
                }
                state.tabs.forEach(updateTabEl);
                saveTabs();
                void AES.saveSettings();
            });
            return select;
        }

        function setCustomizationSelectValues(line2Fields, line3Fields) {
            customizationSection.querySelectorAll('select[data-tab-type][data-tab-line]').forEach(function (select) {
                const type = select.dataset.tabType;
                const line = select.dataset.tabLine === '2' ? 2 : 3;
                const fields = line === 2 ? line2Fields : line3Fields;
                const value = fields && fields[type];
                const fallback = getDefaultLineField(type, line);
                select.value = getLineOptionsForType(type).includes(value) ? value : fallback;
            });
        }

        function applyRecommendedCustomization() {
            const line2Fields = defaultTabLineSettings(2);
            const line3Fields = defaultTabLineSettings(3);
            CUSTOMIZABLE_TAB_TYPES.forEach(function (type) {
                const recommendation = TAB_LINE_RECOMMENDED_BY_TYPE[type] || {};
                if (getLineOptionsForType(type).includes(recommendation.line2)) {
                    line2Fields[type] = recommendation.line2;
                }
                if (getLineOptionsForType(type).includes(recommendation.line3)) {
                    line3Fields[type] = recommendation.line3;
                }
            });
            state.tabLine2Fields = line2Fields;
            state.tabLine3Fields = line3Fields;
            AES.state.tabLine2Fields = line2Fields;
            AES.state.tabLine3Fields = line3Fields;
            setCustomizationSelectValues(line2Fields, line3Fields);
            state.tabs.forEach(updateTabEl);
            saveTabs();
            void AES.saveSettings();
        }

        CUSTOMIZABLE_TAB_TYPES.forEach(function (type) {
            const row = document.createElement('div');
            row.className = 'at-tabs-setting-row at-tabs-customization-row';
            const label = document.createElement('span');
            label.className = 'at-tabs-setting-label';
            const tabIcon = document.createElement('span');
            tabIcon.className = 'at-tabs-setting-icon';
            appendIconMarkup(tabIcon, CUSTOMIZATION_TAB_TYPE_ICONS[type] || '');
            label.appendChild(tabIcon);
            const name = document.createElement('span');
            name.className = 'at-tabs-setting-name';
            name.textContent = TAB_TYPE_LABELS[type] || type;
            label.appendChild(name);

            const controls = document.createElement('span');
            controls.className = 'at-tabs-setting-line-controls';
            const line2 = createLineSelect(type, 2);
            const line3 = createLineSelect(type, 3);
            line2.title = 'Line 2';
            line3.title = 'Line 3';
            controls.appendChild(line2);
            controls.appendChild(line3);
            row.appendChild(label);
            row.appendChild(controls);
            customizationSection.appendChild(row);
        });

        function updateCustomizationCompactState() {
            const disabled = !!state.horizontalCompactTabsEnabled;
            customizationSection.querySelectorAll('select[data-tab-line="3"]').forEach(function (select) {
                select.disabled = disabled;
                select.title = disabled ? 'Line 3 is hidden when Compact horizontal tabs is enabled' : 'Line 3';
            });
            customizationSection.querySelectorAll('.at-tabs-setting-line-controls').forEach(function (controls) {
                controls.classList.toggle('line3-disabled', disabled);
            });
            customizationSection.querySelectorAll('[data-tab-line-header="3"]').forEach(function (label) {
                label.classList.toggle('line3-disabled', disabled);
                label.title = disabled ? 'Line 3 is hidden when Compact horizontal tabs is enabled' : '';
            });
        }
        updateCustomizationCompactState();

        const uiSection = document.createElement('div');
        uiSection.className = 'at-tabs-settings-section';

        section.appendChild(orientationRow);
        section.appendChild(resizeRow);
        section.appendChild(everywhereRow);
        section.appendChild(hideRow);
        section.appendChild(openAtStartRow);
        section.appendChild(persistRow);
        section.appendChild(peekConfirmRow);
        generalSection.appendChild(enabledRow);
        generalSection.appendChild(enabledReloadNote);
        uiSection.appendChild(earlyAccessRow);
        uiSection.appendChild(resourcePlannerRow);
        uiSection.appendChild(roundedPageFramesRow);
        uiSection.appendChild(improvedScrollbarsRow);
        uiSection.appendChild(phoneRow);

        const nav = document.createElement('div');
        nav.className = 'at-tabs-settings-nav';
        const pages = document.createElement('div');
        pages.className = 'at-tabs-settings-pages';
        const pageDefs = [
            { id: 'general', label: 'General', description: 'Core extension controls.', section: generalSection },
            { id: 'ui', label: 'Enhancements', description: 'Visual tweaks for Autotask and native navigation cleanup.', section: uiSection },
            { id: 'tabbar', label: 'Tab bar', description: 'Position, persistence, Peek behavior, and visibility.', section: section },
            { id: 'customization', label: 'Customization', description: 'Choose what metadata appears on each tab line.', section: customizationSection },
        ];
        const navButtons = [];
        const pageEls = [];
        function activateSettingsPage(id) {
            navButtons.forEach(function (button) {
                button.classList.toggle('active', button.dataset.pageId === id);
            });
            pageEls.forEach(function (page) {
                page.classList.toggle('active', page.dataset.pageId === id);
            });
        }
        pageDefs.forEach(function (def, index) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'at-tabs-settings-nav-item' + (index === 0 ? ' active' : '');
            button.dataset.pageId = def.id;
            appendIconMarkup(button, '<span class="at-tabs-settings-nav-name"></span><span class="at-tabs-settings-nav-arrow">›</span>');
            button.querySelector('.at-tabs-settings-nav-name').textContent = def.label;
            button.addEventListener('click', function () { activateSettingsPage(def.id); });
            navButtons.push(button);
            nav.appendChild(button);

            const page = document.createElement('div');
            page.className = 'at-tabs-settings-page' + (index === 0 ? ' active' : '');
            page.dataset.pageId = def.id;
            const pageTitle = document.createElement('div');
            pageTitle.className = 'at-tabs-settings-page-title';
            if (def.id === 'customization') pageTitle.classList.add('with-action');
            const pageTitleCopy = document.createElement('div');
            pageTitleCopy.className = 'at-tabs-settings-page-title-copy';
            const titleText = document.createElement('strong');
            titleText.textContent = def.label;
            const subtitle = document.createElement('span');
            subtitle.textContent = def.description;
            pageTitleCopy.appendChild(titleText);
            pageTitleCopy.appendChild(subtitle);
            pageTitle.appendChild(pageTitleCopy);
            if (def.id === 'customization') {
                const recommendedButton = document.createElement('button');
                recommendedButton.type = 'button';
                recommendedButton.className = 'at-tabs-settings-page-action';
                recommendedButton.textContent = 'Set to recommended';
                recommendedButton.addEventListener('click', applyRecommendedCustomization);
                pageTitle.appendChild(recommendedButton);
            }
            page.appendChild(pageTitle);
            page.appendChild(def.section);
            pageEls.push(page);
            pages.appendChild(page);
        });
        body.appendChild(nav);
        body.appendChild(pages);

        function resetSettingsToDefaults() {
            if (!window.confirm('Reset AES settings to their defaults? Open tabs will stay open.')) return;

            const defaults = defaultSettingsState();
            Object.assign(state, defaults);
            Object.assign(AES.state, defaults);
            state.shellHidden = false;

            enabledInput.checked = defaults.extensionEnabled;
            enabledReloadNote.classList.remove('visible');
            earlyAccessInput.checked = defaults.hideEarlyAccessLabels;
            resourcePlannerInput.checked = defaults.replaceCalendarWithResourcePlanner;
            roundedPageFramesInput.checked = defaults.roundedPageFramesEnabled;
            orientationSelect.value = defaults.barOrientation === 'vertical' ? 'vertical-left' : (defaults.horizontalCompactTabsEnabled ? 'horizontal-compact' : 'horizontal');
            resizeInput.checked = defaults.resizableTabBarEnabled;
            hideInput.checked = state.shellHidden;
            openAtStartInput.checked = defaults.openNewTabsAtStart;
            persistInput.checked = defaults.rememberTabsAfterClose;
            everywhereInput.checked = defaults.showTabBarOnNonIframePages;
            peekConfirmInput.checked = !defaults.skipPeekBackdropCloseWarning;
            improvedScrollbarsInput.checked = defaults.improvedScrollbarsEnabled;
            phoneInput.checked = defaults.phoneLinksEnabled;
            setCustomizationSelectValues(defaults.tabLine2Fields, defaults.tabLine3Fields);
            updateCustomizationCompactState();

            applyAutotaskTheme();
            applyBarOrientationClass();
            applyPageFrameClass();
            syncImprovedScrollbarsState();
            updateResizableBarClasses();
            updateShellVisibility();
            applyExtensionEnabledState();
            applyEarlyAccessLabelVisibility(document);
            applyResourcePlannerCalendarShortcut(document);
            if (AES.setPhoneLinksEnabled) AES.setPhoneLinksEnabled(defaults.phoneLinksEnabled);
            if (state.showTabBarOnNonIframePages) ensureNonIframeTitleWatcher();
            else stopNonIframeTitleWatcher();
            state.tabs.forEach(updateTabEl);
            requestSyncGeometry();

            void AES.saveSettings().then(function () {
                if (AES.syncTabsPersistenceMode) {
                    return AES.syncTabsPersistenceMode(buildTabsPayload());
                }
                return null;
            });
        }

        const footer = document.createElement('div');
        footer.className = 'at-tabs-settings-footer';
        const footerText = document.createElement('span');
        footerText.textContent = 'Developed by QNTN.dev with help of Generative AI';
        const resetButton = createSettingsFooterButton({
            text: 'Reset settings',
            title: 'Reset AES settings to defaults',
            onClick: resetSettingsToDefaults,
        });
        const releaseNotesButton = createSettingsFooterButton({
            text: 'Release notes',
            title: 'View AES release notes',
            onClick: function () {
                closeSettingsModal(true);
                openReleaseNotesModal();
            },
        });
        const feedbackButton = createSettingsFooterButton({
            text: 'Provide feedback',
            title: 'Create a GitHub issue for AES feedback',
            onClick: function () {
                window.open(FEEDBACK_URL, '_blank', 'noopener,noreferrer');
            },
        });
        const footerActions = document.createElement('span');
        footerActions.className = 'at-tabs-settings-footer-actions';
        footerActions.appendChild(releaseNotesButton);
        footerActions.appendChild(feedbackButton);
        footerActions.appendChild(resetButton);
        footer.appendChild(footerText);
        footer.appendChild(footerActions);

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

    function closeMapModal() {
        if (state.mapModal) {
            state.mapModal.remove();
            state.mapModal = null;
        }
        if (state.mapBackdrop) {
            state.mapBackdrop.remove();
            state.mapBackdrop = null;
        }
    }

    function mapEmbedUrl(url) {
        try {
            const parsed = new URL(url, location.origin);
            const query = parsed.searchParams.get('q') ||
                parsed.searchParams.get('query') ||
                parsed.searchParams.get('daddr') ||
                parsed.searchParams.get('destination') ||
                parsed.searchParams.get('address');
            if (/google\.[^/]+$/i.test(parsed.hostname) || /(^|\.)google\.[^/]+$/i.test(parsed.hostname)) {
                if (query) {
                    return 'https://maps.google.com/maps?q=' + encodeURIComponent(query) + '&output=embed';
                }
                parsed.searchParams.set('output', 'embed');
                return parsed.href;
            }
            if (/(^|\.)googleapis\.com$/i.test(parsed.hostname) || /(^|\.)gstatic\.com$/i.test(parsed.hostname)) {
                return parsed.href;
            }
            if (query) {
                return 'https://maps.google.com/maps?q=' + encodeURIComponent(query) + '&output=embed';
            }
            return parsed.href;
        } catch (e) {
            return url;
        }
    }

    function openMapModal(url) {
        if (!url) return;
        closeMapModal();

        const backdrop = document.createElement('div');
        backdrop.className = 'at-tabs-map-backdrop';
        backdrop.addEventListener('click', closeMapModal);

        const modal = document.createElement('div');
        modal.className = 'at-tabs-map-modal';

        const header = document.createElement('div');
        header.className = 'at-tabs-map-header';

        const title = document.createElement('div');
        title.textContent = 'Organization location';

        const actions = document.createElement('div');
        actions.className = 'at-tabs-map-actions';

        const openExternal = document.createElement('a');
        openExternal.className = 'at-tabs-map-open';
        openExternal.href = url;
        openExternal.target = '_blank';
        openExternal.rel = 'noopener noreferrer';
        openExternal.textContent = 'Open in maps';

        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'at-tabs-map-close';
        close.textContent = '×';
        close.title = 'Close map';
        close.addEventListener('click', closeMapModal);

        actions.appendChild(openExternal);
        actions.appendChild(close);
        header.appendChild(title);
        header.appendChild(actions);

        const iframe = document.createElement('iframe');
        iframe.className = 'at-tabs-map-frame';
        iframe.src = mapEmbedUrl(url);
        iframe.loading = 'lazy';
        iframe.referrerPolicy = 'no-referrer-when-downgrade';

        modal.appendChild(header);
        modal.appendChild(iframe);
        document.body.appendChild(backdrop);
        document.body.appendChild(modal);

        state.mapBackdrop = backdrop;
        state.mapModal = modal;
    }

    // --- Peek modal ----------------------------------------------------------
    // Shows a tab's URL inside a modal overlay (Arc-style "peek") with a
    // vertical button column floating to the right: Close + Split-with-current.
    function clearPeekPrewarm(keepUrl) {
        if (!state.peekPrewarm) return null;
        const prewarm = state.peekPrewarm;
        if (keepUrl && prewarm.url === keepUrl) return prewarm;
        try { prewarm.iframe.remove(); } catch (e) {}
        state.peekPrewarm = null;
        return null;
    }

    function prewarmPeek(tab) {
        if (!tab || !tab.url || state.peekBackdrop) return;
        if (state.peekPrewarm && state.peekPrewarm.url === tab.url) return;
        clearPeekPrewarm();

        const iframe = document.createElement('iframe');
        iframe.className = 'at-tabs-peek-frame';
        iframe.src = tab.url;
        iframe.referrerPolicy = 'no-referrer-when-downgrade';
        iframe.setAttribute('aria-hidden', 'true');
        iframe.style.position = 'fixed';
        iframe.style.left = '-10000px';
        iframe.style.top = '0';
        iframe.style.width = '1px';
        iframe.style.height = '1px';
        iframe.style.opacity = '0';
        iframe.style.pointerEvents = 'none';
        const prewarm = { url: tab.url, iframe: iframe, loaded: false };
        iframe.addEventListener('load', function () {
            prewarm.loaded = true;
        }, { once: true });
        document.body.appendChild(iframe);
        state.peekPrewarm = prewarm;
    }

    function stopPeekLiveReuse() {
        if (state.peekResizeObserver) {
            try { state.peekResizeObserver.disconnect(); } catch (e) {}
            state.peekResizeObserver = null;
        }
        window.removeEventListener('resize', requestSyncGeometry);
        const iframe = state.peekReuseIframe;
        if (iframe) {
            iframe.classList.remove('at-tab-peeking');
            iframe.style.cssText = state.peekReusePrevStyle || '';
            state.peekReuseIframe = null;
            state.peekReusePrevStyle = '';
        }
        if (state.viewport) {
            state.viewport.classList.remove('peek-closing');
            state.viewport.classList.remove('peek-active');
            state.viewport.style.cssText = state.peekViewportPrevStyle || '';
        }
        state.peekViewportPrevStyle = '';
        state.peekSyncOverlay = null;
        requestSyncGeometry();
    }

    function startPeekLiveReuse(tab, modal) {
        // Safari/WebKit can rasterize transformed iframe layers during live
        // reuse, leaving the tab content blurry after resize/Peek animations.
        if (IS_SAFARI_WEBKIT) return false;
        const iframe = tab && tab.iframeEl;
        if (!iframe || !iframe.isConnected || !state.viewport) return false;

        clearPeekPrewarm();
        state.peekReuseIframe = iframe;
        state.peekReusePrevStyle = iframe.style.cssText || '';
        state.peekViewportPrevStyle = state.viewport.style.cssText || '';

        const syncOverlay = function () {
            if (!state.viewport || !modal || !modal.isConnected) return;
            const rect = modal.getBoundingClientRect();
            state.viewport.classList.add('peek-active');
            setCssPx(state.viewport, 'left', rect.left);
            setCssPx(state.viewport, 'top', rect.top);
            setCssPx(state.viewport, 'width', rect.width);
            setCssPx(state.viewport, 'height', rect.height);
            state.viewport.style.right = 'auto';
            state.viewport.style.bottom = 'auto';
        };

        state.peekSyncOverlay = syncOverlay;
        state.viewport.classList.add('peek-active');
        iframe.classList.add('at-tab-peeking');
        iframe.style.cssText = '';
        iframe.style.position = 'absolute';
        iframe.style.inset = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.display = 'block';
        iframe.style.visibility = 'visible';
        iframe.style.opacity = '1';
        iframe.style.pointerEvents = 'auto';
        iframe.style.zIndex = '1';

        syncOverlay();
        if (window.ResizeObserver) {
            state.peekResizeObserver = new ResizeObserver(syncOverlay);
            state.peekResizeObserver.observe(modal);
        }
        window.addEventListener('resize', requestSyncGeometry);
        console.info('[AES Peek Diagnostic] live iframe reuse enabled', {
            tabId: tab.id,
            url: tab.url,
            iframeSrc: iframe.src,
            viewportClassName: state.viewport.className
        });
        return true;
    }

    // Diagnostic mode: try to reuse the already-loaded real tab iframe for
    // Peek. This intentionally stresses the shell so we can inspect why it
    // fails; if it cannot reuse, it falls back to the temporary iframe path.
    function closePeekModal(immediate) {
        if (state.peekClosing && !immediate) return;
        closePeekCloseConfirm();
        if (immediate || prefersReducedMotion()) {
            removePeekModalNow();
            return;
        }
        if (!state.peekBackdrop && !state.peekWrapper && !state.peekReuseIframe) return;
        state.peekClosing = true;
        if (state.peekBackdrop) state.peekBackdrop.classList.add('closing');
        if (state.peekWrapper) state.peekWrapper.classList.add('closing');
        if (state.viewport && state.peekReuseIframe) state.viewport.classList.add('peek-closing');
        window.setTimeout(removePeekModalNow, AES_MODAL_EXIT_MS);
    }

    function removePeekModalNow() {
        stopPeekLiveReuse();
        if (state.peekBackdrop) {
            state.peekBackdrop.remove();
            state.peekBackdrop = null;
        }
        if (state.peekWrapper) {
            state.peekWrapper.remove();
            state.peekWrapper = null;
        }
        state.peekModal = null;
        state.peekTabId = null;
        state.peekClosing = false;
    }

    function closePeekCloseConfirm() {
        if (state.peekCloseConfirm) {
            state.peekCloseConfirm.remove();
            state.peekCloseConfirm = null;
        }
        if (state.peekCloseConfirmShade) {
            state.peekCloseConfirmShade.remove();
            state.peekCloseConfirmShade = null;
        }
    }

    function requestPeekBackdropClose() {
        if (state.skipPeekBackdropCloseWarning) {
            closePeekModal();
            return;
        }
        if (state.peekCloseConfirm) return;

        const shade = document.createElement('div');
        shade.className = 'at-tabs-peek-confirm-shade';
        shade.addEventListener('click', closePeekCloseConfirm);

        const confirmBox = document.createElement('div');
        confirmBox.className = 'at-tabs-peek-confirm';
        confirmBox.setAttribute('role', 'dialog');
        confirmBox.setAttribute('aria-modal', 'true');

        const title = document.createElement('p');
        title.className = 'at-tabs-peek-confirm-title';
        title.textContent = 'Are you sure you want to close the Peek window?';

        const checkLabel = document.createElement('label');
        checkLabel.className = 'at-tabs-peek-confirm-check';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';

        const checkText = document.createElement('span');
        checkText.textContent = 'Do not show this again';
        checkLabel.appendChild(checkbox);
        checkLabel.appendChild(checkText);

        const actions = document.createElement('div');
        actions.className = 'at-tabs-peek-confirm-actions';

        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'at-tabs-peek-confirm-button';
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', closePeekCloseConfirm);

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'at-tabs-peek-confirm-button primary';
        closeButton.textContent = 'Close Peek';
        closeButton.addEventListener('click', function () {
            if (checkbox.checked) {
                state.skipPeekBackdropCloseWarning = true;
                AES.state.skipPeekBackdropCloseWarning = true;
                void AES.saveSettings();
            }
            closePeekModal();
        });

        actions.appendChild(cancelButton);
        actions.appendChild(closeButton);
        confirmBox.appendChild(title);
        confirmBox.appendChild(checkLabel);
        confirmBox.appendChild(actions);
        document.body.appendChild(shade);
        document.body.appendChild(confirmBox);
        state.peekCloseConfirmShade = shade;
        state.peekCloseConfirm = confirmBox;
        closeButton.focus();
    }

    function assignPeekOpener(iframe, openerWindow) {
        if (!iframe || !openerWindow) return;
        try {
            if (iframe.contentWindow && iframe.contentWindow !== openerWindow) {
                iframe.contentWindow.opener = openerWindow;
            }
        } catch (e) {}
    }

    function openPeekModal(tab, options) {
        if (!tab || !tab.url) return;
        const opts = options || {};
        const canOpenPeekAsTab = opts.allowOpenInTab === true;
        const openerWindow = opts.openerWindow || null;
        closePeekModal(true);
        hideHoverCard(true);

        const backdrop = document.createElement('div');
        backdrop.className = 'at-tabs-peek-backdrop';
        backdrop.addEventListener('click', requestPeekBackdropClose);

        const wrapper = document.createElement('div');
        wrapper.className = 'at-tabs-peek-wrapper';

        const modal = document.createElement('div');
        modal.className = 'at-tabs-peek-modal';

        const loader = document.createElement('div');
        loader.className = 'at-tabs-peek-loader';
        loader.setAttribute('aria-label', 'Loading');

        const reusedLiveIframe = opts.reuseLiveIframe === true && startPeekLiveReuse(tab, modal);
        if (reusedLiveIframe) {
            modal.classList.add('live-reuse');
            loader.classList.add('hidden');
            modal.appendChild(loader);
        } else {
            const prewarm = clearPeekPrewarm(tab.url);
            const iframe = prewarm ? prewarm.iframe : document.createElement('iframe');
            iframe.className = 'at-tabs-peek-frame';
            iframe.removeAttribute('aria-hidden');
            iframe.style.cssText = '';
            if (!prewarm) {
                iframe.src = tab.url;
                iframe.referrerPolicy = 'no-referrer-when-downgrade';
            }
            if (prewarm && prewarm.loaded) {
                loader.classList.add('hidden');
            } else {
                iframe.addEventListener('load', function () {
                    loader.classList.add('hidden');
                }, { once: true });
            }
            if (openerWindow) {
                iframe.addEventListener('load', function () {
                    assignPeekOpener(iframe, openerWindow);
                });
            }
            const frameWrap = document.createElement('div');
            frameWrap.className = 'at-tabs-peek-frame-wrap';
            frameWrap.appendChild(iframe);
            assignPeekOpener(iframe, openerWindow);
            frameWrap.appendChild(loader);
            modal.appendChild(frameWrap);
            state.peekPrewarm = null;
        }

        const actions = document.createElement('div');
        actions.className = 'at-tabs-peek-actions';

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'at-tabs-peek-action close-action';
        closeBtn.title = 'Close peek';
        closeBtn.setAttribute('aria-label', 'Close peek');
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', closePeekModal);

        const splitBtn = document.createElement('button');
        splitBtn.type = 'button';
        splitBtn.className = 'at-tabs-peek-action split-action';
        splitBtn.title = 'Split with current tab';
        splitBtn.setAttribute('aria-label', 'Split with current tab');
        appendIconMarkup(splitBtn, '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/></svg>');
        const canSplit = opts.allowSplit !== false && typeof tab.id === 'number' && state.activeId !== null && state.activeId !== tab.id;
        if (!canSplit) {
            splitBtn.disabled = true;
            splitBtn.title = state.activeId === null
                ? 'Open another custom tab first to split with'
                : typeof tab.id !== 'number'
                    ? 'Open this Peek as a tab before splitting'
                    : 'Cannot split a tab with itself';
        }
        splitBtn.addEventListener('click', function () {
            if (splitBtn.disabled) return;
            const tabId = tab.id;
            closePeekModal();
            enableSplitScreen(tabId);
        });

        const openInTabBtn = document.createElement('button');
        openInTabBtn.type = 'button';
        openInTabBtn.className = 'at-tabs-peek-action open-tab-action';
        openInTabBtn.disabled = !canOpenPeekAsTab;
        openInTabBtn.title = canOpenPeekAsTab ? 'Open Peek in tab' : 'Only manually peeked tabs can be opened as tabs';
        openInTabBtn.setAttribute('aria-label', 'Open Peek in tab');
        appendIconMarkup(openInTabBtn, '<span class="fa-up-right-from-square fa-regular" aria-hidden="true"></span>');
        openInTabBtn.addEventListener('click', function () {
            if (!canOpenPeekAsTab) return;
            const targetUrl = tab.url;
            closePeekModal();
            openTab(targetUrl);
        });

        actions.appendChild(closeBtn);
        actions.appendChild(openInTabBtn);
        actions.appendChild(splitBtn);

        wrapper.appendChild(modal);
        wrapper.appendChild(actions);

        document.body.appendChild(backdrop);
        document.body.appendChild(wrapper);

        state.peekBackdrop = backdrop;
        state.peekWrapper = wrapper;
        state.peekModal = modal;
        state.peekTabId = tab.id;
        if (reusedLiveIframe && state.peekSyncOverlay) {
            requestAnimationFrame(state.peekSyncOverlay);
        }
    }

    function openUrlInPeek(url, options) {
        if (!featuresEnabled() || !url) return;
        const opts = options || {};
        const existing = state.tabs.find(t => t.url === url);
        if (existing) {
            openPeekModal(existing, opts);
            return;
        }
        const fallback = fallbackTabMetadataForUrl(url);
        const type = tabTypeForUrl(url);
        openPeekModal({
            id: null,
            url: url,
            title: fallback.title,
            number: fallback.number,
            contact: fallback.contact,
            primaryResource: null,
            hoverFields: [],
            metadataFields: fallbackMetadataFields(type, fallback),
            pageWarning: false,
            iframeEl: null,
            tabEl: null,
        }, Object.assign({ allowSplit: false }, opts));
    }

    // --- Tab hover preview card ---------------------------------------------
    const HOVER_SHOW_DELAY_MS = 550;
    const HOVER_HIDE_DELAY_MS = 180;

    function ensureHoverCard() {
        if (state.hoverCard) return state.hoverCard;
        const card = document.createElement('div');
        card.className = 'at-tabs-hover-card';
        card.setAttribute('role', 'tooltip');
        document.body.appendChild(card);
        function markHovered() {
            state.hoverCardHovered = true;
            state.hoverAnchorHovered = false;
            if (state.hoverHideTimer) {
                clearTimeout(state.hoverHideTimer);
                state.hoverHideTimer = 0;
            }
        }
        function markLeft() {
            state.hoverCardHovered = false;
            hideHoverCard(false);
        }
        card.addEventListener('pointerenter', markHovered);
        card.addEventListener('pointerleave', markLeft);
        state.hoverCard = card;
        return card;
    }

    function hoverCardSuppressed() {
        return !!(state.draggingTabId
            || state.tabContextMenu
            || state.peekBackdrop
            || state.settingsModal
            || state.mapModal);
    }

    function fillHoverCard(card, tab) {
        card.replaceChildren();
        const titleEl = document.createElement('div');
        titleEl.className = 'hc-title';
        titleEl.textContent = tab.title || 'Tab';
        card.appendChild(titleEl);

        const typeEl = document.createElement('div');
        typeEl.className = 'hc-number';
        typeEl.textContent = tabMetadataFields(tab).type || tabTypeLabel(tab);
        card.appendChild(typeEl);

        function addRow(label, value, copyable) {
            if (!value) return;
            const row = document.createElement('div');
            row.className = 'hc-row';
            const lbl = document.createElement('div');
            lbl.className = 'hc-label';
            lbl.textContent = label;
            const val = document.createElement('div');
            val.className = 'hc-value';
            val.textContent = value;
            row.appendChild(lbl);
            row.appendChild(val);
            if (copyable !== false) {
                const copy = document.createElement('button');
                copy.type = 'button';
                copy.className = 'hc-copy';
                copy.title = 'Copy ' + label;
                copy.setAttribute('aria-label', 'Copy ' + label);
                appendIconMarkup(copy, '<i class="fa-regular fa-copy" aria-hidden="true"></i>');
                copy.addEventListener('pointerdown', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                });
                copy.addEventListener('click', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    void copyTextToClipboard(String(value || ''));
                });
                row.appendChild(copy);
            }
            card.appendChild(row);
        }

        addRow('Account', tab.contact);
        if (tab.primaryResource && tab.primaryResource.name) {
            addRow('Primary', tab.primaryResource.name);
        }
        const hoverFields = normalizeHoverFields(tab.hoverFields);
        if (hoverFields.length) {
            for (const field of hoverFields) addRow(field.label, field.value);
        } else {
            addRow('Status', tab.status);
            addRow('Priority', tab.priority);
            addRow('Last activity', tab.lastActivity);
        }
    }

    function positionHoverCard(card, anchorEl) {
        const rect = anchorEl.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const margin = 8;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let top, left;
        if (isVerticalBar()) {
            left = rect.right + margin;
            top = rect.top;
            if (left + cardRect.width + margin > vw) {
                left = rect.left - cardRect.width - margin;
            }
            if (top + cardRect.height + margin > vh) {
                top = vh - cardRect.height - margin;
            }
            if (top < margin) top = margin;
        } else {
            top = rect.bottom + margin;
            left = rect.left;
            if (top + cardRect.height + margin > vh) {
                top = rect.top - cardRect.height - margin;
            }
            if (left + cardRect.width + margin > vw) {
                left = vw - cardRect.width - margin;
            }
            if (left < margin) left = margin;
        }
        card.style.left = left + 'px';
        card.style.top = top + 'px';
    }

    function showHoverCardNow(tab, anchorEl) {
        if (hoverCardSuppressed()) return;
        if (!tab || !tab.url) return;
        state.hoverAnchorEl = anchorEl;
        const card = ensureHoverCard();
        fillHoverCard(card, tab);
        card.style.left = '-9999px';
        card.style.top = '0px';
        card.classList.add('visible');
        requestAnimationFrame(function () {
            if (!state.hoverCard || state.hoverTabId !== tab.id) return;
            positionHoverCard(card, anchorEl);
        });
        state.hoverTabId = tab.id;
    }

    function scheduleHoverCard(tab, anchorEl) {
        if (hoverCardSuppressed()) return;
        state.hoverAnchorEl = anchorEl;
        if (state.hoverHideTimer) {
            clearTimeout(state.hoverHideTimer);
            state.hoverHideTimer = 0;
        }
        if (state.hoverShowTimer) clearTimeout(state.hoverShowTimer);
        const delay = state.hoverCard && state.hoverCard.classList.contains('visible')
            ? 60
            : HOVER_SHOW_DELAY_MS;
        state.hoverShowTimer = setTimeout(function () {
            state.hoverShowTimer = 0;
            showHoverCardNow(tab, anchorEl);
        }, delay);
    }

    function hideHoverCard(immediate) {
        if (state.hoverShowTimer) {
            clearTimeout(state.hoverShowTimer);
            state.hoverShowTimer = 0;
        }
        function doHide() {
            const anchorHovered = !!(state.hoverAnchorEl &&
                state.hoverAnchorEl.isConnected &&
                state.hoverAnchorEl.matches(':hover'));
            const cardHovered = !!(state.hoverCard &&
                state.hoverCard.isConnected &&
                state.hoverCard.matches(':hover'));
            state.hoverAnchorHovered = anchorHovered;
            state.hoverCardHovered = cardHovered;
            if (!immediate && anchorHovered) {
                state.hoverHideTimer = setTimeout(doHide, HOVER_HIDE_DELAY_MS);
                return;
            }
            if (!immediate && cardHovered) {
                state.hoverHideTimer = setTimeout(doHide, HOVER_HIDE_DELAY_MS);
                return;
            }
            state.hoverHideTimer = 0;
            state.hoverCardHovered = false;
            state.hoverAnchorHovered = false;
            state.hoverAnchorEl = null;
            state.hoverTabId = null;
            if (state.hoverCard) state.hoverCard.classList.remove('visible');
        }
        if (immediate) {
            if (state.hoverHideTimer) {
                clearTimeout(state.hoverHideTimer);
                state.hoverHideTimer = 0;
            }
            doHide();
            return;
        }
        if (state.hoverHideTimer) clearTimeout(state.hoverHideTimer);
        state.hoverHideTimer = setTimeout(doHide, HOVER_HIDE_DELAY_MS);
    }

    function openTab(url) {
        if (!featuresEnabled()) return;
        if (shouldOpenUrlInPeek(url)) {
            openUrlInPeek(url);
            return;
        }
        const existing = state.tabs.find(t => t.url === url);
        if (existing) {
            activateTab(existing.id);
            return;
        }
        createAndAddTab(url);
    }

    function shouldOpenUrlInPeek(url) {
        const path = AES.normalizeHandledPath(AES.pathOf(url)).toLowerCase();
        return path === '/autotask/views/administration/companysetup/neweditallocationcode.aspx' ||
            path === '/mvc/administrationsetup/invoicetemplate.mvc/editproperties';
    }

    // Create a fresh tab for `url` and activate it. Bypasses the URL-dedup
    // check in `openTab` — used by `duplicateTab` so two tabs can legitimately
    // point at the same Autotask entity.
    function createAndAddTab(url, seedFromTab, options) {
        if (!featuresEnabled()) return null;
        if (!state.viewport) {
            return null;
        }
        const opts = options || {};
        const iframeEl = createTabIframe(url);
        const loaderEl = createTabPaneLoader();
        state.viewport.appendChild(iframeEl);
        state.viewport.appendChild(loaderEl);
        const fallback = fallbackTabMetadataForUrl(url);
        const type = tabTypeForUrl(url);

        const tab = {
            id: state.nextId++,
            url: url,
            title: (seedFromTab && seedFromTab.title) || fallback.title,
            number: (seedFromTab && seedFromTab.number) || fallback.number,
            contact: (seedFromTab && seedFromTab.contact) || fallback.contact,
            primaryResource: (seedFromTab && seedFromTab.primaryResource) || null,
            pinned: false,
            color: (seedFromTab && seedFromTab.color) || '',
            priority: (seedFromTab && seedFromTab.priority) || '',
            status: (seedFromTab && seedFromTab.status) || '',
            lastActivity: (seedFromTab && seedFromTab.lastActivity) || '',
            pageWarning: !!(seedFromTab && seedFromTab.pageWarning),
            hoverFields: normalizeHoverFields(seedFromTab && seedFromTab.hoverFields),
            metadataFields: normalizeMetadataFields((seedFromTab && seedFromTab.metadataFields) || fallbackMetadataFields(type, fallback)),
            iframeEl: iframeEl,
            loaderEl: loaderEl,
            tabEl: null,
            loading: true,
            loadStarted: true,
        };
        addTabToList(tab);
        renderTabs();
        if (opts.activate === false) {
            syncTabPaneState();
            updateHomeTabActive();
        } else {
            activateTab(tab.id);
        }
        requestSyncGeometry();
        saveTabs();
        return tab;
    }

    function duplicateTab(srcTab) {
        if (!srcTab || !srcTab.url) return;
        // Seed metadata from the source so the new tab shows the right title
        // immediately instead of falling back to "Loading..." until the iframe
        // re-extracts. The iframe will overwrite these once it loads.
        createAndAddTab(srcTab.url, srcTab);
    }

    // Best-effort clipboard write. Uses async Clipboard API when available;
    // falls back to a hidden textarea + execCommand for older contexts.
    function copyTextToClipboard(text) {
        if (!text) return Promise.resolve(false);
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                return navigator.clipboard.writeText(String(text)).then(
                    function () { return true; },
                    function () { return legacyCopy(text); }
                );
            }
        } catch (e) { /* fall through */ }
        return Promise.resolve(legacyCopy(text));
    }
    function legacyCopy(text) {
        try {
            const ta = document.createElement('textarea');
            ta.value = String(text);
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            ta.style.top = '0';
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand && document.execCommand('copy');
            ta.remove();
            return !!ok;
        } catch (e) {
            return false;
        }
    }

    function shouldPreserveSparseNavMetadata(url) {
        return tabTypeForUrl(url) === 'project';
    }

    function parsePurchaseOrderNumberFromTitle(rawTitle) {
        const match = String(rawTitle || '').match(/\(ID:\s*([^)]+)\)/i);
        if (!match || !match[1]) return '';
        return ('ID ' + match[1]).trim().slice(0, 40);
    }

    function normalizePurchaseOrderNavData(tab, data) {
        if (!tab) return null;
        if (tabTypeForUrl(tab.url || '') !== 'purchaseorder') return null;

        const incomingTitle = typeof data.title === 'string' ? data.title.trim() : '';
        const incomingNumber = typeof data.number === 'string' ? data.number.trim() : data.number;

        return {
            title: /purchase order/i.test(incomingTitle) ? 'Purchase Order' : (incomingTitle || null),
            number: incomingNumber || parsePurchaseOrderNumberFromTitle(incomingTitle) || null,
        };
    }

    function handleMessage(event) {
        const data = event.data;
        if (!data || data.__ns !== AES.MSG_NS) return;

        if (data.type === 'all-state-request') {
            broadcastAllFrameState();
            return;
        }

        if (data.type === 'improved-scrollbars-request') {
            const respond = function () {
                syncImprovedScrollbarsState();
            };
            if (!state.bar && AES.loadSettings) {
                void AES.loadSettings().then(respond).catch(respond);
            } else {
                respond();
            }
            return;
        }

        if (data.type === 'feature-enabled-request') {
            broadcastFeatureEnabledState();
            return;
        }

        if (!featuresEnabled()) return;

        if (data.type === 'close-frame' || data.type === 'close-peek') {
            if (windowBelongsToPeek(event.source)) {
                closePeekModal();
                return;
            }
            const tab = findTabFromWindow(event.source);
            if (tab) {
                closeTab(tab.id);
                return;
            }
            return;
        }

        if (data.type === 'open' && data.url) {
            openTab(data.url);
            return;
        }

        if (data.type === 'open-peek' && data.url) {
            openUrlInPeek(data.url, { openerWindow: event.source });
            return;
        }

        if (data.type === 'open-duplicate' && data.url) {
            createAndAddTab(data.url, null, { activate: false });
            return;
        }

        if (data.type === 'map' && data.url) {
            openMapModal(data.url);
            return;
        }

        if (data.type === 'frame-interaction') {
            const tab = findTabFromWindow(event.source);
            closeTabContextMenu();
            if (!tab || state.activeId === tab.id) return;
            activateTab(tab.id, { recordPrevious: false });
            return;
        }

        if (data.type === 'nav') {
            const tab = findTabFromWindow(event.source);
            if (!tab) return;
            const isDirectTabFrame = !!(tab.iframeEl && event.source === tab.iframeEl.contentWindow);
            if (data.url && isDirectTabFrame) tab.url = data.url;
            const preserveSparse = shouldPreserveSparseNavMetadata(tab.url);
            const normalizedPurchaseOrderNav = normalizePurchaseOrderNavData(tab, data);
            const navTitle = normalizedPurchaseOrderNav && normalizedPurchaseOrderNav.title !== null
                ? normalizedPurchaseOrderNav.title
                : data.title;
            const navNumber = normalizedPurchaseOrderNav && normalizedPurchaseOrderNav.number !== null
                ? normalizedPurchaseOrderNav.number
                : data.number;
            if (navTitle && (!preserveSparse || navTitle.trim())) tab.title = navTitle;
            if (navNumber !== undefined && navNumber !== null) {
                if (!preserveSparse || (typeof navNumber === 'string' ? navNumber.trim() : navNumber)) {
                    tab.number = navNumber;
                }
            }
            if (data.contact !== undefined) {
                if (!preserveSparse || (typeof data.contact === 'string' ? data.contact.trim() : data.contact)) {
                    tab.contact = data.contact;
                }
            }
            if (data.primaryResource !== undefined) tab.primaryResource = data.primaryResource || null;
            if (data.priority !== undefined) tab.priority = data.priority || '';
            if (data.status !== undefined) tab.status = data.status || '';
            if (data.lastActivity !== undefined) tab.lastActivity = data.lastActivity || '';
            if (data.pageWarning !== undefined) tab.pageWarning = !!data.pageWarning;
            if (data.hoverFields !== undefined) tab.hoverFields = normalizeHoverFields(data.hoverFields);
            if (data.metadataFields !== undefined) tab.metadataFields = normalizeMetadataFields(data.metadataFields);
            updateTabEl(tab);
            saveTabs();
            return;
        }

        if (data.type === 'nav-start') {
            // Ignore beforeunload fired from any iframe that belongs to one of
            // our tabs — those already have their own per-tab loader overlay.
            // What's left is native Autotask chrome navigating, which means the
            // Home view is about to refresh. Show the Home-tab spinner until
            // the native iframe fires `load`.
            if (findTabFromWindow(event.source)) return;
            startNativeHomeLoading();
            return;
        }

        if (data.type === 'native-title') {
            // Iframe bridge reports its <title>. Tab iframes get their label
            // from the existing 'nav' metadata path, so we ignore those here
            // and only honor titles coming from the native iframe (the page
            // backing the Home tab). During browser refresh a restored tab can
            // report before it is fully registered, so require a positive
            // native-frame source match instead of trusting "not a tab".
            if (findTabFromWindow(event.source)) return;
            if (!findNativeFrameFromWindow(event.source)) return;
            setHomeTitle(data.title);
            return;
        }
    }

    function installTopLevelNavigationInterception() {
        if (window.__AESNavInterceptInstalled) return;
        window.__AESNavInterceptInstalled = true;

        const originalPushState = history.pushState.bind(history);
        const originalReplaceState = history.replaceState.bind(history);

        function intercept(originalFn, stateArg, unusedTitle, urlArg) {
            if (!featuresEnabled()) return originalFn(stateArg, unusedTitle, urlArg);
            const handledUrl = urlArg ? AES.extractHandledUrlFromLandingPageUrl(urlArg) : null;
            if (handledUrl) {
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

    function injectTopLevelPageBridgeFromShell() {
        if (!AES.isTop) return;
        if (document.documentElement.dataset.aesPageBridgeInjected === 'true') {
            broadcastFeatureEnabledState();
            return;
        }
        const runtime = getRuntimeApi();
        try {
            if (!runtime || typeof runtime.getURL !== 'function') return;
        } catch (e) {
            return;
        }
        document.documentElement.dataset.aesPageBridgeInjected = 'true';
        const script = document.createElement('script');
        try {
            script.src = runtime.getURL('src/aes-page-bridge.js');
        } catch (e) {
            document.documentElement.dataset.aesPageBridgeInjected = 'false';
            return;
        }
        script.onload = function () {
            script.remove();
            broadcastFeatureEnabledState();
        };
        (document.documentElement || document.head).appendChild(script);
    }

    function installTopLevelRouteWatchers() {
        if (state.topLevelRouteWatchInstalled) return;
        state.topLevelRouteWatchInstalled = true;
        window.addEventListener('popstate', maybePromoteTopLevelLandingRoute);
        window.addEventListener('hashchange', maybePromoteTopLevelLandingRoute);
        window.setInterval(maybePromoteTopLevelLandingRoute, 750);
        maybePromoteTopLevelLandingRoute();
    }

    function maybePromoteTopLevelLandingRoute() {
        if (!featuresEnabled()) return;
        if (!state.viewport) return;
        const topHref = location.href;
        const firstObservation = !state.lastObservedTopHref;
        const hrefChanged = topHref !== state.lastObservedTopHref;
        state.lastObservedTopHref = topHref;

        const handledUrl = AES.extractHandledUrlFromLandingPageUrl(topHref);
        if (!handledUrl) {
            state.lastObservedTopHandledUrl = '';
            if (hrefChanged && !firstObservation && state.activeId !== null) {
                activateHome();
            }
            return;
        }
        if (handledUrl === state.lastObservedTopHandledUrl && !hrefChanged) return;
        state.lastObservedTopHandledUrl = handledUrl;
        openTab(handledUrl);
    }

    // Autotask exposes the active theme via inline CSS custom properties on
    // <body> (`--is-theme-dark: 0|1`, `color-scheme: light|dark`). Mirror that
    // onto <html> as `aes-dark` so the dark-mode rules above apply to all
    // shell-injected elements (bar, viewport, modals, context menu, etc.)
    // without each consumer needing to subscribe.
    function detectAutotaskDarkMode() {
        const body = document.body;
        if (!body) return false;
        const inline = (body.style.getPropertyValue('--is-theme-dark') || '').trim();
        if (inline === '1') return true;
        if (inline === '0') return false;
        try {
            const computed = getComputedStyle(body).getPropertyValue('--is-theme-dark').trim();
            if (computed === '1') return true;
            if (computed === '0') return false;
            const scheme = (getComputedStyle(body).colorScheme || '').toLowerCase();
            if (scheme.includes('dark') && !scheme.includes('light')) return true;
        } catch (e) {}
        return false;
    }

    function effectiveDarkMode() {
        return detectAutotaskDarkMode();
    }

    function applyAutotaskTheme(force) {
        const dark = effectiveDarkMode();
        if (!force && state.lastAppliedDarkMode === dark) return;
        state.lastAppliedDarkMode = dark;
        document.documentElement.classList.toggle('aes-dark', dark);
        for (const tab of state.tabs) applyTabColorStyle(tab);
    }

    function scheduleAutotaskThemeApply() {
        if (state.themeRaf) return;
        state.themeRaf = window.requestAnimationFrame(function () {
            state.themeRaf = 0;
            applyAutotaskTheme(false);
        });
    }

    function applyBarOrientationClass() {
        document.documentElement.classList.toggle('aes-bar-vertical', isVerticalBar());
        updateResizableBarClasses();
    }

    function applyBrowserCompatibilityClasses() {
        document.documentElement.classList.toggle('aes-safari-webkit', IS_SAFARI_WEBKIT);
    }

    function applyPageFrameClass() {
        const enabled = !!state.roundedPageFramesEnabled;
        document.documentElement.classList.toggle('aes-rounded-pages', enabled);
        if (state.viewport) state.viewport.classList.toggle('rounded-pages', enabled);
    }

    function improvedScrollbarsActive() {
        return featuresEnabled() && !!state.improvedScrollbarsEnabled;
    }

    function applyImprovedScrollbarsClass() {
        document.documentElement.classList.toggle('aes-improved-scrollbars', improvedScrollbarsActive());
    }

    function broadcastImprovedScrollbarsState() {
        const payload = { __ns: AES.MSG_NS, type: 'improved-scrollbars', enabled: improvedScrollbarsActive() };
        function postToFrames(win) {
            try {
                for (let i = 0; i < win.frames.length; i++) {
                    const child = win.frames[i];
                    try { child.postMessage(payload, '*'); } catch (e) {}
                    try { postToFrames(child); } catch (e) {}
                }
            } catch (e) {}
        }
        postToFrames(window);
    }

    function syncImprovedScrollbarsState() {
        applyImprovedScrollbarsClass();
        broadcastImprovedScrollbarsState();
    }

    function broadcastAllFrameState() {
        broadcastFeatureEnabledState();
        applyImprovedScrollbarsClass();
        broadcastImprovedScrollbarsState();
    }

    function setBarOrientation(value) {
        const next = value === 'vertical' ? 'vertical' : 'horizontal';
        if (state.barOrientation === next) return;
        state.barOrientation = next;
        AES.state.barOrientation = next;
        applyBarOrientationClass();
        // Tear down any reservation that was applied for the old axis so the
        // next syncGeometry rebuilds it on the right axis.
        if (state.nativeFrame) clearNativeChromeReservation(state.nativeFrame);
        // Drop inline width/height the bar carried from the previous axis so
        // the new orientation's CSS + syncGeometry can reset cleanly.
        if (state.bar) {
            state.bar.style.width = '';
            state.bar.style.height = '';
        }
        if (state.viewport) {
            state.viewport.style.width = '';
            state.viewport.style.height = '';
        }
        requestSyncGeometry();
    }

    function findEarlyAccessWrapper(pill) {
        let node = pill;
        for (let i = 0; node && i < 4; i++) {
            if (node.classList && node.classList.contains('flex-grow')) return node;
            node = node.parentElement;
        }
        return pill;
    }

    function cleanEarlyAccessText(value) {
        return (value || '').replace(/\s+/g, ' ').trim();
    }

    function applyEarlyAccessLabelVisibility(root) {
        const enabled = featuresEnabled() && !!state.hideEarlyAccessLabels;
        const scope = root && root.querySelectorAll ? root : document;

        if (!enabled) {
            document.querySelectorAll('[data-aes-early-access-hidden="true"]').forEach(function (el) {
                el.style.display = el.dataset.aesEarlyAccessDisplay || '';
                delete el.dataset.aesEarlyAccessDisplay;
                delete el.dataset.aesEarlyAccessHidden;
            });
            return;
        }

        scope.querySelectorAll('div').forEach(function (el) {
            if (cleanEarlyAccessText(el.textContent) !== 'Early Access') return;
            const wrapper = findEarlyAccessWrapper(el);
            if (!wrapper || wrapper.dataset.aesEarlyAccessHidden === 'true') return;
            wrapper.dataset.aesEarlyAccessDisplay = wrapper.style.display || '';
            wrapper.dataset.aesEarlyAccessHidden = 'true';
            wrapper.style.setProperty('display', 'none', 'important');
        });
    }

    function installEarlyAccessLabelWatcher() {
        applyEarlyAccessLabelVisibility(document);
        if (state.earlyAccessObserver || !document.body) return;
        state.earlyAccessObserver = new MutationObserver(function (mutations) {
            if (!(featuresEnabled() && state.hideEarlyAccessLabels)) return;
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node && node.nodeType === 1) applyEarlyAccessLabelVisibility(node);
                }
            }
        });
        state.earlyAccessObserver.observe(document.body, { childList: true, subtree: true });
    }

    function findResourcePlannerMenuItem() {
        const items = Array.from(document.querySelectorAll('li[role="menuitem"]'));
        return items.find(function (item) {
            return cleanEarlyAccessText(item.textContent) === 'Resource Planner'
                || !!Array.from(item.querySelectorAll('span')).find(function (span) {
                    return cleanEarlyAccessText(span.textContent) === 'Resource Planner';
                });
        }) || null;
    }

    function navigateToResourcePlanner() {
        const item = findResourcePlannerMenuItem();
        if (item) {
            item.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
            item.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
            item.click();
            return;
        }
        const url = new URL('/AutotaskOnyx/LandingPage?view=resource-planner&view-data=e30%3D', location.origin);
        location.assign(url.href);
    }

    function isResourcePlannerCalendarButton(button) {
        if (!button) return false;
        if (button.dataset && button.dataset.aesResourcePlannerShortcut === 'true') return true;
        if (button.getAttribute('data-onyx-external-id') === '0C07O8TE') return true;

        const text = cleanEarlyAccessText(button.textContent).toLowerCase();
        return text === 'calendar' || text === 'dispatch calendar' || text === 'resource planner';
    }

    function findResourcePlannerShortcutLabel(button) {
        if (!button) return null;
        const preferred = button.querySelector('.flex-grow');
        if (preferred) return preferred;

        const labels = Array.from(button.querySelectorAll('span, div'));
        return labels.find(function (el) {
            const text = cleanEarlyAccessText(el.textContent).toLowerCase();
            return text === 'more'
                || text === 'calendar'
                || text === 'dispatch calendar'
                || text === 'resource planner';
        }) || null;
    }

    function findResourcePlannerShortcutChevrons(button) {
        if (!button) return [];
        return Array.from(button.querySelectorAll('span, i, svg, use')).filter(function (el) {
            const className = String(el.getAttribute('class') || '').toLowerCase();
            const iconName = String(el.getAttribute('data-icon') || '').toLowerCase();
            const aria = String(el.getAttribute('aria-label') || '').toLowerCase();
            return (className.includes('chevron') && className.includes('down'))
                || iconName === 'chevron-down'
                || aria === 'chevron down';
        });
    }

    function restoreResourcePlannerShortcutButton(button, label, chevrons) {
        const originalLabel = button.dataset.aesOriginalCalendarLabel || 'Calendar';
        if (label && label.textContent !== originalLabel) label.textContent = originalLabel;
        chevrons.forEach(function (chevron) {
            chevron.style.display = chevron.dataset.aesOriginalDisplay || '';
            delete chevron.dataset.aesOriginalDisplay;
        });
        const originalTitle = button.dataset.aesOriginalCalendarTitle || '';
        if (button.title !== originalTitle) button.title = originalTitle;
        if (button.dataset.aesHadInvisibleClass === 'true') {
            button.classList.add('invisible');
            delete button.dataset.aesHadInvisibleClass;
        }
        if (button.dataset.aesOriginalVisibility !== undefined) {
            button.style.visibility = button.dataset.aesOriginalVisibility || '';
            delete button.dataset.aesOriginalVisibility;
        }
        if (button.dataset.aesOriginalDisplay !== undefined) {
            button.style.display = button.dataset.aesOriginalDisplay || '';
            delete button.dataset.aesOriginalDisplay;
        }
        button.removeAttribute('data-aes-resource-planner-shortcut');
    }

    function restoreResourcePlannerHiddenMoreButtons(root) {
        const scope = root && root.querySelectorAll ? root : document;
        scope.querySelectorAll('button[data-aes-resource-planner-hidden-more="true"]').forEach(function (button) {
            button.style.display = button.dataset.aesResourcePlannerMoreDisplay || '';
            delete button.dataset.aesResourcePlannerMoreDisplay;
            button.style.visibility = button.dataset.aesResourcePlannerMoreVisibility || '';
            delete button.dataset.aesResourcePlannerMoreVisibility;
            if (button.dataset.aesResourcePlannerMoreAriaHidden !== undefined) {
                const originalAriaHidden = button.dataset.aesResourcePlannerMoreAriaHidden;
                if (originalAriaHidden) button.setAttribute('aria-hidden', originalAriaHidden);
                else button.removeAttribute('aria-hidden');
                delete button.dataset.aesResourcePlannerMoreAriaHidden;
            }
            delete button.dataset.aesResourcePlannerHiddenMore;
        });
    }

    function findResourcePlannerAdjacentMoreButton(button) {
        if (!button || !button.parentElement) return null;
        const siblings = Array.from(button.parentElement.querySelectorAll('button'));
        const ownIndex = siblings.indexOf(button);
        if (ownIndex < 0) return null;
        return siblings.find(function (candidate, index) {
            if (candidate === button) return false;
            if (Math.abs(index - ownIndex) > 2) return false;
            if (candidate.getAttribute('data-onyx-external-id')) return false;
            return cleanEarlyAccessText(candidate.textContent).toLowerCase() === 'more';
        }) || null;
    }

    function hideResourcePlannerAdjacentMoreButton(button) {
        const moreButton = findResourcePlannerAdjacentMoreButton(button);
        if (!moreButton) return;
        if (moreButton.dataset.aesResourcePlannerHiddenMore !== 'true') {
            moreButton.dataset.aesResourcePlannerMoreDisplay = moreButton.style.display || '';
            moreButton.dataset.aesResourcePlannerMoreVisibility = moreButton.style.visibility || '';
            moreButton.dataset.aesResourcePlannerMoreAriaHidden = moreButton.getAttribute('aria-hidden') || '';
            moreButton.dataset.aesResourcePlannerHiddenMore = 'true';
        }
        moreButton.setAttribute('aria-hidden', 'true');
        moreButton.style.setProperty('display', 'none', 'important');
        moreButton.style.setProperty('visibility', 'hidden', 'important');
    }

    function forceResourcePlannerShortcutVisible(button) {
        if (!button || button.getAttribute('data-onyx-external-id') !== '0C07O8TE') return;
        let forcedVisible = button.dataset.aesHadInvisibleClass === 'true';
        if (button.classList && button.classList.contains('invisible')) {
            button.dataset.aesHadInvisibleClass = 'true';
            button.classList.remove('invisible');
            forcedVisible = true;
        }
        try {
            const style = getComputedStyle(button);
            if (style.display === 'none' || style.visibility === 'hidden') forcedVisible = true;
        } catch (e) {}
        if (!Object.prototype.hasOwnProperty.call(button.dataset, 'aesOriginalVisibility')) {
            button.dataset.aesOriginalVisibility = button.style.visibility || '';
        }
        if (!Object.prototype.hasOwnProperty.call(button.dataset, 'aesOriginalDisplay')) {
            button.dataset.aesOriginalDisplay = button.style.display || '';
        }
        button.style.setProperty('visibility', 'visible', 'important');
        button.style.setProperty('display', 'flex', 'important');
        if (forcedVisible) hideResourcePlannerAdjacentMoreButton(button);
        else restoreResourcePlannerHiddenMoreButtons(button.parentElement || document);
    }

    function collectResourcePlannerCalendarButtons(root) {
        const scope = root && root.querySelectorAll ? root : document;
        const buttons = [];
        function addButton(candidate) {
            const button = candidate && candidate.matches && candidate.matches('button')
                ? candidate
                : candidate && candidate.closest
                    ? candidate.closest('button')
                    : null;
            if (!button || buttons.includes(button)) return;
            if (isResourcePlannerCalendarButton(button)) buttons.push(button);
        }

        if (scope.matches) {
            if (scope.matches('button, [data-onyx-external-id="0C07O8TE"]')) addButton(scope);
            const ancestor = scope.closest && scope.closest('button[data-aes-resource-planner-shortcut="true"]');
            if (ancestor) addButton(ancestor);
        }

        scope.querySelectorAll('button[data-onyx-external-id="0C07O8TE"], button[data-aes-resource-planner-shortcut="true"], button').forEach(addButton);
        return buttons;
    }

    function applyResourcePlannerCalendarShortcut(root) {
        const scope = root && root.querySelectorAll ? root : document;
        const buttons = collectResourcePlannerCalendarButtons(scope);

        buttons.forEach(function (button) {
            const enabled = featuresEnabled() && !!state.replaceCalendarWithResourcePlanner;
            const label = findResourcePlannerShortcutLabel(button);
            const chevrons = findResourcePlannerShortcutChevrons(button);
            if (!button.dataset.aesOriginalCalendarLabel && label) {
                button.dataset.aesOriginalCalendarLabel = label.textContent || 'Calendar';
            }

            if (!enabled) {
                if (button.dataset.aesResourcePlannerShortcut === 'true') {
                    restoreResourcePlannerShortcutButton(button, label, chevrons);
                }
                restoreResourcePlannerHiddenMoreButtons(document);
                return;
            }

            if (label && label.textContent !== 'Resource Planner') label.textContent = 'Resource Planner';
            if (!button.dataset.aesOriginalCalendarTitle) {
                button.dataset.aesOriginalCalendarTitle = button.getAttribute('title') || '';
            }
            if (button.title !== 'Open Resource Planner') button.title = 'Open Resource Planner';
            button.dataset.aesResourcePlannerShortcut = 'true';
            forceResourcePlannerShortcutVisible(button);
            chevrons.forEach(function (chevron) {
                if (!chevron.dataset.aesOriginalDisplay) {
                    chevron.dataset.aesOriginalDisplay = chevron.style.display || '';
                }
                chevron.style.setProperty('display', 'none', 'important');
            });
        });
    }

    function scheduleResourcePlannerShortcutRefresh() {
        if (state.resourcePlannerShortcutRaf) return;
        const raf = window.requestAnimationFrame || function (callback) { return window.setTimeout(callback, 16); };
        state.resourcePlannerShortcutRaf = raf(function () {
            state.resourcePlannerShortcutRaf = 0;
            applyResourcePlannerCalendarShortcut(document);
        });
    }

    function installResourcePlannerShortcutWatcher() {
        applyResourcePlannerCalendarShortcut(document);
        if (state.resourcePlannerShortcutObserver || !document.body) return;
        state.resourcePlannerShortcutObserver = new MutationObserver(function (mutations) {
            let shouldRefreshAll = false;
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node && node.nodeType === 1) applyResourcePlannerCalendarShortcut(node);
                }
                if (mutation.type === 'attributes' || mutation.type === 'characterData') {
                    shouldRefreshAll = true;
                }
            }
            if (shouldRefreshAll) scheduleResourcePlannerShortcutRefresh();
        });
        state.resourcePlannerShortcutObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['class', 'data-onyx-external-id', 'title', 'aria-label'],
            characterData: true,
            childList: true,
            subtree: true,
        });

        document.addEventListener('click', function (event) {
            const button = event.target && event.target.closest
                ? event.target.closest('button[data-aes-resource-planner-shortcut="true"]')
                : null;
            if (!button || !(featuresEnabled() && state.replaceCalendarWithResourcePlanner)) return;
            event.preventDefault();
            event.stopPropagation();
            if (event.stopImmediatePropagation) event.stopImmediatePropagation();
            navigateToResourcePlanner();
        }, true);

        document.addEventListener('keydown', function (event) {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            const button = event.target && event.target.closest
                ? event.target.closest('button[data-aes-resource-planner-shortcut="true"]')
                : null;
            if (!button || !(featuresEnabled() && state.replaceCalendarWithResourcePlanner)) return;
            event.preventDefault();
            event.stopPropagation();
            if (event.stopImmediatePropagation) event.stopImmediatePropagation();
            navigateToResourcePlanner();
        }, true);
    }

    function updateSettingsEntryVisibility() {
        if (!state.settingsButton) return;
        state.settingsButton.style.display = state.nativeSettingsAvailable ? 'none' : '';
    }

    function getDirectMenuItemLabels(menu) {
        if (!menu) return [];
        return Array.from(menu.children)
            .filter(function (child) {
                return !!child && child.getAttribute('role') === 'menuitem';
            })
            .map(function (child) {
                return cleanEarlyAccessText(child.textContent).toLowerCase();
            })
            .filter(Boolean);
    }

    function findNativeAutotaskMenu() {
        const menus = Array.from(document.querySelectorAll('ul[role="menu"].list-none, ul[role="menu"]'));
        let best = null;
        let bestScore = 0;
        const expectedRootLabels = [
            'home',
            'crm',
            'contracts',
            'projects',
            'service desk',
            'timesheets',
            'inventory',
            'reports',
            'admin',
        ];

        for (const menu of menus) {
            if (state.bar && state.bar.contains(menu)) continue;
            const directLabels = getDirectMenuItemLabels(menu);
            if (!directLabels.includes('admin')) continue;
            const rootMatches = expectedRootLabels.filter(function (label) {
                return directLabels.includes(label);
            }).length;
            if (rootMatches < 5) continue;

            const itemCount = directLabels.length;
            let score = rootMatches * 10 + itemCount;
            if (directLabels.includes('home')) score += 4;
            if (directLabels.includes('service desk')) score += 4;
            if (directLabels.includes('contracts')) score += 2;
            if (score > bestScore) {
                bestScore = score;
                best = menu;
            }
        }

        return bestScore >= 50 ? best : null;
    }

    function removeStaleNativeSettingsItems(keepMenu) {
        // Sweep up any existing AES Settings items that ended up in a menu
        // other than the chosen top-level one (e.g. submenus rendered by
        // Autotask after the previous insert). Without this, opening a
        // submenu after the menu has been re-rendered leaves orphan items
        // behind in every layer.
        const stale = document.querySelectorAll('[data-aes-native-settings-item="true"]');
        for (const node of stale) {
            if (keepMenu && node.parentElement === keepMenu) continue;
            node.remove();
        }
    }

    function createNativeSettingsMenuItem(referenceItem) {
        const item = document.createElement('li');
        item.id = 'aes-native-settings-menu-item';
        item.setAttribute('role', 'menuitem');
        item.setAttribute('data-aes-native-settings-item', 'true');
        item.setAttribute('tabindex', '0');
        item.className = referenceItem && referenceItem.className
            ? sanitizeNativeSettingsMenuItemClass(referenceItem.className)
            : 'relative min-h-8 w-full grid items-center gap-col-2 px-2 py-1 select-none outline-none grid-cols-[auto_1fr] cursor-pointer color-text-primary bg-background-primary';
        item.style.cssText = referenceItem && referenceItem.getAttribute('style')
            ? referenceItem.getAttribute('style')
            : 'padding-inline: 1rem; padding-left: calc(1rem);';

        const icon = document.createElement('span');
        icon.className = 'fa-puzzle-piece fa-regular flex justify-center items-center flex-shrink-0 w-1rem h-1rem override-$icon-override-font-size:font-size-3 line-height-5 override-$icon-override-color:color-icon-primary';

        const outer = document.createElement('div');
        outer.className = 'min-w-0 flex items-center gap-1';

        const title = document.createElement('div');
        title.className = 'break-words text-menu-header fw-normal';

        const text = document.createElement('span');
        text.textContent = 'Autotask Enhancement Suite';

        const spacer = document.createElement('div');
        spacer.className = 'flex-grow flex items-center justify-end gap-2';

        title.appendChild(text);
        outer.appendChild(title);
        outer.appendChild(spacer);
        item.appendChild(icon);
        item.appendChild(outer);

        item.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            toggleSettingsModal();
        });
        item.addEventListener('keydown', function (event) {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            event.stopPropagation();
            toggleSettingsModal();
        });
        item.addEventListener('mouseenter', function () {
            item.dataset.aesNativeSettingsHoverBg = item.style.backgroundColor || '';
            // Match Autotask's native sidebar item hover. Autotask's own dark
            // theme uses #48505A; light theme uses #E5E5E5. The shell mirrors
            // Autotask's theme via `html.aes-dark` (set when body has the
            // `--is-theme-dark: 1` custom property), so use that as the gate.
            const dark = document.documentElement.classList.contains('aes-dark');
            item.style.setProperty('background-color', dark ? '#48505A' : '#E5E5E5', 'important');
        });
        item.addEventListener('mouseleave', function () {
            item.style.backgroundColor = item.dataset.aesNativeSettingsHoverBg || '';
            delete item.dataset.aesNativeSettingsHoverBg;
        });

        return item;
    }

    function sanitizeNativeSettingsMenuItemClass(className) {
        return String(className || '')
            .split(/\s+/)
            .filter(function (name) {
                return name &&
                    name !== 'bg-$brand-primary-color/15' &&
                    name !== 'before:content-empty' &&
                    name !== 'before:absolute' &&
                    name !== 'before:h-full' &&
                    name !== 'before:left-0' &&
                    name !== 'before:border-l-4' &&
                    name !== 'before:border-l-solid' &&
                    name !== 'before:border-$brand-primary-color';
            })
            .join(' ');
    }

    function ensureNativeSettingsMenuItem() {
        const menu = findNativeAutotaskMenu();
        if (!menu) {
            // No top-level menu currently in the DOM — clean up any orphan
            // items left in submenus / detached nodes so they don't linger.
            removeStaleNativeSettingsItems(null);
            state.nativeSettingsAvailable = false;
            state.nativeSettingsMenuItem = null;
            updateSettingsEntryVisibility();
            return;
        }

        // Strip any existing items that are NOT in the chosen menu, then
        // make sure exactly one item is the last child of the chosen menu.
        removeStaleNativeSettingsItems(menu);

        const existingInMenu = Array.from(
            menu.querySelectorAll('[data-aes-native-settings-item="true"]')
        );
        // If duplicates somehow ended up in the same menu, keep one and drop
        // the rest.
        for (let i = 1; i < existingInMenu.length; i++) existingInMenu[i].remove();
        let item = existingInMenu[0] || null;

        if (!item) {
            const referenceItem = Array.from(menu.querySelectorAll('li[role="menuitem"]'))
                .filter(li => li.id !== 'aes-native-settings-menu-item')
                .pop();
            item = createNativeSettingsMenuItem(referenceItem);
            menu.appendChild(item);
        } else if (item.parentElement !== menu) {
            menu.appendChild(item);
        } else if (item.nextElementSibling) {
            menu.appendChild(item);
        }

        item.className = sanitizeNativeSettingsMenuItemClass(item.className);
        state.nativeSettingsMenuItem = item;
        state.nativeSettingsAvailable = true;
        updateSettingsEntryVisibility();
    }

    function installNativeSettingsMenuItemWatcher() {
        ensureNativeSettingsMenuItem();
        if (state.nativeSettingsObserver || !document.body) return;
        state.nativeSettingsObserver = new MutationObserver(function () {
            if (state.nativeSettingsRaf) return;
            state.nativeSettingsRaf = window.requestAnimationFrame(function () {
                state.nativeSettingsRaf = 0;
                ensureNativeSettingsMenuItem();
            });
        });
        state.nativeSettingsObserver.observe(document.body, { childList: true, subtree: true });
    }

    function installThemeWatcher() {
        applyAutotaskTheme(true);
        if (state.themeObserver || !document.body) return;
        state.themeObserver = new MutationObserver(scheduleAutotaskThemeApply);
        state.themeObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['style', 'class'],
        });
    }

    // Toolbar action: clicking the extension icon in the browser toolbar sends
    // a message from `aes-background.js` to ask us to open the Settings modal.
    // Only installed at the top frame (this IIFE bails out otherwise).
    function installToolbarMessageListener() {
        const runtime = getRuntimeApi();
        try {
            if (!runtime || !runtime.onMessage) return;
        } catch (e) {
            return;
        }
        const listener = function (msg) {
            if (!msg) return;
            if (msg.__aesExternalOpen && msg.type === 'open-autotask-url' && msg.url && AES.isHandledUrl(msg.url)) {
                if (featuresEnabled()) openTab(msg.url);
                return;
            }
            if (msg.__aesToolbar && msg.type === 'open-settings') {
                try { toggleSettingsModal(); } catch (e) {}
            }
        };
        try {
            runtime.onMessage.addListener(listener);
        } catch (e) {}
    }
    installToolbarMessageListener();

    AES.mount = async function mount() {
        if (state.bar) return;
        state.mountTime = Date.now();
        applyBrowserCompatibilityClasses();
        applyPageFrameClass();
        applyImprovedScrollbarsClass();
        injectStyles();

        const bar = document.createElement('div');
        bar.className = 'at-tabs-bar';
        bar.addEventListener('mouseenter', function (event) {
            scheduleTabBarHoverExpand(event);
        });
        bar.addEventListener('mousemove', function (event) {
            scheduleTabBarHoverExpand(event);
        });
        bar.addEventListener('mouseleave', function () {
            collapseTabBarHoverExpand();
        });

        const viewport = document.createElement('div');
        viewport.className = 'at-tabs-viewport empty';

        const splitResizeHandles = [];
        for (let i = 0; i < 3; i++) {
            const splitResizeHandle = document.createElement('div');
            splitResizeHandle.className = 'at-tabs-split-resize-handle';
            splitResizeHandle.dataset.splitHandle = String(i);
            const splitResizeGrip = document.createElement('div');
            splitResizeGrip.className = 'at-tabs-split-resize-grip';
            splitResizeGrip.dataset.splitHandle = String(i);
            splitResizeGrip.title = 'Drag to resize split tabs';
            splitResizeGrip.addEventListener('pointerdown', startSplitResize);
            splitResizeGrip.addEventListener('contextmenu', function (event) {
                event.preventDefault();
                event.stopPropagation();
                openSplitHandleContextMenu(event.clientX, event.clientY);
            });
            splitResizeHandle.appendChild(splitResizeGrip);
            viewport.appendChild(splitResizeHandle);
            splitResizeHandles.push(splitResizeHandle);
        }

        const homeCover = document.createElement('div');
        homeCover.className = 'at-tabs-home-cover';

        const loader = document.createElement('div');
        loader.className = 'at-tabs-loader';
        viewport.appendChild(loader);

        const settingsButton = document.createElement('button');
        settingsButton.type = 'button';
        settingsButton.className = 'at-tabs-settings-button';
        settingsButton.title = 'Autotask Enhancement Suite';
        appendIconMarkup(settingsButton, ICONS.settings);
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
        state.splitResizeHandle = splitResizeHandles[0];
        state.splitResizeHandles = splitResizeHandles;
        state.settingsButton = settingsButton;
        applySplitRatio();

        renderHomeTab();
        // Show the spinner on the Home tab until the native iframe reports
        // its real <title>. Cleared in `setHomeTitle()` once the bridge posts
        // a `native-title` message; also cleared by `handleNativeFrameLoad`
        // as a safety net if the title never arrives.
        setHomeLoading(true);
        renderTabs();
        await AES.loadSettings();
        // Sync local state with values just loaded from storage.
        if (['horizontal', 'vertical'].includes(AES.state.barOrientation)) {
            state.barOrientation = AES.state.barOrientation;
        }
        state.themePreference = 'auto';
        AES.state.themePreference = 'auto';
        if (typeof AES.state.extensionEnabled === 'boolean') {
            state.extensionEnabled = AES.state.extensionEnabled;
        }
        if (typeof AES.state.openNewTabsAtStart === 'boolean') {
            state.openNewTabsAtStart = AES.state.openNewTabsAtStart;
        }
        if (typeof AES.state.hideEarlyAccessLabels === 'boolean') {
            state.hideEarlyAccessLabels = AES.state.hideEarlyAccessLabels;
        }
        if (typeof AES.state.replaceCalendarWithResourcePlanner === 'boolean') {
            state.replaceCalendarWithResourcePlanner = AES.state.replaceCalendarWithResourcePlanner;
        }
        if (typeof AES.state.showTabBarOnNonIframePages === 'boolean') {
            state.showTabBarOnNonIframePages = AES.state.showTabBarOnNonIframePages;
        }
        if (typeof AES.state.resizableTabBarEnabled === 'boolean') {
            state.resizableTabBarEnabled = AES.state.resizableTabBarEnabled;
        }
        if (typeof AES.state.horizontalCompactTabsEnabled === 'boolean') {
            state.horizontalCompactTabsEnabled = AES.state.horizontalCompactTabsEnabled;
        }
        if (typeof AES.state.roundedPageFramesEnabled === 'boolean') {
            state.roundedPageFramesEnabled = AES.state.roundedPageFramesEnabled;
        }
        if (typeof AES.state.improvedScrollbarsEnabled === 'boolean') {
            state.improvedScrollbarsEnabled = AES.state.improvedScrollbarsEnabled;
        }
        applyPageFrameClass();
        syncImprovedScrollbarsState();
        state.tabLine2Fields = normalizeTabLineSettings(AES.state.tabLine2Fields, 2);
        state.tabLine3Fields = normalizeTabLineSettings(AES.state.tabLine3Fields, 3);
        state.tabBarWidth = normalizedTabBarWidth(AES.state.tabBarWidth);
        AES.state.tabBarWidth = state.tabBarWidth;
        applyBarOrientationClass();
        applyExtensionEnabledState(false);
        maybeShowReleaseNotesModalOnUpdate();
        window.setTimeout(maybeCheckGithubReleaseUpdate, 3000);
        if (featuresEnabled()) {
            await restoreTabs();
            installTabsMetadataSyncWatcher();
            if (state.tabs.length) clearHomeLoading();
            if (!state.tabs.length) activateHome();
        }
        syncGeometry();
        installGeometrySync();
        installTabContextMenuDismissal();
        installThemeWatcher();
        installEarlyAccessLabelWatcher();
        installResourcePlannerShortcutWatcher();
        installNativeSettingsMenuItemWatcher();
        startMetadataRefreshTimer();
        if (state.showTabBarOnNonIframePages) ensureNonIframeTitleWatcher();
    };

    AES.installTopLevelNavigationInterception = installTopLevelNavigationInterception;
    AES.maybePromoteTopLevelLandingRoute = maybePromoteTopLevelLandingRoute;
    AES.handleShellMessage = handleMessage;
})();
