import { extension_settings, getContext, eventSource, event_types, saveSettingsDebounced } from '../../../extensions.js';

const extensionName = 'disable-reasoning-effort';
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    enabled: true,
    showNotifications: false,
};

let settings = defaultSettings;

/**
 * Load extension settings
 */
function loadSettings() {
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = { ...defaultSettings };
    }
    settings = extension_settings[extensionName];
    
    // Update UI to reflect loaded settings
    $('#disable-reasoning-enabled').prop('checked', settings.enabled);
    $('#disable-reasoning-notifications').prop('checked', settings.showNotifications);
    
    console.log(`[${extensionName}] Settings loaded:`, settings);
}

/**
 * Save extension settings
 */
function saveSettings() {
    extension_settings[extensionName] = settings;
    saveSettingsDebounced();
    console.log(`[${extensionName}] Settings saved:`, settings);
}

/**
 * Hook into generation request to modify reasoning effort
 */
function handleGenerationRequest(data) {
    if (!settings.enabled) {
        return;
    }

    // Check if reasoning_effort exists in the request
    if (data && typeof data === 'object') {
        const hadReasoningEffort = 'reasoning_effort' in data;
        
        // Remove reasoning_effort parameter entirely
        delete data.reasoning_effort;
        
        if (hadReasoningEffort && settings.showNotifications) {
            toastr.info('Reasoning effort disabled for this request', extensionName);
        }
        
        console.log(`[${extensionName}] Reasoning effort removed from payload`);
    }
}

/**
 * Alternative approach: Override settings before generation
 */
function handleBeforeGeneration() {
    if (!settings.enabled) {
        return;
    }

    try {
        const context = getContext();
        if (context.main_api && context.main_api === 'openai') {
            const oaiSettings = context.openai_settings || {};
            
            // Check if reasoning_effort exists
            if ('reasoning_effort' in oaiSettings) {
                const originalValue = oaiSettings.reasoning_effort;
                delete oaiSettings.reasoning_effort;
                
                console.log(`[${extensionName}] Removed reasoning_effort (was: ${originalValue})`);
                
                if (settings.showNotifications) {
                    toastr.info('Reasoning effort disabled', extensionName, { timeOut: 2000 });
                }
            }
        }
    } catch (error) {
        console.error(`[${extensionName}] Error in handleBeforeGeneration:`, error);
    }
}

/**
 * Initialize settings panel
 */
function initializeSettingsPanel() {
    const settingsHtml = `
        <div class="disable-reasoning-settings">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>Disable Reasoning Effort</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="disable-reasoning-description">
                        <p>Forces reasoning effort to be removed from API requests. Useful for models/endpoints that don't support this parameter.</p>
                    </div>
                    
                    <div class="disable-reasoning-option">
                        <label class="checkbox_label" for="disable-reasoning-enabled">
                            <input type="checkbox" id="disable-reasoning-enabled" />
                            <span>Enable reasoning effort removal</span>
                        </label>
                    </div>
                    
                    <div class="disable-reasoning-option">
                        <label class="checkbox_label" for="disable-reasoning-notifications">
                            <input type="checkbox" id="disable-reasoning-notifications" />
                            <span>Show notifications when disabled</span>
                        </label>
                    </div>
                    
                    <div class="disable-reasoning-status">
                        <small class="disable-reasoning-status-text">
                            <i class="fa-solid fa-circle-info"></i>
                            Status: <span id="disable-reasoning-status-value">Active</span>
                        </small>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Try multiple injection points for compatibility
    const injectTargets = [
        '#extensions_settings',
        '#extensions_settings2',
        '#third-party_extensions_settings',
        '.extensions_block'
    ];

    let injected = false;
    for (const target of injectTargets) {
        const $target = $(target);
        if ($target.length) {
            $target.append(settingsHtml);
            injected = true;
            console.log(`[${extensionName}] Settings panel injected into ${target}`);
            break;
        }
    }

    if (!injected) {
        console.warn(`[${extensionName}] Could not find settings injection point, retrying...`);
        setTimeout(initializeSettingsPanel, 1000);
        return;
    }

    // Attach event listeners
    $('#disable-reasoning-enabled').on('change', function() {
        settings.enabled = $(this).prop('checked');
        saveSettings();
        updateStatusDisplay();
    });

    $('#disable-reasoning-notifications').on('change', function() {
        settings.showNotifications = $(this).prop('checked');
        saveSettings();
    });

    // Initialize status display
    updateStatusDisplay();
}

/**
 * Update status display in settings panel
 */
function updateStatusDisplay() {
    const statusText = settings.enabled ? 'Active' : 'Inactive';
    const statusColor = settings.enabled ? '#4caf50' : '#ff9800';
    
    $('#disable-reasoning-status-value')
        .text(statusText)
        .css('color', statusColor);
}

/**
 * Monkey-patch approach: Override the resolveReasoningEffort function
 */
function patchReasoningEffortResolution() {
    if (!settings.enabled) {
        return;
    }

    // Store reference to potential settings object
    try {
        const context = getContext();
        
        // Hook into the settings object if available
        if (window.oai_settings || context.openai_settings) {
            const settingsObj = window.oai_settings || context.openai_settings;
            
            // Create a proxy to intercept reasoning_effort access
            if (settingsObj && !settingsObj._reasoning_effort_patched) {
                const originalReasoningEffort = settingsObj.reasoning_effort;
                
                Object.defineProperty(settingsObj, 'reasoning_effort', {
                    get: function() {
                        if (settings.enabled) {
                            return undefined; // Return undefined to disable
                        }
                        return originalReasoningEffort;
                    },
                    set: function(value) {
                        if (!settings.enabled) {
                            originalReasoningEffort = value;
                        }
                        // If enabled, ignore the set operation
                    },
                    configurable: true,
                });
                
                settingsObj._reasoning_effort_patched = true;
                console.log(`[${extensionName}] Reasoning effort setting patched`);
            }
        }
    } catch (error) {
        console.error(`[${extensionName}] Error patching reasoning effort:`, error);
    }
}

/**
 * Initialize extension
 */
jQuery(async () => {
    console.log(`[${extensionName}] Extension loading...`);

    // Load settings
    loadSettings();

    // Initialize settings panel
    setTimeout(initializeSettingsPanel, 100);

    // Hook into events
    // Try multiple event types for maximum compatibility
    if (eventSource) {
        // Before generation starts
        eventSource.on(event_types.GENERATION_STARTED, handleBeforeGeneration);
        
        // When chat completion settings are ready
        if (event_types.CHAT_COMPLETION_SETTINGS_READY) {
            eventSource.on(event_types.CHAT_COMPLETION_SETTINGS_READY, handleGenerationRequest);
        }
        
        console.log(`[${extensionName}] Event hooks registered`);
    }

    // Apply monkey-patch approach
    patchReasoningEffortResolution();
    
    // Re-apply patch periodically to handle setting changes
    setInterval(() => {
        if (settings.enabled) {
            patchReasoningEffortResolution();
        }
    }, 5000);

    console.log(`[${extensionName}] Extension loaded successfully`);
});
