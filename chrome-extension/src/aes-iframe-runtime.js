(function () {
    'use strict';

    const AES = window.__AES__;
    if (!AES) return;

    /**
     * Purpose: shared iframe module registry for the no-build AES runtime.
     * Owns: cross-file iframe runtime state containers and module registration.
     * Must not own: shell tab behavior, settings UI, or top-frame geometry.
     * Companion files: aes-iframe-bridge.js and route allowlist files.
     * Verify: scripts/verify-extension-sources.sh after changing loaded runtime files.
     */
    const runtime = AES.IframeRuntime || (AES.IframeRuntime = {});
    runtime.modules = runtime.modules || [];

    AES.registerIframeModule = function registerIframeModule(name, factory) {
        if (typeof factory !== 'function') return;
        runtime.modules.push({ name: String(name || 'anonymous-iframe-module'), factory });
    };

    AES.runIframeModules = function runIframeModules(context) {
        runtime.modules.forEach(function (module) {
            try { module.factory(context || runtime); }
            catch (e) { console.warn('AES iframe module failed:', module.name, e); }
        });
    };
})();
