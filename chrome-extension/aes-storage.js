(function () {
    'use strict';

    const AES = window.__AES__;
    if (!AES || AES.storageInitialized) return;
    AES.storageInitialized = true;

    AES.state = AES.state || {};
    if (typeof AES.state.rememberTabsAfterClose !== 'boolean') {
        AES.state.rememberTabsAfterClose = false;
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
    if (typeof AES.state.darkModeEnhancerEnabled !== 'boolean') {
        AES.state.darkModeEnhancerEnabled = false;
    }
    if (typeof AES.state.hideEarlyAccessLabels !== 'boolean') {
        AES.state.hideEarlyAccessLabels = false;
    }

    AES.hasChromeStorage = function hasChromeStorage() {
        return !!(
            typeof chrome !== 'undefined' &&
            chrome &&
            chrome.storage &&
            chrome.storage.local
        );
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
                chrome.storage.local.get(keys, resolve);
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

    AES.loadSettings = async function loadSettings() {
        if (AES.hasChromeStorage()) {
            const stored = await AES.getChromeLocal(AES.SETTINGS_STORAGE_KEY);
            const settings = stored && stored[AES.SETTINGS_STORAGE_KEY];
            AES.state.rememberTabsAfterClose = !!(settings && settings.rememberTabsAfterClose);
            AES.state.phoneLinksEnabled = settings && typeof settings.phoneLinksEnabled === 'boolean'
                ? settings.phoneLinksEnabled
                : true;
            AES.state.themePreference = readThemePreference(settings);
            AES.state.barOrientation = readBarOrientation(settings);
            AES.state.darkModeEnhancerEnabled = !!(settings && settings.darkModeEnhancerEnabled);
            AES.state.hideEarlyAccessLabels = !!(settings && settings.hideEarlyAccessLabels);
            return;
        }

        try {
            const raw = localStorage.getItem(AES.SETTINGS_STORAGE_KEY);
            const settings = raw ? JSON.parse(raw) : null;
            AES.state.rememberTabsAfterClose = !!(settings && settings.rememberTabsAfterClose);
            AES.state.phoneLinksEnabled = settings && typeof settings.phoneLinksEnabled === 'boolean'
                ? settings.phoneLinksEnabled
                : true;
            AES.state.themePreference = readThemePreference(settings);
            AES.state.barOrientation = readBarOrientation(settings);
            AES.state.darkModeEnhancerEnabled = !!(settings && settings.darkModeEnhancerEnabled);
            AES.state.hideEarlyAccessLabels = !!(settings && settings.hideEarlyAccessLabels);
        } catch (e) {
            AES.state.rememberTabsAfterClose = false;
            AES.state.phoneLinksEnabled = true;
            AES.state.themePreference = 'auto';
            AES.state.barOrientation = 'horizontal';
            AES.state.darkModeEnhancerEnabled = false;
            AES.state.hideEarlyAccessLabels = false;
        }
    };

    AES.saveSettings = async function saveSettings() {
        const payload = {
            rememberTabsAfterClose: !!AES.state.rememberTabsAfterClose,
            phoneLinksEnabled: !!AES.state.phoneLinksEnabled,
            themePreference: readThemePreference(AES.state),
            barOrientation: readBarOrientation(AES.state),
            darkModeEnhancerEnabled: !!AES.state.darkModeEnhancerEnabled,
            hideEarlyAccessLabels: !!AES.state.hideEarlyAccessLabels,
        };
        if (AES.hasChromeStorage()) {
            await AES.setChromeLocal({ [AES.SETTINGS_STORAGE_KEY]: payload });
            return;
        }

        try {
            localStorage.setItem(AES.SETTINGS_STORAGE_KEY, JSON.stringify(payload));
        } catch (e) {}
    };

    AES.readTabsPayload = async function readTabsPayload() {
        if (AES.state.rememberTabsAfterClose && AES.hasChromeStorage()) {
            const stored = await AES.getChromeLocal(AES.STORAGE_KEY);
            return stored ? stored[AES.STORAGE_KEY] || null : null;
        }
        return AES.readSessionTabsPayload();
    };

    AES.writeTabsPayload = async function writeTabsPayload(payload) {
        if (AES.state.rememberTabsAfterClose && AES.hasChromeStorage()) {
            await AES.setChromeLocal({ [AES.STORAGE_KEY]: payload });
            AES.clearSessionTabsPayload();
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
