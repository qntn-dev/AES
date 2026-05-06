(function () {
    'use strict';

    const AES = window.__AES__;
    if (!AES) return;

    /**
     * Purpose: CSS payload for the AES top-level shell.
     * Owns: tab bar, settings modal, Peek, split view, hover card, and frame styling CSS.
     * Must not own: JavaScript behavior, settings state, or metadata extraction.
     * Companion files: aes-shell.js for selectors and DOM structure.
     * Verify: smoke test Chrome/Safari styling after changing selectors here.
     */
    const runtime = AES.ShellRuntime || (AES.ShellRuntime = {});
    runtime.styles = runtime.styles || {};
    runtime.styles.shell = `
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
                pointer-events: auto;
            }
            html.aes-horizontal-compact-tabs:not(.aes-bar-vertical) .at-tabs-bar,
            html.aes-horizontal-compact-tabs:not(.aes-bar-vertical) .at-tabs-home-cover {
                height: 50px;
            }
            html.aes-horizontal-compact-tabs:not(.aes-bar-vertical) .at-tab {
                padding-top: 4px;
                padding-bottom: 4px;
            }
            html.aes-horizontal-compact-tabs:not(.aes-bar-vertical) .at-tab .line.contact {
                display: none;
            }
            html.aes-horizontal-compact-tabs:not(.aes-bar-vertical) .at-tab .icon {
                width: 16px;
                height: 16px;
            }
            html.aes-horizontal-compact-tabs:not(.aes-bar-vertical) .at-tab .icon :is(svg, span, i) {
                width: 16px;
                height: 16px;
            }
            html.aes-horizontal-compact-tabs:not(.aes-bar-vertical) .at-tab .tab-actions {
                justify-content: center;
                gap: 0;
                padding-top: 0;
            }
            html.aes-horizontal-compact-tabs:not(.aes-bar-vertical) .at-tab .resource-badge,
            html.aes-horizontal-compact-tabs:not(.aes-bar-vertical) .at-tab .tab-warning-badge {
                width: 20px;
                height: 20px;
                min-width: 20px;
                min-height: 20px;
                flex: 0 0 20px;
            }
            html.aes-horizontal-compact-tabs:not(.aes-bar-vertical) .at-tab .tab-warning-badge svg {
                width: 12px;
                height: 12px;
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
            .at-tabs-pane-loader {
                position: absolute;
                inset: 0;
                z-index: 3;
                display: none;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.72);
                border-radius: 10px;
                pointer-events: none;
            }
            .at-tabs-pane-loader.show { display: flex; }
            html.aes-safari-webkit .at-tabs-viewport,
            html.aes-safari-webkit .at-tabs-viewport > iframe {
                transform: none !important;
            }
            .at-tabs-viewport > iframe.hidden {
                visibility: hidden;
                pointer-events: auto;
            }
            .at-tabs-viewport.rounded-pages:not(.split) > iframe.hidden {
                inset: 8px;
                width: calc(100% - 16px);
                height: calc(100% - 16px);
            }
            .at-tabs-pane-loader.hidden {
                display: none !important;
            }
            .at-tabs-viewport.rounded-pages:not(.split) > iframe:not(.hidden),
            .at-tabs-viewport.rounded-pages:not(.split) > .at-tabs-pane-loader:not(.hidden) {
                inset: 8px;
                width: calc(100% - 16px);
                height: calc(100% - 16px);
                border-radius: 10px;
                box-sizing: border-box;
            }
            .at-tabs-viewport.rounded-pages:not(.split) > iframe:not(.hidden) {
                border: 1px solid rgba(55, 106, 148, 0.24);
                box-shadow: 0 14px 34px rgba(15, 23, 42, 0.22);
                background: #ffffff;
                color-scheme: light;
            }
            .at-tabs-viewport.rounded-pages:not(.split) {
                background: #f6f7f8;
            }
            .at-tabs-viewport.split {
                --at-tabs-split-gap: 26px;
                --at-tabs-split-left: 50%;
                --at-tabs-split-b1: 33.33%;
                --at-tabs-split-b2: 66.67%;
                --at-tabs-split-b3: 75%;
                background: #f6f7f8;
            }
            .at-tabs-viewport.split > iframe,
            .at-tabs-viewport.split > .at-tabs-pane-loader {
                inset: auto;
                top: 8px;
                bottom: 8px;
                height: calc(100% - 16px);
            }
            .at-tabs-viewport.split > iframe {
                border: 1px solid rgba(55, 106, 148, 0.24);
                border-radius: 10px;
                box-shadow: 0 14px 34px rgba(15, 23, 42, 0.22);
                background: #ffffff;
                color-scheme: light;
                box-sizing: border-box;
                overflow: hidden;
            }
            .at-tabs-viewport.split > iframe.left-pane,
            .at-tabs-viewport.split > .at-tabs-pane-loader.left-pane {
                left: 8px;
                right: auto;
                width: calc(var(--at-tabs-split-left) - (var(--at-tabs-split-gap) / 2) - 8px);
            }
            .at-tabs-viewport.split > iframe.right-pane,
            .at-tabs-viewport.split > .at-tabs-pane-loader.right-pane {
                left: auto;
                right: 8px;
                width: calc(100% - var(--at-tabs-split-left) - (var(--at-tabs-split-gap) / 2) - 8px);
            }
            .at-tabs-viewport.split.split-count-3 > iframe,
            .at-tabs-viewport.split.split-count-4 > iframe,
            .at-tabs-viewport.split.split-count-3 > .at-tabs-pane-loader,
            .at-tabs-viewport.split.split-count-4 > .at-tabs-pane-loader {
                top: 8px;
                bottom: 8px;
                height: calc(100% - 16px);
            }
            .at-tabs-viewport.split.split-count-3 > iframe.split-pane-index-0,
            .at-tabs-viewport.split.split-count-3 > .at-tabs-pane-loader.split-pane-index-0,
            .at-tabs-viewport.split.split-count-4 > iframe.split-pane-index-0,
            .at-tabs-viewport.split.split-count-4 > .at-tabs-pane-loader.split-pane-index-0 {
                left: 8px;
                right: auto;
            }
            .at-tabs-viewport.split.split-count-3 > iframe.split-pane-index-1,
            .at-tabs-viewport.split.split-count-3 > .at-tabs-pane-loader.split-pane-index-1 {
                left: calc(var(--at-tabs-split-b1) + (var(--at-tabs-split-gap) / 2));
                right: auto;
            }
            .at-tabs-viewport.split.split-count-3 > iframe.split-pane-index-2,
            .at-tabs-viewport.split.split-count-3 > .at-tabs-pane-loader.split-pane-index-2 {
                left: calc(var(--at-tabs-split-b2) + (var(--at-tabs-split-gap) / 2));
                right: 8px;
            }
            .at-tabs-viewport.split.split-count-3 > iframe.split-pane-index-0,
            .at-tabs-viewport.split.split-count-3 > .at-tabs-pane-loader.split-pane-index-0 {
                width: calc(var(--at-tabs-split-b1) - (var(--at-tabs-split-gap) / 2) - 8px);
            }
            .at-tabs-viewport.split.split-count-3 > iframe.split-pane-index-1,
            .at-tabs-viewport.split.split-count-3 > .at-tabs-pane-loader.split-pane-index-1 {
                width: calc(var(--at-tabs-split-b2) - var(--at-tabs-split-b1) - var(--at-tabs-split-gap));
            }
            .at-tabs-viewport.split.split-count-3 > iframe.split-pane-index-2,
            .at-tabs-viewport.split.split-count-3 > .at-tabs-pane-loader.split-pane-index-2 {
                width: calc(100% - var(--at-tabs-split-b2) - (var(--at-tabs-split-gap) / 2) - 8px);
            }
            .at-tabs-viewport.split.split-count-4 > iframe.split-pane-index-1,
            .at-tabs-viewport.split.split-count-4 > .at-tabs-pane-loader.split-pane-index-1 {
                left: calc(var(--at-tabs-split-b1) + (var(--at-tabs-split-gap) / 2));
                right: auto;
            }
            .at-tabs-viewport.split.split-count-4 > iframe.split-pane-index-2,
            .at-tabs-viewport.split.split-count-4 > .at-tabs-pane-loader.split-pane-index-2 {
                left: calc(var(--at-tabs-split-b2) + (var(--at-tabs-split-gap) / 2));
                right: auto;
            }
            .at-tabs-viewport.split.split-count-4 > iframe.split-pane-index-3,
            .at-tabs-viewport.split.split-count-4 > .at-tabs-pane-loader.split-pane-index-3 {
                left: calc(var(--at-tabs-split-b3) + (var(--at-tabs-split-gap) / 2));
                right: 8px;
            }
            .at-tabs-viewport.split.split-count-4 > iframe.split-pane-index-0,
            .at-tabs-viewport.split.split-count-4 > .at-tabs-pane-loader.split-pane-index-0 {
                width: calc(var(--at-tabs-split-b1) - (var(--at-tabs-split-gap) / 2) - 8px);
            }
            .at-tabs-viewport.split.split-count-4 > iframe.split-pane-index-1,
            .at-tabs-viewport.split.split-count-4 > .at-tabs-pane-loader.split-pane-index-1 {
                width: calc(var(--at-tabs-split-b2) - var(--at-tabs-split-b1) - var(--at-tabs-split-gap));
            }
            .at-tabs-viewport.split.split-count-4 > iframe.split-pane-index-2,
            .at-tabs-viewport.split.split-count-4 > .at-tabs-pane-loader.split-pane-index-2 {
                width: calc(var(--at-tabs-split-b3) - var(--at-tabs-split-b2) - var(--at-tabs-split-gap));
            }
            .at-tabs-viewport.split.split-count-4 > iframe.split-pane-index-3,
            .at-tabs-viewport.split.split-count-4 > .at-tabs-pane-loader.split-pane-index-3 {
                width: calc(100% - var(--at-tabs-split-b3) - (var(--at-tabs-split-gap) / 2) - 8px);
            }
            .at-tabs-split-resize-handle {
                display: none;
                position: absolute;
                top: 8px;
                bottom: 8px;
                left: calc(var(--at-tabs-split-left, 50%) - 17px);
                width: 34px;
                z-index: 4;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                pointer-events: none;
            }
            .at-tabs-split-resize-grip {
                width: 17px;
                height: 68px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                cursor: col-resize;
                touch-action: none;
                pointer-events: auto;
            }
            .at-tabs-viewport.split.split-count-2 > .at-tabs-split-resize-handle[data-split-handle="0"] {
                display: flex;
            }
            .at-tabs-viewport.split.split-count-3 > .at-tabs-split-resize-handle[data-split-handle="0"],
            .at-tabs-viewport.split.split-count-4 > .at-tabs-split-resize-handle[data-split-handle="0"] {
                display: flex;
                left: calc(var(--at-tabs-split-b1) - 17px);
            }
            .at-tabs-viewport.split.split-count-3 > .at-tabs-split-resize-handle[data-split-handle="1"],
            .at-tabs-viewport.split.split-count-4 > .at-tabs-split-resize-handle[data-split-handle="1"] {
                display: flex;
                left: calc(var(--at-tabs-split-b2) - 17px);
            }
            .at-tabs-viewport.split.split-count-4 > .at-tabs-split-resize-handle[data-split-handle="2"] {
                display: flex;
                left: calc(var(--at-tabs-split-b3) - 17px);
            }
            .at-tabs-split-resize-grip::before {
                content: "";
                width: 5px;
                height: 56px;
                border-radius: 999px;
                background: rgba(55, 106, 148, 0.72);
                box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.72), 0 8px 22px rgba(15, 23, 42, 0.22);
                transition: width 0.16s ease, background 0.16s ease;
            }
            .at-tabs-split-resize-grip:hover::before,
            .at-tabs-viewport.split-resizing .at-tabs-split-resize-grip::before {
                width: 7px;
                background: #376A94;
            }
            .at-tabs-viewport.split-resizing {
                cursor: col-resize;
                user-select: none;
            }
            .at-tabs-viewport.split-resizing::after {
                content: "";
                position: absolute;
                inset: 0;
                z-index: 3;
                cursor: col-resize;
                background: transparent;
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
            .at-tabs-loader::before,
            .at-tabs-pane-loader::before {
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
               Custom scrollbars for Autotask documents and injected frames.
               These intentionally use normal specificity + !important so
               legacy Autotask grids and nested pages do not bring back the
               oversized native scrollbars. ================================
            */
            html.aes-improved-scrollbars,
            html.aes-improved-scrollbars body,
            html.aes-improved-scrollbars * {
                scrollbar-color: rgba(125, 167, 201, 0.5) transparent !important;
                scrollbar-width: thin !important;
                scrollbar-gutter: auto !important;
            }
            html.aes-improved-scrollbars::-webkit-scrollbar,
            html.aes-improved-scrollbars body::-webkit-scrollbar,
            html.aes-improved-scrollbars *::-webkit-scrollbar {
                background: transparent !important;
                background-color: transparent !important;
                width: 4px !important;
                height: 4px !important;
            }
            html.aes-improved-scrollbars::-webkit-scrollbar-track,
            html.aes-improved-scrollbars body::-webkit-scrollbar-track,
            html.aes-improved-scrollbars *::-webkit-scrollbar-track {
                background: transparent !important;
                background-color: transparent !important;
                border: 0 !important;
                box-shadow: none !important;
            }
            html.aes-improved-scrollbars::-webkit-scrollbar-track-piece,
            html.aes-improved-scrollbars body::-webkit-scrollbar-track-piece,
            html.aes-improved-scrollbars *::-webkit-scrollbar-track-piece {
                background: transparent !important;
                background-color: transparent !important;
                border: 0 !important;
                box-shadow: none !important;
            }
            html.aes-improved-scrollbars::-webkit-scrollbar-thumb,
            html.aes-improved-scrollbars body::-webkit-scrollbar-thumb,
            html.aes-improved-scrollbars *::-webkit-scrollbar-thumb {
                background-color: rgba(125, 167, 201, 0.5) !important;
                border-radius: 999px !important;
                border: 1px solid transparent !important;
                background-clip: content-box !important;
            }
            html.aes-improved-scrollbars::-webkit-scrollbar-thumb:hover,
            html.aes-improved-scrollbars body::-webkit-scrollbar-thumb:hover,
            html.aes-improved-scrollbars *::-webkit-scrollbar-thumb:hover {
                background-color: rgba(125, 167, 201, 0.75) !important;
                background-clip: content-box !important;
            }
            html.aes-improved-scrollbars::-webkit-scrollbar-corner,
            html.aes-improved-scrollbars body::-webkit-scrollbar-corner,
            html.aes-improved-scrollbars *::-webkit-scrollbar-corner {
                background: transparent !important;
                background-color: transparent !important;
            }
            html.aes-improved-scrollbars::-webkit-scrollbar-button,
            html.aes-improved-scrollbars body::-webkit-scrollbar-button,
            html.aes-improved-scrollbars *::-webkit-scrollbar-button,
            html.aes-improved-scrollbars::-webkit-resizer,
            html.aes-improved-scrollbars body::-webkit-resizer,
            html.aes-improved-scrollbars *::-webkit-resizer {
                display: none !important;
                background: transparent !important;
                background-color: transparent !important;
                width: 0 !important;
                height: 0 !important;
            }
            html.aes-improved-scrollbars .at-tabs-scroll {
                scrollbar-color: transparent transparent !important;
                scrollbar-width: none !important;
            }
            html.aes-improved-scrollbars.aes-dark {
                scrollbar-color: rgba(125, 167, 201, 0.58) #11161c !important;
            }
            html.aes-improved-scrollbars.aes-dark::-webkit-scrollbar-track,
            html.aes-improved-scrollbars.aes-dark body::-webkit-scrollbar-track,
            html.aes-improved-scrollbars.aes-dark *::-webkit-scrollbar-track {
                background: transparent !important;
            }
            html.aes-improved-scrollbars.aes-dark::-webkit-scrollbar-thumb,
            html.aes-improved-scrollbars.aes-dark body::-webkit-scrollbar-thumb,
            html.aes-improved-scrollbars.aes-dark *::-webkit-scrollbar-thumb {
                background-color: rgba(125, 167, 201, 0.58) !important;
                border-color: #11161c !important;
            }
            html.aes-improved-scrollbars.aes-dark::-webkit-scrollbar-thumb:hover,
            html.aes-improved-scrollbars.aes-dark body::-webkit-scrollbar-thumb:hover,
            html.aes-improved-scrollbars.aes-dark *::-webkit-scrollbar-thumb:hover {
                background-color: rgba(125, 167, 201, 0.82) !important;
            }
            html.aes-improved-scrollbars.aes-dark::-webkit-scrollbar-corner,
            html.aes-improved-scrollbars.aes-dark body::-webkit-scrollbar-corner,
            html.aes-improved-scrollbars.aes-dark *::-webkit-scrollbar-corner {
                background: transparent !important;
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
                --aes-tab-separator: #e2e8f0;
            }
            .at-tab:hover { background: var(--aes-tab-bg-hover); }
            .at-tab:not(.active) + .at-tab:not(.active)::before {
                content: "";
                position: absolute;
                left: 0;
                top: 14px;
                bottom: 14px;
                width: 1px;
                background: var(--aes-tab-separator);
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
            .at-tab.split-member + .at-tab.split-member::before {
                display: none;
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
            .at-tab .icon :is(svg, span, i) {
                width: 18px;
                height: 18px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
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
            .at-tab .pin-badge :is(svg, span, i) {
                width: 11px;
                height: 11px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
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
                min-width: 22px;
                min-height: 22px;
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
            .at-tab .tab-warning-badge {
                display: none;
                align-items: center;
                justify-content: center;
                width: 22px;
                height: 22px;
                min-width: 22px;
                min-height: 22px;
                border-radius: 50%;
                border: 1px solid rgba(127, 29, 29, 0.22);
                background: #dc2626;
                color: #ffffff;
                box-sizing: border-box;
                box-shadow: 0 2px 6px rgba(127, 29, 29, 0.24);
                line-height: 1;
            }
            .at-tab .tab-warning-badge.contract-warning {
                color: #b7791f !important;
                background: rgba(245, 158, 11, 0.1) !important;
                border-color: rgba(245, 158, 11, 0.2) !important;
                box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.1) !important;
            }
            .at-tab .tab-warning-badge.visible {
                display: inline-flex;
            }
            .at-tab .tab-warning-badge svg {
                width: 13px;
                height: 13px;
                display: block;
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
            .at-tabs-settings-button :is(svg, span, i) {
                width: 18px;
                height: 18px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
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
                position: relative;
            }
            .at-tabs-context-item:hover {
                background: #edf4fb;
                color: #12344f;
            }
            .at-tabs-context-label {
                flex: 1 1 auto;
                min-width: 0;
            }
            .at-tabs-context-submenu-arrow {
                color: #94a3b8;
                flex: 0 0 auto;
                font-size: 15px;
                line-height: 1;
                margin-left: 12px;
            }
            .at-tabs-context-submenu-trigger {
                position: relative;
            }
            .at-tabs-context-submenu {
                position: absolute;
                top: -6px;
                left: calc(100% + 6px);
                display: none;
                width: 188px;
                padding: 8px;
                border: 1px solid #dbe3ec;
                border-radius: 12px;
                background: #ffffff;
                box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
                color: #0f172a;
                box-sizing: border-box;
            }
            .at-tabs-context-submenu.open-left {
                left: auto;
                right: calc(100% + 6px);
            }
            .at-tabs-context-submenu-trigger:hover > .at-tabs-context-submenu,
            .at-tabs-context-submenu-trigger:focus-within > .at-tabs-context-submenu {
                display: block;
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
            .at-tabs-context-icon :is(svg, span, i) {
                width: 16px;
                height: 16px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }
            .at-tabs-context-colors {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 8px;
                padding: 0;
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
            .at-tabs-release-notes-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, 0.24);
                z-index: 1700;
                animation: aes-backdrop-in 260ms ease-out both;
            }
            .at-tabs-release-notes-backdrop.closing {
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
            html.aes-safari-webkit .at-tabs-peek-wrapper,
            html.aes-safari-webkit .at-tabs-peek-wrapper.closing {
                animation: none !important;
                transform: translate(-50%, -50%) !important;
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
            .at-tabs-peek-frame-wrap {
                position: relative;
                flex: 1 1 auto;
                min-width: 0;
                min-height: 0;
                overflow: hidden;
                background: #ffffff;
            }
            .at-tabs-peek-frame {
                width: 100%;
                height: 100%;
                border: 0;
                display: block;
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
            html.aes-safari-webkit .at-tabs-viewport.peek-active,
            html.aes-safari-webkit .at-tabs-viewport.peek-closing {
                animation: none !important;
                transform: none !important;
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
            .at-tabs-peek-action :is(span, i) {
                width: 20px;
                height: 20px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                line-height: 1;
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
                pointer-events: auto;
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
                align-items: center;
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
            .at-tabs-hover-card .hc-copy {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                border: 0;
                border-radius: 5px;
                background: transparent;
                color: #64748b;
                cursor: pointer;
                flex: 0 0 auto;
                padding: 0;
            }
            .at-tabs-hover-card .hc-copy:hover {
                background: #edf4fb;
                color: #12344f;
            }
            .at-tabs-hover-card .hc-copy i {
                font-size: 11px;
                line-height: 1;
            }
            .at-tabs-settings-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: min(1120px, calc(100vw - 40px));
                height: min(820px, calc(100vh - 40px));
                background: #ffffff;
                border: 1px solid #dbe2ea;
                border-radius: 14px;
                box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
                z-index: 1301;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
                animation: aes-settings-in 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }
            .at-tabs-settings-modal.closing {
                animation: aes-settings-out 220ms cubic-bezier(0.4, 0, 1, 1) both;
            }
            .at-tabs-release-notes-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: min(720px, calc(100vw - 48px));
                max-height: min(760px, calc(100vh - 48px));
                background: #ffffff;
                border: 1px solid #dbe2ea;
                border-radius: 14px;
                box-shadow: 0 20px 56px rgba(15, 23, 42, 0.28);
                z-index: 1701;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
                animation: aes-settings-in 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
            }
            .at-tabs-release-notes-modal.closing {
                animation: aes-settings-out 220ms cubic-bezier(0.4, 0, 1, 1) both;
            }
            @media (prefers-reduced-motion: reduce) {
                .at-tabs-settings-backdrop,
                .at-tabs-settings-modal,
                .at-tabs-release-notes-backdrop,
                .at-tabs-release-notes-modal,
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
            .at-tabs-release-notes-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 14px 16px;
                border-bottom: 1px solid #e2e8f0;
            }
            .at-tabs-release-notes-title {
                font-size: 14px;
                font-weight: 600;
                color: #0f172a;
                line-height: 1.3;
            }
            .at-tabs-release-notes-close {
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
            .at-tabs-release-notes-close:hover {
                background: #f1f5f9;
                color: #0f172a;
            }
            .at-tabs-release-notes-body {
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                color: #0f172a;
                font-size: 13px;
                line-height: 1.45;
                overflow: auto;
            }
            .at-tabs-release-notes-body p {
                margin: 0;
            }
            .at-tabs-release-notes-intro {
                font-weight: 700;
                color: #334155;
            }
            .at-tabs-release-notes-section {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .at-tabs-release-notes-section h3 {
                margin: 0;
                font-size: 12px;
                font-weight: 800;
                color: #0f172a;
                text-transform: uppercase;
            }
            .at-tabs-release-notes-section ul {
                margin: 0;
                padding-left: 18px;
                list-style: disc outside;
            }
            .at-tabs-release-notes-section li ul {
                margin-top: 5px;
                list-style: circle outside;
            }
            .at-tabs-release-notes-section li {
                margin: 0 0 5px;
                display: list-item;
            }
            .at-tabs-release-notes-section li::marker {
                color: #334155;
            }
            .at-tabs-release-notes-actions {
                padding: 0 16px 16px;
                display: flex;
                align-items: center;
                justify-content: flex-end;
                gap: 12px;
                flex-wrap: wrap;
            }
            .at-tabs-release-notes-action {
                appearance: none;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                background: #ffffff;
                color: #334155;
                cursor: pointer;
                font: 700 12px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
                padding: 10px 12px;
                min-height: 36px;
            }
            .at-tabs-release-notes-open {
                margin-right: auto;
                background: #376A94;
                border-color: #376A94;
                color: #ffffff;
            }
            .at-tabs-release-notes-action:hover {
                background: #f1f5f9;
                border-color: #94a3b8;
            }
            .at-tabs-release-notes-open:hover {
                background: #2c567a;
                border-color: #2c567a;
                color: #ffffff;
            }
            .at-tabs-settings-body {
                padding: 0;
                display: grid;
                grid-template-columns: 240px minmax(0, 1fr);
                min-height: 0;
                flex: 1 1 auto;
                overflow: hidden;
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
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 12px 16px 14px;
                border-top: 1px solid #e2e8f0;
                font-size: 11px;
                line-height: 1.4;
                color: #64748b;
                text-align: left;
            }
            .at-tabs-settings-footer-actions {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                gap: 10px;
                flex: 0 0 auto;
                flex-wrap: wrap;
            }
            .at-tabs-settings-reset {
                appearance: none;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                background: #ffffff;
                color: #334155;
                cursor: pointer;
                flex: 0 0 auto;
                font: 700 11px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
                padding: 8px 10px;
                transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
            }
            .at-tabs-settings-reset:hover {
                background: #f1f5f9;
                border-color: #94a3b8;
                color: #0f172a;
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
            .at-tabs-settings-page-title.with-action {
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                align-items: start;
                column-gap: 14px;
            }
            .at-tabs-settings-page-title-copy {
                display: flex;
                min-width: 0;
                flex-direction: column;
                gap: 3px;
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
            .at-tabs-settings-page-action {
                appearance: none;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                background: #ffffff;
                color: #334155;
                cursor: pointer;
                font: 700 12px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
                padding: 9px 11px;
                white-space: nowrap;
            }
            .at-tabs-settings-page-action:hover {
                background: #f1f5f9;
                border-color: #94a3b8;
                color: #0f172a;
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
            .at-tabs-setting-reload-note {
                display: none;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                margin: -4px 4px 4px;
                padding: 10px 12px;
                border: 1px solid #bfdbfe;
                border-radius: 10px;
                background: #eff6ff;
                color: #1e3a5f;
                font-size: 12px;
                font-weight: 600;
                line-height: 1.4;
            }
            .at-tabs-setting-reload-note.visible {
                display: flex;
            }
            .at-tabs-setting-reload-button {
                appearance: none;
                border: 1px solid #376A94;
                border-radius: 8px;
                background: #376A94;
                color: #ffffff;
                cursor: pointer;
                flex: 0 0 auto;
                font: 700 11px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
                padding: 8px 10px;
            }
            .at-tabs-setting-reload-button:hover {
                background: #2c567a;
                border-color: #2c567a;
            }
            html.aes-dark .at-tabs-setting-note {
                color: #94a3b8;
            }
            html.aes-dark .at-tabs-setting-reload-note {
                background: #142333;
                border-color: #31506A;
                color: #dbeafe;
            }
            .at-tabs-setting-label {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 6px;
                min-width: 0;
            }
            .at-tabs-setting-info {
                display: none !important;
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
            .at-tabs-setting-line-controls {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                flex: 0 0 auto;
            }
            .at-tabs-customization-row {
                display: grid;
                grid-template-columns: minmax(180px, 1fr) minmax(0, 460px);
                align-items: center;
                gap: 16px;
            }
            .at-tabs-customization-row .at-tabs-setting-line-controls {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                justify-content: stretch;
                min-width: 0;
                width: 100%;
            }
            .at-tabs-setting-line-controls .at-tabs-setting-select {
                min-width: 0;
                width: 100%;
                max-width: none;
            }
            .at-tabs-setting-line-controls.line3-disabled select[data-tab-line="3"] {
                opacity: 0.48;
                cursor: not-allowed;
                background-color: #eef2f6;
            }
            .at-tabs-customization-header-lines .line3-disabled {
                opacity: 0.48;
            }
            .at-tabs-customization-header {
                display: grid;
                grid-template-columns: minmax(180px, 1fr) minmax(0, 460px);
                gap: 16px;
                padding: 0 14px 2px;
                color: #64748b;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.03em;
                text-transform: uppercase;
            }
            .at-tabs-customization-header-lines {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 8px;
            }
            .at-tabs-setting-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                color: #64748b;
                font-size: 14px;
                width: 16px;
                text-align: center;
                flex: 0 0 auto;
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
            html.aes-dark .at-tabs-viewport.split {
                background: #11161c;
            }
            html.aes-dark .at-tabs-viewport.rounded-pages:not(.split) {
                background: #11161c;
            }
            html.aes-dark .at-tabs-viewport.split > iframe {
                border-color: rgba(125, 167, 201, 0.26);
                box-shadow: 0 10px 28px rgba(0, 0, 0, 0.34);
                background: #0f141a;
                color-scheme: light;
            }
            html.aes-dark .at-tabs-viewport.rounded-pages:not(.split) > iframe:not(.hidden) {
                border-color: rgba(125, 167, 201, 0.26);
                box-shadow: 0 10px 28px rgba(0, 0, 0, 0.34);
                background: #0f141a;
                color-scheme: light;
            }
            html.aes-dark .at-tabs-split-resize-grip::before {
                background: rgba(125, 167, 201, 0.78);
                box-shadow: 0 0 0 4px rgba(17, 22, 28, 0.8), 0 8px 22px rgba(0, 0, 0, 0.36);
            }
            html.aes-dark .at-tabs-split-resize-grip:hover::before,
            html.aes-dark .at-tabs-viewport.split-resizing .at-tabs-split-resize-grip::before {
                background: #7da7c9;
            }
            html.aes-dark .at-tabs-loader {
                background: rgba(31, 34, 39, 0.85);
            }
            html.aes-dark .at-tabs-pane-loader {
                background: rgba(31, 34, 39, 0.68);
            }
            html.aes-dark .at-tabs-loader::before,
            html.aes-dark .at-tabs-pane-loader::before {
                border-color: #475569;
                border-top-color: #376A94;
            }

            html.aes-dark .at-tab {
                color: #cbd5e1;
                --aes-tab-bg-idle: transparent;
                --aes-tab-bg-hover: #262A30;
                --aes-tab-bg-active: #232D37;
                --aes-tab-separator: #2a2e34;
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
                background: var(--aes-tab-separator);
            }
            html.aes-dark .at-tab .resource-badge {
                border-color: rgba(241, 245, 249, 0.18);
            }
            html.aes-dark .at-tab .tab-warning-badge.contract-warning {
                color: #f6c453 !important;
                background: rgba(246, 196, 83, 0.12) !important;
                border-color: rgba(246, 196, 83, 0.24) !important;
                box-shadow: inset 0 0 0 1px rgba(246, 196, 83, 0.08) !important;
            }
            html.aes-dark .at-tab .tab-warning-badge {
                border-color: rgba(254, 202, 202, 0.24);
                box-shadow: 0 2px 8px rgba(127, 29, 29, 0.34);
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
            html.aes-dark .at-tabs-context-item:hover {
                background: #262A30;
                color: #ffffff;
            }
            html.aes-dark .at-tabs-context-submenu {
                background: #1F2227;
                border-color: #2a2e34;
                color: #f1f5f9;
                box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
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
            html.aes-dark .at-tabs-release-notes-backdrop {
                background: rgba(0, 0, 0, 0.55);
            }
            html.aes-dark .at-tabs-settings-modal,
            html.aes-dark .at-tabs-map-modal {
                background: #1F2227;
                border-color: #2a2e34;
                color: #f1f5f9;
                box-shadow: 0 22px 60px rgba(0, 0, 0, 0.6);
            }
            html.aes-dark .at-tabs-release-notes-modal {
                background: #1F2227;
                border-color: #2a2e34;
                color: #f1f5f9;
                box-shadow: 0 22px 60px rgba(0, 0, 0, 0.6);
            }
            html.aes-dark .at-tabs-settings-header,
            html.aes-dark .at-tabs-map-header {
                border-bottom-color: #2a2e34;
            }
            html.aes-dark .at-tabs-release-notes-header {
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
                color: #94a3b8;
            }
            html.aes-dark .at-tabs-settings-reset {
                background: #1f2937;
                border-color: #334155;
                color: #e2e8f0;
            }
            html.aes-dark .at-tabs-settings-reset:hover {
                background: #263244;
                border-color: #475569;
                color: #ffffff;
            }
            html.aes-dark .at-tabs-settings-title,
            html.aes-dark .at-tabs-settings-section-title,
            html.aes-dark .at-tabs-settings-page-title strong {
                color: #f1f5f9;
            }
            html.aes-dark .at-tabs-settings-page-title span {
                color: #94a3b8;
            }
            html.aes-dark .at-tabs-settings-page-action {
                background: #1f2937;
                border-color: #334155;
                color: #e2e8f0;
            }
            html.aes-dark .at-tabs-settings-page-action:hover {
                background: #263244;
                border-color: #475569;
                color: #ffffff;
            }
            html.aes-dark .at-tabs-settings-close:hover {
                background: #262A30;
                color: #f1f5f9;
            }
            html.aes-dark .at-tabs-release-notes-close {
                color: #94a8b8;
            }
            html.aes-dark .at-tabs-release-notes-close:hover {
                background: #262A30;
                color: #f1f5f9;
            }
            html.aes-dark .at-tabs-settings-note {
                color: #94a3b8;
            }
            html.aes-dark .at-tabs-release-notes-title {
                color: #f1f5f9;
            }
            html.aes-dark .at-tabs-release-notes-body {
                color: #cbd5e1;
            }
            html.aes-dark .at-tabs-release-notes-intro,
            html.aes-dark .at-tabs-release-notes-section h3 {
                color: #f1f5f9;
            }
            html.aes-dark .at-tabs-release-notes-section li::marker {
                color: #cbd5e1;
            }
            html.aes-dark .at-tabs-release-notes-action {
                background: #1f2937;
                border-color: #334155;
                color: #e2e8f0;
            }
            html.aes-dark .at-tabs-release-notes-action:hover {
                background: #263244;
                border-color: #475569;
                color: #f1f5f9;
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
            html.aes-dark .at-tabs-hover-card .hc-copy {
                color: #94a3b8;
            }
            html.aes-dark .at-tabs-hover-card .hc-copy:hover {
                background: #262A30;
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
            html.aes-dark .at-tabs-setting-line-controls.line3-disabled select[data-tab-line="3"] {
                background-color: #1F2227;
                border-color: #334155;
                color: #64748b;
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
            html.aes-bar-vertical .at-tabs-bar.compact:not(.hover-expanded) .at-tab .icon :is(svg, span, i) {
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
            html.aes-bar-vertical .at-tab .tab-actions {
                justify-content: flex-start;
                padding-top: 4px;
            }
            html.aes-bar-vertical .at-tab .resource-badge {
                margin-top: 2px;
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
})();
