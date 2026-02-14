/**
 * Reasoning Effort: None Option
 * Adds "none" to reasoning effort dropdown
 */

(function() {
    console.log('[Reasoning Effort None] Extension file loaded');

    const SETTINGS_KEY = 'reasoning-effort-none-ext';
    let settings = { enabled: true, autoSetNone: false };
    
    function addNoneOption() {
        if (!settings.enabled) return;
        
        const dropdown = $('#reasoning_effort, #openai_reasoning_effort, select[name="reasoning_effort"]').first();
        
        if (dropdown.length === 0) return;
        if (dropdown.find('option[value="none"]').length > 0) return;
        
        const autoOption = dropdown.find('option[value="auto"]');
        if (autoOption.length > 0) {
            autoOption.after('<option value="none">None</option>');
        } else {
            dropdown.prepend('<option value="none">None</option>');
        }
        
        console.log('[Reasoning Effort None] Added "none" option');
        
        if (settings.autoSetNone) {
            dropdown.val('none').trigger('change');
        }
    }
    
    function removeNoneOption() {
        $('select option[value="none"]').remove();
    }
    
    function saveSettings() {
        if (window.extension_settings && window.saveSettingsDebounced) {
            window.extension_settings[SETTINGS_KEY] = settings;
            window.saveSettingsDebounced();
        }
    }
    
    function loadSettings() {
        if (window.extension_settings) {
            if (window.extension_settings[SETTINGS_KEY]) {
                settings = window.extension_settings[SETTINGS_KEY];
            } else {
                window.extension_settings[SETTINGS_KEY] = settings;
            }
        }
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
                        <br><small>Adds "none" to reasoning effort dropdown.</small>
                        
                        <br><br>
                        <label class="checkbox_label">
                            <input type="checkbox" id="reasoning_none_auto">
                            <span>Auto-select None</span>
                        </label>
                        <br><small>Automatically set to "none".</small>
                    </div>
                </div>
            </div>
        `;
        
        $('#extensions_settings').append(html);
        
        $('#reasoning_none_enabled').prop('checked', settings.enabled);
        $('#reasoning_none_auto').prop('checked', settings.autoSetNone);
        
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
    }
    
    function startWatching() {
        setInterval(function() {
            if (settings.enabled) {
                const dropdown = $('#reasoning_effort, #openai_reasoning_effort, select[name="reasoning_effort"]').first();
                if (dropdown.length > 0 && dropdown.find('option[value="none"]').length === 0) {
                    addNoneOption();
                }
            }
        }, 3000);
    }
    
    function init() {
        console.log('[Reasoning Effort None] Initializing...');
        
        loadSettings();
        createSettingsUI();
        
        setTimeout(addNoneOption, 1000);
        startWatching();
        
        console.log('[Reasoning Effort None] Ready');
    }
    
    // Wait for extension_settings to be available
    function waitForSettings() {
        if (window.extension_settings) {
            console.log('[Reasoning Effort None] extension_settings found, starting init');
            init();
        } else {
            console.log('[Reasoning Effort None] Waiting for extension_settings...');
            setTimeout(waitForSettings, 500);
        }
    }
    
    // Start when jQuery is ready
    if (typeof jQuery !== 'undefined') {
        jQuery(function() {
            waitForSettings();
        });
    } else {
        console.error('[Reasoning Effort None] jQuery not found');
    }

})();
