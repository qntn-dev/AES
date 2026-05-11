(function () {
    'use strict';

    const root = typeof globalThis !== 'undefined' ? globalThis : window;
    root.__AES_LOCAL_FLAGS__ = Object.assign({}, root.__AES_LOCAL_FLAGS__ || {}, {
        umbrellaContractFrameExperiment: true,
    });
})();
