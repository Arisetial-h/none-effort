/**
 * Reasoning Effort: None Option
 * Simple extension to add "none" to reasoning effort dropdown
 */

(function() {
    console.log('[Reasoning Effort None] Script loaded');

    // Settings key - you can change this to match your folder name if needed
    const SETTINGS_KEY = 'reasoning-effort-none-ext';
    
    function getSettings() {
        if (!window.extension_settings) {
            console.log('[Reasoning Effort None] extension_settings not available yet');
            return { enabled: true, autoSetNone: false };
        }
        
        if (!window.extension_settings[SETTINGS_KEY]) {
            window.extension_settings[SETTINGS_KEY] = {
                enabled: true,
                autoSetNone: false
            };
        }
        
        return window.extension_settings[SETTINGS_KEY];
    }
    
    function saveSettings() {
        if (window.saveSettingsDebounced) {
            window.saveSettingsDebounced();
        }
    }
    
    function addNoneOption() {
        const settings = getSettings();
        if (!settings.enabled) return;
        
        // Find any reasoning effort dropdown
        const dropdown = $('#reasoning_effort, #openai_reasoning_effort, select[name="reasoning_effort"]').first();
        
        if (dropdown.length === 0) {
            return; // Not found, will retry later
        }
        
        // Don't add if already exists
        if (dropdown.find('option[value="none"]').length > 0) {
            return;
        }
        
        // Add the option after "auto" or at the start
        const autoOption = dropdown.find('option[value="auto"]');
        if (autoOption.length > 0) {
            autoOption.after('<option value="none">None</option>');
        } else {
            dropdown.prepend('<option value="none">None</option>');
        }
        
        console.log('[Reasoning Effort None] Added "none" option to dropdown');
        
        if (settings.autoSetNone) {
            dropdown.val('none').trigger('change');
        }
    }
    
    function removeNoneOption() {
        $('select option[value="none"]').remove();
    }
    
    function createSettingsUI() {
        const html = `
            <div class="reasoning-effort-none-settings">
                <div class="inline-drawer">
                    <div class="inline-drawer-toggle inline-drawer-header">
                        <b>Reasoning Effort: None Option</b>
                        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                    </div>
                    <div class="inline-drawer-content">
                        <label class="checkbox_label">
                            <input type="checkbox" id="reasoning_none_enabled" checked>
                            <span>Enable "None" Option</span>
                        </label>
                        <br><small>Adds "none" to the reasoning effort dropdown.</small>
                        
                        <br><br>
                        <label class="checkbox_label">
                            <input type="checkbox" id="reasoning_none_auto">
                            <span>Auto-select None</span>
                        </label>
                        <br><small>Automatically set to "none" when available.</small>
                    </div>
                </div>
            </div>
        `;
        
        $('#extensions_settings').append(html);
        
        // Load current settings
        const settings = getSettings();
        $('#reasoning_none_enabled').prop('checked', settings.enabled);
        $('#reasoning_none_auto').prop('checked', settings.autoSetNone);
        
        // Bind events
        $('#reasoning_none_enabled').on('change', function() {
            settings.enabled = $(this).is(':checked');
            saveSettings();
            if (settings.enabled) {
                addNoneOption();
            } else {
                removeNoneOption();
            }
        });
        
        $('#reasoning_none_auto').on('change', function() {
            settings.autoSetNone = $(this).is(':checked');
            saveSettings();
        });
        
        console.log('[Reasoning Effort None] Settings UI created');
    }
    
    function init() {
        console.log('[Reasoning Effort None] Initializing...');
        
        createSettingsUI();
        
        // Try adding option after 1 second
        setTimeout(addNoneOption, 1000);
        
        // Keep checking periodically
        setInterval(function() {
            const settings = getSettings();
            if (settings.enabled) {
                const dropdown = $('#reasoning_effort, #openai_reasoning_effort, select[name="reasoning_effort"]').first();
                if (dropdown.length > 0 && dropdown.find('option[value="none"]').length === 0) {
                    addNoneOption();
                }
            }
        }, 3000);
        
        console.log('[Reasoning Effort None] Ready');
    }
    
    // Start when jQuery is ready
    if (typeof jQuery !== 'undefined' && jQuery) {
        jQuery(function() {
            setTimeout(init, 500);
        });
    } else {
        console.error('[Reasoning Effort None] jQuery not found!');
    }

})();
