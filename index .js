/**
 * Reasoning Effort: None Option - SillyTavern Extension
 * Adds "none" option to OpenAI reasoning effort settings
 */

(function() {
    'use strict';

    const extensionName = 'reasoning-effort-none';
    
    // Default settings
    const defaultSettings = {
        enabled: true,
        autoSetNone: false
    };

    // Safe getter for extension settings
    function getSettings() {
        try {
            if (window.extension_settings) {
                if (!window.extension_settings[extensionName]) {
                    window.extension_settings[extensionName] = JSON.parse(JSON.stringify(defaultSettings));
                }
                return window.extension_settings[extensionName];
            }
        } catch (e) {
            console.error('[Reasoning Effort None] Error accessing settings:', e);
        }
        return defaultSettings;
    }

    // Safe settings save
    function saveSettings() {
        try {
            if (window.saveSettingsDebounced) {
                window.saveSettingsDebounced();
            }
        } catch (e) {
            console.error('[Reasoning Effort None] Error saving settings:', e);
        }
    }

    // Add "none" option to dropdown
    function addNoneOption() {
        try {
            const settings = getSettings();
            if (!settings.enabled) return;

            // Find the reasoning effort dropdown
            const selectors = [
                '#reasoning_effort',
                '#openai_reasoning_effort',
                'select[name="reasoning_effort"]'
            ];
            
            let dropdown = null;
            for (const sel of selectors) {
                const elem = $(sel);
                if (elem.length > 0) {
                    dropdown = elem;
                    break;
                }
            }
            
            if (!dropdown || dropdown.length === 0) {
                return; // Silently fail, will retry
            }
            
            // Check if already exists
            if (dropdown.find('option[value="none"]').length > 0) {
                return;
            }
            
            // Add the option
            const autoOption = dropdown.find('option[value="auto"]');
            if (autoOption.length > 0) {
                autoOption.after('<option value="none">None</option>');
            } else {
                dropdown.prepend('<option value="none">None</option>');
            }
            
            console.log('[Reasoning Effort None] Added "none" option');
            
            // Auto-set if enabled
            if (settings.autoSetNone) {
                dropdown.val('none').trigger('change');
            }
        } catch (e) {
            console.error('[Reasoning Effort None] Error adding option:', e);
        }
    }

    // Remove "none" option
    function removeNoneOption() {
        try {
            $('select option[value="none"]').remove();
            console.log('[Reasoning Effort None] Removed "none" option');
        } catch (e) {
            console.error('[Reasoning Effort None] Error removing option:', e);
        }
    }

    // Load settings into UI
    function loadSettingsUI() {
        try {
            const settings = getSettings();
            $('#reasoning_effort_none_enabled').prop('checked', settings.enabled);
            $('#reasoning_effort_auto_none').prop('checked', settings.autoSetNone);
        } catch (e) {
            console.error('[Reasoning Effort None] Error loading UI:', e);
        }
    }

    // Handle enable toggle
    function onEnableToggle() {
        try {
            const settings = getSettings();
            settings.enabled = $('#reasoning_effort_none_enabled').is(':checked');
            saveSettings();
            
            if (settings.enabled) {
                addNoneOption();
            } else {
                removeNoneOption();
            }
        } catch (e) {
            console.error('[Reasoning Effort None] Error on toggle:', e);
        }
    }

    // Handle auto-set toggle
    function onAutoSetToggle() {
        try {
            const settings = getSettings();
            settings.autoSetNone = $('#reasoning_effort_auto_none').is(':checked');
            saveSettings();
        } catch (e) {
            console.error('[Reasoning Effort None] Error on auto-set toggle:', e);
        }
    }

    // Create settings UI
    function createUI() {
        try {
            const html = `
                <div class="reasoning-effort-none-settings">
                    <div class="inline-drawer">
                        <div class="inline-drawer-toggle inline-drawer-header">
                            <b>Reasoning Effort: None Option</b>
                            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                        </div>
                        <div class="inline-drawer-content">
                            <label class="checkbox_label" for="reasoning_effort_none_enabled">
                                <input type="checkbox" id="reasoning_effort_none_enabled">
                                <span>Enable "None" Option</span>
                            </label>
                            <small>Adds "none" to reasoning effort dropdown for faster responses.</small>
                            
                            <label class="checkbox_label" style="margin-top:10px" for="reasoning_effort_auto_none">
                                <input type="checkbox" id="reasoning_effort_auto_none">
                                <span>Auto-set to None</span>
                            </label>
                            <small>Automatically select "none" when available.</small>
                        </div>
                    </div>
                </div>
            `;
            
            $('#extensions_settings').append(html);
            
            // Bind events
            $('#reasoning_effort_none_enabled').on('change', onEnableToggle);
            $('#reasoning_effort_auto_none').on('change', onAutoSetToggle);
            
            console.log('[Reasoning Effort None] UI created');
        } catch (e) {
            console.error('[Reasoning Effort None] Error creating UI:', e);
        }
    }

    // Watch for dropdown appearing/changing
    function setupWatcher() {
        try {
            // Periodically check and add option if needed
            setInterval(() => {
                const settings = getSettings();
                if (!settings.enabled) return;
                
                const dropdown = $('#reasoning_effort, #openai_reasoning_effort, select[name="reasoning_effort"]');
                if (dropdown.length > 0 && dropdown.find('option[value="none"]').length === 0) {
                    addNoneOption();
                }
            }, 2000); // Check every 2 seconds
        } catch (e) {
            console.error('[Reasoning Effort None] Error in watcher:', e);
        }
    }

    // Initialize
    function init() {
        try {
            console.log('[Reasoning Effort None] Initializing...');
            
            // Create UI
            createUI();
            
            // Load settings
            loadSettingsUI();
            
            // Try to add option immediately
            setTimeout(() => {
                addNoneOption();
            }, 1000);
            
            // Setup periodic watcher
            setupWatcher();
            
            console.log('[Reasoning Effort None] Initialized successfully');
        } catch (e) {
            console.error('[Reasoning Effort None] Initialization error:', e);
        }
    }

    // Wait for jQuery and start
    if (typeof jQuery !== 'undefined') {
        jQuery(() => {
            setTimeout(init, 100);
        });
    } else {
        console.error('[Reasoning Effort None] jQuery not found');
    }

})();
