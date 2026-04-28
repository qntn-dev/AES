(function () {
    'use strict';

    const AES = window.__AES__;
    if (!AES || !AES.isTop || AES.shellInitialized) return;
    if (AES.isAllowedHost && !AES.isAllowedHost(location.href)) return;
    AES.shellInitialized = true;

    const state = AES.state = Object.assign(AES.state || {}, {
        tabs: [],
        activeId: null,
        splitId: null,
        nextId: 1,
        bar: null,
        viewport: null,
        loader: null,
        homeCover: null,
        settingsButton: null,
        nativeSettingsMenuItem: null,
        nativeSettingsObserver: null,
        nativeSettingsAvailable: false,
        resourcePlannerShortcutObserver: null,
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
        hoverShowTimer: 0,
        hoverHideTimer: 0,
        homeTabEl: null,
        nativeFrame: null,
        nativeLastUrl: '',
        lastObservedTopHref: '',
        lastObservedTopHandledUrl: '',
        homeLoadingAwaitingNativeLoad: false,
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
        rootMutationObserver: null,
        themeObserver: null,
        earlyAccessObserver: null,
        shellHidden: false,
        mountTime: 0,
        homeLoading: false,
        rememberTabsAfterClose: !!(AES.state && AES.state.rememberTabsAfterClose),
        phoneLinksEnabled: AES.state && typeof AES.state.phoneLinksEnabled === 'boolean'
            ? AES.state.phoneLinksEnabled
            : true,
        themePreference: AES.state && ['auto', 'light', 'dark'].includes(AES.state.themePreference)
            ? AES.state.themePreference
            : 'auto',
        extensionEnabled: !(AES.state && AES.state.extensionEnabled === false),
        barOrientation: AES.state && ['horizontal', 'vertical'].includes(AES.state.barOrientation)
            ? AES.state.barOrientation
            : 'horizontal',
        homeTitle: 'Home',
        darkModeEnhancerEnabled: !!(AES.state && AES.state.darkModeEnhancerEnabled),
        hideEarlyAccessLabels: !!(AES.state && AES.state.hideEarlyAccessLabels),
        replaceCalendarWithResourcePlanner: !!(AES.state && AES.state.replaceCalendarWithResourcePlanner),
        showTabBarOnNonIframePages: !!(AES.state && AES.state.showTabBarOnNonIframePages),
        resizableTabBarEnabled: !!(AES.state && AES.state.resizableTabBarEnabled),
        skipPeekBackdropCloseWarning: !!(AES.state && AES.state.skipPeekBackdropCloseWarning),
        tabBarWidth: AES.state && typeof AES.state.tabBarWidth === 'number' ? AES.state.tabBarWidth : AES.BAR_W,
        tabBarHoverExpanded: false,
        tabBarExpandTimer: 0,
        tabBarResizeHandleHovered: false,
        tabBarResizing: false,
    });

    const ICONS = {
        home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5L12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>',
        ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z"/><path d="M13 6v12" stroke-dasharray="2 2"/></svg>',
        contract: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/></svg>',
        account: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="1"/><path d="M9 6h1M14 6h1M9 10h1M14 10h1M9 14h1M14 14h1"/><path d="M10 22v-4h4v4"/></svg>',
        inventory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/></svg>',
        timesheet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>',
        livelink: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L10.59 5.3"/><path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l2.24-2.2"/></svg>',
        person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
        project: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h6l2 2h10v11a1 1 0 0 1-1 1H3z"/><path d="M6 13h4"/><path d="M6 16h7"/><path d="M14 13h4"/></svg>',
        pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 17v4"/><path d="M8 4h8l-1 4 3 3H6l3-3-1-4z"/></svg>',
        settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    };

    const TAB_COLOR_PRESETS = [
        '#EF4444', '#F97316', '#F59E0B', '#EAB308',
        '#84CC16', '#22C55E', '#10B981', '#14B8A6',
        '#06B6D4', '#6366F1', '#8B5CF6', '#A16207',
        '#A855F7', '#EC4899', '#F43F5E', '#64748B',
    ];

    function createTabIframe(url) {
        const iframeEl = document.createElement('iframe');
        iframeEl.src = url;
        iframeEl.addEventListener('load', function () {
            const tab = state.tabs.find(t => t.iframeEl === iframeEl);
            if (!tab) return;
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

    function updateLoaderVisibility() {
        if (!state.loader) return;
        const active = state.tabs.find(t => t.id === state.activeId);
        const split = state.tabs.find(t => t.id === state.splitId);
        state.loader.classList.toggle('show', !!(
            (active && active.loading) ||
            (split && split.id !== state.activeId && split.loading)
        ));
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
                padding: 0;
                background: #ffffff;
                border-bottom: 1px solid #e2e8f0;
                overflow: hidden;
                z-index: 220;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
                box-sizing: border-box;
            }
            .at-tabs-bar.compact.hover-expanded {
                width: var(--aes-expanded-bar-width, 240px) !important;
                box-shadow: 8px 0 24px rgba(15, 23, 42, 0.16);
            }
            html.aes-bar-vertical.aes-resizable-tabs .at-tabs-bar.compact {
                transition: width 180ms ease, box-shadow 180ms ease;
            }
            .at-tabs-resize-handle {
                position: absolute;
                top: 0;
                right: 0;
                bottom: 0;
                width: 18px;
                display: none;
                cursor: ew-resize;
                z-index: 8;
                background: transparent;
            }
            .at-tabs-resize-handle::after {
                content: "";
                position: absolute;
                top: 10px;
                right: 2px;
                bottom: 10px;
                width: 2px;
                border-radius: 999px;
                background: transparent;
            }
            .at-tabs-resize-handle:hover::after,
            .at-tabs-bar.resizing .at-tabs-resize-handle::after {
                background: rgba(55, 106, 148, 0.65);
            }
            html.aes-bar-vertical.aes-resizable-tabs .at-tabs-resize-handle {
                display: block;
            }
            html.aes-bar-vertical .at-tabs-bar.compact.hover-expanded .at-tabs-resize-handle,
            html.aes-bar-vertical .at-tabs-bar.compact.resizing .at-tabs-resize-handle {
                right: 0;
                width: 18px;
            }
            .at-tabs-scroll-wrap {
                position: relative;
                min-width: 0;
                flex: 1 1 auto;
                height: 100%;
            }
            .at-tabs-scroll {
                height: 100%;
                width: 100%;
                overflow-x: auto;
                overflow-y: hidden;
                -ms-overflow-style: none;
                scrollbar-color: transparent transparent;
                scrollbar-width: none;
                scroll-behavior: smooth;
            }
            .at-tabs-scroll::-webkit-scrollbar {
                width: 0;
                height: 0;
                display: none;
            }
            .at-tabs-scroll::-webkit-scrollbar-track {
                background: transparent;
            }
            .at-tabs-scroll::-webkit-scrollbar-thumb {
                background: rgba(71, 85, 105, 0.34);
                border-radius: 999px;
            }
            .at-tabs-scroll::-webkit-scrollbar-thumb:hover {
                background: rgba(55, 106, 148, 0.58);
            }
            .at-tabs-bar-inner {
                display: flex;
                align-items: stretch;
                min-width: max-content;
                height: 100%;
                padding-right: 34px;
            }
            .at-tabs-scroll-button {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                width: 28px;
                height: 32px;
                border: 1px solid #dbe3ec;
                border-radius: 16px;
                background: rgba(255, 255, 255, 0.94);
                color: #475569;
                display: none;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 2;
                box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
            }
            .at-tabs-scroll-button.visible {
                display: inline-flex;
            }
            .at-tabs-scroll-button:hover {
                background: #f8fafc;
                color: #0f172a;
            }
            .at-tabs-scroll-button.left {
                left: 6px;
            }
            .at-tabs-scroll-button.right {
                right: 6px;
            }
            .at-tabs-scroll-button svg {
                width: 15px;
                height: 15px;
                display: block;
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
            .at-tabs-viewport.split {
                --at-tabs-split-gap: 10px;
                background: #dbe3ec;
            }
            .at-tabs-viewport.split > iframe {
                inset: auto;
                top: 0;
                bottom: 0;
                width: calc((100% - var(--at-tabs-split-gap)) / 2);
                height: 100%;
            }
            .at-tabs-viewport.split > iframe.left-pane {
                left: 0;
                right: auto;
            }
            .at-tabs-viewport.split > iframe.right-pane {
                left: auto;
                right: 0;
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
            @keyframes aes-backdrop-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes aes-backdrop-out {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            @keyframes aes-settings-in {
                from {
                    opacity: 0;
                    transform: translate(-50%, calc(-50% + 14px)) scale(0.975);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
            @keyframes aes-settings-out {
                from {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translate(-50%, calc(-50% + 12px)) scale(0.982);
                }
            }
            @keyframes aes-peek-wrapper-in {
                from {
                    opacity: 0;
                    transform: translate(-50%, calc(-50% + 18px)) scale(0.976);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
            @keyframes aes-peek-wrapper-out {
                from {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translate(-50%, calc(-50% + 14px)) scale(0.982);
                }
            }
            @keyframes aes-peek-live-in {
                from {
                    opacity: 0;
                    transform: translateY(18px) scale(0.976);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            @keyframes aes-peek-live-out {
                from {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translateY(14px) scale(0.982);
                }
            }
            @media (prefers-reduced-motion: reduce) {
                .at-tabs-settings-backdrop,
                .at-tabs-settings-modal,
                .at-tabs-peek-backdrop,
                .at-tabs-peek-wrapper,
                .at-tabs-viewport.peek-active {
                    animation: none !important;
                }
            }

            /* ============================================================
               Custom scrollbars for the top document. Uses :where() so the
               selectors carry zero specificity — anything Autotask styles
               with a regular selector (.SomeGrid::-webkit-scrollbar { ... },
               etc.) automatically wins and keeps its custom scrollbar. The
               translucent neutral thumb works on both light and dark
               surfaces without a theme switch. ============================
            */
            :where(html) {
                scrollbar-color: rgba(125, 167, 201, 0.5) transparent;
                scrollbar-width: thin;
            }
            :where(*)::-webkit-scrollbar {
                width: 10px;
                height: 10px;
            }
            :where(*)::-webkit-scrollbar-track {
                background: transparent;
            }
            :where(*)::-webkit-scrollbar-thumb {
                background-color: rgba(125, 167, 201, 0.5);
                border-radius: 999px;
                border: 2px solid transparent;
                background-clip: content-box;
            }
            :where(*)::-webkit-scrollbar-thumb:hover {
                background-color: rgba(125, 167, 201, 0.75);
                background-clip: content-box;
            }
            :where(*)::-webkit-scrollbar-corner {
                background: transparent;
            }
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
                --aes-tab-border: transparent;
                --aes-tab-bg-idle: transparent;
                --aes-tab-bg-hover: #f1f5f9;
                --aes-tab-bg-active: #E1E9EF;
            }
            .at-tab:hover { background: var(--aes-tab-bg-hover); }
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
                background: var(--aes-tab-bg-active);
                border-bottom-color: #376A94;
                color: #0f172a;
            }
            .at-tab.active:not([data-aes-colored="true"]),
            .at-tab[data-aes-colored="false"].active {
                color: #0f172a;
            }
            .at-tab[data-aes-colored="true"] {
                background: var(--aes-tab-bg-idle);
                border-bottom-color: transparent;
            }
            .at-tab[data-aes-colored="true"]:hover {
                background: var(--aes-tab-bg-hover);
            }
            .at-tab[data-aes-colored="true"].active {
                background: var(--aes-tab-bg-active);
                border-bottom-color: var(--aes-tab-border);
            }
            .at-tab.split-target {
                box-shadow: inset 0 -3px 0 #7da7c9;
            }
            .at-tab.dragging {
                opacity: 0.46;
            }
            .at-tab.drop-before::after,
            .at-tab.drop-after::after {
                content: "";
                position: absolute;
                top: 8px;
                bottom: 8px;
                width: 3px;
                border-radius: 999px;
                background: #376A94;
                z-index: 2;
            }
            .at-tab.drop-before::after {
                left: -1px;
            }
            .at-tab.drop-after::after {
                right: -1px;
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
            .at-tab.active:not([data-aes-colored="true"]) .icon,
            .at-tab[data-aes-colored="false"].active .icon {
                color: #0f172a;
            }
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
            .at-tab .line.title.loading {
                display: inline-flex;
                align-items: center;
                min-height: 16px;
            }
            .at-tab-title-spinner {
                width: 14px;
                height: 14px;
                border: 2px solid #cbd5e1;
                border-top-color: #376A94;
                border-radius: 50%;
                animation: at-tabs-spin 0.8s linear infinite;
                flex: 0 0 auto;
            }
            .at-tab .line.number,
            .at-tab .line.contact {
                color: #64748b;
                font-size: 10.5px;
            }
            .at-tab .line.number {
                font-variant-numeric: tabular-nums;
            }
            .at-tab.active .line.title { color: #0f172a; }
            .at-tab.active:not([data-aes-colored="true"]) .line.title,
            .at-tab[data-aes-colored="false"].active .line.title,
            .at-tab.active:not([data-aes-colored="true"]) .line.number,
            .at-tab[data-aes-colored="false"].active .line.number,
            .at-tab.active:not([data-aes-colored="true"]) .line.contact,
            .at-tab[data-aes-colored="false"].active .line.contact {
                color: #0f172a;
            }
            .at-tab .pin-badge {
                position: absolute;
                top: 5px;
                left: 6px;
                width: 11px;
                height: 11px;
                color: #64748b;
                display: none;
                pointer-events: none;
                z-index: 1;
            }
            .at-tab .pin-badge svg {
                width: 11px;
                height: 11px;
                display: block;
            }
            .at-tab.pinned .pin-badge {
                display: block;
            }
            .at-tab.active .pin-badge {
                color: #64748b;
            }
            .at-tab[data-aes-colored="true"].active,
            .at-tab[data-aes-colored="true"].active .icon,
            .at-tab[data-aes-colored="true"].active .line.title,
            .at-tab[data-aes-colored="true"].active .line.number,
            .at-tab[data-aes-colored="true"].active .line.contact,
            .at-tab[data-aes-colored="true"].active .pin-badge {
                color: #0f172a;
            }
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
            }
            .at-tab .close:hover { background: #e2e8f0; color: #0f172a; }
            .at-tab .tab-actions {
                display: flex;
                flex: 0 0 auto;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                gap: 5px;
                align-self: stretch;
                padding-top: 2px;
                box-sizing: border-box;
            }
            .at-tab .resource-badge {
                display: none;
                align-items: center;
                justify-content: center;
                width: 22px;
                height: 22px;
                border-radius: 50%;
                border: 1px solid rgba(15, 23, 42, 0.16);
                background: #64748b;
                color: #ffffff;
                box-sizing: border-box;
                font-size: 9px;
                font-weight: 700;
                letter-spacing: 0.01em;
                line-height: 1;
                overflow: hidden;
                text-transform: uppercase;
                white-space: nowrap;
            }
            .at-tab .resource-badge.visible {
                display: inline-flex;
            }
            .at-tab .resource-badge.has-photo {
                background-position: center;
                background-size: cover;
                color: transparent;
                text-shadow: none;
            }
            .at-tab.home {
                width: auto;
                padding: 0 14px;
                gap: 8px;
                align-items: center;
                font-size: 12px;
                font-weight: 500;
            }
            .at-tab.home .close { display: none; }
            .at-tab.home .home-spinner {
                display: none;
                width: 14px;
                height: 14px;
                border: 2px solid #cbd5e1;
                border-top-color: #376A94;
                border-radius: 50%;
                animation: at-tabs-spin 0.8s linear infinite;
                flex: 0 0 auto;
                align-self: center;
            }
            .at-tab.home.loading .icon { display: none; }
            .at-tab.home.loading .home-spinner { display: inline-block; }
            .at-tab.home.loading .home-label { display: none; }
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
            .at-tabs-context-menu {
                position: fixed;
                min-width: 232px;
                padding: 6px;
                border: 1px solid #dbe3ec;
                border-radius: 12px;
                background: #ffffff;
                box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
                color: #0f172a;
                z-index: 1500;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
                box-sizing: border-box;
            }
            .at-tabs-context-divider {
                height: 1px;
                margin: 6px 4px;
                background: #e2e8f0;
            }
            .at-tabs-context-section-title {
                padding: 6px 10px 2px;
                color: #64748b;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.04em;
                text-transform: uppercase;
            }
            .at-tabs-context-item {
                width: 100%;
                display: flex;
                align-items: center;
                gap: 9px;
                padding: 9px 10px;
                border: 0;
                border-radius: 9px;
                background: transparent;
                color: inherit;
                cursor: pointer;
                text-align: left;
                font: inherit;
                font-size: 12px;
                font-weight: 600;
                line-height: 1.25;
            }
            .at-tabs-context-item:hover {
                background: #edf4fb;
                color: #12344f;
            }
            .at-tabs-context-item:disabled {
                cursor: not-allowed;
                color: #94a3b8;
                background: transparent;
            }
            .at-tabs-context-icon {
                width: 16px;
                height: 16px;
                flex: 0 0 auto;
                color: #376A94;
            }
            .at-tabs-context-item:disabled .at-tabs-context-icon {
                color: #94a3b8;
            }
            .at-tabs-context-icon svg {
                width: 16px;
                height: 16px;
                display: block;
            }
            .at-tabs-context-colors {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 8px;
                padding: 8px 8px 10px;
            }
            .at-tabs-color-swatch {
                width: 100%;
                aspect-ratio: 1;
                border-radius: 10px;
                border: 2px solid rgba(15, 23, 42, 0.08);
                background: var(--aes-swatch);
                cursor: pointer;
                box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28);
            }
            .at-tabs-color-swatch:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18), inset 0 0 0 1px rgba(255, 255, 255, 0.34);
            }
            .at-tabs-color-swatch.selected {
                border-color: #0f172a;
                box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.45);
            }
            .at-tabs-settings-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, 0.16);
                z-index: 1300;
                animation: aes-backdrop-in 260ms ease-out both;
            }
            .at-tabs-settings-backdrop.closing {
                animation: aes-backdrop-out 220ms ease-in both;
            }
            .at-tabs-map-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, 0.28);
                z-index: 1400;
            }
            .at-tabs-map-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: min(980px, calc(100vw - 48px));
                height: min(680px, calc(100vh - 48px));
                background: #ffffff;
                border: 1px solid #dbe2ea;
                border-radius: 14px;
                box-shadow: 0 22px 60px rgba(15, 23, 42, 0.28);
                z-index: 1401;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
            }
            .at-tabs-map-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 12px 14px;
                border-bottom: 1px solid #e2e8f0;
                color: #0f172a;
                font-size: 14px;
                font-weight: 650;
            }
            .at-tabs-map-actions {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                flex: 0 0 auto;
            }
            .at-tabs-map-open {
                border: 1px solid #dbe3ec;
                border-radius: 8px;
                padding: 6px 10px;
                color: #25577d;
                background: #f8fafc;
                text-decoration: none;
                font-size: 12px;
                font-weight: 600;
            }
            .at-tabs-map-open:hover {
                background: #edf4fb;
                color: #12344f;
            }
            .at-tabs-map-close {
                width: 30px;
                height: 30px;
                border: 0;
                border-radius: 8px;
                background: transparent;
                color: #64748b;
                cursor: pointer;
                font-size: 22px;
                line-height: 1;
            }
            .at-tabs-map-close:hover {
                background: #f1f5f9;
                color: #0f172a;
            }
            .at-tabs-map-frame {
                width: 100%;
                height: 100%;
                border: 0;
                flex: 1 1 auto;
            }
            /* --- Peek modal: a tab's iframe shown in a centered overlay
               with a vertical button column floating to the right. --- */
            .at-tabs-peek-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, 0.42);
                z-index: 1500;
                animation: aes-backdrop-in 280ms ease-out both;
            }
            .at-tabs-peek-backdrop.closing {
                animation: aes-backdrop-out 240ms ease-in both;
            }
            .at-tabs-peek-wrapper {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 1501;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
                animation: aes-peek-wrapper-in 340ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }
            .at-tabs-peek-wrapper.closing {
                animation: aes-peek-wrapper-out 240ms cubic-bezier(0.4, 0, 1, 1) both;
            }
            .at-tabs-peek-modal {
                width: min(1430px, calc(100vw - 96px));
                height: min(1014px, calc(100vh - 48px));
                background: #ffffff;
                border: 1px solid #dbe2ea;
                border-radius: 14px;
                box-shadow: 0 30px 80px rgba(15, 23, 42, 0.42);
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            .at-tabs-peek-modal.live-reuse {
                background: transparent;
                border-color: transparent;
            }
            .at-tabs-peek-frame {
                width: 100%;
                height: 100%;
                border: 0;
                flex: 1 1 auto;
                background: #ffffff;
            }
            .at-tabs-viewport.peek-active {
                position: fixed !important;
                display: block !important;
                overflow: hidden !important;
                background: transparent !important;
                border: 0 !important;
                border-radius: 14px !important;
                box-shadow: none !important;
                z-index: 1502 !important;
                scrollbar-gutter: auto !important;
                transform-origin: center center !important;
                animation: aes-peek-live-in 340ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }
            .at-tabs-viewport.peek-closing {
                animation: aes-peek-live-out 240ms cubic-bezier(0.4, 0, 1, 1) both !important;
            }
            .at-tabs-viewport.peek-active > iframe {
                position: absolute !important;
                inset: 0 !important;
                width: 100% !important;
                height: 100% !important;
                margin: 0 !important;
                border: 0 !important;
                background: transparent !important;
                scrollbar-gutter: auto !important;
            }
            .at-tabs-viewport.peek-active > iframe.at-tab-peeking {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                pointer-events: auto !important;
                z-index: 1 !important;
            }
            .at-tabs-peek-loader {
                position: absolute;
                inset: 0;
                z-index: 2;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.85);
                pointer-events: none;
            }
            .at-tabs-peek-loader.hidden {
                display: none;
            }
            .at-tabs-peek-loader::before {
                content: "";
                width: 36px;
                height: 36px;
                border: 3px solid #cbd5e1;
                border-top-color: #376A94;
                border-radius: 50%;
                animation: at-tabs-spin 0.8s linear infinite;
            }
            .at-tabs-peek-actions {
                display: flex;
                flex-direction: column;
                gap: 10px;
                flex: 0 0 auto;
            }
            .at-tabs-peek-action {
                width: 44px;
                height: 44px;
                border-radius: 10px;
                border: 0;
                background: rgba(255, 255, 255, 0.92);
                color: #0f172a;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 14px rgba(15, 23, 42, 0.22);
                transition: background 120ms ease, color 120ms ease, transform 80ms ease;
            }
            .at-tabs-peek-action:hover {
                background: #ffffff;
                transform: translateY(-1px);
            }
            .at-tabs-peek-action:active {
                transform: translateY(0);
            }
            .at-tabs-peek-action[disabled] {
                opacity: 0.45;
                cursor: not-allowed;
                box-shadow: 0 2px 6px rgba(15, 23, 42, 0.18);
            }
            .at-tabs-peek-action svg {
                width: 20px;
                height: 20px;
                display: block;
            }
            .at-tabs-peek-action.close-action {
                font-size: 24px;
                line-height: 1;
                color: #475569;
            }
            .at-tabs-peek-action.close-action:hover {
                color: #0f172a;
            }
            .at-tabs-peek-confirm-shade {
                position: fixed;
                inset: 0;
                z-index: 1509;
                background: rgba(2, 6, 23, 0.36);
            }
            .at-tabs-peek-confirm {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 1510;
                width: 360px;
                max-width: calc(100vw - 32px);
                padding: 18px;
                border: 1px solid #dbe2ea;
                border-radius: 14px;
                background: #ffffff;
                color: #0f172a;
                box-shadow: 0 24px 70px rgba(15, 23, 42, 0.35);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
            }
            .at-tabs-peek-confirm-title {
                margin: 0 0 14px;
                font-size: 15px;
                line-height: 1.4;
                font-weight: 700;
            }
            .at-tabs-peek-confirm-check {
                display: flex;
                align-items: center;
                gap: 9px;
                margin-bottom: 16px;
                color: #475569;
                font-size: 13px;
                user-select: none;
            }
            .at-tabs-peek-confirm-check input {
                appearance: none;
                -webkit-appearance: none;
                width: 16px;
                height: 16px;
                flex: 0 0 16px;
                margin: 0;
                border: 1.5px solid #94a3b8;
                border-radius: 4px;
                background: #ffffff;
                display: inline-grid;
                place-content: center;
                cursor: pointer;
            }
            .at-tabs-peek-confirm-check input::after {
                content: "";
                width: 8px;
                height: 5px;
                border-left: 2px solid #ffffff;
                border-bottom: 2px solid #ffffff;
                transform: rotate(-45deg) translateY(-1px);
                opacity: 0;
            }
            .at-tabs-peek-confirm-check input:checked {
                border-color: #376A94;
                background: #376A94;
            }
            .at-tabs-peek-confirm-check input:checked::after {
                opacity: 1;
            }
            .at-tabs-peek-confirm-check input:focus-visible {
                outline: 2px solid rgba(55, 106, 148, 0.35);
                outline-offset: 2px;
            }
            .at-tabs-peek-confirm-actions {
                display: flex;
                justify-content: flex-end;
                gap: 8px;
            }
            .at-tabs-peek-confirm-button {
                min-height: 34px;
                padding: 7px 12px;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                background: #ffffff;
                color: #334155;
                cursor: pointer;
                font: inherit;
                font-size: 13px;
                font-weight: 650;
            }
            .at-tabs-peek-confirm-button:hover {
                background: #f8fafc;
                color: #0f172a;
            }
            .at-tabs-peek-confirm-button.primary {
                border-color: #376A94;
                background: #376A94;
                color: #ffffff;
            }
            .at-tabs-peek-confirm-button.primary:hover {
                background: #2f5f85;
            }
            /* --- Tab hover preview card: shows tab metadata on hover-intent. --- */
            .at-tabs-hover-card {
                position: fixed;
                z-index: 1450;
                min-width: 240px;
                max-width: 360px;
                padding: 10px 12px;
                background: #ffffff;
                color: #0f172a;
                border: 1px solid #dbe2ea;
                border-radius: 10px;
                box-shadow: 0 12px 32px rgba(15, 23, 42, 0.22);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
                font-size: 12px;
                line-height: 1.45;
                pointer-events: none;
                opacity: 0;
                transform: translateY(-2px);
                transition: opacity 90ms ease, transform 90ms ease;
            }
            .at-tabs-hover-card.visible {
                opacity: 1;
                transform: translateY(0);
            }
            .at-tabs-hover-card .hc-title {
                font-size: 13px;
                font-weight: 650;
                color: #0f172a;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .at-tabs-hover-card .hc-number {
                margin-top: 2px;
                font-size: 11px;
                color: #475569;
                font-variant-numeric: tabular-nums;
            }
            .at-tabs-hover-card .hc-row {
                margin-top: 6px;
                display: flex;
                gap: 6px;
                color: #334155;
            }
            .at-tabs-hover-card .hc-row .hc-label {
                color: #64748b;
                flex: 0 0 auto;
                min-width: 92px;
            }
            .at-tabs-hover-card .hc-row .hc-value {
                color: #0f172a;
                flex: 1 1 auto;
                overflow-wrap: anywhere;
            }
            .at-tabs-settings-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 760px;
                max-width: calc(100vw - 32px);
                background: #ffffff;
                border: 1px solid #dbe2ea;
                border-radius: 14px;
                box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
                z-index: 1301;
                overflow: hidden;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
                animation: aes-settings-in 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }
            .at-tabs-settings-modal.closing {
                animation: aes-settings-out 220ms cubic-bezier(0.4, 0, 1, 1) both;
            }
            @media (prefers-reduced-motion: reduce) {
                .at-tabs-settings-backdrop,
                .at-tabs-settings-modal,
                .at-tabs-peek-backdrop,
                .at-tabs-peek-wrapper,
                .at-tabs-viewport.peek-active,
                .at-tabs-viewport.peek-closing {
                    animation: none !important;
                }
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
                padding: 0;
                display: grid;
                grid-template-columns: 220px minmax(0, 1fr);
                min-height: 420px;
            }
            .at-tabs-settings-nav {
                padding: 14px;
                border-right: 1px solid #e2e8f0;
                background: #f8fafc;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .at-tabs-settings-nav-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                width: 100%;
                min-height: 42px;
                padding: 10px 12px;
                border: 1px solid transparent;
                border-radius: 12px;
                background: transparent;
                color: #334155;
                cursor: pointer;
                font: inherit;
                text-align: left;
            }
            .at-tabs-settings-nav-item:hover {
                background: #ffffff;
                border-color: #e2e8f0;
                color: #0f172a;
            }
            .at-tabs-settings-nav-item.active {
                background: #E1E9EF;
                border-color: #c7d8e6;
                color: #0f172a;
                box-shadow: inset 3px 0 0 #376A94;
            }
            .at-tabs-settings-nav-name {
                font-size: 13px;
                font-weight: 650;
            }
            .at-tabs-settings-nav-arrow {
                color: #94a3b8;
                font-size: 16px;
                line-height: 1;
            }
            .at-tabs-settings-pages {
                padding: 16px 18px 20px;
                min-width: 0;
                overflow: auto;
            }
            .at-tabs-settings-page {
                display: none;
                flex-direction: column;
                gap: 10px;
            }
            .at-tabs-settings-page.active {
                display: flex;
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
            .at-tabs-settings-page-title {
                display: flex;
                flex-direction: column;
                gap: 3px;
                margin-bottom: 4px;
            }
            .at-tabs-settings-page-title strong {
                font-size: 16px;
                color: #0f172a;
            }
            .at-tabs-settings-page-title span {
                font-size: 12px;
                line-height: 1.4;
                color: #64748b;
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
            .at-tabs-setting-note {
                margin: -4px 4px 0;
                font-size: 11px;
                line-height: 1.4;
                color: #64748b;
            }
            html.aes-dark .at-tabs-setting-note {
                color: #94a3b8;
            }
            .at-tabs-setting-label {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 6px;
                min-width: 0;
            }
            .at-tabs-setting-info {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 16px;
                height: 16px;
                color: #94a3b8;
                cursor: help;
                flex: 0 0 auto;
            }
            .at-tabs-setting-info:hover {
                color: #475569;
            }
            .at-tabs-setting-info svg {
                width: 14px;
                height: 14px;
                display: block;
            }
            html.aes-dark .at-tabs-setting-info {
                color: #94a3b8;
            }
            html.aes-dark .at-tabs-setting-info:hover {
                color: #f1f5f9;
            }
            .at-tabs-setting-name {
                font-size: 13px;
                font-weight: 600;
                color: #0f172a;
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
            .at-tabs-setting-select {
                appearance: none;
                -webkit-appearance: none;
                background: #ffffff;
                color: #0f172a;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                padding: 6px 30px 6px 10px;
                font: 600 12px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
                cursor: pointer;
                min-width: 140px;
                background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
                background-repeat: no-repeat;
                background-position: right 8px center;
            }
            .at-tabs-setting-select:focus-visible {
                outline: 2px solid #93c5fd;
                outline-offset: 2px;
            }
            button.absolute.border-border-primary:has(> span.fa-chevron-left) {
                display: none !important;
            }
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

            /* ============================================================
               Dark mode — toggled via html.aes-dark when Autotask sets
               --is-theme-dark: 1 on body. User-specified palette:
                 - Tab bar background:        #1F2227
                 - Active tab background:     #232D37
                 - Active tab bottom border:  #376A94
               Other shades are derived to match. ===========================
            */
            html.aes-dark .at-tabs-bar {
                background: #1F2227;
                border-bottom-color: #2a2e34;
            }
            html.aes-dark .at-tabs-home-cover {
                background: #1F2227;
                border-bottom-color: #2a2e34;
            }
            html.aes-dark.aes-bar-vertical .at-tabs-bar {
                border-right-color: #2a2e34;
                border-bottom-color: transparent;
            }
            html.aes-dark.aes-bar-vertical .at-tabs-home-cover {
                border-right-color: #2a2e34;
                border-bottom-color: transparent;
            }
            html.aes-dark .at-tabs-viewport {
                background: #1F2227;
            }
            html.aes-dark .at-tabs-viewport.peek-active > iframe {
                color-scheme: dark !important;
            }
            html.aes-dark .at-tabs-viewport.split {
                background: #11161c;
            }
            html.aes-dark .at-tabs-loader {
                background: rgba(31, 34, 39, 0.85);
            }
            html.aes-dark .at-tabs-loader::before {
                border-color: #475569;
                border-top-color: #376A94;
            }

            html.aes-dark .at-tab {
                color: #cbd5e1;
                --aes-tab-bg-idle: transparent;
                --aes-tab-bg-hover: #262A30;
                --aes-tab-bg-active: #232D37;
            }
            html.aes-dark .at-tab:hover {
                background: var(--aes-tab-bg-hover, #262A30);
            }
            html.aes-dark .at-tab.active {
                background: var(--aes-tab-bg-active, #232D37);
                border-bottom-color: #376A94;
                color: #f8fafc;
            }
            html.aes-dark .at-tab[data-aes-colored="true"] {
                background: var(--aes-tab-bg-idle);
                border-bottom-color: transparent;
            }
            html.aes-dark .at-tab[data-aes-colored="true"]:hover {
                background: var(--aes-tab-bg-hover);
            }
            html.aes-dark .at-tab[data-aes-colored="true"].active {
                background: var(--aes-tab-bg-active);
                border-bottom-color: var(--aes-tab-border);
            }
            html.aes-dark .at-tab .icon {
                color: #cbd5e1;
            }
            html.aes-dark .at-tab.active .icon,
            html.aes-dark .at-tab.active .line.title {
                color: #f8fafc;
            }
            html.aes-dark .at-tab.active .line.number,
            html.aes-dark .at-tab.active .line.contact {
                color: rgba(248, 250, 252, 0.82);
            }
            html.aes-dark .at-tab .line.number,
            html.aes-dark .at-tab .line.contact {
                color: #94a3b8;
            }
            html.aes-dark .at-tab .close {
                color: #94a3b8;
            }
            html.aes-dark .at-tab .close:hover {
                background: #2a2e34;
                color: #f1f5f9;
            }
            html.aes-dark .at-tab:not(.active) + .at-tab:not(.active)::before {
                background: #2a2e34;
            }
            html.aes-dark .at-tab .resource-badge {
                border-color: rgba(241, 245, 249, 0.18);
            }
            html.aes-dark .at-tab-title-spinner,
            html.aes-dark .at-tab.home .home-spinner {
                border-color: #475569;
                border-top-color: #376A94;
            }

            html.aes-dark .at-tabs-settings-button {
                background: #1F2227;
                color: #cbd5e1;
                border-left-color: #2a2e34;
                border-right-color: #2a2e34;
            }
            html.aes-dark.aes-bar-vertical .at-tabs-settings-button {
                border-top-color: #2a2e34;
                border-left-color: transparent;
                border-right-color: transparent;
            }
            html.aes-dark .at-tabs-settings-button:hover {
                background: #262A30;
                color: #f1f5f9;
            }
            html.aes-dark .at-tabs-scroll-button {
                background: rgba(31, 34, 39, 0.94);
                border-color: #2a2e34;
                color: #cbd5e1;
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
            }
            html.aes-dark .at-tabs-scroll-button:hover {
                background: #262A30;
                color: #f1f5f9;
            }
            html.aes-dark .at-tabs-scroll {
                scrollbar-color: transparent transparent;
            }
            html.aes-dark .at-tabs-scroll::-webkit-scrollbar-thumb {
                background: rgba(203, 213, 225, 0.34);
            }
            html.aes-dark .at-tabs-scroll::-webkit-scrollbar-thumb:hover {
                background: rgba(125, 167, 201, 0.6);
            }

            html.aes-dark .at-tabs-context-menu {
                background: #1F2227;
                border-color: #2a2e34;
                color: #f1f5f9;
                box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
            }
            html.aes-dark .at-tabs-context-divider {
                background: #2a2e34;
            }
            html.aes-dark .at-tabs-context-section-title {
                color: #94a3b8;
            }
            html.aes-dark .at-tabs-context-item:hover {
                background: #262A30;
                color: #ffffff;
            }
            html.aes-dark .at-tabs-context-item:disabled {
                color: #64748b;
            }
            html.aes-dark .at-tabs-context-item:disabled .at-tabs-context-icon {
                color: #64748b;
            }
            html.aes-dark .at-tabs-color-swatch {
                border-color: rgba(241, 245, 249, 0.12);
                box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
            }
            html.aes-dark .at-tabs-color-swatch.selected {
                border-color: #f8fafc;
                box-shadow: 0 0 0 2px rgba(241, 245, 249, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.22);
            }

            html.aes-dark .at-tabs-settings-backdrop,
            html.aes-dark .at-tabs-map-backdrop {
                background: rgba(0, 0, 0, 0.55);
            }
            html.aes-dark .at-tabs-settings-modal,
            html.aes-dark .at-tabs-map-modal {
                background: #1F2227;
                border-color: #2a2e34;
                color: #f1f5f9;
                box-shadow: 0 22px 60px rgba(0, 0, 0, 0.6);
            }
            html.aes-dark .at-tabs-settings-header,
            html.aes-dark .at-tabs-map-header {
                border-bottom-color: #2a2e34;
            }
            html.aes-dark .at-tabs-settings-nav {
                background: #1A1D22;
                border-right-color: #2a2e34;
            }
            html.aes-dark .at-tabs-settings-nav-item {
                color: #cbd5e1;
            }
            html.aes-dark .at-tabs-settings-nav-item:hover {
                background: #232D37;
                border-color: #2a2e34;
                color: #f1f5f9;
            }
            html.aes-dark .at-tabs-settings-nav-item.active {
                background: #24384A;
                border-color: #31506A;
                color: #f1f5f9;
            }
            html.aes-dark .at-tabs-settings-nav-arrow {
                color: #64748b;
            }
            html.aes-dark .at-tabs-settings-footer {
                border-top-color: #2a2e34;
            }
            html.aes-dark .at-tabs-settings-title,
            html.aes-dark .at-tabs-settings-section-title,
            html.aes-dark .at-tabs-settings-page-title strong {
                color: #f1f5f9;
            }
            html.aes-dark .at-tabs-settings-page-title span {
                color: #94a3b8;
            }
            html.aes-dark .at-tabs-settings-close:hover {
                background: #262A30;
                color: #f1f5f9;
            }
            html.aes-dark .at-tabs-settings-note {
                color: #94a3b8;
            }

            /* Settings modal interior in dark mode */
            html.aes-dark .at-tabs-settings-close {
                color: #94a3b8;
            }
            html.aes-dark .at-tabs-setting-row {
                background: #232D37;
                border-color: #2a2e34;
            }
            html.aes-dark .at-tabs-setting-row:hover {
                background: #262A30;
            }
            html.aes-dark .at-tabs-setting-name {
                color: #f1f5f9;
            }
            html.aes-dark .at-tabs-setting-toggle-ui {
                background: #475569;
                box-shadow: inset 0 0 0 1px rgba(241, 245, 249, 0.06);
            }
            html.aes-dark .at-tabs-setting-toggle-ui::after {
                background: #e2e8f0;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
            }
            html.aes-dark .at-tabs-setting-toggle input:checked + .at-tabs-setting-toggle-ui {
                background: #376A94;
            }

            /* Map modal interior in dark mode */
            html.aes-dark .at-tabs-map-header {
                color: #f1f5f9;
            }
            html.aes-dark .at-tabs-map-open {
                background: #232D37;
                border-color: #2a2e34;
                color: #cbd5e1;
            }
            html.aes-dark .at-tabs-map-open:hover {
                background: #262A30;
                color: #f1f5f9;
            }
            html.aes-dark .at-tabs-map-close {
                color: #94a3b8;
            }
            html.aes-dark .at-tabs-map-close:hover {
                background: #262A30;
                color: #f1f5f9;
            }
            /* Peek modal + hover card in dark mode */
            html.aes-dark .at-tabs-peek-backdrop {
                background: rgba(0, 0, 0, 0.6);
            }
            html.aes-dark .at-tabs-peek-modal {
                background: #1F2227;
                border-color: #2a2e34;
                box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7);
            }
            html.aes-dark .at-tabs-peek-frame {
                background: #1F2227;
            }
            html.aes-dark .at-tabs-peek-loader {
                background: rgba(31, 34, 39, 0.85);
            }
            html.aes-dark .at-tabs-peek-loader::before {
                border-color: #475569;
                border-top-color: #376A94;
            }
            html.aes-dark .at-tabs-peek-action {
                background: #232D37;
                color: #f1f5f9;
                box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
            }
            html.aes-dark .at-tabs-peek-action:hover {
                background: #2a3641;
            }
            html.aes-dark .at-tabs-peek-action.close-action {
                color: #cbd5e1;
            }
            html.aes-dark .at-tabs-peek-action.close-action:hover {
                color: #f1f5f9;
            }
            html.aes-dark .at-tabs-peek-confirm {
                background: #1F2227;
                color: #f1f5f9;
                border-color: #2a2e34;
                box-shadow: 0 24px 70px rgba(0, 0, 0, 0.65);
            }
            html.aes-dark .at-tabs-peek-confirm-check {
                color: #cbd5e1;
            }
            html.aes-dark .at-tabs-peek-confirm-check input {
                background: #111827;
                border-color: #64748b;
            }
            html.aes-dark .at-tabs-peek-confirm-check input:checked {
                background: #376A94;
                border-color: #376A94;
            }
            html.aes-dark .at-tabs-peek-confirm-button {
                background: #232D37;
                border-color: #334155;
                color: #e2e8f0;
            }
            html.aes-dark .at-tabs-peek-confirm-button:hover {
                background: #2a3641;
                color: #ffffff;
            }
            html.aes-dark .at-tabs-peek-confirm-button.primary {
                background: #376A94;
                border-color: #376A94;
                color: #ffffff;
            }
            html.aes-dark .at-tabs-hover-card {
                background: #1F2227;
                border-color: #2a2e34;
                color: #f1f5f9;
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
            }
            html.aes-dark .at-tabs-hover-card .hc-title {
                color: #f1f5f9;
            }
            html.aes-dark .at-tabs-hover-card .hc-number {
                color: #94a3b8;
            }
            html.aes-dark .at-tabs-hover-card .hc-row {
                color: #cbd5e1;
            }
            html.aes-dark .at-tabs-hover-card .hc-row .hc-label {
                color: #94a3b8;
            }
            html.aes-dark .at-tabs-hover-card .hc-row .hc-value {
                color: #f1f5f9;
            }
            html.aes-dark .at-tabs-setting-select {
                background-color: #1F2227;
                border-color: #2a2e34;
                color: #f1f5f9;
                background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
            }
            html.aes-dark .at-tabs-setting-select option {
                background: #1F2227;
                color: #f1f5f9;
            }

            /* Home tab label ellipsis (was static "Home", now mirrors document.title). */
            .at-tab.home .home-label {
                display: inline-block;
                max-width: 240px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                vertical-align: middle;
            }

            /* ============================================================
               Vertical tab bar mode — toggled via html.aes-bar-vertical when
               settings → Appearance → Tab bar position = Vertical. The bar
               sits to the LEFT of the native iframe instead of above it; the
               iframe's parent container reserves padding-left instead of
               padding-top. ===============================================
            */
            html.aes-bar-vertical .at-tabs-bar {
                flex-direction: column;
                border-bottom: none;
                border-right: 1px solid #e2e8f0;
            }
            html.aes-bar-vertical .at-tabs-home-cover {
                border-bottom: none;
                border-right: 1px solid #e2e8f0;
            }
            html.aes-bar-vertical .at-tabs-bar-inner {
                flex-direction: column;
                min-width: 0;
                min-height: max-content;
                padding-right: 0;
                padding-bottom: 12px;
            }
            html.aes-bar-vertical .at-tabs-scroll {
                overflow-y: auto;
                overflow-x: hidden;
            }
            html.aes-bar-vertical .at-tab {
                width: auto;
                align-self: stretch;
                min-height: calc(32px * var(--aes-tab-rows, 1));
                padding: 4px 16px;
                border-bottom: none;
                border-left: 3px solid transparent;
            }
            html.aes-bar-vertical .at-tabs-bar.compact:not(.hover-expanded) .at-tabs-bar-inner {
                align-items: stretch;
            }
            html.aes-bar-vertical .at-tabs-bar.compact:not(.hover-expanded) .at-tab {
                justify-content: center;
                gap: 0;
                padding-left: 0;
                padding-right: 0;
                min-height: 44px;
            }
            html.aes-bar-vertical .at-tabs-bar.compact:not(.hover-expanded) .at-tab .meta,
            html.aes-bar-vertical .at-tabs-bar.compact:not(.hover-expanded) .at-tab .tab-actions,
            html.aes-bar-vertical .at-tabs-bar.compact:not(.hover-expanded) .at-tab.home .home-label {
                display: none;
            }
            html.aes-bar-vertical .at-tabs-bar.compact:not(.hover-expanded) .at-tab .icon {
                width: 20px;
                height: 20px;
            }
            html.aes-bar-vertical .at-tabs-bar.compact:not(.hover-expanded) .at-tab .icon svg {
                width: 20px;
                height: 20px;
            }
            html.aes-bar-vertical .at-tabs-bar.compact:not(.hover-expanded) .at-tab.pinned .pin-badge {
                left: 8px;
            }
            html.aes-bar-vertical .at-tabs-bar.compact:not(.hover-expanded) .at-tabs-settings-button {
                width: 100%;
            }
            html.aes-bar-vertical .at-tabs-bar.compact.hover-expanded .at-tab {
                padding-left: 16px;
                padding-right: 16px;
            }
            html.aes-bar-vertical .at-tab.home {
                padding: 4px 16px;
            }
            html.aes-bar-vertical .at-tab.active {
                border-bottom-color: transparent;
                border-left-color: #376A94;
            }
            html.aes-bar-vertical .at-tab[data-aes-colored="true"] {
                border-left-color: transparent;
                border-bottom-color: transparent;
            }
            html.aes-bar-vertical .at-tab[data-aes-colored="true"].active {
                border-left-color: var(--aes-tab-border);
            }
            html.aes-bar-vertical .at-tab.split-target {
                box-shadow: inset 3px 0 0 #7da7c9;
            }
            html.aes-bar-vertical .at-tab.drop-before::after,
            html.aes-bar-vertical .at-tab.drop-after::after {
                left: 10px;
                right: 10px;
                top: auto;
                bottom: auto;
                width: auto;
                height: 3px;
            }
            html.aes-bar-vertical .at-tab.drop-before::after {
                top: -1px;
            }
            html.aes-bar-vertical .at-tab.drop-after::after {
                bottom: -1px;
            }
            html.aes-bar-vertical .at-tab:not(.active) + .at-tab:not(.active)::before {
                left: 14px;
                right: 14px;
                top: 0;
                bottom: auto;
                width: auto;
                height: 1px;
            }
            html.aes-bar-vertical .at-tabs-settings-button {
                width: 100%;
                height: 52px;
                border: none;
                border-top: 1px solid #e2e8f0;
            }
            html.aes-bar-vertical .at-tabs-scroll-button {
                width: 32px;
                height: 28px;
            }
            html.aes-bar-vertical .at-tabs-scroll-button.left {
                left: 50%;
                right: auto;
                top: 6px;
                transform: translate(-50%, 0);
            }
            html.aes-bar-vertical .at-tabs-scroll-button.right {
                left: 50%;
                right: auto;
                top: auto;
                bottom: 6px;
                transform: translate(-50%, 0);
            }
            html.aes-bar-vertical .at-tabs-scroll-button svg {
                transform: rotate(90deg);
            }
            body.EntityPage>.MessageBarContainer {
                padding: 25px 8px 0 8px;
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    function findContentIframe() {
        let best = null;
        let bestArea = 0;
        for (const f of document.querySelectorAll('iframe')) {
            if (state.viewport && state.viewport.contains(f)) continue;
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
        tab.pinned = !!tab.pinned;
        tab.color = TAB_COLOR_PRESETS.includes(tab.color) ? tab.color : '';
        return tab;
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
        return {
            tabs: state.tabs.map(t => ({
                url: t.url,
                title: t.title,
                number: t.number,
                contact: t.contact,
                primaryResource: t.primaryResource || null,
                pinned: !!t.pinned,
                color: t.color || '',
                priority: t.priority || '',
                status: t.status || '',
                lastActivity: t.lastActivity || '',
            })),
            activeIndex: state.activeId === null
                ? null
                : state.tabs.findIndex(t => t.id === state.activeId),
            splitIndex: state.splitId === null
                ? null
                : state.tabs.findIndex(t => t.id === state.splitId),
        };
    }

    function handleNativeFrameLoad(event) {
        const frame = event.currentTarget;
        // New native page finished loading — clear the Home-tab spinner.
        state.homeLoadingAwaitingNativeLoad = false;
        setHomeLoading(false);
        // The iframe may have lost our dark-enhancer style on navigation.
        broadcastDarkModeEnhancerState();
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

    function startNativeHomeLoading() {
        state.homeLoadingAwaitingNativeLoad = true;
        setHomeLoading(true);
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
        const payload = buildTabsPayload();
        void AES.writeTabsPayload(payload);
    }

    async function restoreTabs() {
        let payload;
        try {
            payload = await AES.readTabsPayload();
        } catch (e) { return; }
        if (!payload || !Array.isArray(payload.tabs) || payload.tabs.length === 0) return;

        for (const saved of payload.tabs) {
            if (!saved.url) continue;
            const iframeEl = createTabIframe(saved.url);
            state.viewport.appendChild(iframeEl);
            state.tabs.push(normalizeTabState({
                id: state.nextId++,
                url: saved.url,
                title: saved.title || '',
                number: saved.number || '',
                contact: saved.contact || '',
                primaryResource: saved.primaryResource || null,
                pinned: !!saved.pinned,
                color: saved.color || '',
                priority: saved.priority || '',
                status: saved.status || '',
                lastActivity: saved.lastActivity || '',
                iframeEl,
                tabEl: null,
                loading: true,
            }));
        }
        renderTabs();
        const idx = payload.activeIndex;
        const splitIdx = payload.splitIndex;
        if (typeof splitIdx === 'number' && splitIdx >= 0 && state.tabs[splitIdx]) {
            state.splitId = state.tabs[splitIdx].id;
        } else {
            state.splitId = null;
        }
        if (typeof idx === 'number' && idx >= 0 && state.tabs[idx]) {
            activateTab(state.tabs[idx].id);
        } else {
            activateHome();
        }
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
        if (Math.abs(marginTop - AES.BAR_H) < 0.5) frame.style.removeProperty('margin-top');
        if (frame.style.getPropertyValue('translate')) frame.style.removeProperty('translate');
    }

    function isVerticalBar() {
        return state.barOrientation === 'vertical';
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

    function barAxisAmount() {
        return isVerticalBar() ? currentVerticalBarWidth() : AES.BAR_H;
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
        if (axis === 'vertical') return { top: 0, left: currentVerticalBarWidth() };
        return { top: AES.BAR_H, left: 0 };
    }

    function nonIframeReservationAxis(el) {
        if (!el || !el.dataset) return null;
        if (el.dataset.aesNonIframeReservedAxis === 'vertical') return 'vertical';
        if (el.dataset.aesNonIframeReservedAxis === 'horizontal') return 'horizontal';
        if (el.dataset.aesNonIframeReserved === 'true') return 'horizontal';
        return null;
    }

    function nonIframeReservationAmount(el) {
        const axis = nonIframeReservationAxis(el);
        if (!axis) return { top: 0, left: 0 };
        if (axis === 'vertical') return { top: 0, left: currentVerticalBarWidth() };
        return { top: AES.BAR_H, left: 0 };
    }

    function findNonIframeContentContainer() {
        return document.querySelector('main') ||
            document.querySelector('[role="main"]') ||
            document.querySelector('.min-w-0.flex-1') ||
            null;
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
            width: rect.width + off.left,
            height: rect.height + off.top,
        };
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
            delete container.dataset.aesNativeChromeReserved;
            delete container.dataset.aesNativeChromeReservedAxis;
        }
        state.nativeReservedContainer = null;

        if (!frame) return;
        restoreInlineStyle(frame, 'height', 'aesPrevHeight');
        restoreInlineStyle(frame, 'width', 'aesPrevWidth');
        restoreInlineStyle(frame, 'display', 'aesPrevDisplay');
        delete frame.dataset.aesNativeChromeReserved;
        delete frame.dataset.aesNativeChromeReservedAxis;
        clearLegacyNativeFrameOffset(frame);
    }

    function clearNonIframeReservation() {
        const container = state.nonIframeReservedContainer ||
            (findNonIframeContentContainer() && nonIframeReservationAxis(findNonIframeContentContainer())
                ? findNonIframeContentContainer()
                : null);
        if (!container) return;
        restoreInlineStyle(container, 'padding-top', 'aesPrevNonIframePaddingTop');
        restoreInlineStyle(container, 'padding-left', 'aesPrevNonIframePaddingLeft');
        restoreInlineStyle(container, 'box-sizing', 'aesPrevNonIframeBoxSizing');
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

        rememberInlineStyle(container, 'padding-top', 'aesPrevNonIframePaddingTop');
        rememberInlineStyle(container, 'padding-left', 'aesPrevNonIframePaddingLeft');
        rememberInlineStyle(container, 'box-sizing', 'aesPrevNonIframeBoxSizing');
        container.style.setProperty('box-sizing', 'border-box', 'important');

        if (targetAxis === 'vertical') {
            container.style.removeProperty('padding-top');
            container.style.setProperty('padding-left', currentVerticalBarWidth() + 'px', 'important');
        } else {
            container.style.removeProperty('padding-left');
            container.style.setProperty('padding-top', AES.BAR_H + 'px', 'important');
        }

        container.dataset.aesNonIframeReserved = 'true';
        container.dataset.aesNonIframeReservedAxis = targetAxis;
        state.nonIframeReservedContainer = container;
    }

    function applyNativeChromeReservation(frame) {
        if (!frame) return;
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

        clearLegacyNativeFrameOffset(frame);

        rememberInlineStyle(container, 'padding-top', 'aesPrevPaddingTop');
        rememberInlineStyle(container, 'padding-left', 'aesPrevPaddingLeft');
        rememberInlineStyle(container, 'box-sizing', 'aesPrevBoxSizing');
        rememberInlineStyle(container, 'overflow', 'aesPrevOverflow');
        rememberInlineStyle(frame, 'height', 'aesPrevHeight');
        rememberInlineStyle(frame, 'width', 'aesPrevWidth');
        rememberInlineStyle(frame, 'display', 'aesPrevDisplay');

        container.style.setProperty('box-sizing', 'border-box', 'important');
        container.style.setProperty('overflow', 'hidden', 'important');
        frame.style.removeProperty('translate');
        frame.style.removeProperty('margin-top');
        frame.style.setProperty('display', 'block', 'important');

        if (targetAxis === 'vertical') {
            container.style.removeProperty('padding-top');
            container.style.setProperty('padding-left', currentVerticalBarWidth() + 'px', 'important');
            // Container is border-box with padding-left, so its content area
            // is already shrunk. Iframe just fills it (100%/100%).
            frame.style.setProperty('width', '100%', 'important');
            frame.style.setProperty('height', '100%', 'important');
        } else {
            container.style.removeProperty('padding-left');
            container.style.setProperty('padding-top', AES.BAR_H + 'px', 'important');
            // Same idea — content area is already height - BAR_H.
            frame.style.removeProperty('width');
            frame.style.setProperty('height', '100%', 'important');
        }

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
                state.bar.style.left = base.left + 'px';
                state.bar.style.top = base.top + 'px';
                state.bar.style.width = barWidth + 'px';
                state.bar.style.height = base.height + 'px';
                state.viewport.style.left = (base.left + barWidth) + 'px';
                state.viewport.style.top = base.top + 'px';
                state.viewport.style.width = Math.max(0, base.width - barWidth) + 'px';
                state.viewport.style.height = base.height + 'px';
                state.viewport.style.bottom = 'auto';
            } else {
                state.bar.style.left = base.left + 'px';
                state.bar.style.top = base.top + 'px';
                state.bar.style.width = base.width + 'px';
                state.bar.style.height = AES.BAR_H + 'px';
                state.viewport.style.left = base.left + 'px';
                state.viewport.style.top = (base.top + AES.BAR_H) + 'px';
                state.viewport.style.width = base.width + 'px';
                state.viewport.style.height = Math.max(0, base.height - AES.BAR_H) + 'px';
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
        if (isVerticalBar()) {
            const barWidth = currentVerticalBarWidth();
            if (state.homeCover) {
                state.homeCover.style.display = state.activeId === null ? '' : 'none';
                state.homeCover.style.left = base.left + 'px';
                state.homeCover.style.top = base.top + 'px';
                state.homeCover.style.width = barWidth + 'px';
                state.homeCover.style.height = base.height + 'px';
            }
            state.bar.style.left = base.left + 'px';
            state.bar.style.top = base.top + 'px';
            state.bar.style.width = barWidth + 'px';
            state.bar.style.height = base.height + 'px';
            state.viewport.style.left = (base.left + barWidth) + 'px';
            state.viewport.style.top = base.top + 'px';
            state.viewport.style.width = Math.max(0, base.width - barWidth) + 'px';
            state.viewport.style.height = base.height + 'px';
            state.viewport.style.bottom = 'auto';
        } else {
            if (state.homeCover) {
                state.homeCover.style.display = state.activeId === null ? '' : 'none';
                state.homeCover.style.left = base.left + 'px';
                state.homeCover.style.top = base.top + 'px';
                state.homeCover.style.width = base.width + 'px';
                state.homeCover.style.height = AES.BAR_H + 'px';
            }
            state.bar.style.left = base.left + 'px';
            state.bar.style.top = base.top + 'px';
            state.bar.style.width = base.width + 'px';
            state.bar.style.height = AES.BAR_H + 'px';
            state.viewport.style.left = base.left + 'px';
            state.viewport.style.top = (base.top + AES.BAR_H) + 'px';
            state.viewport.style.width = base.width + 'px';
            state.viewport.style.height = Math.max(0, base.height - AES.BAR_H) + 'px';
            state.viewport.style.bottom = 'auto';
        }
        updateTabScrollButtons();
    }

    function requestSyncGeometry() {
        if (state.geometryRaf) return;
        state.geometryRaf = window.requestAnimationFrame(syncGeometry);
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
                const noIframeTestMode = state.showTabBarOnNonIframePages && !state.lastGeometryHadNativeFrame;
                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        if (isShellOwnedMutationTarget(mutation.target)) continue;
                        const nodes = [...mutation.addedNodes, ...mutation.removedNodes];
                        if (nodes.some(node => node && (
                            node.nodeName === 'IFRAME' ||
                            (node.querySelector && node.querySelector('iframe'))
                        ))) {
                            if (state.activeId === null) startNativeHomeLoading();
                            startGeometryBurst(300);
                            return;
                        }
                    }
                    if (mutation.type === 'attributes') {
                        if (noIframeTestMode) continue;
                        if (state.nonIframeReservedContainer && mutation.target === state.nonIframeReservedContainer) continue;
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
            state.geometryPollId = window.setInterval(requestSyncGeometry, 1500);
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
            broadcastDarkModeEnhancerState();
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
            broadcastDarkModeEnhancerState();
        }
        broadcastFeatureEnabledState();
        updateShellVisibility();
    }

    function tabById(id) {
        return state.tabs.find(t => t.id === id) || null;
    }

    function syncTabPaneState() {
        if (!state.viewport) return;

        const active = tabById(state.activeId);
        let split = tabById(state.splitId);
        if (!active || (split && split.id === active.id)) {
            split = null;
            state.splitId = null;
        }

        const splitActive = !!(active && split);
        state.viewport.classList.toggle('empty', !active);
        state.viewport.classList.toggle('split', splitActive);

        const activeIndex = active ? state.tabs.findIndex(tab => tab.id === active.id) : -1;
        const splitIndex = split ? state.tabs.findIndex(tab => tab.id === split.id) : -1;
        const splitIsLeft = splitActive && splitIndex >= 0 && activeIndex >= 0 && splitIndex < activeIndex;
        const leftPaneId = splitActive && splitIsLeft ? split.id : active && active.id;
        const rightPaneId = splitActive && splitIsLeft ? active.id : split && split.id;

        for (const tab of state.tabs) {
            const isPrimary = !!(active && tab.id === active.id);
            const isSplit = !!(splitActive && tab.id === split.id);
            const isLeftPane = !!(splitActive && tab.id === leftPaneId);
            const isRightPane = !!(splitActive && tab.id === rightPaneId);

            if (tab.tabEl) {
                tab.tabEl.classList.toggle('active', isPrimary);
                tab.tabEl.classList.toggle('split-target', isSplit);
            }

            tab.iframeEl.classList.toggle('primary-pane', splitActive && isPrimary);
            tab.iframeEl.classList.toggle('split-pane', isSplit);
            tab.iframeEl.classList.toggle('left-pane', isLeftPane);
            tab.iframeEl.classList.toggle('right-pane', isRightPane);
            tab.iframeEl.classList.toggle('hidden', !(isPrimary || isSplit));
        }
    }

    function enableSplitScreen(tabId) {
        if (state.activeId === null || state.activeId === tabId || !tabById(tabId)) return false;
        state.splitId = tabId;
        syncTabPaneState();
        updateLoaderVisibility();
        updateTabScrollButtons();
        saveTabs();
        return true;
    }

    function disableSplitScreen() {
        if (state.splitId === null) return;
        state.splitId = null;
        syncTabPaneState();
        updateLoaderVisibility();
        updateTabScrollButtons();
        saveTabs();
    }

    function activateHome() {
        state.activeId = null;
        state.splitId = null;
        if (!state.homeLoadingAwaitingNativeLoad) setHomeLoading(false);
        syncTabPaneState();
        updateHomeTabActive();
        updateLoaderVisibility();
        requestSyncGeometry();
        ensureActiveTabVisible();
        updateTabScrollButtons();
        saveTabs();
    }

    function activateTab(id) {
        if (state.splitId === id) state.splitId = null;
        state.activeId = id;
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
        if (state.splitId === id) state.splitId = null;
        if (state.activeId === id) {
            const next = state.tabs[Math.min(idx, state.tabs.length - 1)];
            if (next) activateTab(next.id);
            else activateHome();
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

    function tabTypeForUrl(url) {
        const p = AES.normalizeHandledPath(AES.pathOf(url));
        if (p === '/mvc/servicedesk/ticketdetail.mvc') return 'ticket';
        if (p === '/mvc/crm/accountdetail.mvc') return 'account';
        if (p.includes('/contactdetail') || p.includes('/resourcedetail') || p.includes('/persondetail') || p === '/autotask35/grapevine/profile.aspx') return 'person';
        if (p === '/timesheets/views/readonly/tmsreadonly_100.asp') return 'timesheet';
        if (p === '/mvc/inventory/costitem.mvc/shipping' ||
            p.includes('/picklistdetailforshippinggrid') ||
            p.includes('/packinglistdetailforshippinggrid')) return 'inventory';
        if (p.startsWith('/contracts/views/contract')) return 'contract';
        if (p === '/mvc/projects/projectdetail.mvc/projectdetail' || p === '/mvc/projects/taskdetail.mvc') return 'project';
        return 'ticket';
    }

    function fallbackTabMetadataForUrl(url) {
        const path = AES.pathOf(url);
        let parsed = null;
        try { parsed = new URL(url, location.origin); } catch (e) {}
        const params = parsed ? parsed.searchParams : new URLSearchParams();

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
                number: params.get('costProductIds') ? 'Cost items ' + params.get('costProductIds') : '',
                contact: params.get('accountId') ? 'Account ID ' + params.get('accountId') : '',
            };
        }
        if (path.includes('/packinglistdetailforshippinggrid')) {
            const account = params.get('accountIdWithIndex') || '';
            return {
                title: 'Packing List',
                number: params.get('costProductIds') ? 'Cost items ' + params.get('costProductIds') : '',
                contact: account ? 'Account ' + account.split(':')[0] : '',
            };
        }
        if (path === '/mvc/inventory/costitem.mvc/shipping') {
            return {
                title: 'Shipping',
                number: '',
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
        return tabTypeForUrl(tab?.url || '');
    }

    function renderHomeTab() {
        const el = document.createElement('div');
        el.className = 'at-tab home active';
        el.style.setProperty('--aes-tab-rows', '1');
        if (state.homeLoading) el.classList.add('loading');

        const icon = document.createElement('span');
        icon.className = 'icon';
        icon.innerHTML = ICONS.home;

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
        if (tab && tab.number) rows += 1;
        if (tab && tab.contact) rows += 1;
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
        // During a real native iframe navigation, the previous page can still
        // report its old title around `beforeunload`. Keep the spinner up
        // until the iframe load event confirms that navigation finished.
        if (!state.homeLoadingAwaitingNativeLoad) setHomeLoading(false);
    }

    function setHomeLoading(loading) {
        const next = !!loading;
        state.homeLoading = next;
        if (state.homeTabEl) state.homeTabEl.classList.toggle('loading', next);
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
        state.homeLoadingAwaitingNativeLoad = false;
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
        icon.innerHTML = svg;
        return icon;
    }

    function createContextMenuItem(labelText, svg, onClick) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'at-tabs-context-item';
        button.setAttribute('role', 'menuitem');
        button.appendChild(createContextMenuIcon(svg));
        const label = document.createElement('span');
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

    function createContextMenuSectionTitle(text) {
        const title = document.createElement('div');
        title.className = 'at-tabs-context-section-title';
        title.textContent = text;
        return title;
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
        tab.color = TAB_COLOR_PRESETS.includes(color) ? color : '';
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

        const splitButton = createContextMenuItem(
            '',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v14H4z"/><path d="M12 5v14"/></svg>'
        );
        const label = splitButton.querySelector('span:last-child');

        if (tab.id === state.splitId) {
            label.textContent = 'Remove from split screen';
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
            label.textContent = 'Open in split screen';
            const canSplit = state.activeId !== null && state.activeId !== tab.id;
            splitButton.disabled = !canSplit;
            splitButton.title = canSplit ? '' : 'Open another custom tab first, then split this tab beside it.';
            splitButton.addEventListener('click', function () {
                if (splitButton.disabled) return;
                closeTabContextMenu();
                enableSplitScreen(tab.id);
            });
        }

        const pinButton = createContextMenuItem(
            tab.pinned ? 'Unpin tab' : 'Pin tab',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M8 3h8l-1 5 3 3H6l3-3-1-5z"/></svg>',
            function () {
                closeTabContextMenu();
                pinTab(tab.id, !tab.pinned);
            }
        );

        const clearColorButton = createContextMenuItem(
            'Clear tab color',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"/><path d="M7 16l10-10"/><path d="M8 7l9 9"/><path d="M14 4l6 6"/></svg>',
            function () {
                closeTabContextMenu();
                setTabColor(tab.id, '');
            }
        );
        clearColorButton.disabled = !tab.color;

        menu.appendChild(splitButton);
        menu.appendChild(pinButton);
        menu.appendChild(createContextMenuDivider());
        menu.appendChild(createContextMenuSectionTitle('Color tab'));

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
        menu.appendChild(palette);
        menu.appendChild(clearColorButton);

        // --- Tab actions: duplicate (any tab) + copy helpers (ticket tabs) ---
        menu.appendChild(createContextMenuDivider());

        const duplicateButton = createContextMenuItem(
            'Duplicate tab',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
            function () {
                closeTabContextMenu();
                duplicateTab(tab);
            }
        );
        menu.appendChild(duplicateButton);

        const peekButton = createContextMenuItem(
            'Peek',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
            function () {
                closeTabContextMenu();
                openPeekModal(tab);
            }
        );
        menu.appendChild(peekButton);

        if (tabTypeForUrl(tab.url) === 'ticket') {
            const markdownButton = createContextMenuItem(
                'Copy as markdown link',
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"/></svg>',
                function () {
                    closeTabContextMenu();
                    const num = (tab.number || '').trim();
                    const ttl = (tab.title || '').trim();
                    const label = num && ttl ? (num + ' - ' + ttl) : (num || ttl || tab.url);
                    void copyTextToClipboard('[' + label + '](' + tab.url + ')');
                }
            );
            menu.appendChild(markdownButton);

            const copyNumberButton = createContextMenuItem(
                'Copy ticket number',
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9h14"/><path d="M5 15h14"/><path d="M11 4 9 20"/><path d="M15 4l-2 16"/></svg>',
                function () {
                    closeTabContextMenu();
                    void copyTextToClipboard((tab.number || '').trim());
                }
            );
            copyNumberButton.disabled = !(tab.number && tab.number.trim());
            menu.appendChild(copyNumberButton);

            const copyTitleButton = createContextMenuItem(
                'Copy ticket title',
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h10"/></svg>',
                function () {
                    closeTabContextMenu();
                    void copyTextToClipboard((tab.title || '').trim());
                }
            );
            copyTitleButton.disabled = !(tab.title && tab.title.trim());
            menu.appendChild(copyTitleButton);
        }

        document.body.appendChild(menu);
        state.tabContextMenu = menu;
        positionContextMenu(menu, x, y);
    }

    function installTabContextMenuDismissal() {
        document.addEventListener('pointerdown', function (event) {
            if (!state.tabContextMenu || state.tabContextMenu.contains(event.target)) return;
            closeTabContextMenu();
        }, true);
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
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
        pinBadge.innerHTML = ICONS.pin;
        el.appendChild(pinBadge);

        const icon = document.createElement('span');
        icon.className = 'icon';
        icon.innerHTML = ICONS[tabIconKey(tab)] || ICONS.ticket;
        el.appendChild(icon);

        const meta = document.createElement('div');
        meta.className = 'meta';

        const title = document.createElement('div');
        title.className = 'line title';
        updateTabTitleEl(title, tab);

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

        const resource = document.createElement('span');
        resource.className = 'resource-badge';
        updateTabResourceEl(resource, tab);

        const actions = document.createElement('div');
        actions.className = 'tab-actions';
        actions.appendChild(close);
        actions.appendChild(resource);

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
            scheduleHoverCard(tab, el);
            prewarmPeek(tab);
        });
        el.addEventListener('mouseleave', function () {
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
        state.bar.innerHTML = '';
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
        button.innerHTML = direction === 'left'
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
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

    function tabTooltipFor(tab) {
        const title = typeof tab.title === 'string' ? tab.title.trim() : '';
        if (title) return title;
        return tab.loading ? 'Loading...' : tab.url;
    }

    function applyTabColorStyle(tab) {
        if (!tab || !tab.tabEl) return;
        tab.tabEl.classList.toggle('pinned', !!tab.pinned);
        const color = TAB_COLOR_PRESETS.includes(tab.color) ? tab.color : '';
        if (!color) {
            tab.tabEl.dataset.aesColored = 'false';
            tab.tabEl.style.removeProperty('--aes-tab-border');
            tab.tabEl.style.removeProperty('--aes-tab-bg-idle');
            tab.tabEl.style.removeProperty('--aes-tab-bg-hover');
            tab.tabEl.style.removeProperty('--aes-tab-bg-active');
            return;
        }

        const dark = document.documentElement.classList.contains('aes-dark');
        tab.tabEl.dataset.aesColored = 'true';
        tab.tabEl.style.setProperty('--aes-tab-border', color);
        tab.tabEl.style.setProperty('--aes-tab-bg-idle', colorToRgba(color, dark ? 0.18 : 0.14));
        tab.tabEl.style.setProperty('--aes-tab-bg-hover', colorToRgba(color, dark ? 0.26 : 0.2));
        tab.tabEl.style.setProperty('--aes-tab-bg-active', colorToRgba(color, dark ? 0.34 : 0.28));
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
        const shouldShow = tabTypeForUrl(tab.url) === 'ticket' && !!(initials || photoUrl);

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

    function updateTabEl(tab) {
        if (!tab.tabEl) return;
        const t = tab.tabEl.querySelector('.line.title');
        const n = tab.tabEl.querySelector('.line.number');
        const c = tab.tabEl.querySelector('.line.contact');
        const r = tab.tabEl.querySelector('.resource-badge');
        if (t) updateTabTitleEl(t, tab);
        if (n) n.textContent = tab.number || '';
        if (c) c.textContent = tab.contact || '';
        if (r) updateTabResourceEl(r, tab);
        updateTabRowCount(tab);
        applyTabColorStyle(tab);
    }

    function updateHomeTabActive() {
        if (!state.homeTabEl) return;
        state.homeTabEl.classList.toggle('active', state.activeId === null);
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

    function removeSettingsModalNow() {
        if (state.settingsModal) {
            state.settingsModal.remove();
            state.settingsModal = null;
        }
        if (state.settingsBackdrop) {
            state.settingsBackdrop.remove();
            state.settingsBackdrop = null;
        }
        state.settingsClosing = false;
    }

    const SETTING_INFO_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

    function createSettingInfo(text) {
        const span = document.createElement('span');
        span.className = 'at-tabs-setting-info';
        span.title = text;
        span.setAttribute('aria-label', text);
        span.setAttribute('role', 'img');
        span.innerHTML = SETTING_INFO_SVG;
        return span;
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

        const generalTitle = document.createElement('div');
        generalTitle.className = 'at-tabs-settings-section-title';
        generalTitle.textContent = 'General';

        const enabledRow = document.createElement('label');
        enabledRow.className = 'at-tabs-setting-row';

        const enabledLabel = document.createElement('span');
        enabledLabel.className = 'at-tabs-setting-label';

        const enabledName = document.createElement('span');
        enabledName.className = 'at-tabs-setting-name';
        enabledName.textContent = 'Enable Autotask Enhancement Suite';
        enabledLabel.appendChild(createSettingInfo('Turns all AES enhancements on or off. Settings remain available from the native Autotask menu and browser toolbar.'));
        enabledLabel.appendChild(enabledName);

        const enabledToggle = document.createElement('span');
        enabledToggle.className = 'at-tabs-setting-toggle';

        const enabledInput = document.createElement('input');
        enabledInput.type = 'checkbox';
        enabledInput.checked = featuresEnabled();
        enabledInput.addEventListener('change', function () {
            state.extensionEnabled = enabledInput.checked;
            applyExtensionEnabledState();
            void AES.saveSettings();
        });

        const enabledToggleUi = document.createElement('span');
        enabledToggleUi.className = 'at-tabs-setting-toggle-ui';
        enabledToggle.appendChild(enabledInput);
        enabledToggle.appendChild(enabledToggleUi);
        enabledRow.appendChild(enabledLabel);
        enabledRow.appendChild(enabledToggle);

        // Appearance section ----------------------------------------------
        const appearanceSection = document.createElement('div');
        appearanceSection.className = 'at-tabs-settings-section';

        const appearanceTitle = document.createElement('div');
        appearanceTitle.className = 'at-tabs-settings-section-title';
        appearanceTitle.textContent = 'Appearance';

        const themeRow = document.createElement('label');
        themeRow.className = 'at-tabs-setting-row';

        const themeLabel = document.createElement('span');
        themeLabel.className = 'at-tabs-setting-label';

        const themeName = document.createElement('span');
        themeName.className = 'at-tabs-setting-name';
        themeName.textContent = 'Theme';
        themeLabel.appendChild(createSettingInfo('Force tabbar to show in a specific mode, recommended to set to Follow Autotask'));
        themeLabel.appendChild(themeName);

        const themeSelect = document.createElement('select');
        themeSelect.className = 'at-tabs-setting-select';
        [
            { value: 'auto', label: 'Follow Autotask' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
        ].forEach(function (opt) {
            const optionEl = document.createElement('option');
            optionEl.value = opt.value;
            optionEl.textContent = opt.label;
            if (state.themePreference === opt.value) optionEl.selected = true;
            themeSelect.appendChild(optionEl);
        });
        themeSelect.addEventListener('change', function () {
            const value = themeSelect.value;
            if (!['auto', 'light', 'dark'].includes(value)) return;
            state.themePreference = value;
            AES.state.themePreference = value;
            applyAutotaskTheme();
            void AES.saveSettings();
        });

        themeRow.appendChild(themeLabel);
        themeRow.appendChild(themeSelect);

        // Autotask UI Enhancement row (legacy iframe color overrides +
        // button/chrome polish for iframe pages).
        const enhancerRow = document.createElement('label');
        enhancerRow.className = 'at-tabs-setting-row';

        const enhancerLabel = document.createElement('span');
        enhancerLabel.className = 'at-tabs-setting-label';

        const enhancerName = document.createElement('span');
        enhancerName.className = 'at-tabs-setting-name';
        enhancerName.textContent = 'Autotask UI Enhancement';
        enhancerLabel.appendChild(createSettingInfo('Align legacy iframe pages to the newer Autotask Onyx styling, including dark surfaces, button styling, and legacy chrome cleanup (can cause visual issues)'));
        enhancerLabel.appendChild(enhancerName);

        const enhancerToggle = document.createElement('span');
        enhancerToggle.className = 'at-tabs-setting-toggle';

        const enhancerInput = document.createElement('input');
        enhancerInput.type = 'checkbox';
        enhancerInput.checked = !!state.darkModeEnhancerEnabled;
        enhancerInput.addEventListener('change', function () {
            state.darkModeEnhancerEnabled = enhancerInput.checked;
            AES.state.darkModeEnhancerEnabled = enhancerInput.checked;
            broadcastDarkModeEnhancerState();
            void AES.saveSettings();
        });

        const enhancerToggleUi = document.createElement('span');
        enhancerToggleUi.className = 'at-tabs-setting-toggle-ui';
        enhancerToggle.appendChild(enhancerInput);
        enhancerToggle.appendChild(enhancerToggleUi);
        enhancerRow.appendChild(enhancerLabel);
        enhancerRow.appendChild(enhancerToggle);

        // Hide Early Access labels row (native Autotask chrome cleanup).
        const earlyAccessRow = document.createElement('label');
        earlyAccessRow.className = 'at-tabs-setting-row';

        const earlyAccessLabel = document.createElement('span');
        earlyAccessLabel.className = 'at-tabs-setting-label';

        const earlyAccessName = document.createElement('span');
        earlyAccessName.className = 'at-tabs-setting-name';
        earlyAccessName.textContent = 'Hide early access labels';
        earlyAccessLabel.appendChild(createSettingInfo('Hide Early Access badges in the native Autotask navigation menu'));
        earlyAccessLabel.appendChild(earlyAccessName);

        const earlyAccessToggle = document.createElement('span');
        earlyAccessToggle.className = 'at-tabs-setting-toggle';

        const earlyAccessInput = document.createElement('input');
        earlyAccessInput.type = 'checkbox';
        earlyAccessInput.checked = !!state.hideEarlyAccessLabels;
        earlyAccessInput.addEventListener('change', function () {
            state.hideEarlyAccessLabels = earlyAccessInput.checked;
            AES.state.hideEarlyAccessLabels = earlyAccessInput.checked;
            applyEarlyAccessLabelVisibility(document);
            void AES.saveSettings();
        });

        const earlyAccessToggleUi = document.createElement('span');
        earlyAccessToggleUi.className = 'at-tabs-setting-toggle-ui';
        earlyAccessToggle.appendChild(earlyAccessInput);
        earlyAccessToggle.appendChild(earlyAccessToggleUi);
        earlyAccessRow.appendChild(earlyAccessLabel);
        earlyAccessRow.appendChild(earlyAccessToggle);

        const resourcePlannerRow = document.createElement('label');
        resourcePlannerRow.className = 'at-tabs-setting-row';

        const resourcePlannerLabel = document.createElement('span');
        resourcePlannerLabel.className = 'at-tabs-setting-label';

        const resourcePlannerName = document.createElement('span');
        resourcePlannerName.className = 'at-tabs-setting-name';
        resourcePlannerName.textContent = 'Replace legacy Dispatch Calendar with Resource Planner';
        resourcePlannerLabel.appendChild(createSettingInfo('Changes the native Calendar button into a Resource Planner shortcut.'));
        resourcePlannerLabel.appendChild(resourcePlannerName);

        const resourcePlannerToggle = document.createElement('span');
        resourcePlannerToggle.className = 'at-tabs-setting-toggle';

        const resourcePlannerInput = document.createElement('input');
        resourcePlannerInput.type = 'checkbox';
        resourcePlannerInput.checked = !!state.replaceCalendarWithResourcePlanner;
        resourcePlannerInput.addEventListener('change', function () {
            state.replaceCalendarWithResourcePlanner = resourcePlannerInput.checked;
            AES.state.replaceCalendarWithResourcePlanner = resourcePlannerInput.checked;
            applyResourcePlannerCalendarShortcut(document);
            void AES.saveSettings();
        });

        const resourcePlannerToggleUi = document.createElement('span');
        resourcePlannerToggleUi.className = 'at-tabs-setting-toggle-ui';
        resourcePlannerToggle.appendChild(resourcePlannerInput);
        resourcePlannerToggle.appendChild(resourcePlannerToggleUi);
        resourcePlannerRow.appendChild(resourcePlannerLabel);
        resourcePlannerRow.appendChild(resourcePlannerToggle);

        appearanceSection.appendChild(appearanceTitle);
        appearanceSection.appendChild(themeRow);
        appearanceSection.appendChild(enhancerRow);
        appearanceSection.appendChild(earlyAccessRow);

        // Tabbar section --------------------------------------------------
        const section = document.createElement('div');
        section.className = 'at-tabs-settings-section';

        const sectionTitle = document.createElement('div');
        sectionTitle.className = 'at-tabs-settings-section-title';
        sectionTitle.textContent = 'Tab bar';

        // Tab bar position row (horizontal/vertical).
        const orientationRow = document.createElement('label');
        orientationRow.className = 'at-tabs-setting-row';

        const orientationLabel = document.createElement('span');
        orientationLabel.className = 'at-tabs-setting-label';

        const orientationName = document.createElement('span');
        orientationName.className = 'at-tabs-setting-name';
        orientationName.textContent = 'Tab bar position';
        orientationLabel.appendChild(createSettingInfo('Show either a horizontal or vertical tab bar for legacy pages'));
        orientationLabel.appendChild(orientationName);

        const orientationSelect = document.createElement('select');
        orientationSelect.className = 'at-tabs-setting-select';
        [
            { value: 'horizontal', label: 'Horizontal (top)' },
            { value: 'vertical', label: 'Vertical (left)' },
        ].forEach(function (opt) {
            const optionEl = document.createElement('option');
            optionEl.value = opt.value;
            optionEl.textContent = opt.label;
            if (state.barOrientation === opt.value) optionEl.selected = true;
            orientationSelect.appendChild(optionEl);
        });
        orientationSelect.addEventListener('change', function () {
            setBarOrientation(orientationSelect.value);
            void AES.saveSettings();
        });

        orientationRow.appendChild(orientationLabel);
        orientationRow.appendChild(orientationSelect);

        const resizeRow = document.createElement('label');
        resizeRow.className = 'at-tabs-setting-row';

        const resizeLabel = document.createElement('span');
        resizeLabel.className = 'at-tabs-setting-label';

        const resizeName = document.createElement('span');
        resizeName.className = 'at-tabs-setting-name';
        resizeName.textContent = '[BETA] Allow resizing of the vertical tab bar';
        resizeLabel.appendChild(createSettingInfo('Allows the resizing of the vertical AES Tab Bar by dragging the line on the right side. May cause visual issues on the content'));
        resizeLabel.appendChild(resizeName);

        const resizeToggle = document.createElement('span');
        resizeToggle.className = 'at-tabs-setting-toggle';

        const resizeInput = document.createElement('input');
        resizeInput.type = 'checkbox';
        resizeInput.checked = !!state.resizableTabBarEnabled;
        resizeInput.addEventListener('change', function () {
            state.resizableTabBarEnabled = resizeInput.checked;
            AES.state.resizableTabBarEnabled = resizeInput.checked;
            updateResizableBarClasses();
            requestSyncGeometry();
            void AES.saveSettings();
        });

        const resizeToggleUi = document.createElement('span');
        resizeToggleUi.className = 'at-tabs-setting-toggle-ui';
        resizeToggle.appendChild(resizeInput);
        resizeToggle.appendChild(resizeToggleUi);
        resizeRow.appendChild(resizeLabel);
        resizeRow.appendChild(resizeToggle);

        const hideRow = document.createElement('label');
        hideRow.className = 'at-tabs-setting-row';

        const hideLabel = document.createElement('span');
        hideLabel.className = 'at-tabs-setting-label';

        const hideName = document.createElement('span');
        hideName.className = 'at-tabs-setting-name';
        hideName.textContent = 'Hide tab bar';
        hideLabel.appendChild(createSettingInfo('Manually disable the tab bar that gets added by this extension'));
        hideLabel.appendChild(hideName);

        const hideToggle = document.createElement('span');
        hideToggle.className = 'at-tabs-setting-toggle';

        const hideInput = document.createElement('input');
        hideInput.type = 'checkbox';
        hideInput.checked = state.shellHidden;
        hideInput.addEventListener('change', function () {
            state.shellHidden = hideInput.checked;
            updateShellVisibility();
        });

        const hideToggleUi = document.createElement('span');
        hideToggleUi.className = 'at-tabs-setting-toggle-ui';
        hideToggle.appendChild(hideInput);
        hideToggle.appendChild(hideToggleUi);
        hideRow.appendChild(hideLabel);
        hideRow.appendChild(hideToggle);

        const persistRow = document.createElement('label');
        persistRow.className = 'at-tabs-setting-row';

        const persistLabel = document.createElement('span');
        persistLabel.className = 'at-tabs-setting-label';

        const persistName = document.createElement('span');
        persistName.className = 'at-tabs-setting-name';
        persistName.textContent = 'Remember tabs after closing browser';
        persistLabel.appendChild(createSettingInfo('By default the tabs are not remembered after closing the browser, by enabling this the tabs will be saved in persistent memory (may cause tab mess!)'));
        persistLabel.appendChild(persistName);

        const persistToggle = document.createElement('span');
        persistToggle.className = 'at-tabs-setting-toggle';

        const persistInput = document.createElement('input');
        persistInput.type = 'checkbox';
        persistInput.checked = state.rememberTabsAfterClose;
        persistInput.addEventListener('change', function () {
            state.rememberTabsAfterClose = persistInput.checked;
            void AES.saveSettings().then(function () {
                return AES.syncTabsPersistenceMode(buildTabsPayload());
            });
        });

        const persistToggleUi = document.createElement('span');
        persistToggleUi.className = 'at-tabs-setting-toggle-ui';
        persistToggle.appendChild(persistInput);
        persistToggle.appendChild(persistToggleUi);
        persistRow.appendChild(persistLabel);
        persistRow.appendChild(persistToggle);

        const persistNote = document.createElement('div');
        persistNote.className = 'at-tabs-setting-note';
        persistNote.textContent = 'Note that this will severely increase initial load times since all tabs will be loaded in one go';

        const everywhereRow = document.createElement('label');
        everywhereRow.className = 'at-tabs-setting-row';

        const everywhereLabel = document.createElement('span');
        everywhereLabel.className = 'at-tabs-setting-label';

        const everywhereName = document.createElement('span');
        everywhereName.className = 'at-tabs-setting-name';
        everywhereName.textContent = '[BETA] Show tab bar on all Autotask pages';
        everywhereLabel.appendChild(createSettingInfo('Show the AES Tab Bar on all Autotask pages independent of the usage of iFrames, for example: Umbrella Contracts or Resource Planner'));
        everywhereLabel.appendChild(everywhereName);

        const everywhereToggle = document.createElement('span');
        everywhereToggle.className = 'at-tabs-setting-toggle';

        const everywhereInput = document.createElement('input');
        everywhereInput.type = 'checkbox';
        everywhereInput.checked = !!state.showTabBarOnNonIframePages;
        everywhereInput.addEventListener('change', function () {
            state.showTabBarOnNonIframePages = everywhereInput.checked;
            AES.state.showTabBarOnNonIframePages = everywhereInput.checked;
            if (state.showTabBarOnNonIframePages) {
                ensureNonIframeTitleWatcher();
                scheduleNonIframeTitleUpdate();
            } else {
                stopNonIframeTitleWatcher();
            }
            requestSyncGeometry();
            void AES.saveSettings();
        });

        const everywhereToggleUi = document.createElement('span');
        everywhereToggleUi.className = 'at-tabs-setting-toggle-ui';
        everywhereToggle.appendChild(everywhereInput);
        everywhereToggle.appendChild(everywhereToggleUi);
        everywhereRow.appendChild(everywhereLabel);
        everywhereRow.appendChild(everywhereToggle);

        const peekConfirmRow = document.createElement('label');
        peekConfirmRow.className = 'at-tabs-setting-row';

        const peekConfirmLabel = document.createElement('span');
        peekConfirmLabel.className = 'at-tabs-setting-label';

        const peekConfirmName = document.createElement('span');
        peekConfirmName.className = 'at-tabs-setting-name';
        peekConfirmName.textContent = 'Confirm before closing Peek by outside click';
        peekConfirmLabel.appendChild(createSettingInfo('Shows a confirmation when closing a Peek window by clicking outside it. Disable this to keep the “Do not show this again” behavior.'));
        peekConfirmLabel.appendChild(peekConfirmName);

        const peekConfirmToggle = document.createElement('span');
        peekConfirmToggle.className = 'at-tabs-setting-toggle';

        const peekConfirmInput = document.createElement('input');
        peekConfirmInput.type = 'checkbox';
        peekConfirmInput.checked = !state.skipPeekBackdropCloseWarning;
        peekConfirmInput.addEventListener('change', function () {
            state.skipPeekBackdropCloseWarning = !peekConfirmInput.checked;
            AES.state.skipPeekBackdropCloseWarning = state.skipPeekBackdropCloseWarning;
            void AES.saveSettings();
        });

        const peekConfirmToggleUi = document.createElement('span');
        peekConfirmToggleUi.className = 'at-tabs-setting-toggle-ui';
        peekConfirmToggle.appendChild(peekConfirmInput);
        peekConfirmToggle.appendChild(peekConfirmToggleUi);
        peekConfirmRow.appendChild(peekConfirmLabel);
        peekConfirmRow.appendChild(peekConfirmToggle);

        const phoneSection = document.createElement('div');
        phoneSection.className = 'at-tabs-settings-section';

        const phoneSectionTitle = document.createElement('div');
        phoneSectionTitle.className = 'at-tabs-settings-section-title';
        phoneSectionTitle.textContent = 'Phone number';

        const phoneRow = document.createElement('label');
        phoneRow.className = 'at-tabs-setting-row';

        const phoneLabel = document.createElement('span');
        phoneLabel.className = 'at-tabs-setting-label';

        const phoneName = document.createElement('span');
        phoneName.className = 'at-tabs-setting-name';
        phoneName.textContent = 'Clickable phone numbers';
        phoneLabel.appendChild(createSettingInfo('Converts all telephone numbers in Autotask to clickable telto: links'));
        phoneLabel.appendChild(phoneName);

        const phoneToggle = document.createElement('span');
        phoneToggle.className = 'at-tabs-setting-toggle';

        const phoneInput = document.createElement('input');
        phoneInput.type = 'checkbox';
        phoneInput.checked = state.phoneLinksEnabled;
        phoneInput.addEventListener('change', function () {
            state.phoneLinksEnabled = phoneInput.checked;
            AES.state.phoneLinksEnabled = phoneInput.checked;
            if (AES.setPhoneLinksEnabled) {
                AES.setPhoneLinksEnabled(phoneInput.checked);
            }
            void AES.saveSettings();
        });

        const phoneToggleUi = document.createElement('span');
        phoneToggleUi.className = 'at-tabs-setting-toggle-ui';
        phoneToggle.appendChild(phoneInput);
        phoneToggle.appendChild(phoneToggleUi);
        phoneRow.appendChild(phoneLabel);
        phoneRow.appendChild(phoneToggle);

        const uiSection = document.createElement('div');
        uiSection.className = 'at-tabs-settings-section';

        const uiTitle = document.createElement('div');
        uiTitle.className = 'at-tabs-settings-section-title';
        uiTitle.textContent = 'UI Enhancement';

        section.appendChild(orientationRow);
        section.appendChild(resizeRow);
        section.appendChild(hideRow);
        section.appendChild(persistRow);
        section.appendChild(persistNote);
        section.appendChild(everywhereRow);
        section.appendChild(peekConfirmRow);
        phoneSection.appendChild(phoneRow);
        generalSection.appendChild(enabledRow);
        generalSection.appendChild(themeRow);
        uiSection.appendChild(enhancerRow);
        uiSection.appendChild(earlyAccessRow);
        uiSection.appendChild(resourcePlannerRow);

        const nav = document.createElement('div');
        nav.className = 'at-tabs-settings-nav';
        const pages = document.createElement('div');
        pages.className = 'at-tabs-settings-pages';
        const pageDefs = [
            { id: 'general', label: 'General', description: 'Core extension controls and theme behavior.', section: generalSection },
            { id: 'ui', label: 'UI Enhancement', description: 'Visual tweaks for Autotask and native navigation cleanup.', section: uiSection },
            { id: 'tabbar', label: 'Tab bar', description: 'Position, persistence, experimental tab bar behavior, and visibility.', section: section },
            { id: 'misc', label: 'Miscellaneous', description: 'Extra productivity helpers that do not belong to the tab shell.', section: phoneSection },
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
            button.innerHTML = '<span class="at-tabs-settings-nav-name"></span><span class="at-tabs-settings-nav-arrow">›</span>';
            button.querySelector('.at-tabs-settings-nav-name').textContent = def.label;
            button.addEventListener('click', function () { activateSettingsPage(def.id); });
            navButtons.push(button);
            nav.appendChild(button);

            const page = document.createElement('div');
            page.className = 'at-tabs-settings-page' + (index === 0 ? ' active' : '');
            page.dataset.pageId = def.id;
            const pageTitle = document.createElement('div');
            pageTitle.className = 'at-tabs-settings-page-title';
            const titleText = document.createElement('strong');
            titleText.textContent = def.label;
            const subtitle = document.createElement('span');
            subtitle.textContent = def.description;
            pageTitle.appendChild(titleText);
            pageTitle.appendChild(subtitle);
            page.appendChild(pageTitle);
            page.appendChild(def.section);
            pageEls.push(page);
            pages.appendChild(page);
        });
        body.appendChild(nav);
        body.appendChild(pages);

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
            state.viewport.style.left = rect.left + 'px';
            state.viewport.style.top = rect.top + 'px';
            state.viewport.style.width = rect.width + 'px';
            state.viewport.style.height = rect.height + 'px';
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

    function openPeekModal(tab) {
        if (!tab || !tab.url) return;
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

        const reusedLiveIframe = startPeekLiveReuse(tab, modal);
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
            modal.appendChild(iframe);
            modal.appendChild(loader);
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
        splitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/></svg>';
        const canSplit = state.activeId !== null && state.activeId !== tab.id;
        if (!canSplit) {
            splitBtn.disabled = true;
            splitBtn.title = state.activeId === null
                ? 'Open another custom tab first to split with'
                : 'Cannot split a tab with itself';
        }
        splitBtn.addEventListener('click', function () {
            if (splitBtn.disabled) return;
            const tabId = tab.id;
            closePeekModal();
            enableSplitScreen(tabId);
        });

        actions.appendChild(closeBtn);
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

    // --- Tab hover preview card ---------------------------------------------
    const HOVER_SHOW_DELAY_MS = 350;
    const HOVER_HIDE_DELAY_MS = 80;

    function ensureHoverCard() {
        if (state.hoverCard) return state.hoverCard;
        const card = document.createElement('div');
        card.className = 'at-tabs-hover-card';
        card.setAttribute('role', 'tooltip');
        document.body.appendChild(card);
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
        card.innerHTML = '';
        const titleEl = document.createElement('div');
        titleEl.className = 'hc-title';
        titleEl.textContent = tab.title || 'Tab';
        card.appendChild(titleEl);

        if (tab.number) {
            const numEl = document.createElement('div');
            numEl.className = 'hc-number';
            numEl.textContent = tab.number;
            card.appendChild(numEl);
        }

        function addRow(label, value) {
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
            card.appendChild(row);
        }

        addRow('Account', tab.contact);
        if (tab.primaryResource && tab.primaryResource.name) {
            addRow('Primary', tab.primaryResource.name);
        }
        addRow('Status', tab.status);
        addRow('Priority', tab.priority);
        addRow('Last activity', tab.lastActivity);
        const typeLabel = tabTypeForUrl(tab.url || '');
        if (typeLabel) addRow('Type', typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1));
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
            state.hoverHideTimer = 0;
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
        const existing = state.tabs.find(t => t.url === url);
        if (existing) {
            activateTab(existing.id);
            return;
        }
        createAndAddTab(url);
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
        state.viewport.appendChild(iframeEl);
        const fallback = fallbackTabMetadataForUrl(url);

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
            iframeEl: iframeEl,
            tabEl: null,
            loading: true,
        };
        state.tabs.push(normalizeTabState(tab));
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

    function handleMessage(event) {
        const data = event.data;
        if (!data || data.__ns !== AES.MSG_NS) return;

        if (data.type === 'dark-enhancer-request') {
            const respond = function () {
                broadcastDarkModeEnhancerState();
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

        if (data.type === 'open' && data.url) {
            openTab(data.url);
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

        if (data.type === 'nav') {
            const tab = findTabFromWindow(event.source);
            if (!tab) return;
            if (data.url) tab.url = data.url;
            const preserveSparse = shouldPreserveSparseNavMetadata(tab.url);
            if (data.title && (!preserveSparse || data.title.trim())) tab.title = data.title;
            if (data.number !== undefined) {
                if (!preserveSparse || (typeof data.number === 'string' ? data.number.trim() : data.number)) {
                    tab.number = data.number;
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
            // backing the Home tab).
            if (findTabFromWindow(event.source)) return;
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
        const runtime = (typeof browser !== 'undefined' && browser && browser.runtime)
            ? browser.runtime
            : (typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime : null);
        if (!runtime || typeof runtime.getURL !== 'function') return;
        document.documentElement.dataset.aesPageBridgeInjected = 'true';
        const script = document.createElement('script');
        script.src = runtime.getURL('aes-page-bridge.js');
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
        setInterval(maybePromoteTopLevelLandingRoute, 250);
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
        const pref = state.themePreference;
        if (pref === 'light') return false;
        if (pref === 'dark') return true;
        return detectAutotaskDarkMode();
    }

    function applyAutotaskTheme() {
        document.documentElement.classList.toggle('aes-dark', effectiveDarkMode());
        for (const tab of state.tabs) applyTabColorStyle(tab);
        // Iframes need to know the effective theme so the dark mode enhancer
        // can decide whether to apply its overrides.
        broadcastDarkModeEnhancerState();
    }

    function applyBarOrientationClass() {
        document.documentElement.classList.toggle('aes-bar-vertical', isVerticalBar());
        updateResizableBarClasses();
    }

    // Broadcast the current dark mode enhancer state to every same-origin
    // iframe (native and tab). The iframe bridge applies/removes its color
    // overrides based on this signal. Recursively descends into nested
    // same-origin frames so legacy frameset wrappers are covered too.
    function broadcastDarkModeEnhancerState() {
        const enabled = featuresEnabled() && !!state.darkModeEnhancerEnabled;
        const dark = effectiveDarkMode();
        const payload = { __ns: AES.MSG_NS, type: 'dark-enhancer', enabled: enabled, dark: dark };
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
        const enabled = !!state.hideEarlyAccessLabels;
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
            if (!state.hideEarlyAccessLabels) return;
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

    function applyResourcePlannerCalendarShortcut(root) {
        const scope = root && root.querySelectorAll ? root : document;
        const buttons = Array.from(scope.querySelectorAll('button[data-onyx-external-id="0C07O8TE"]'));
        if (scope.matches && scope.matches('button[data-onyx-external-id="0C07O8TE"]')) {
            buttons.push(scope);
        }

        buttons.forEach(function (button) {
            const enabled = featuresEnabled() && !!state.replaceCalendarWithResourcePlanner;
            const label = button.querySelector('div.flex-grow');
            const chevron = button.querySelector('span.fa-chevron-down');
            if (!button.dataset.aesOriginalCalendarLabel && label) {
                button.dataset.aesOriginalCalendarLabel = label.textContent || 'Calendar';
            }

            if (!enabled) {
                if (button.dataset.aesResourcePlannerShortcut === 'true') {
                    if (label) label.textContent = button.dataset.aesOriginalCalendarLabel || 'Calendar';
                    if (chevron) {
                        chevron.style.display = chevron.dataset.aesOriginalDisplay || '';
                        delete chevron.dataset.aesOriginalDisplay;
                    }
                    button.title = button.dataset.aesOriginalCalendarTitle || '';
                    button.removeAttribute('data-aes-resource-planner-shortcut');
                }
                return;
            }

            if (label) label.textContent = 'Resource Planner';
            if (!button.dataset.aesOriginalCalendarTitle) {
                button.dataset.aesOriginalCalendarTitle = button.getAttribute('title') || '';
            }
            button.title = 'Open Resource Planner';
            button.dataset.aesResourcePlannerShortcut = 'true';
            if (chevron) {
                if (!chevron.dataset.aesOriginalDisplay) {
                    chevron.dataset.aesOriginalDisplay = chevron.style.display || '';
                }
                chevron.style.setProperty('display', 'none', 'important');
            }
        });
    }

    function installResourcePlannerShortcutWatcher() {
        applyResourcePlannerCalendarShortcut(document);
        if (state.resourcePlannerShortcutObserver || !document.body) return;
        state.resourcePlannerShortcutObserver = new MutationObserver(function (mutations) {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node && node.nodeType === 1) applyResourcePlannerCalendarShortcut(node);
                }
            }
        });
        state.resourcePlannerShortcutObserver.observe(document.body, { childList: true, subtree: true });

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
        state.settingsButton.style.display = 'none';
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
            ? referenceItem.className
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
        text.textContent = 'AES Settings';

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

        state.nativeSettingsMenuItem = item;
        state.nativeSettingsAvailable = true;
        updateSettingsEntryVisibility();
    }

    function installNativeSettingsMenuItemWatcher() {
        ensureNativeSettingsMenuItem();
        if (state.nativeSettingsObserver || !document.body) return;
        state.nativeSettingsObserver = new MutationObserver(function () {
            window.requestAnimationFrame(ensureNativeSettingsMenuItem);
        });
        state.nativeSettingsObserver.observe(document.body, { childList: true, subtree: true });
    }

    function installThemeWatcher() {
        applyAutotaskTheme();
        if (state.themeObserver || !document.body) return;
        state.themeObserver = new MutationObserver(applyAutotaskTheme);
        state.themeObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['style', 'class'],
        });
    }

    // Toolbar action: clicking the extension icon in the browser toolbar sends
    // a message from `aes-background.js` to ask us to open the Settings modal.
    // Only installed at the top frame (this IIFE bails out otherwise).
    function installToolbarMessageListener() {
        const runtime = (typeof browser !== 'undefined' && browser && browser.runtime)
            ? browser.runtime
            : (typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime : null);
        if (!runtime || !runtime.onMessage) return;
        runtime.onMessage.addListener(function (msg) {
            if (!msg || !msg.__aesToolbar) return;
            if (msg.type === 'open-settings') {
                try { toggleSettingsModal(); } catch (e) {}
            }
        });
    }
    installToolbarMessageListener();

    AES.mount = async function mount() {
        if (state.bar) return;
        state.mountTime = Date.now();
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
        if (['auto', 'light', 'dark'].includes(AES.state.themePreference)) {
            state.themePreference = AES.state.themePreference;
        }
        if (typeof AES.state.extensionEnabled === 'boolean') {
            state.extensionEnabled = AES.state.extensionEnabled;
        }
        if (typeof AES.state.darkModeEnhancerEnabled === 'boolean') {
            state.darkModeEnhancerEnabled = AES.state.darkModeEnhancerEnabled;
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
        state.tabBarWidth = normalizedTabBarWidth(AES.state.tabBarWidth);
        AES.state.tabBarWidth = state.tabBarWidth;
        applyBarOrientationClass();
        applyExtensionEnabledState(false);
        if (featuresEnabled()) {
            await restoreTabs();
            if (!state.tabs.length) activateHome();
        }
        syncGeometry();
        installGeometrySync();
        installTabContextMenuDismissal();
        installThemeWatcher();
        installEarlyAccessLabelWatcher();
        installResourcePlannerShortcutWatcher();
        installNativeSettingsMenuItemWatcher();
        if (state.showTabBarOnNonIframePages) ensureNonIframeTitleWatcher();
    };

    AES.installTopLevelNavigationInterception = installTopLevelNavigationInterception;
    AES.maybePromoteTopLevelLandingRoute = maybePromoteTopLevelLandingRoute;
    AES.handleShellMessage = handleMessage;
})();
