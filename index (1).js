/**
 * Reasoning Effort: None Option - SillyTavern Extension
 * Adds "none" option to OpenAI reasoning effort settings
 */

import { eventSource, event_types } from '../../../script.js';
import { extension_settings, saveSettingsDebounced } from '../../extensions.js';

const extensionName = 'reasoning-effort-none';
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}/`;

// Default settings
const defaultSettings = {
    enabled: true,
    autoSetNone: false
};

// Initialize extension settings
function loadSettings() {
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = defaultSettings;
    }
    
    // Apply settings to UI
    $('#reasoning_effort_none_enabled').prop('checked', extension_settings[extensionName].enabled);
    $('#reasoning_effort_auto_none').prop('checked', extension_settings[extensionName].autoSetNone);
}

// Save extension settings
function onEnabledChange() {
    extension_settings[extensionName].enabled = $('#reasoning_effort_none_enabled').prop('checked');
    saveSettingsDebounced();
    
    if (extension_settings[extensionName].enabled) {
        addNoneOption();
    } else {
        removeNoneOption();
    }
}

function onAutoNoneChange() {
    extension_settings[extensionName].autoSetNone = $('#reasoning_effort_auto_none').prop('checked');
    saveSettingsDebounced();
}

// Add "none" option to the reasoning effort dropdown
function addNoneOption() {
    // Find the reasoning effort select element
    // It might be in different locations depending on the API source
    const selectors = [
        '#reasoning_effort',
        '#openai_reasoning_effort',
        'select[name="reasoning_effort"]',
        '.reasoning_effort_select'
    ];
    
    let reasoningEffortSelect = null;
    for (const selector of selectors) {
        const elem = $(selector);
        if (elem.length > 0) {
            reasoningEffortSelect = elem;
            break;
        }
    }
    
    if (!reasoningEffortSelect || reasoningEffortSelect.length === 0) {
        console.log('[Reasoning Effort None] Reasoning effort select not found, will retry...');
        return;
    }
    
    // Check if "none" option already exists
    if (reasoningEffortSelect.find('option[value="none"]').length > 0) {
        console.log('[Reasoning Effort None] "none" option already exists');
        return;
    }
    
    // Add the "none" option after "auto"
    // Expected order: auto, none, min, low, medium, high, max
    const autoOption = reasoningEffortSelect.find('option[value="auto"]');
    if (autoOption.length > 0) {
        autoOption.after('<option value="none">None</option>');
    } else {
        // If no auto option, add at the beginning
        reasoningEffortSelect.prepend('<option value="none">None</option>');
    }
    
    console.log('[Reasoning Effort None] Added "none" option to reasoning effort');
    
    // Auto-set to none if enabled
    if (extension_settings[extensionName].autoSetNone) {
        reasoningEffortSelect.val('none').trigger('change');
    }
}

// Remove "none" option
function removeNoneOption() {
    const selectors = [
        '#reasoning_effort',
        '#openai_reasoning_effort',
        'select[name="reasoning_effort"]',
        '.reasoning_effort_select'
    ];
    
    for (const selector of selectors) {
        $(selector).find('option[value="none"]').remove();
    }
    
    console.log('[Reasoning Effort None] Removed "none" option from reasoning effort');
}

// Monitor for settings changes
function setupMonitoring() {
    // Watch for API source changes that might reload the UI
    eventSource.on(event_types.CHAT_CHANGED, function() {
        if (extension_settings[extensionName].enabled) {
            // Recheck if the option needs to be added
            setTimeout(() => {
                const select = $('#reasoning_effort, #openai_reasoning_effort, select[name="reasoning_effort"]');
                if (select.length > 0 && select.find('option[value="none"]').length === 0) {
                    addNoneOption();
                }
            }, 100);
        }
    });
}

// Create the settings UI
function createSettingsUI() {
    const settingsHtml = `
        <div class="reasoning-effort-none-settings">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>Reasoning Effort: None Option</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <label class="checkbox_label" for="reasoning_effort_none_enabled">
                        <input type="checkbox" id="reasoning_effort_none_enabled" name="reasoning_effort_none_enabled">
                        <span>Enable "None" Option</span>
                    </label>
                    <small>Adds a "none" reasoning effort option. Use this to disable reasoning for faster responses with standard models.</small>
                    
                    <label class="checkbox_label marginTop10" for="reasoning_effort_auto_none">
                        <input type="checkbox" id="reasoning_effort_auto_none" name="reasoning_effort_auto_none">
                        <span>Auto-set to None</span>
                    </label>
                    <small>Automatically select "none" when the option is available. Good for prioritizing speed over reasoning.</small>
                    
                    <div class="marginTop10">
                        <small><strong>Note:</strong> This extension adds "none" to the existing options: auto, min, low, medium, high, max. The "none" option tells the API to not use extended reasoning at all.</small>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Append to extensions settings
    $('#extensions_settings').append(settingsHtml);
    
    // Bind event handlers
    $('#reasoning_effort_none_enabled').on('change', onEnabledChange);
    $('#reasoning_effort_auto_none').on('change', onAutoNoneChange);
}

// Observe DOM changes to catch when reasoning effort dropdown is added/modified
function observeDOM() {
    const observer = new MutationObserver((mutations) => {
        if (!extension_settings[extensionName].enabled) return;
        
        for (const mutation of mutations) {
            // Check if any select elements were added
            if (mutation.addedNodes.length > 0) {
                const hasReasoningSelect = Array.from(mutation.addedNodes).some(node => {
                    if (node.nodeType !== 1) return false; // Only element nodes
                    return node.id === 'reasoning_effort' || 
                           node.id === 'openai_reasoning_effort' ||
                           (node.querySelector && node.querySelector('select[name="reasoning_effort"]'));
                });
                
                if (hasReasoningSelect) {
                    setTimeout(() => addNoneOption(), 100);
                }
            }
        }
    });
    
    // Start observing the document body for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Initialize extension
jQuery(async () => {
    console.log('[Reasoning Effort None] Initializing extension...');
    
    // Create settings UI
    createSettingsUI();
    
    // Load settings
    loadSettings();
    
    // Set up monitoring for API changes
    setupMonitoring();
    
    // Observe DOM for dynamic UI changes
    observeDOM();
    
    // Try to add the option immediately if the element exists
    const checkAndAdd = () => {
        const select = $('#reasoning_effort, #openai_reasoning_effort, select[name="reasoning_effort"]');
        if (select.length > 0 && extension_settings[extensionName].enabled) {
            addNoneOption();
            console.log('[Reasoning Effort None] Extension initialized successfully');
            return true;
        }
        return false;
    };
    
    // Try immediately
    if (!checkAndAdd()) {
        // If not found, retry periodically
        const checkInterval = setInterval(() => {
            if (checkAndAdd()) {
                clearInterval(checkInterval);
            }
        }, 500);
        
        // Stop trying after 10 seconds
        setTimeout(() => clearInterval(checkInterval), 10000);
    }
});

// Export for module usage
export { extensionName, defaultSettings };
