(function () {
    'use strict';

    const AES = window.__AES__;
    if (!AES) return;

    /**
     * Purpose: shared shell module registry for the no-build AES runtime.
     * Owns: cross-file shell runtime state containers and module registration.
     * Must not own: tab behavior, settings UI, route metadata, or DOM rendering.
     * Companion files: aes-shell-config.js, aes-shell-styles.js, aes-shell.js.
     * Verify: scripts/verify-extension-sources.sh after changing loaded runtime files.
     */
    const runtime = AES.ShellRuntime || (AES.ShellRuntime = {});
    runtime.modules = runtime.modules || [];

    AES.registerShellModule = function registerShellModule(name, factory) {
        if (typeof factory !== 'function') return;
        runtime.modules.push({ name: String(name || 'anonymous-shell-module'), factory });
    };

    AES.runShellModules = function runShellModules(context) {
        runtime.modules.forEach(function (module) {
            try { module.factory(context || runtime); }
            catch (e) { console.warn('AES shell module failed:', module.name, e); }
        });
    };
})();
