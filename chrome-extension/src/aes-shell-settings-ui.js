(function () {
    'use strict';

    const AES = window.__AES__;
    if (!AES) return;

    /**
     * Purpose: reusable, data-driven builders for AES settings modal controls.
     * Owns: generic settings row DOM structure only.
     * Must not own: persisted setting keys, shell state mutations, tab behavior, or storage calls.
     * Companion files: aes-shell.js for modal composition and settings behavior.
     * Verify: settings modal smoke test after changing row structure or CSS classes.
     */
    const settingsUi = AES.SettingsUi || (AES.SettingsUi = {});

    function appendName(label, config) {
        if (config.info && typeof config.createInfo === 'function') {
            label.appendChild(config.createInfo(config.info));
        }

        const name = document.createElement('span');
        name.className = 'at-tabs-setting-name';
        name.textContent = config.name || '';
        label.appendChild(name);
        return name;
    }

    function createBaseRow(config) {
        config = config || {};
        const row = document.createElement(config.rowTag || 'label');
        row.className = 'at-tabs-setting-row' + (config.extraClass ? ' ' + config.extraClass : '');

        const label = document.createElement('span');
        label.className = 'at-tabs-setting-label';
        const name = appendName(label, config);

        row.appendChild(label);
        return { row, label, name };
    }

    settingsUi.createToggleRow = function createToggleRow(config) {
        config = config || {};
        const parts = createBaseRow(config);
        const toggle = document.createElement('span');
        toggle.className = 'at-tabs-setting-toggle';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = !!config.checked;
        input.disabled = !!config.disabled;
        if (config.title) input.title = config.title;
        input.addEventListener('change', function (event) {
            if (typeof config.onChange === 'function') {
                config.onChange(input, event);
            }
        });

        const toggleUi = document.createElement('span');
        toggleUi.className = 'at-tabs-setting-toggle-ui';
        toggle.appendChild(input);
        toggle.appendChild(toggleUi);
        parts.row.appendChild(toggle);

        return Object.assign(parts, { input, toggle, toggleUi });
    };

    settingsUi.createSelectRow = function createSelectRow(config) {
        config = config || {};
        const parts = createBaseRow(config);
        const select = document.createElement('select');
        select.className = 'at-tabs-setting-select';
        if (config.title) select.title = config.title;

        (config.options || []).forEach(function (option) {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.label || option.value;
            if (option.disabled) optionEl.disabled = true;
            if (config.value === option.value) optionEl.selected = true;
            select.appendChild(optionEl);
        });

        select.addEventListener('change', function (event) {
            if (typeof config.onChange === 'function') {
                config.onChange(select, event);
            }
        });

        parts.row.appendChild(select);
        return Object.assign(parts, { select });
    };

    settingsUi.createFooterButton = function createFooterButton(config) {
        config = config || {};
        const button = document.createElement('button');
        button.type = 'button';
        button.className = config.className || 'at-tabs-settings-reset';
        button.textContent = config.text || '';
        if (config.title) button.title = config.title;
        if (typeof config.onClick === 'function') {
            button.addEventListener('click', config.onClick);
        }
        return button;
    };
})();
