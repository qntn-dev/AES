// ==UserScript==
// @name         Autotask Enhancement Suite
// @namespace    http://tampermonkey.net/
// @version      2026-04-23
// @description  Autotask Enhancement Suite: iframe navigation, UI polish, and productivity upgrades
// @author       You
// @match        https://ww19.autotask.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=autotask.net
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const isInIframe = window.top !== window.self;

    // ===== Modern restyle (iframe only) =====
    if (isInIframe) {
        const style = document.createElement('style');
        style.textContent = `
            /* ===== Design tokens ===== */
            :root {
                --at-bg: #f3f4f6;
                --at-surface: #ffffff;
                --at-surface-hover: #f6f7f9;
                --at-border: #e3e5e8;
                --at-border-subtle: #e5e7eb;
                --at-text: #1f2937;
                --at-text-muted: #6b7280;
                --at-text-faint: #9ca3af;
                --at-accent: #0891b2;
                --at-accent-hover: #0e7490;
                --at-accent-icon: #33c5e8;
                --at-shadow-sm: none;
                --at-shadow: none;
                --at-radius: 10px;
                --at-radius-sm: 6px;
                --at-activity-inline-gutter: 20px;
                --at-font: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
                           "SF Pro Text", system-ui, sans-serif;
            }

            @media (prefers-color-scheme: dark) {
                :root {
                    --at-bg: #0f1115;
                    --at-surface: #181b21;
                    --at-surface-hover: #1f232b;
                    --at-border: #2a2e37;
                    --at-border-subtle: #23262d;
                    --at-text: #e5e7eb;
                    --at-text-muted: #9ca3af;
                    --at-text-faint: #6b7280;
                    --at-accent: #22d3ee;
                    --at-accent-hover: #67e8f9;
                    --at-accent-icon: #01a9c8;
                    --at-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
                    --at-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
                }
            }

            /* ===== Global typography ===== */
            body, body * {
                font-family: var(--at-font) !important;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            body.EntityDetail, body.EntityPage {
                background: var(--at-bg) !important;
                color: var(--at-text) !important;
            }
            /* Datto reserves a left gutter on body when QuickLaunch is enabled */
            body.QuickLaunchEnabled.EntityPage,
            body.QuickLaunchEnabled.EntityDetail {
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 12px !important;
                padding-right: 12px !important;
            }

            /* ===== Spacing cleanup ===== */
            .HeadingVerticalSpacer1,
            .AccessoryVerticalSpacer1,
            .FooterVerticalSpacer1,
            .WalkMeIconPlaceholder { display: none !important; }

            .PageHeadingContainer > .ToolBar {
                padding: 4px 10px !important;
                min-height: 0 !important;
                background: transparent !important;
                border: none !important;
            }
            /* Autotask reserves a left rail when QuickLaunch is enabled.
               We dock QuickLaunch at the bottom, so reclaim that left space. */
            body.QuickLaunchEnabled .PageHeadingContainer,
            body.QuickLaunchEnabled .MainContainer,
            body.QuickLaunchEnabled .MainContainer.Active {
                left: 0 !important;
                right: 0 !important;
                width: auto !important;
                margin-left: 0 !important;
                padding-left: 0 !important;
            }
            /* ===== QuickLaunchBar: floating dock at bottom ===== */
            .QuickLaunchBar {
                position: fixed !important;
                top: auto !important;
                right: auto !important;
                left: 50% !important;
                bottom: 18px !important;
                transform: translateX(-50%) !important;
                display: flex !important;
                flex-direction: row !important;
                align-items: center !important;
                gap: 7px !important;
                padding: 9px !important;
                background: var(--at-surface) !important;
                border: 1px solid var(--at-border) !important;
                border-radius: 999px !important;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12),
                            0 2px 6px rgba(0, 0, 0, 0.08) !important;
                z-index: 9999 !important;
                width: auto !important;
                height: auto !important;
                min-width: 0 !important;
                max-width: calc(100vw - 40px) !important;
                box-sizing: border-box !important;
                overflow: visible !important;
            }
            .QuickLaunchBar > .QuickLaunchButton,
            .QuickLaunchBar .QuickLaunchButton {
                position: relative !important;
                display: inline-block !important;
                width: 42px !important;
                height: 42px !important;
                min-width: 42px !important;
                max-width: 42px !important;
                margin: 0 !important;
                padding: 0 !important;
                border-radius: 999px !important;
                background: transparent !important;
                border: none !important;
                color: var(--at-text) !important;
                cursor: pointer !important;
                transition: background 0.15s !important;
                overflow: hidden !important;
                box-sizing: border-box !important;
                top: auto !important;
                left: auto !important;
                right: auto !important;
                bottom: auto !important;
                flex: 0 0 auto !important;
            }
            .QuickLaunchBar .QuickLaunchButton:hover {
                background: var(--at-surface-hover) !important;
            }
            .QuickLaunchBar .QuickLaunchButton .Text {
                display: none !important;
            }
            .QuickLaunchBar .QuickLaunchButton .Icon {
                position: absolute !important;
                top: 50% !important;
                left: 50% !important;
                right: auto !important;
                bottom: auto !important;
                width: 19px !important;
                height: 19px !important;
                margin: -9.5px 0 0 -9.5px !important;
                padding: 0 !important;
            }
            /* Leave room at page bottom so content isn't hidden behind dock */
            .MainContainer.Active {
                padding-bottom: 80px !important;
            }
            /* Sidebar Details/Insights tabs: flat, match new bg */
            .SecondaryContainer.Left .TabButtonContainer {
                background: transparent !important;
                border: none !important;
                margin-bottom: 12px !important;
            }

            /* ===== Main containers ===== */
            body, body.EntityDetail, body.EntityPage,
            .MainContainer, .MainContainer.Active {
                background: var(--at-bg) !important;
            }
            .MainContainer.Active {
                padding: 12px !important;
                gap: 12px !important;
            }
            .PrimaryContainer {
                padding: 0 !important;
                background: transparent !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 12px !important;
                min-width: 0 !important;
            }
            .PrimaryContainer > * {
                margin: 0 !important;
            }
            .PrimaryContainer > div,
            .PrimaryContainer .BodyContainer,
            .PrimaryContainer .BodyContainer > div {
                padding: 0 !important;
                margin: 0 !important;
                background: transparent !important;
                width: 100% !important;
                box-sizing: border-box !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 12px !important;
            }
            .EntityHeadingContainer {
                width: 100% !important;
                box-sizing: border-box !important;
            }
            .BodyContent > .Normal.Section {
                width: 100% !important;
                box-sizing: border-box !important;
            }
            .SecondaryContainer.Left,
            .SecondaryContainer.Right {
                background: transparent !important;
            }

            /* ===== Section cards: flat, airy ===== */
            .DetailsSection,
            .Section,
            .BodyContent > .Section {
                background: var(--at-surface) !important;
                border: 1px solid var(--at-border-subtle) !important;
                border-radius: var(--at-radius) !important;
                box-shadow: none !important;
                margin-bottom: 12px !important;
                overflow: hidden;
            }
            .DetailsSectionHeading {
                padding: 8px 12px !important;
                background: transparent !important;
                border-bottom: 1px solid var(--at-border-subtle) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                gap: 8px !important;
            }
            .DetailsSectionHeading .Left {
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
            }
            .DetailsSectionHeading .Text,
            .Section .Heading .Text {
                font-weight: 600 !important;
                font-size: 12px !important;
                letter-spacing: 0.04em !important;
                text-transform: uppercase !important;
                color: var(--at-text-muted) !important;
            }
            .DetailsSectionHeading .Toggle .SectionArrowIcon {
                opacity: 0.5 !important;
            }
            /* First DetailsSection (Organization/Status/Priority) has no heading - add top padding */
            .SecondaryContainer.Left .DetailsSection:first-child .ContentContainer {
                padding-top: 4px !important;
            }
            /* Sidebars: individual card per section, gap between */
            .SecondaryContainer.Left,
            .SecondaryContainer.Right {
                padding: 0 !important;
            }
            .SecondaryContainer.Left > div:not(.TabButtonContainer),
            .SecondaryContainer.Right > div {
                display: flex !important;
                flex-direction: column !important;
                gap: 12px !important;
                background: transparent !important;
            }
            .SecondaryContainer.Left .DetailsSection,
            .SecondaryContainer.Right .DetailsSection,
            .SecondaryContainer.Right .Section {
                background: var(--at-surface) !important;
                border: 1px solid var(--at-border-subtle) !important;
                border-radius: var(--at-radius) !important;
                margin-bottom: 0 !important;
                box-shadow: none !important;
                overflow: hidden !important;
            }
            .SecondaryContainer.Right .DetailsSectionHeading .Text,
            .SecondaryContainer.Right .Section .Heading .Text,
            .SecondaryContainer.Left .DetailsSectionHeading .Text {
                font-size: 15px !important;
                font-weight: 600 !important;
                text-transform: none !important;
                letter-spacing: -0.005em !important;
                color: var(--at-text) !important;
            }
            .SecondaryContainer.Right .DetailsSectionHeading,
            .SecondaryContainer.Right .Section .HeadingContainer .Heading,
            .SecondaryContainer.Left .DetailsSectionHeading {
                padding: 12px 12px 8px !important;
                border-bottom: none !important;
            }
            .SecondaryContainer.Left .ContentContainer,
            .SecondaryContainer.Right .ContentContainer {
                padding: 6px 0 12px !important;
            }

            /* ===== Labels & values: inline two-column ===== */
            .ReadOnlyDetailsContainer {
                display: flex !important;
                flex-direction: column !important;
                gap: 2px !important;
                padding: 6px 0 !important;
            }
            .ReadOnlyData {
                display: flex !important;
                flex-direction: row !important;
                align-items: flex-start !important;
                gap: 8px !important;
                padding: 4px 12px !important;
                border-bottom: none !important;
                min-height: 0 !important;
            }
            .ReadOnlyData:has(.ReadOnlyValueContainer .Value:empty:only-child) {
                display: none !important;
            }
            .ReadOnlyLabelContainer {
                flex: 0 0 44% !important;
                max-width: 44% !important;
                padding-right: 8px !important;
                display: flex !important;
                align-items: flex-start !important;
                gap: 4px !important;
                padding-top: 2px !important;
            }
            .ReadOnlyValueContainer {
                flex: 1 1 auto !important;
                min-width: 0 !important;
                display: flex !important;
                align-items: center !important;
                flex-wrap: wrap !important;
            }
            .ReadOnlyValueContainer .Value {
                font-size: 13px !important;
                color: var(--at-text) !important;
                font-weight: 400 !important;
                min-width: 0 !important;
                word-break: break-word !important;
                overflow-wrap: anywhere !important;
            }
            .ReadOnlyValueContainer .Value .Text {
                white-space: normal !important;
            }
            .LabelContainer1 {
                min-width: 0 !important;
            }
            .LabelContainer1 .Text,
            .LabelContainer1 .PrimaryText {
                font-size: 12px !important;
                font-weight: 500 !important;
                color: var(--at-text-muted) !important;
                letter-spacing: 0.01em !important;
                line-height: 1.35 !important;
                word-break: normal !important;
            }
            .Required {
                display: none !important;
            }
            .WalkMeIconPlaceholder { display: none !important; }

            /* ===== Link buttons: subtle accent ===== */
            .LinkButton2 .Text2,
            .HeaderLinkButton2 .LinkButton2 .Text2 {
                color: var(--at-accent) !important;
                font-weight: 500 !important;
                text-decoration: none !important;
                transition: color 0.15s !important;
            }
            .LinkButton2:hover .Text2 {
                color: var(--at-accent-hover) !important;
                text-decoration: underline !important;
            }

            /* ===== Regular buttons: flatter, rounded ===== */
            .Button2 {
                border-radius: var(--at-radius-sm) !important;
                transition: background 0.15s, border-color 0.15s !important;
                border: 1px solid var(--at-border) !important;
            }
            .Button2.NormalBackground {
                background: var(--at-surface) !important;
            }
            .Button2:hover:not(.Disabled2) {
                background: var(--at-surface-hover) !important;
                border-color: var(--at-text-muted) !important;
            }
            .Button2 .Text2 {
                color: var(--at-text) !important;
                font-size: 13px !important;
                font-weight: 500 !important;
            }
            .Button2.Disabled2 { opacity: 0.45 !important; }
            .Button2.SuggestiveBackground {
                background: var(--at-accent) !important;
                border-color: var(--at-accent) !important;
            }
            .Button2.SuggestiveBackground .Text2 { color: #fff !important; }
            .Button2.SuggestiveBackground:hover {
                background: var(--at-accent-hover) !important;
            }

            /* ===== Dropdown menus (Tools, Outsource, etc.) ===== */
            .ContextOverlay,
            .DropDownButtonOverlay2,
            .ContextOverlay.InlineIconContextOverlay,
            .AccessoryTabButtonBarContextMenu {
                background: var(--at-surface) !important;
                border: 1px solid var(--at-border) !important;
                border-radius: var(--at-radius) !important;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12),
                            0 2px 6px rgba(0, 0, 0, 0.06) !important;
                padding: 4px !important;
                overflow: hidden;
            }
            .ContextOverlay .Button2,
            .ContextOverlay .MenuButton1,
            .ContextOverlay a.Button {
                border: none !important;
                border-radius: var(--at-radius-sm) !important;
                padding: 6px 10px !important;
                background: transparent !important;
                text-align: left !important;
                width: 100% !important;
                justify-content: flex-start !important;
                transition: background 0.12s !important;
            }
            .ContextOverlay .Button2:hover:not(.Disabled2),
            .ContextOverlay .MenuButton1:hover,
            .ContextOverlay a.Button:hover {
                background: var(--at-surface-hover) !important;
                border: none !important;
            }
            .ContextOverlay .Button2 .Text2,
            .ContextOverlay .MenuButton1 .Text1,
            .ContextOverlay a.Button .Text {
                font-size: 13px !important;
                font-weight: 400 !important;
                color: var(--at-text) !important;
            }
            .ContextOverlay .Button2.Disabled2 { opacity: 0.4 !important; }
            .ContextOverlay .Button2 .Icon2,
            .ContextOverlay .MenuButton1 .StandardButtonIcon,
            .ContextOverlay a.Button .Icon {
                margin-right: 8px !important;
                opacity: 0.7 !important;
            }
            .ContextOverlay .MenuColumn1 > .ButtonGroup1 {
                border: none !important;
            }
            .ContextOverlay .Arrow,
            .ContextOverlay .Outline.Arrow {
                display: none !important;
            }

            /* ===== TitleBar ===== */
            .TitleBar {
                background: transparent !important;
                border-bottom: 1px solid var(--at-border-subtle) !important;
                padding: 6px 12px !important;
            }
            .TitleBar .Text {
                font-weight: 600 !important;
                font-size: 14px !important;
                color: var(--at-text) !important;
            }
            .TitleBar .SecondaryText {
                color: var(--at-text-muted) !important;
                font-weight: 400 !important;
            }

            /* ===== Entity heading ===== */
            .EntityHeadingContainer {
                background: var(--at-surface) !important;
                border: 1px solid var(--at-border-subtle) !important;
                border-radius: var(--at-radius) !important;
                padding: 20px 24px 16px !important;
                margin: 0 !important;
                box-shadow: none !important;
            }
            .EntityHeadingContainer,
            .EntityHeadingContainer * {
                background-color: transparent !important;
            }
            .EntityHeadingContainer {
                background-color: var(--at-surface) !important;
            }
            /* Let chips/stopwatch keep their own backgrounds */
            .EntityHeadingContainer .CategoryChip,
            .EntityHeadingContainer .CategoryChip *,
            .EntityHeadingContainer .TypeChip,
            .EntityHeadingContainer .StopwatchContainer {
                background-color: revert !important;
            }
            .EntityHeadingContainer .TypeChip {
                background-color: var(--at-surface-hover) !important;
            }
            .EntityHeadingContainer .StopwatchContainer {
                background-color: var(--at-surface-hover) !important;
            }
            .EntityHeadingContainer > .Content {
                display: flex !important;
                flex-direction: column !important;
                gap: 8px !important;
            }
            .EntityHeadingContainer .IdentificationContainer {
                display: flex !important;
                flex-direction: row !important;
                align-items: center !important;
                gap: 12px !important;
                flex-wrap: nowrap !important;
                justify-content: flex-start !important;
                text-align: left !important;
            }
            .EntityHeadingContainer .IdentificationContainer .Left {
                display: flex !important;
                flex-direction: row !important;
                align-items: center !important;
                gap: 10px !important;
                flex-wrap: wrap !important;
                flex: 1 1 auto !important;
                min-width: 0 !important;
                justify-content: flex-start !important;
                align-content: center !important;
                margin: 0 !important;
                padding: 0 !important;
                width: auto !important;
            }
            .EntityHeadingContainer .IdentificationContainer .Right {
                display: flex !important;
                flex: 0 0 auto !important;
                margin-left: auto !important;
                align-items: center !important;
            }
            .EntityHeadingContainer .IdentificationTextContainer {
                display: inline-flex !important;
                align-items: center !important;
                gap: 4px !important;
                margin: 0 !important;
            }
            .EntityHeadingContainer .ChipContainer {
                margin: 0 !important;
            }
            .EntityHeadingContainer .Title {
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
                flex-wrap: wrap !important;
            }
            .EntityHeadingContainer .Title .Text {
                font-size: 24px !important;
                font-weight: 700 !important;
                color: var(--at-text) !important;
                letter-spacing: -0.02em !important;
                line-height: 1.25 !important;
            }
            .EntityHeadingContainer .EntityTypeIcon {
                flex: 0 0 auto !important;
            }
            .EntityHeadingContainer .Bundle {
                display: flex !important;
                flex-direction: row !important;
                flex-wrap: wrap !important;
                align-items: center !important;
                gap: 6px !important;
                color: var(--at-text-muted) !important;
                font-size: 12px !important;
            }
            .EntityHeadingContainer .Bundle > div {
                display: inline-flex !important;
                align-items: center !important;
            }
            .EntityHeadingContainer .Bundle .Label {
                font-weight: 500 !important;
                color: var(--at-text-faint) !important;
                margin-right: 2px !important;
            }
            .IdentificationText {
                color: var(--at-text-faint) !important;
                font-size: 12px !important;
                font-variant-numeric: tabular-nums !important;
            }
            .StopwatchContainer {
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
                padding: 4px 10px !important;
                background: var(--at-surface-hover) !important;
                border: 1px solid var(--at-border) !important;
                border-radius: var(--at-radius-sm) !important;
            }
            .StopwatchTime {
                font-variant-numeric: tabular-nums !important;
                font-weight: 600 !important;
                font-size: 13px !important;
                color: var(--at-text) !important;
            }

            /* ===== Chips / badges ===== */
            .ChipContainer {
                display: inline-flex !important;
                align-items: center !important;
                gap: 6px !important;
            }
            .CategoryChip {
                border-radius: 999px !important;
                padding: 3px 10px !important;
                font-size: 10.5px !important;
                font-weight: 700 !important;
                letter-spacing: 0.04em !important;
                text-transform: uppercase !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 4px !important;
            }
            .CategoryChip .Name {
                font-size: inherit !important;
                font-weight: inherit !important;
            }
            .TypeChip {
                border-radius: 999px !important;
                padding: 3px 10px !important;
                font-size: 11px !important;
                font-weight: 500 !important;
                color: var(--at-text-muted) !important;
                background: var(--at-surface-hover) !important;
                border: 1px solid var(--at-border) !important;
                text-transform: none !important;
                letter-spacing: 0 !important;
            }
            .ChipContainer .Name {
                padding: 0 !important;
            }

            /* ===== Body / description text ===== */
            .EntityBodyRichText2,
            .ReadOnlyRichText {
                font-size: 13.5px !important;
                line-height: 1.6 !important;
                color: var(--at-text) !important;
                padding: 18px 20px !important;
                word-break: break-word !important;
                overflow-wrap: anywhere !important;
            }
            .ReadOnlyRichText img { max-height: 22px !important; vertical-align: middle !important; }
            .ReadOnlyRichText a {
                color: var(--at-accent) !important;
                word-break: break-all !important;
            }
            /* Collapse long runs of empty div/br noise in email descriptions */
            .ReadOnlyRichText br + br { display: none !important; }
            .ReadOnlyRichText div:empty { display: none !important; }
            .ReadOnlyRichText p:empty { display: none !important; }

            /* ===== Section heading (center column) ===== */
            .BodyContent {
                display: flex !important;
                flex-direction: column !important;
                gap: 12px !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }
            .BodyContent > .Normal.Section {
                border: 1px solid var(--at-border-subtle) !important;
                border-radius: var(--at-radius) !important;
                background: var(--at-surface) !important;
                margin: 0 !important;
            }
            .Normal.Section > .CollapsibleSectionContainer > .HeadingContainer > .Heading {
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                padding: 14px 20px !important;
                border-bottom: 1px solid var(--at-border-subtle) !important;
            }
            .Normal.Section .Heading .Text .PrimaryText {
                font-weight: 600 !important;
                font-size: 14px !important;
                color: var(--at-text) !important;
                letter-spacing: 0 !important;
            }
            .Normal.Section .SectionArrowIcon {
                opacity: 0.5 !important;
            }
            .Normal.Section > .CollapsibleSectionContainer > .ContentContainer > .Content {
                padding: 4px 6px !important;
            }

            /* ===== Timeline: compact ===== */
            .Section.Timeline .Timeline {
                padding: 16px 20px !important;
                height: auto !important;
                min-height: 0 !important;
            }
            .Section.Timeline .Bar {
                height: 3px !important;
                background: var(--at-border) !important;
                border-radius: 999px !important;
                position: relative !important;
            }
            .Section.Timeline .Divider {
                height: 8px !important;
            }
            .Section.Timeline .CurrentProgress,
            .Section.Timeline .TargetProgress {
                height: 3px !important;
                border-radius: 999px !important;
            }

            /* ===== Activity tab bar: container-variant ===== */
            .PrimaryContainer > div.AccessoryTabButtonBar,
            .PrimaryContainer > .AccessoryTabButtonBar,
            .AccessoryTabButtonBar {
                display: flex !important;
                flex-direction: row !important;
                flex-wrap: nowrap !important;
                gap: 4px !important;
                padding: 0 var(--at-activity-inline-gutter) !important;
                border-bottom: 1px solid var(--at-border) !important;
                background: transparent !important;
            }
            .AccessoryTabButtonBar .Button {
                flex: 0 0 auto !important;
                padding: 12px 16px !important;
                font-size: 14px !important;
                font-weight: 500 !important;
                border: none !important;
                border-bottom: 2px solid transparent !important;
                background: transparent !important;
                color: var(--at-text-muted) !important;
                border-radius: 0 !important;
                transition: all 0.15s !important;
                margin-bottom: -1px !important;
            }
            .AccessoryTabButtonBar .Button.SelectedState {
                color: var(--at-text) !important;
                border-bottom-color: var(--at-accent-icon) !important;
                background: transparent !important;
                font-weight: 600 !important;
            }
            .AccessoryTabButtonBar .Button:hover:not(.SelectedState) {
                color: var(--at-text) !important;
                background: var(--at-surface-hover) !important;
            }
            .AccessoryTabButtonBar .Spacer { flex: 1 !important; }

            /* Remove framework inset so activity rows align with tab bar gutters */
            .ActivityTabShell > .Content {
                padding-left: 0 !important;
                padding-right: 0 !important;
            }

            /* ===== Activity toolbar ===== */
            .ActivityTabShell > .Content > .ToolBar {
                padding: 10px var(--at-activity-inline-gutter) !important;
                margin: 0 !important;
                gap: 6px !important;
                display: flex !important;
                align-items: center !important;
                background: transparent !important;
                border-bottom: 1px solid var(--at-border-subtle) !important;
            }
            .ActivityTabShell .ToolBarItem { margin: 0 !important; }
            .ActivityTabShell .ButtonGroupDivider {
                width: 1px !important;
                height: 20px !important;
                background: var(--at-border) !important;
                margin: 0 4px !important;
            }

            /* ===== Quick note composer ===== */
            .QuickNote.Starter,
            .QuickNote.Reply {
                padding: 12px var(--at-activity-inline-gutter) !important;
                gap: 10px !important;
                background: var(--at-surface) !important;
                border-bottom: 1px solid var(--at-border-subtle) !important;
            }
            .QuickNote .Avatar { flex: 0 0 auto !important; }
            .QuickNote .Avatar img,
            .QuickNote .Avatar .Initials {
                width: 32px !important;
                height: 32px !important;
                border-radius: 50% !important;
            }
            .QuickNote .Details { flex: 1 !important; min-width: 0 !important; }

            .QuickNote .QuickNoteEditorContainer {
                display: flex !important;
                gap: 8px !important;
                align-items: stretch !important;
            }
            .QuickNote .Note { flex: 1 !important; min-width: 0 !important; }
            .QuickNote .Time { flex: 0 0 90px !important; }

            .QuickNote .TextArea2 {
                border-radius: var(--at-radius-sm) !important;
                border: 1px solid var(--at-border) !important;
                background: var(--at-surface) !important;
                padding: 6px 10px !important;
            }
            .QuickNote .TextArea2 textarea {
                border: none !important;
                padding: 0 !important;
                background: transparent !important;
                resize: none !important;
            }
            .QuickNote .CharacterInformation { display: none !important; }
            .QuickNote .TextArea2:focus-within .CharacterInformation {
                display: block !important;
            }

            .QuickTimeEntryMinutesBox2 {
                height: 100% !important;
                border-radius: var(--at-radius-sm) !important;
                border: 1px solid var(--at-border) !important;
                background: var(--at-surface) !important;
                padding: 0 8px !important;
                display: flex !important;
                align-items: center !important;
                gap: 4px !important;
            }
            .QuickTimeEntryMinutesBox2 input {
                border: none !important;
                padding: 0 !important;
                width: 32px !important;
                background: transparent !important;
            }
            .QuickTimeEntryMinutesBox2 .Minutes {
                font-size: 12px !important;
                color: var(--at-text-muted) !important;
            }
            .QuickTimeEntryMinutesBox2.Disabled { opacity: 0.5 !important; }

            /* ===== Filter bar ===== */
            .ActivityFilterBar {
                margin: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
            }
            .ActivityFilterBar .FilterBarRow {
                display: flex !important;
                gap: 16px !important;
                padding: 8px var(--at-activity-inline-gutter) !important;
                align-items: center !important;
            }
            .ActivityFilterBar .FilterBarHalf {
                width: auto !important;
                flex: 0 0 auto !important;
            }
            .ActivityFilterBar .EditorFacade2 { margin: 0 !important; }
            .ActivityFilterBar .Checkbox2 {
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
                padding: 0 !important;
            }
            .ActivityFilterBar .Checkbox2 .LabelContainer1 .Text {
                font-size: 12px !important;
                color: var(--at-text-muted) !important;
            }

            /* ===== Advanced options row ===== */
            .ActivityAdvancedOptions {
                display: flex !important;
                gap: 8px !important;
                align-items: center !important;
                padding: 8px var(--at-activity-inline-gutter) !important;
                background: var(--at-surface) !important;
                border-top: 1px solid var(--at-border-subtle) !important;
                border-bottom: 1px solid var(--at-border-subtle) !important;
            }
            .ActivityAdvancedOptions .FilterButtonPair {
                display: flex !important;
                gap: 0 !important;
                align-items: center !important;
            }
            .ActivityAdvancedOptions .FilterButtonPair .Button.Filter {
                border: 1px solid var(--at-border) !important;
                border-right: none !important;
                border-radius: var(--at-radius-sm) 0 0 var(--at-radius-sm) !important;
                padding: 6px 10px !important;
                font-size: 13px !important;
                color: var(--at-text) !important;
                background: var(--at-surface) !important;
            }
            .ActivityAdvancedOptions .FilterButtonPair .Button.Filter.SelectedState {
                background: var(--at-accent) !important;
                border-color: var(--at-accent) !important;
                color: #fff !important;
            }
            .ActivityAdvancedOptions .FilterButtonPair .IconButtonWrapper2 .Button2 {
                border-radius: 0 var(--at-radius-sm) var(--at-radius-sm) 0 !important;
                border-left: none !important;
                height: 100% !important;
            }
            .ActivityAdvancedOptions > input[type="text"] {
                flex: 1 !important;
                min-width: 0 !important;
                padding: 6px 10px !important;
                border-radius: var(--at-radius-sm) !important;
                border: 1px solid var(--at-border) !important;
                font-size: 13px !important;
            }
            .ActivityAdvancedOptions > select {
                flex: 0 0 auto !important;
                min-width: 230px !important;
                padding: 6px 28px 6px 10px !important;
                border-radius: var(--at-radius-sm) !important;
                border: 1px solid var(--at-border) !important;
                font-size: 13px !important;
                background: var(--at-surface) !important;
                color: var(--at-text) !important;
                cursor: pointer !important;
                appearance: none !important;
                -webkit-appearance: none !important;
                background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8.5L2 4.5h8z'/%3E%3C/svg%3E") !important;
                background-repeat: no-repeat !important;
                background-position: right 10px center !important;
            }

            /* ===== Activity layout polish (current ActivityTabShell markup) ===== */
            .ActivityTabShell > .Content > .ToolBar {
                flex-wrap: wrap !important;
                row-gap: 8px !important;
                column-gap: 8px !important;
            }
            .ActivityTabShell > .Content > .ToolBar .ToolBarItem.Left .Button2 {
                min-height: 34px !important;
            }

            .ActivityTabShell > .Content .QuickNote.Starter.Inactive,
            .ActivityTabShell > .Content .QuickNote.ConversationItem.Reply {
                display: flex !important;
                align-items: flex-start !important;
            }
            .ActivityTabShell > .Content .QuickNote .Details {
                display: flex !important;
                flex-direction: column !important;
                gap: 10px !important;
            }
            .ActivityTabShell > .Content .QuickNote .ButtonBar {
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                flex-wrap: wrap !important;
            }
            .ActivityTabShell > .Content .QuickNote .ButtonBar .Size1 {
                min-width: 170px !important;
                flex: 0 0 auto !important;
            }
            .ActivityTabShell > .Content .QuickNote .ButtonBar .DropDownList2 {
                min-height: 34px !important;
            }

            .ActivityTabShell > .Content .QuickNote .OptionBar {
                display: flex !important;
                flex-direction: column !important;
                gap: 6px !important;
            }
            .ActivityTabShell > .Content .QuickNote .OptionBar .OptionBarRow {
                display: grid !important;
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                gap: 8px 14px !important;
                margin: 0 !important;
            }
            .ActivityTabShell > .Content .QuickNote .OptionBar .OptionBarHalf {
                width: auto !important;
                min-width: 0 !important;
            }

            .ActivityTabShell > .Content .ActivityFilterBar .FilterBarRow,
            .ActivityTabShell > .Content .ActivityAdvancedOptions {
                flex-wrap: wrap !important;
            }
            .ActivityTabShell > .Content .ActivityAdvancedOptions > input[type="text"] {
                min-width: 260px !important;
            }

            @media (max-width: 980px) {
                .ActivityTabShell > .Content .QuickNote .QuickNoteEditorContainer {
                    flex-direction: column !important;
                }
                .ActivityTabShell > .Content .QuickNote .Time {
                    flex: 0 0 auto !important;
                    width: 100% !important;
                }
                .ActivityTabShell > .Content .QuickTimeEntryMinutesBox2 {
                    min-height: 34px !important;
                    width: 100% !important;
                    justify-content: space-between !important;
                }
                .ActivityTabShell > .Content .QuickNote .OptionBar .OptionBarRow {
                    grid-template-columns: 1fr !important;
                }
                .ActivityTabShell > .Content .ActivityAdvancedOptions > input[type="text"],
                .ActivityTabShell > .Content .ActivityAdvancedOptions > select {
                    flex: 1 1 100% !important;
                    min-width: 0 !important;
                }
            }

            /* ===== Activity feed conversation items ===== */
            .ConversationItem {
                padding: 10px 14px !important;
                border-bottom: 1px solid var(--at-border-subtle) !important;
                background: transparent !important;
                transition: background 0.15s !important;
            }
            .ConversationItem:hover { background: var(--at-surface-hover) !important; }
            .ConversationItem .Title .Text {
                font-weight: 600 !important;
                font-size: 13px !important;
            }
            .ConversationItem .Subtitle,
            .ConversationItem .Timestamp {
                color: var(--at-text-muted) !important;
                font-size: 12px !important;
            }
            .ConversationItem .Message {
                font-size: 13.5px !important;
                line-height: 1.5 !important;
                margin-top: 4px !important;
            }
            .Avatar img, .Avatar .Initials { border-radius: 50% !important; }

            /* ===== Inputs & text areas ===== */
            textarea, input[type="text"], select, .TextArea2 textarea {
                border-radius: var(--at-radius-sm) !important;
                border: 1px solid var(--at-border) !important;
                background: var(--at-surface) !important;
                color: var(--at-text) !important;
                padding: 6px 10px !important;
                font-size: 13px !important;
                transition: border-color 0.15s, box-shadow 0.15s !important;
            }
            textarea:focus, input[type="text"]:focus, select:focus {
                outline: none !important;
                border-color: var(--at-accent) !important;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
            }

            /* ===== Toolbar button hiding ===== */
            .ToolBarItem:has(.StandardButtonIcon.PrintView),
            .ToolBarItem:has(.StandardButtonIcon.BookOpen),
            .ToolBarItem:has(.StandardButtonIcon.Livelink) {
                display: none !important;
            }

            /* ===== Secondary container constraint ===== */
            .SecondaryContainer.Right { max-width: 340px !important; }

            /* ===== Scrollbar polish ===== */
            ::-webkit-scrollbar { width: 10px; height: 10px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb {
                background: var(--at-border);
                border-radius: 999px;
                border: 2px solid var(--at-bg);
            }
            ::-webkit-scrollbar-thumb:hover { background: var(--at-text-faint); }
        `;
        (document.head || document.documentElement).appendChild(style);

        // Autotask's own stylesheets load AFTER document-start injection and
        // win the cascade when specificity ties. Re-append our <style> so it
        // ends up LAST in the document, giving our !important rules priority.
        function reappendStyle() {
            if (style.parentNode !== document.head) {
                document.head.appendChild(style);
            } else {
                // move to end of head
                document.head.appendChild(style);
            }
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', reappendStyle);
        } else {
            reappendStyle();
        }
        window.addEventListener('load', reappendStyle);
        // Also observe <head> for new stylesheets and keep ours last
        const headObserver = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (
                        node !== style &&
                        (node.nodeName === 'LINK' || node.nodeName === 'STYLE') &&
                        style.parentNode === document.head &&
                        document.head.lastElementChild !== style
                    ) {
                        document.head.appendChild(style);
                        return;
                    }
                }
            }
        });
        const startObserver = () => {
            if (document.head) headObserver.observe(document.head, { childList: true });
        };
        if (document.head) startObserver();
        else document.addEventListener('DOMContentLoaded', startObserver, { once: true });

        // QuickLaunch labels are hidden in our compact dock; expose them as tooltips.
        function applyQuickLaunchTooltips(root = document) {
            const buttons = root.querySelectorAll('.QuickLaunchBar .QuickLaunchButton');
            for (const btn of buttons) {
                const textEl = btn.querySelector('.Text');
                if (!textEl) continue;
                const raw = (textEl.textContent || '').replace(/\s+/g, ' ').trim();
                if (!raw) continue;
                const label = raw.replace(/\s*\(Alt\s*\+\s*\d+\)\s*$/i, '').trim();
                if (!label) continue;
                btn.setAttribute('title', label);
                btn.setAttribute('aria-label', label);
            }
        }

        const runQuickLaunchTooltips = () => applyQuickLaunchTooltips(document);
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', runQuickLaunchTooltips);
        } else {
            runQuickLaunchTooltips();
        }
        window.addEventListener('load', runQuickLaunchTooltips);

        const quickLaunchObserver = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (!(node instanceof Element)) continue;
                    if (
                        node.matches?.('.QuickLaunchBar') ||
                        node.matches?.('.QuickLaunchButton') ||
                        node.querySelector?.('.QuickLaunchBar, .QuickLaunchButton')
                    ) {
                        runQuickLaunchTooltips();
                        return;
                    }
                }
            }
        });
        if (document.body) {
            quickLaunchObserver.observe(document.body, { childList: true, subtree: true });
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                if (document.body) {
                    quickLaunchObserver.observe(document.body, { childList: true, subtree: true });
                }
            }, { once: true });
        }
    }

    // ===== Click interception (iframe only) =====
    if (isInIframe) {
        const HANDLED_PATHS = [
            '/Mvc/ServiceDesk/TicketDetail.mvc',
            '/Mvc/CRM/AccountDetail.mvc',
        ];

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
            const match = onclickText.match(
                /NewWindowPage\s*\(\s*'[^']*'\s*,\s*'([^']+)'\s*,\s*(?:true|false)\s*,\s*'([^']+)'\s*,\s*'([^']+)'/
            );
            if (!match) return null;
            const rawUrl = match[1];
            const key = match[2];
            const value = match[3];
            if (!HANDLED_PATHS.some(p => rawUrl.startsWith(p))) return null;
            const baseUrl = decodeAutotaskUrl(rawUrl);
            const sep = baseUrl.includes('?') ? '&' : '?';
            return baseUrl + sep + encodeURIComponent(key) + '=' + encodeURIComponent(value);
        }

        document.addEventListener(
            'click',
            function (event) {
                const cell = event.target.closest('td[onclick]');
                if (!cell) return;
                const onclickText = cell.getAttribute('onclick') || '';
                if (!HANDLED_PATHS.some(p => onclickText.includes(p))) return;

                const targetUrl = extractUrlFromOnclick(onclickText);
                if (!targetUrl) {
                    console.warn('[Autotask iframe] Could not extract URL from onclick');
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                const finalUrl = toAbsoluteUrl(targetUrl);
                console.log('[Autotask iframe] Navigating frame to:', finalUrl);
                window.location.href = finalUrl;
            },
            true
        );

        console.log('[Autotask iframe] Click interception active');
    }
})();
