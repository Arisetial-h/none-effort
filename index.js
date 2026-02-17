import { extension_settings, saveSettingsDebounced } from '../../../extensions.js';

// Must match your GitHub repo folder name when installed by SillyTavern
const extensionName = 'jipjoa';

const defaultSettings = {
    enabled: true,
    showNotifications: false,
};

// ─────────────────────────────────────────────
// Settings helpers
// ─────────────────────────────────────────────

function getSettings() {
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = { ...defaultSettings };
    }
    return extension_settings[extensionName];
}

function saveSettings() {
    extension_settings[extensionName] = getSettings();
    saveSettingsDebounced();
}

// ─────────────────────────────────────────────
// Core: Fetch interception
// Intercepts every outgoing HTTP request and strips
// reasoning_effort from the JSON body if present.
// This is the most reliable approach — it works at
// the network layer, independent of ST internals.
// ─────────────────────────────────────────────

let fetchPatched = false;

function patchFetch() {
    if (fetchPatched) return;
    fetchPatched = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async function (url, options, ...rest) {
        const settings = getSettings();

        if (settings.enabled && options?.body && typeof options.body === 'string') {
            try {
                const body = JSON.parse(options.body);

                if ('reasoning_effort' in body) {
                    delete body.reasoning_effort;
                    options = { ...options, body: JSON.stringify(body) };

                    console.log(`[${extensionName}] Removed reasoning_effort from request to: ${url}`);

                    if (settings.showNotifications) {
                        toastr.info('reasoning_effort removed', 'Disable Reasoning Effort', { timeOut: 2000 });
                    }
                }
            } catch (_) {
                // Body wasn't valid JSON — leave it untouched
            }
        }

        return originalFetch(url, options, ...rest);
    };

    console.log(`[${extensionName}] Fetch interception active`);
}

// ─────────────────────────────────────────────
// UI: Settings panel
// ─────────────────────────────────────────────

const SETTINGS_HTML = `
<div id="disable-reasoning-settings" class="disable-reasoning-settings">
    <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
            <b>Disable Reasoning Effort</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
            <small class="disable-reasoning-desc">
                Strips <code>reasoning_effort</code> from API requests
                for models/endpoints that don't support it.
            </small>

            <div class="disable-reasoning-row">
                <label class="checkbox_label" for="dre-enabled">
                    <input type="checkbox" id="dre-enabled" />
                    <span>Enable (remove reasoning effort)</span>
                </label>
            </div>

            <div class="disable-reasoning-row">
                <label class="checkbox_label" for="dre-notify">
                    <input type="checkbox" id="dre-notify" />
                    <span>Show notification when removed</span>
                </label>
            </div>

            <div class="disable-reasoning-status">
                Status: <span id="dre-status">●</span>
            </div>
        </div>
    </div>
</div>
`;

function injectSettingsPanel() {
    // Avoid duplicate injection
    if ($('#disable-reasoning-settings').length) return;

    // Try known ST extension panel containers in order
    const targets = [
        '#extensions_settings2',
        '#extensions_settings',
        '#extension-settings',
        '.extension_settings',
    ];

    let injected = false;
    for (const selector of targets) {
        const $el = $(selector);
        if ($el.length) {
            $el.append(SETTINGS_HTML);
            injected = true;
            console.log(`[${extensionName}] Settings injected into ${selector}`);
            break;
        }
    }

    if (!injected) {
        // Final fallback: retry after a short delay
        console.warn(`[${extensionName}] No settings container found, retrying in 1 s...`);
        setTimeout(injectSettingsPanel, 1000);
        return;
    }

    bindSettingsControls();
    updateStatusBadge();
}

function bindSettingsControls() {
    const settings = getSettings();

    $('#dre-enabled').prop('checked', settings.enabled);
    $('#dre-notify').prop('checked', settings.showNotifications);

    $('#dre-enabled').on('change', function () {
        getSettings().enabled = $(this).prop('checked');
        saveSettings();
        updateStatusBadge();
        console.log(`[${extensionName}] Enabled: ${getSettings().enabled}`);
    });

    $('#dre-notify').on('change', function () {
        getSettings().showNotifications = $(this).prop('checked');
        saveSettings();
    });
}

function updateStatusBadge() {
    const enabled = getSettings().enabled;
    $('#dre-status')
        .text(enabled ? '● Active' : '○ Inactive')
        .css('color', enabled ? '#4caf50' : '#ff9800');
}

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    // Ensure settings object exists
    getSettings();

    // Patch fetch immediately — must happen before any request is made
    patchFetch();

    // Inject UI after DOM is ready
    // Small delay gives ST time to build the extensions panel
    setTimeout(injectSettingsPanel, 300);

    console.log(`[${extensionName}] Ready`);
});
