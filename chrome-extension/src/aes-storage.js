(function () {
    'use strict';

    const AES = window.__AES__;
    if (!AES || AES.storageInitialized) return;
    AES.storageInitialized = true;

    AES.state = AES.state || {};
    if (typeof AES.state.extensionEnabled !== 'boolean') {
        AES.state.extensionEnabled = true;
    }
    if (typeof AES.state.rememberTabsAfterClose !== 'boolean') {
        AES.state.rememberTabsAfterClose = true;
    }
    if (typeof AES.state.openNewTabsAtStart !== 'boolean') {
        AES.state.openNewTabsAtStart = false;
    }
    if (typeof AES.state.phoneLinksEnabled !== 'boolean') {
        AES.state.phoneLinksEnabled = true;
    }
    if (typeof AES.state.themePreference !== 'string'
        || !['auto', 'light', 'dark'].includes(AES.state.themePreference)) {
        AES.state.themePreference = 'auto';
    }
    if (typeof AES.state.barOrientation !== 'string'
        || !['horizontal', 'vertical'].includes(AES.state.barOrientation)) {
        AES.state.barOrientation = 'horizontal';
    }
    if (typeof AES.state.hideEarlyAccessLabels !== 'boolean') {
        AES.state.hideEarlyAccessLabels = false;
    }
    if (typeof AES.state.replaceCalendarWithResourcePlanner !== 'boolean') {
        AES.state.replaceCalendarWithResourcePlanner = false;
    }
    if (typeof AES.state.showTabBarOnNonIframePages !== 'boolean') {
        AES.state.showTabBarOnNonIframePages = true;
    }
    if (typeof AES.state.resizableTabBarEnabled !== 'boolean') {
        AES.state.resizableTabBarEnabled = true;
    }
    if (typeof AES.state.horizontalCompactTabsEnabled !== 'boolean') {
        AES.state.horizontalCompactTabsEnabled = false;
    }
    if (typeof AES.state.roundedPageFramesEnabled !== 'boolean') {
        AES.state.roundedPageFramesEnabled = false;
    }
    if (typeof AES.state.experimentalUmbrellaContractFrameTabs !== 'boolean') {
        AES.state.experimentalUmbrellaContractFrameTabs = false;
    }
    if (typeof AES.state.autotaskBrandColorEnabled !== 'boolean') {
        AES.state.autotaskBrandColorEnabled = false;
    }
    if (typeof AES.state.autotaskBrandColor !== 'string') {
        AES.state.autotaskBrandColor = '#376A94';
    }
    if (!Array.isArray(AES.state.autotaskBrandColorPresets)) {
        AES.state.autotaskBrandColorPresets = [];
    }
    if (typeof AES.state.autotaskLogoOverrideEnabled !== 'boolean') {
        AES.state.autotaskLogoOverrideEnabled = false;
    }
    if (typeof AES.state.autotaskLogoDataUrl !== 'string') {
        AES.state.autotaskLogoDataUrl = '';
    }
    if (!AES.state.managedSettings || typeof AES.state.managedSettings !== 'object') {
        AES.state.managedSettings = {};
    }
    if (typeof AES.state.improvedScrollbarsEnabled !== 'boolean') {
        AES.state.improvedScrollbarsEnabled = true;
    }
    if (typeof AES.state.skipPeekBackdropCloseWarning !== 'boolean') {
        AES.state.skipPeekBackdropCloseWarning = false;
    }
    if (typeof AES.state.peekMoveResizeEnabled !== 'boolean') {
        AES.state.peekMoveResizeEnabled = false;
    }
    if (typeof AES.state.releaseNotesLastSeenVersion !== 'string') {
        AES.state.releaseNotesLastSeenVersion = '';
    }
    if (typeof AES.state.releaseNotesSnoozeVersion !== 'string') {
        AES.state.releaseNotesSnoozeVersion = '';
    }
    if (typeof AES.state.welcomeNoticeLastSeenVersion !== 'string') {
        AES.state.welcomeNoticeLastSeenVersion = '';
    }
    if (typeof AES.state.tabBarWidth !== 'number') {
        AES.state.tabBarWidth = AES.BAR_W || 240;
    }
    if (!AES.state.tabLine2Fields || typeof AES.state.tabLine2Fields !== 'object') {
        AES.state.tabLine2Fields = {};
    }
    if (!AES.state.tabLine3Fields || typeof AES.state.tabLine3Fields !== 'object') {
        AES.state.tabLine3Fields = {};
    }
    AES.settingsLoaded = false;
    AES.settingsLoadFailed = false;
    AES.lastChromeStorageError = null;

    AES.hasChromeStorage = function hasChromeStorage() {
        try {
            return !!(
                typeof chrome !== 'undefined' &&
                chrome &&
                chrome.storage &&
                chrome.storage.local
            );
        } catch (e) {
            AES.lastChromeStorageError = e;
            return false;
        }
    };

    AES.readSessionTabsPayload = function readSessionTabsPayload() {
        try {
            const raw = sessionStorage.getItem(AES.STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    };

    AES.writeSessionTabsPayload = function writeSessionTabsPayload(payload) {
        try {
            sessionStorage.setItem(AES.STORAGE_KEY, JSON.stringify(payload));
        } catch (e) {}
    };

    AES.clearSessionTabsPayload = function clearSessionTabsPayload() {
        try {
            sessionStorage.removeItem(AES.STORAGE_KEY);
        } catch (e) {}
    };

    AES.getChromeLocal = function getChromeLocal(keys) {
        return new Promise(function (resolve) {
            try {
                chrome.storage.local.get(keys, function (result) {
                    try {
                        if (chrome.runtime && chrome.runtime.lastError) {
                            AES.lastChromeStorageError = chrome.runtime.lastError;
                            resolve({});
                            return;
                        }
                    } catch (e) {
                        AES.lastChromeStorageError = e;
                        resolve({});
                        return;
                    }
                    resolve(result);
                });
            } catch (e) {
                AES.lastChromeStorageError = e;
                resolve({});
            }
        });
    };

    AES.hasChromeManagedStorage = function hasChromeManagedStorage() {
        try {
            return !!(
                typeof chrome !== 'undefined' &&
                chrome &&
                chrome.storage &&
                chrome.storage.managed
            );
        } catch (e) {
            return false;
        }
    };

    AES.getChromeManaged = function getChromeManaged(keys) {
        return new Promise(function (resolve) {
            if (!AES.hasChromeManagedStorage()) {
                resolve({});
                return;
            }
            try {
                chrome.storage.managed.get(keys || null, function (result) {
                    try {
                        if (chrome.runtime && chrome.runtime.lastError) {
                            resolve({});
                            return;
                        }
                    } catch (e) {
                        resolve({});
                        return;
                    }
                    resolve(result || {});
                });
            } catch (e) {
                resolve({});
            }
        });
    };

    AES.setChromeLocal = function setChromeLocal(values) {
        return new Promise(function (resolve) {
            try {
                chrome.storage.local.set(values, resolve);
            } catch (e) {
                resolve();
            }
        });
    };

    AES.removeChromeLocal = function removeChromeLocal(keys) {
        return new Promise(function (resolve) {
            try {
                chrome.storage.local.remove(keys, resolve);
            } catch (e) {
                resolve();
            }
        });
    };

    function readThemePreference(settings) {
        const value = settings && settings.themePreference;
        return ['auto', 'light', 'dark'].includes(value) ? value : 'auto';
    }

    function readBarOrientation(settings) {
        const value = settings && settings.barOrientation;
        return ['horizontal', 'vertical'].includes(value) ? value : 'horizontal';
    }

    function readTabBarWidth(settings) {
        const value = settings && Number(settings.tabBarWidth);
        const min = AES.BAR_W_MIN || 56;
        const max = AES.BAR_W_MAX || 420;
        const fallback = AES.BAR_W || 240;
        if (!Number.isFinite(value)) return fallback;
        return Math.max(min, Math.min(max, Math.round(value)));
    }

    function normalizeAutotaskBrandColorValue(value) {
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

    function readAutotaskBrandColor(settings) {
        return normalizeAutotaskBrandColorValue(settings && settings.autotaskBrandColor) || '#376a94';
    }

    const DEFAULT_AUTOTASK_BRAND_PRESETS_STORAGE = [
        '#376a94', '#b23a48', '#2e8458', '#6f4fa0', '#c97a3f', '#4f5d75',
    ];

    function readAutotaskBrandColorPresets(settings) {
        const list = settings && Array.isArray(settings.autotaskBrandColorPresets)
            ? settings.autotaskBrandColorPresets
            : [];
        const out = [];
        for (let i = 0; i < DEFAULT_AUTOTASK_BRAND_PRESETS_STORAGE.length; i += 1) {
            const raw = String(list[i] || '').trim();
            const short = raw.match(/^#([0-9a-f]{3})$/i);
            if (short) {
                out.push('#' + short[1].split('').map(function (char) { return char + char; }).join('').toLowerCase());
            } else if (/^#[0-9a-f]{6}$/i.test(raw)) {
                out.push(raw.toLowerCase());
            } else {
                out.push(DEFAULT_AUTOTASK_BRAND_PRESETS_STORAGE[i]);
            }
        }
        return out;
    }

    function readAutotaskLogoDataUrl(settings) {
        const value = String((settings && settings.autotaskLogoDataUrl) || '');
        return value.startsWith('data:image/svg+xml') ? value : '';
    }

    function readManagedBrandingSettings(settings) {
        const hasEnabledPolicy = settings && typeof settings.autotaskBrandColorEnabled === 'boolean';
        const color = normalizeAutotaskBrandColorValue(settings && settings.autotaskBrandColor);
        const logo = readAutotaskLogoDataUrl(settings);
        return {
            hasAutotaskBrandColor: !!color,
            hasAutotaskBrandColorEnabled: hasEnabledPolicy,
            autotaskBrandColor: color,
            autotaskBrandColorEnabled: hasEnabledPolicy ? settings.autotaskBrandColorEnabled !== false : !!color,
            hasAutotaskLogoDataUrl: !!logo,
            autotaskLogoDataUrl: logo,
        };
    }

    async function loadManagedBrandingSettings() {
        const managed = await AES.getChromeManaged([
            'autotaskBrandColor',
            'autotaskBrandColorEnabled',
            'autotaskLogoDataUrl',
        ]);
        return readManagedBrandingSettings(managed);
    }

    function applyManagedBrandingSettings(managed) {
        AES.state.managedSettings = managed || {};
        if (!managed) return;
        AES.state.localAutotaskBrandColorEnabled = AES.state.autotaskBrandColorEnabled;
        AES.state.localAutotaskBrandColor = AES.state.autotaskBrandColor;
        AES.state.localAutotaskLogoOverrideEnabled = AES.state.autotaskLogoOverrideEnabled;
        AES.state.localAutotaskLogoDataUrl = AES.state.autotaskLogoDataUrl;
        if (managed.hasAutotaskBrandColor || managed.hasAutotaskBrandColorEnabled) {
            if (managed.hasAutotaskBrandColor) {
                AES.state.autotaskBrandColor = managed.autotaskBrandColor;
            }
            AES.state.autotaskBrandColorEnabled = !!managed.autotaskBrandColorEnabled && !!managed.autotaskBrandColor;
        }
        if (managed.hasAutotaskLogoDataUrl) {
            AES.state.autotaskLogoDataUrl = managed.autotaskLogoDataUrl;
            AES.state.autotaskLogoOverrideEnabled = true;
        }
    }

    AES.loadSettings = async function loadSettings() {
        AES.settingsLoaded = false;
        AES.settingsLoadFailed = false;
        if (AES.hasChromeStorage()) {
            AES.lastChromeStorageError = null;
            const stored = await AES.getChromeLocal(AES.SETTINGS_STORAGE_KEY);
            if (AES.lastChromeStorageError) {
                AES.settingsLoadFailed = true;
                return;
            }
            const settings = stored && stored[AES.SETTINGS_STORAGE_KEY];
            AES.state.extensionEnabled = settings && typeof settings.extensionEnabled === 'boolean'
                ? settings.extensionEnabled
                : true;
            AES.state.rememberTabsAfterClose = settings && typeof settings.rememberTabsAfterClose === 'boolean'
                ? settings.rememberTabsAfterClose
                : true;
            AES.state.openNewTabsAtStart = !!(settings && settings.openNewTabsAtStart);
            AES.state.phoneLinksEnabled = settings && typeof settings.phoneLinksEnabled === 'boolean'
                ? settings.phoneLinksEnabled
                : true;
            AES.state.themePreference = readThemePreference(settings);
            AES.state.barOrientation = readBarOrientation(settings);
            AES.state.hideEarlyAccessLabels = settings && typeof settings.hideEarlyAccessLabels === 'boolean'
                ? settings.hideEarlyAccessLabels
                : true;
            AES.state.replaceCalendarWithResourcePlanner = !!(settings && settings.replaceCalendarWithResourcePlanner);
            AES.state.showTabBarOnNonIframePages = settings && typeof settings.showTabBarOnNonIframePages === 'boolean'
                ? settings.showTabBarOnNonIframePages
                : true;
            AES.state.resizableTabBarEnabled = settings && typeof settings.resizableTabBarEnabled === 'boolean'
                ? settings.resizableTabBarEnabled
                : true;
            AES.state.horizontalCompactTabsEnabled = !!(settings && settings.horizontalCompactTabsEnabled);
            AES.state.roundedPageFramesEnabled = settings && typeof settings.roundedPageFramesEnabled === 'boolean'
                ? settings.roundedPageFramesEnabled
                : true;
            AES.state.experimentalUmbrellaContractFrameTabs = settings && typeof settings.experimentalUmbrellaContractFrameTabs === 'boolean'
                ? settings.experimentalUmbrellaContractFrameTabs
                : false;
            AES.state.autotaskBrandColorEnabled = !!(settings && settings.autotaskBrandColorEnabled);
            AES.state.autotaskBrandColor = readAutotaskBrandColor(settings);
            AES.state.autotaskBrandColorPresets = readAutotaskBrandColorPresets(settings);
            AES.state.autotaskLogoDataUrl = readAutotaskLogoDataUrl(settings);
            AES.state.autotaskLogoOverrideEnabled = !!AES.state.autotaskLogoDataUrl;
            AES.state.improvedScrollbarsEnabled = settings && typeof settings.improvedScrollbarsEnabled === 'boolean'
                ? settings.improvedScrollbarsEnabled
                : true;
            AES.state.skipPeekBackdropCloseWarning = settings && typeof settings.skipPeekBackdropCloseWarning === 'boolean'
                ? settings.skipPeekBackdropCloseWarning
                : false;
            AES.state.peekMoveResizeEnabled = settings && typeof settings.peekMoveResizeEnabled === 'boolean'
                ? settings.peekMoveResizeEnabled
                : true;
            AES.state.defaultEnabledSettingsMigration = typeof (settings && settings.defaultEnabledSettingsMigration) === 'string'
                ? settings.defaultEnabledSettingsMigration
                : '';
            AES.state.releaseNotesLastSeenVersion = typeof (settings && settings.releaseNotesLastSeenVersion) === 'string'
                ? settings.releaseNotesLastSeenVersion
                : '';
            AES.state.releaseNotesSnoozeVersion = typeof (settings && settings.releaseNotesSnoozeVersion) === 'string'
                ? settings.releaseNotesSnoozeVersion
                : '';
            AES.state.welcomeNoticeLastSeenVersion = typeof (settings && settings.welcomeNoticeLastSeenVersion) === 'string'
                ? settings.welcomeNoticeLastSeenVersion
                : '';
            AES.state.tabBarWidth = readTabBarWidth(settings);
            AES.state.tabLine2Fields = settings && typeof settings.tabLine2Fields === 'object' ? settings.tabLine2Fields : {};
            AES.state.tabLine3Fields = settings && typeof settings.tabLine3Fields === 'object' ? settings.tabLine3Fields : {};
            applyManagedBrandingSettings(await loadManagedBrandingSettings());
            AES.settingsLoaded = true;
            return;
        }

        try {
            const raw = localStorage.getItem(AES.SETTINGS_STORAGE_KEY);
            const settings = raw ? JSON.parse(raw) : null;
            AES.state.extensionEnabled = settings && typeof settings.extensionEnabled === 'boolean'
                ? settings.extensionEnabled
                : true;
            AES.state.rememberTabsAfterClose = settings && typeof settings.rememberTabsAfterClose === 'boolean'
                ? settings.rememberTabsAfterClose
                : true;
            AES.state.openNewTabsAtStart = !!(settings && settings.openNewTabsAtStart);
            AES.state.phoneLinksEnabled = settings && typeof settings.phoneLinksEnabled === 'boolean'
                ? settings.phoneLinksEnabled
                : true;
            AES.state.themePreference = readThemePreference(settings);
            AES.state.barOrientation = readBarOrientation(settings);
            AES.state.hideEarlyAccessLabels = settings && typeof settings.hideEarlyAccessLabels === 'boolean'
                ? settings.hideEarlyAccessLabels
                : true;
            AES.state.replaceCalendarWithResourcePlanner = !!(settings && settings.replaceCalendarWithResourcePlanner);
            AES.state.showTabBarOnNonIframePages = settings && typeof settings.showTabBarOnNonIframePages === 'boolean'
                ? settings.showTabBarOnNonIframePages
                : true;
            AES.state.resizableTabBarEnabled = settings && typeof settings.resizableTabBarEnabled === 'boolean'
                ? settings.resizableTabBarEnabled
                : true;
            AES.state.horizontalCompactTabsEnabled = !!(settings && settings.horizontalCompactTabsEnabled);
            AES.state.roundedPageFramesEnabled = settings && typeof settings.roundedPageFramesEnabled === 'boolean'
                ? settings.roundedPageFramesEnabled
                : true;
            AES.state.experimentalUmbrellaContractFrameTabs = settings && typeof settings.experimentalUmbrellaContractFrameTabs === 'boolean'
                ? settings.experimentalUmbrellaContractFrameTabs
                : false;
            AES.state.autotaskBrandColorEnabled = !!(settings && settings.autotaskBrandColorEnabled);
            AES.state.autotaskBrandColor = readAutotaskBrandColor(settings);
            AES.state.autotaskBrandColorPresets = readAutotaskBrandColorPresets(settings);
            AES.state.autotaskLogoDataUrl = readAutotaskLogoDataUrl(settings);
            AES.state.autotaskLogoOverrideEnabled = !!AES.state.autotaskLogoDataUrl;
            AES.state.improvedScrollbarsEnabled = settings && typeof settings.improvedScrollbarsEnabled === 'boolean'
                ? settings.improvedScrollbarsEnabled
                : true;
            AES.state.skipPeekBackdropCloseWarning = settings && typeof settings.skipPeekBackdropCloseWarning === 'boolean'
                ? settings.skipPeekBackdropCloseWarning
                : false;
            AES.state.peekMoveResizeEnabled = settings && typeof settings.peekMoveResizeEnabled === 'boolean'
                ? settings.peekMoveResizeEnabled
                : true;
            AES.state.defaultEnabledSettingsMigration = typeof (settings && settings.defaultEnabledSettingsMigration) === 'string'
                ? settings.defaultEnabledSettingsMigration
                : '';
            AES.state.releaseNotesLastSeenVersion = typeof (settings && settings.releaseNotesLastSeenVersion) === 'string'
                ? settings.releaseNotesLastSeenVersion
                : '';
            AES.state.releaseNotesSnoozeVersion = typeof (settings && settings.releaseNotesSnoozeVersion) === 'string'
                ? settings.releaseNotesSnoozeVersion
                : '';
            AES.state.welcomeNoticeLastSeenVersion = typeof (settings && settings.welcomeNoticeLastSeenVersion) === 'string'
                ? settings.welcomeNoticeLastSeenVersion
                : '';
            AES.state.tabBarWidth = readTabBarWidth(settings);
            AES.state.tabLine2Fields = settings && typeof settings.tabLine2Fields === 'object' ? settings.tabLine2Fields : {};
            AES.state.tabLine3Fields = settings && typeof settings.tabLine3Fields === 'object' ? settings.tabLine3Fields : {};
            applyManagedBrandingSettings(await loadManagedBrandingSettings());
            AES.settingsLoaded = true;
        } catch (e) {
            AES.settingsLoadFailed = true;
        }
    };

    AES.saveSettings = async function saveSettings() {
        if (AES.settingsLoadFailed || !AES.settingsLoaded) return;
        const managed = AES.state.managedSettings || {};
        const brandColorManaged = !!(managed.hasAutotaskBrandColor || managed.hasAutotaskBrandColorEnabled);
        const logoManaged = !!managed.hasAutotaskLogoDataUrl;
        const savedBrandColorEnabled = brandColorManaged && typeof AES.state.localAutotaskBrandColorEnabled === 'boolean'
            ? AES.state.localAutotaskBrandColorEnabled
            : AES.state.autotaskBrandColorEnabled;
        const savedBrandColor = brandColorManaged && typeof AES.state.localAutotaskBrandColor === 'string'
            ? AES.state.localAutotaskBrandColor
            : AES.state.autotaskBrandColor;
        const savedLogoDataUrl = logoManaged && typeof AES.state.localAutotaskLogoDataUrl === 'string'
            ? AES.state.localAutotaskLogoDataUrl
            : AES.state.autotaskLogoDataUrl;
        const payload = {
            extensionEnabled: AES.state.extensionEnabled !== false,
            rememberTabsAfterClose: !!AES.state.rememberTabsAfterClose,
            openNewTabsAtStart: !!AES.state.openNewTabsAtStart,
            phoneLinksEnabled: !!AES.state.phoneLinksEnabled,
            themePreference: readThemePreference(AES.state),
            barOrientation: readBarOrientation(AES.state),
            hideEarlyAccessLabels: !!AES.state.hideEarlyAccessLabels,
            replaceCalendarWithResourcePlanner: !!AES.state.replaceCalendarWithResourcePlanner,
            showTabBarOnNonIframePages: !!AES.state.showTabBarOnNonIframePages,
            resizableTabBarEnabled: !!AES.state.resizableTabBarEnabled,
            horizontalCompactTabsEnabled: !!AES.state.horizontalCompactTabsEnabled,
            roundedPageFramesEnabled: !!AES.state.roundedPageFramesEnabled,
            experimentalUmbrellaContractFrameTabs: !!AES.state.experimentalUmbrellaContractFrameTabs,
            autotaskBrandColorEnabled: !!savedBrandColorEnabled,
            autotaskBrandColor: readAutotaskBrandColor({ autotaskBrandColor: savedBrandColor }),
            autotaskBrandColorPresets: readAutotaskBrandColorPresets(AES.state),
            autotaskLogoOverrideEnabled: !!readAutotaskLogoDataUrl({ autotaskLogoDataUrl: savedLogoDataUrl }),
            autotaskLogoDataUrl: readAutotaskLogoDataUrl({ autotaskLogoDataUrl: savedLogoDataUrl }),
            improvedScrollbarsEnabled: !!AES.state.improvedScrollbarsEnabled,
            skipPeekBackdropCloseWarning: !!AES.state.skipPeekBackdropCloseWarning,
            peekMoveResizeEnabled: !!AES.state.peekMoveResizeEnabled,
            defaultEnabledSettingsMigration: typeof AES.state.defaultEnabledSettingsMigration === 'string'
                ? AES.state.defaultEnabledSettingsMigration
                : '',
            releaseNotesLastSeenVersion: typeof AES.state.releaseNotesLastSeenVersion === 'string'
                ? AES.state.releaseNotesLastSeenVersion
                : '',
            releaseNotesSnoozeVersion: typeof AES.state.releaseNotesSnoozeVersion === 'string'
                ? AES.state.releaseNotesSnoozeVersion
                : '',
            welcomeNoticeLastSeenVersion: typeof AES.state.welcomeNoticeLastSeenVersion === 'string'
                ? AES.state.welcomeNoticeLastSeenVersion
                : '',
            tabBarWidth: readTabBarWidth(AES.state),
            tabLine2Fields: AES.state.tabLine2Fields || {},
            tabLine3Fields: AES.state.tabLine3Fields || {},
        };
        if (AES.hasChromeStorage()) {
            await AES.setChromeLocal({ [AES.SETTINGS_STORAGE_KEY]: payload });
            return;
        }

        try {
            localStorage.setItem(AES.SETTINGS_STORAGE_KEY, JSON.stringify(payload));
        } catch (e) {}
    };

    AES.shouldPersistTabs = function shouldPersistTabs() {
        return AES.state && AES.state.rememberTabsAfterClose !== false;
    };

    AES.readTabsPayload = async function readTabsPayload() {
        if (!AES.shouldPersistTabs()) {
            return AES.readSessionTabsPayload();
        }
        if (AES.hasChromeStorage()) {
            const stored = await AES.getChromeLocal(AES.STORAGE_KEY);
            if (stored && stored[AES.STORAGE_KEY]) return stored[AES.STORAGE_KEY];
        }
        return AES.readSessionTabsPayload();
    };

    AES.writeTabsPayload = async function writeTabsPayload(payload) {
        if (AES.hasChromeStorage() && AES.shouldPersistTabs()) {
            await AES.setChromeLocal({ [AES.STORAGE_KEY]: payload });
            AES.clearSessionTabsPayload();
            return;
        }

        AES.writeSessionTabsPayload(payload);
        if (AES.hasChromeStorage()) {
            await AES.removeChromeLocal(AES.STORAGE_KEY);
        }
    };

    AES.syncTabsPersistenceMode = async function syncTabsPersistenceMode(payload) {
        if (AES.shouldPersistTabs()) {
            await AES.writeTabsPayload(payload);
            return;
        }

        AES.writeSessionTabsPayload(payload);
        if (AES.hasChromeStorage()) {
            await AES.removeChromeLocal(AES.STORAGE_KEY);
        }
    };

    AES.clearPersistedTabs = async function clearPersistedTabs() {
        AES.clearSessionTabsPayload();
        if (AES.hasChromeStorage()) {
            await AES.removeChromeLocal(AES.STORAGE_KEY);
        }
    };
})();
