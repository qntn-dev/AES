// Background script (service worker on Chrome, event page script on
// Firefox). Sole job: when the user clicks the extension's toolbar icon, ask
// the active tab's content script to open the AES Settings modal. The toolbar
// `action` declares no `default_popup`, so `action.onClicked` fires here.
//
// On non-Autotask tabs there is no AES content script listening and the
// `tabs.sendMessage` Promise rejects with "Could not establish connection".
// We swallow that error — the toolbar button silently does nothing on those
// tabs, which matches user expectation.
(function () {
    'use strict';

    const api = (typeof browser !== 'undefined' && browser && browser.action) ? browser : chrome;
    if (!api || !api.action || !api.action.onClicked || !api.tabs) return;
    const GITHUB_LATEST_RELEASE_API_URL = 'https://api.github.com/repos/qntn-dev/AES/releases/latest';
    const SETTINGS_STORAGE_KEY = 'autotask-tabs-settings-v1';
    const UMBRELLA_CONTRACT_FRAME_RULE_ID = 1101;
    const lastKnownTabUrls = new Map();
    const registeredShellTabs = new Map();
    // Mirrors the "Enable AES: Tabs for Autotask" general switch. When that
    // switch is off we must not redirect externally-opened Autotask URLs into
    // AES. Defaults to enabled until storage is read (matches content scripts).
    let extensionEnabled = true;

    if (!globalThis.__AES_ROUTE_REGISTRY__ && typeof importScripts === 'function') {
        try {
            importScripts('aes-local-flags.js');
        } catch (error) {
            try {
                importScripts('/src/aes-local-flags.js');
            } catch (_error) {
                // Store builds intentionally omit local-only experiment flags.
            }
        }
        try {
            importScripts('aes-routes.js');
        } catch (error) {
            try {
                importScripts('/src/aes-routes.js');
            } catch (_error) {
                // The manifest-driven Firefox background loads this file separately.
            }
        }
    }

    const ROUTES = globalThis.__AES_ROUTE_REGISTRY__ || {};

    function localUmbrellaContractFrameExperimentAvailable() {
        return !!(
            globalThis.__AES_LOCAL_FLAGS__ &&
            globalThis.__AES_LOCAL_FLAGS__.umbrellaContractFrameExperiment
        );
    }

    function fetchLatestGithubRelease(sendResponse) {
        if (typeof fetch !== 'function') {
            sendResponse({ ok: false, reason: 'fetch-unavailable' });
            return;
        }
        fetch(GITHUB_LATEST_RELEASE_API_URL, {
            headers: {
                Accept: 'application/vnd.github+json',
            },
            cache: 'no-store',
        })
            .then(function (response) {
                if (!response.ok) throw new Error('github-release-http-' + response.status);
                return response.json();
            })
            .then(function (release) {
                if (!release || release.draft || release.prerelease) {
                    sendResponse({ ok: false, reason: 'no-stable-release' });
                    return;
                }
                const tagName = String(release.tag_name || '').trim();
                const version = tagName.replace(/^v/i, '').trim();
                if (!version || version.includes('-')) {
                    sendResponse({ ok: false, reason: 'no-stable-release' });
                    return;
                }
                sendResponse({
                    ok: true,
                    version: version,
                    tagName: tagName,
                    name: String(release.name || tagName || version).trim(),
                    htmlUrl: String(release.html_url || 'https://github.com/qntn-dev/AES/releases/latest').trim(),
                    publishedAt: String(release.published_at || '').trim(),
                });
            })
            .catch(function (error) {
                sendResponse({ ok: false, reason: String(error && error.message || error || 'unknown-error') });
            });
    }

    function isRegionalAutotaskHost(hostname) {
        return /^ww\d+\.autotask\.net$/i.test(String(hostname || ''));
    }

    
    function normalizePath(pathname) {
        if (ROUTES.normalizePath) {
            return ROUTES.normalizePath(pathname);
        }
        return String(pathname || '').toLowerCase().replace(/\/index$/, '');
    }

    function isHandledAutotaskPath(path) {
        const normalizedPath = normalizePath(path);
        if (ROUTES.isHandledPath) {
            return ROUTES.isHandledPath(normalizedPath);
        }
        return false;
    }

    function toAbsoluteUrl(url, baseUrl) {
        try {
            return new URL(String(url || ''), baseUrl).href;
        } catch (e) {
            return '';
        }
    }

    function extractInnerUrlFromLandingPageUrl(url) {
        try {
            const landingUrl = new URL(String(url || ''));
            if (normalizePath(landingUrl.pathname) !== '/autotaskonyx/landingpage') return '';

            const rawViewData = landingUrl.searchParams.get('view-data');
            if (!rawViewData) return '';

            const parsed = JSON.parse(atob(rawViewData));
            const innerUrl = parsed && typeof parsed.url === 'string' ? parsed.url : '';
            return innerUrl ? toAbsoluteUrl(innerUrl, landingUrl.origin) : '';
        } catch (e) {
            return '';
        }
    }

    function normalizeExternalAutotaskUrl(url) {
        try {
            const parsed = new URL(String(url || ''));
            const path = normalizePath(parsed.pathname);
            if (!isRegionalAutotaskHost(parsed.hostname)) return '';
            const innerUrl = extractInnerUrlFromLandingPageUrl(parsed.href);
            if (innerUrl) return normalizeExternalAutotaskUrl(innerUrl);
            if (isDialogPopOutFromDialogPath(path)) return '';
            if (!isHandledAutotaskPath(path)) return '';
            return parsed.href;
        } catch (e) {
            return '';
        }
    }

    function rewriteToTabRegion(url, tabUrl) {
        try {
            const target = new URL(url);
            const tab = new URL(tabUrl || '');
            if (isRegionalAutotaskHost(target.hostname) && isRegionalAutotaskHost(tab.hostname)) {
                target.hostname = tab.hostname;
            }
            return target.href;
        } catch (e) {
            return url;
        }
    }

    function callApi(method, args) {
        try {
            const result = method.apply(null, args || []);
            if (result && typeof result.then === 'function') return result;
            return Promise.resolve(result);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    function umbrellaContractFrameRule() {
        return {
            id: UMBRELLA_CONTRACT_FRAME_RULE_ID,
            priority: 1,
            action: {
                type: 'modifyHeaders',
                responseHeaders: [
                    { header: 'content-security-policy', operation: 'remove' },
                    { header: 'x-frame-options', operation: 'remove' },
                ],
            },
            condition: {
                regexFilter: '^https://[^/]+\\.autotask\\.net/AutotaskOnyx/LandingPage\\?(?:[^#]*&)?view=umbrella-contract-details(?:&|$)',
                resourceTypes: ['sub_frame'],
            },
        };
    }

    function setUmbrellaContractFrameRulesEnabled(enabled) {
        if (!localUmbrellaContractFrameExperimentAvailable()) {
            enabled = false;
        }
        if (!api.declarativeNetRequest || !api.declarativeNetRequest.updateDynamicRules) {
            return Promise.resolve({ ok: false, reason: 'declarative-net-request-unavailable' });
        }

        const options = {
            removeRuleIds: [UMBRELLA_CONTRACT_FRAME_RULE_ID],
        };
        if (enabled) {
            options.addRules = [umbrellaContractFrameRule()];
        }

        return callApi(
            api.declarativeNetRequest.updateDynamicRules.bind(api.declarativeNetRequest),
            [options]
        )
            .then(function () {
                return { ok: true, enabled: !!enabled };
            })
            .catch(function (error) {
                return {
                    ok: false,
                    reason: String(error && error.message || error || 'unknown-error'),
                };
            });
    }

    function readUmbrellaContractFrameSetting(settings) {
        return !!(settings && settings.experimentalUmbrellaContractFrameTabs);
    }

    // The general switch defaults on, so only an explicit `false` disables it.
    function readExtensionEnabledSetting(settings) {
        return !(settings && settings.extensionEnabled === false);
    }

    function isUrlRedirectionEnabled() {
        return extensionEnabled;
    }

    function syncUmbrellaContractFrameRulesFromStorage() {
        if (!api.storage || !api.storage.local || !api.storage.local.get) return;
        try {
            const maybePromise = api.storage.local.get([SETTINGS_STORAGE_KEY]);
            if (maybePromise && typeof maybePromise.then === 'function') {
                maybePromise
                    .then(function (result) {
                        const settings = result && result[SETTINGS_STORAGE_KEY];
                        extensionEnabled = readExtensionEnabledSetting(settings);
                        return setUmbrellaContractFrameRulesEnabled(readUmbrellaContractFrameSetting(settings));
                    })
                    .catch(function () {});
                return;
            }
            api.storage.local.get([SETTINGS_STORAGE_KEY], function (result) {
                const settings = result && result[SETTINGS_STORAGE_KEY];
                extensionEnabled = readExtensionEnabledSetting(settings);
                setUmbrellaContractFrameRulesEnabled(readUmbrellaContractFrameSetting(settings));
            });
        } catch (e) {}
    }

    function sendMessageToTab(tabId, message) {
        if (typeof tabId !== 'number') return Promise.reject(new Error('Missing tab id'));
        return callApi(api.tabs.sendMessage.bind(api.tabs), [tabId, message]);
    }

    function focusTab(tab) {
        if (!tab || typeof tab.id !== 'number') return Promise.resolve();
        const tasks = [callApi(api.tabs.update.bind(api.tabs), [tab.id, { active: true }]).catch(function () {})];
        if (api.windows && typeof tab.windowId === 'number') {
            tasks.push(callApi(api.windows.update.bind(api.windows), [tab.windowId, { focused: true }]).catch(function () {}));
        }
        return Promise.all(tasks).then(function () {});
    }

    function isExternalOpenerUrl(url) {
        try {
            const parsed = new URL(url || '');
            return /^https?:$/i.test(parsed.protocol) && (
                !isRegionalAutotaskHost(parsed.hostname) ||
                isAutotaskExternalBridgeOpenerUrl(parsed.href)
            );
        } catch (e) {
            return false;
        }
    }

    function isAutotaskExternalBridgeOpenerUrl(url) {
        try {
            const parsed = new URL(url || '');
            if (!isRegionalAutotaskHost(parsed.hostname)) return false;
            if (normalizePath(parsed.pathname) !== '/autotask/autotaskextend/executecommand.aspx') return false;
            return String(parsed.searchParams.get('Code') || '').toLowerCase() === 'openticketdetail';
        } catch (e) {
            return false;
        }
    }

    function shouldCloseSameTabExternalOpenSource(url) {
        return isAutotaskExternalBridgeOpenerUrl(url);
    }

    function isDialogPopOutFromDialogPath(path) {
        return path === '/mvc/servicedesk/timeentry.mvc/timeentrypopoutfromdialog' ||
            path === '/mvc/servicedesk/note.mvc/notepopoutfromdialog';
    }

    function dialogPopOutPathFromUrl(url) {
        try {
            const parsed = new URL(String(url || ''));
            if (!isRegionalAutotaskHost(parsed.hostname)) return '';
            return normalizePath(parsed.pathname);
        } catch (e) {
            return '';
        }
    }

    function isRegisteredShellUrl(url) {
        try {
            const parsed = new URL(url || '');
            if (!isRegionalAutotaskHost(parsed.hostname)) return false;
            const path = normalizePath(parsed.pathname);
            return path === '/autotaskonyx' || path.startsWith('/autotaskonyx/');
        } catch (e) {
            return false;
        }
    }

    function registerShellTab(tab) {
        if (!tab || typeof tab.id !== 'number' || !isRegisteredShellUrl(tab.url || '')) return false;
        registeredShellTabs.set(tab.id, {
            id: tab.id,
            windowId: tab.windowId,
            url: tab.url || '',
            lastSeenAt: Date.now(),
        });
        return true;
    }

    function chooseRegisteredShellTab(tabs, sender) {
        const senderTab = sender && sender.tab;
        const senderTabId = senderTab && typeof senderTab.id === 'number' ? senderTab.id : null;
        const senderWindowId = senderTab && typeof senderTab.windowId === 'number' ? senderTab.windowId : null;
        const candidates = (tabs || []).filter(function (tab) {
            if (!tab || typeof tab.id !== 'number') return false;
            if (senderTabId !== null && tab.id === senderTabId) return false;
            if (!registeredShellTabs.has(tab.id)) return false;
            if (!isRegisteredShellUrl(tab.url || '')) {
                registeredShellTabs.delete(tab.id);
                return false;
            }
            return true;
        });

        return candidates.find(tab => tab.active && tab.windowId === senderWindowId)
            || candidates.find(tab => tab.windowId === senderWindowId)
            || candidates.find(tab => tab.active)
            || candidates[0]
            || null;
    }

    function openDirectHandledUrlInExistingShell(message, sender, sendResponse) {
        if (!isUrlRedirectionEnabled()) {
            sendResponse({ ok: false, reason: 'extension-disabled' });
            return;
        }
        const rawUrl = normalizeExternalAutotaskUrl(message && message.url);
        const senderTab = sender && sender.tab;
        if (!rawUrl || !senderTab || typeof senderTab.id !== 'number') {
            sendResponse({ ok: false, reason: 'unsupported-url' });
            return;
        }

        callApi(api.tabs.query.bind(api.tabs), [{ url: ['https://*.autotask.net/*'] }])
            .then(function (tabs) {
                const targetTab = chooseRegisteredShellTab(tabs, sender);
                if (!targetTab) {
                    sendResponse({ ok: false, reason: 'no-registered-shell' });
                    return null;
                }
                const targetUrl = rewriteToTabRegion(rawUrl, targetTab.url);
                return focusTab(targetTab)
                    .then(function () {
                        return sendMessageToTab(targetTab.id, {
                            __aesExternalOpen: true,
                            type: 'open-autotask-url',
                            url: targetUrl,
                        });
                    })
                    .then(function () {
                        callApi(api.tabs.remove.bind(api.tabs), [senderTab.id]).catch(function () {});
                        sendResponse({ ok: true, mode: 'registered-shell', url: targetUrl });
                    })
                    .catch(function (error) {
                        registeredShellTabs.delete(targetTab.id);
                        sendResponse({
                            ok: false,
                            reason: String(error && error.message || error || 'shell-message-failed'),
                        });
                    });
            })
            .catch(function (error) {
                sendResponse({ ok: false, reason: String(error && error.message || error || 'unknown-error') });
            });
    }

    function rememberTabUrl(tabId, url) {
        if (typeof tabId !== 'number' || !url) return;
        lastKnownTabUrls.set(tabId, String(url));
    }

    function restoreExternalTabUrl(tabId, externalUrl, openedAutotaskUrl) {
        if (typeof tabId !== 'number' || !externalUrl) return;
        callApi(api.tabs.get.bind(api.tabs), [tabId])
            .then(function (tab) {
                if (!tab || typeof tab.id !== 'number') return;
                const currentAutotaskUrl = normalizeExternalAutotaskUrl(tab.url || '');
                if (currentAutotaskUrl && currentAutotaskUrl === openedAutotaskUrl) {
                    rememberTabUrl(tabId, externalUrl);
                    return callApi(api.tabs.update.bind(api.tabs), [tabId, { url: externalUrl }]);
                }
                return null;
            })
            .catch(function () {});
    }

    function chooseAutotaskTab(tabs, sender, excludedTabId) {
        const candidates = (tabs || []).filter(function (tab) {
            if (typeof excludedTabId === 'number' && tab.id === excludedTabId) return false;
            try { return isRegionalAutotaskHost(new URL(tab.url || '').hostname); }
            catch (e) { return false; }
        });
        const senderWindowId = sender && sender.tab && typeof sender.tab.windowId === 'number'
            ? sender.tab.windowId
            : null;
        return candidates.find(tab => tab.active && tab.windowId === senderWindowId)
            || candidates.find(tab => tab.windowId === senderWindowId)
            || candidates.find(tab => tab.active)
            || candidates[0]
            || null;
    }

    function openExternalAutotaskUrl(message, sender, sendResponse, options) {
        if (!isUrlRedirectionEnabled()) {
            sendResponse({ ok: false, reason: 'extension-disabled' });
            return;
        }
        const rawUrl = normalizeExternalAutotaskUrl(message && message.url);
        if (!rawUrl) {
            sendResponse({ ok: false, reason: 'unsupported-url' });
            return;
        }

        callApi(api.tabs.query.bind(api.tabs), [{ url: ['https://*.autotask.net/*'] }])
            .then(function (tabs) {
                const targetTab = chooseAutotaskTab(tabs, sender, options && options.excludeTabId);
                if (!targetTab) {
                    if (options && options.noNativeFallback) {
                        sendResponse({ ok: false, reason: 'no-autotask-tab' });
                        return null;
                    }
                    return callApi(api.tabs.create.bind(api.tabs), [{ url: rawUrl }])
                        .then(function () {
                            sendResponse({ ok: true, mode: 'native-tab' });
                        });
                }

                const targetUrl = rewriteToTabRegion(rawUrl, targetTab.url);
                return focusTab(targetTab)
                    .then(function () {
                        return sendMessageToTab(targetTab.id, {
                            __aesExternalOpen: true,
                            type: 'open-autotask-url',
                            url: targetUrl,
                        });
                    })
                    .then(function () {
                        if (options && typeof options.closeTabId === 'number') {
                            callApi(api.tabs.remove.bind(api.tabs), [options.closeTabId]).catch(function () {});
                        }
                        sendResponse({ ok: true, mode: 'aes-tab', url: targetUrl });
                    })
                    .catch(function () {
                        return callApi(api.tabs.create.bind(api.tabs), [{ url: targetUrl }])
                            .then(function () {
                                sendResponse({ ok: true, mode: 'fallback-native-tab', url: targetUrl });
                            });
                    });
            })
            .catch(function (error) {
                sendResponse({ ok: false, reason: String(error && error.message || error || 'unknown-error') });
            });
    }

    function sendShellUiMessage(tab, message) {
        if (!tab || typeof tab.id !== 'number') return;
        try {
            const sending = api.tabs.sendMessage(tab.id, message);
            if (sending && typeof sending.catch === 'function') {
                sending.catch(function () { /* ignore: not an AES tab */ });
            }
        } catch (e) {
            // ignore — tab not injectable / no listener
        }
    }

    api.action.onClicked.addListener(function (tab) {
        sendShellUiMessage(tab, {
            __aesToolbar: true,
            type: 'open-settings'
        });
    });

    if (api.commands && api.commands.onCommand) {
        api.commands.onCommand.addListener(function (command, tab) {
            if (command !== 'close-all-tabs') return;
            // Chrome sometimes invokes the command without a tab
            // context (e.g. when focus is on DevTools, the extensions
            // page, or some Mac focus edge cases). Fall back to the
            // active tab in the last-focused normal window.
            if (tab && typeof tab.id === 'number') {
                sendShellUiMessage(tab, {
                    __aesCommand: true,
                    type: 'close-all-tabs'
                });
                return;
            }
            try {
                api.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
                    const resolved = tabs && tabs[0];
                    if (!resolved) return;
                    sendShellUiMessage(resolved, {
                        __aesCommand: true,
                        type: 'close-all-tabs'
                    });
                });
            } catch (e) {}
        });
    }

    if (api.runtime && api.runtime.onMessage) {
        api.runtime.onMessage.addListener(function (message, sender, sendResponse) {
            if (message && message.__aesReleaseCheck && message.type === 'latest-release') {
                fetchLatestGithubRelease(sendResponse);
                return true;
            }
            if (message && message.__aesUmbrellaContractFrameRules && message.type === 'set-enabled') {
                setUmbrellaContractFrameRulesEnabled(!!message.enabled)
                    .then(sendResponse)
                    .catch(function (error) {
                        sendResponse({
                            ok: false,
                            reason: String(error && error.message || error || 'unknown-error'),
                        });
                    });
                return true;
            }
            if (message && message.__aesShellReady && message.type === 'shell-ready') {
                sendResponse({ ok: registerShellTab(sender && sender.tab) });
                return false;
            }
            if (message && message.__aesDirectHandledOpen && message.type === 'open-in-existing-shell') {
                openDirectHandledUrlInExistingShell(message, sender, sendResponse);
                return true;
            }
            if (!message || !message.__aesExternalOpen || message.type !== 'open-autotask-url') return false;
            openExternalAutotaskUrl(message, sender, sendResponse);
            return true;
        });
    }

    if (api.storage && api.storage.onChanged) {
        api.storage.onChanged.addListener(function (changes, areaName) {
            if (areaName !== 'local' || !changes || !changes[SETTINGS_STORAGE_KEY]) return;
            const settings = changes[SETTINGS_STORAGE_KEY].newValue;
            extensionEnabled = readExtensionEnabledSetting(settings);
            setUmbrellaContractFrameRulesEnabled(readUmbrellaContractFrameSetting(settings));
        });
    }

    if (api.tabs.onCreated) {
        api.tabs.onCreated.addListener(function (tab) {
            const rawUrl = tab && (tab.pendingUrl || tab.url);
            const openedUrl = normalizeExternalAutotaskUrl(rawUrl);
            if (tab && typeof tab.id === 'number') {
                rememberTabUrl(tab.id, rawUrl);
            }
            if (!openedUrl || !tab || typeof tab.id !== 'number') return;
            if (typeof tab.openerTabId !== 'number') {
                return;
            }

            callApi(api.tabs.get.bind(api.tabs), [tab.openerTabId])
                .then(function (openerTab) {
                    if (!isExternalOpenerUrl(openerTab && openerTab.url)) return;
                    openExternalAutotaskUrl(
                        { url: openedUrl },
                        { tab: openerTab },
                        function () {},
                        { excludeTabId: tab.id, closeTabId: tab.id, noNativeFallback: true }
                    );
                })
                .catch(function () {});
        });
    }

    if (api.tabs.onUpdated) {
        api.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
            const previousUrl = lastKnownTabUrls.get(tabId) || '';
            const rawUrl = changeInfo && changeInfo.url;
            const openedUrl = normalizeExternalAutotaskUrl(rawUrl);
            if (changeInfo && changeInfo.url) {
                rememberTabUrl(tabId, changeInfo.url);
                if (registeredShellTabs.has(tabId) && !isRegisteredShellUrl(changeInfo.url)) {
                    registeredShellTabs.delete(tabId);
                }
            }
            if (!openedUrl || !tab) return;

            if (typeof tab.openerTabId !== 'number') {
                if (!isExternalOpenerUrl(previousUrl)) {
                    return;
                }
                openExternalAutotaskUrl(
                    { url: openedUrl },
                    { tab: { id: tabId, windowId: tab.windowId, url: previousUrl } },
                    function (response) {
                        if (response && response.ok && response.mode === 'aes-tab') {
                            if (shouldCloseSameTabExternalOpenSource(previousUrl)) {
                                callApi(api.tabs.remove.bind(api.tabs), [tabId]).catch(function () {});
                                return;
                            }
                            restoreExternalTabUrl(tabId, previousUrl, openedUrl);
                        }
                    },
                    { excludeTabId: tabId, noNativeFallback: true }
                );
                return;
            }

            callApi(api.tabs.get.bind(api.tabs), [tab.openerTabId])
                .then(function (openerTab) {
                    if (!isExternalOpenerUrl(openerTab && openerTab.url)) return;
                    openExternalAutotaskUrl(
                        { url: openedUrl },
                        { tab: openerTab },
                        function () {},
                        { excludeTabId: tabId, closeTabId: tabId, noNativeFallback: true }
                    );
                })
                .catch(function () {});
        });
    }

    if (api.tabs.onRemoved) {
        api.tabs.onRemoved.addListener(function (tabId) {
            lastKnownTabUrls.delete(tabId);
            registeredShellTabs.delete(tabId);
        });
    }

    syncUmbrellaContractFrameRulesFromStorage();
})();
