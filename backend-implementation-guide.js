/**
 * Backend Implementation Guide - OpenAI Reasoning Effort "None"
 * 
 * This guide shows how to modify SillyTavern's openai.js to support "none" reasoning effort
 * 
 * IMPORTANT: This is for OpenAI's reasoning models (o1, o3, etc.), NOT Anthropic's Claude
 */

// ============================================================================
// FILE LOCATION: src/openai.js (or similar)
// ============================================================================

// ============================================================================
// STEP 1: Add "none" to reasoning_effort_types
// ============================================================================

// FIND this export (usually near the top or bottom of the file):
/*
export const reasoning_effort_types = {
    auto: 'auto',
    low: 'low',
    medium: 'medium',
    high: 'high',
    min: 'min',
    max: 'max',
};
*/

// CHANGE TO:
export const reasoning_effort_types = {
    auto: 'auto',
    none: 'none',  // ADD THIS LINE
    low: 'low',
    medium: 'medium',
    high: 'high',
    min: 'min',
    max: 'max',
};

// ============================================================================
// STEP 2: Update resolveReasoningEffort() function
// ============================================================================

// FIND this function:
/*
function resolveReasoningEffort() {
    switch (settings.reasoning_effort) {
        case reasoning_effort_types.auto:
            return undefined;
        case reasoning_effort_types.min:
            return [chat_completion_sources.OPENAI, chat_completion_sources.AZURE_OPENAI].includes(settings.chat_completion_source) && /^gpt-5/.test(model)
                ? reasoning_effort_types.min
                : reasoning_effort_types.low;
        case reasoning_effort_types.max:
            return reasoning_effort_types.high;
        default:
            return settings.reasoning_effort;
    }
}
*/

// CHANGE TO:
function resolveReasoningEffort() {
    switch (settings.reasoning_effort) {
        case reasoning_effort_types.auto:
            return undefined;
        case reasoning_effort_types.none:  // ADD THIS CASE
            // Return null or undefined to indicate no reasoning should be used
            // This will prevent the reasoning_effort parameter from being sent
            return null;
        case reasoning_effort_types.min:
            return [chat_completion_sources.OPENAI, chat_completion_sources.AZURE_OPENAI].includes(settings.chat_completion_source) && /^gpt-5/.test(model)
                ? reasoning_effort_types.min
                : reasoning_effort_types.low;
        case reasoning_effort_types.max:
            return reasoning_effort_types.high;
        default:
            return settings.reasoning_effort;
    }
}

// ============================================================================
// STEP 3: Update the API request builder (if needed)
// ============================================================================

// FIND where the reasoning_effort is added to the API request body:
/*
async function generateChatCompletion(messages) {
    const body = {
        model: settings.model,
        messages: messages,
        temperature: settings.temperature,
        // ... other parameters
    };
    
    const reasoningEffort = resolveReasoningEffort();
    if (reasoningEffort) {
        body.reasoning_effort = reasoningEffort;
    }
    
    // ... make API call
}
*/

// VERIFY it looks something like this (it should already handle null/undefined correctly):
async function generateChatCompletion(messages) {
    const body = {
        model: settings.model,
        messages: messages,
        temperature: settings.temperature,
        // ... other parameters
    };
    
    const reasoningEffort = resolveReasoningEffort();
    
    // This check should already handle null/undefined properly
    // Only add reasoning_effort to body if it has a valid value
    if (reasoningEffort !== null && reasoningEffort !== undefined) {
        body.reasoning_effort = reasoningEffort;
    }
    
    console.log('[OpenAI] Reasoning effort:', reasoningEffort || 'none (not sent)');
    
    // ... make API call
}

// ============================================================================
// ALTERNATIVE: If the code structure is different
// ============================================================================

// Some versions might have it structured differently:
/*
function buildRequestBody(messages) {
    const body = {
        model: getModel(),
        messages: processMessages(messages),
    };
    
    // Add optional parameters
    if (settings.temperature !== undefined) body.temperature = settings.temperature;
    if (settings.top_p !== undefined) body.top_p = settings.top_p;
    
    const effort = resolveReasoningEffort();
    if (effort) body.reasoning_effort = effort;
    
    return body;
}
*/

// Make sure the check handles null:
function buildRequestBody(messages) {
    const body = {
        model: getModel(),
        messages: processMessages(messages),
    };
    
    // Add optional parameters
    if (settings.temperature !== undefined) body.temperature = settings.temperature;
    if (settings.top_p !== undefined) body.top_p = settings.top_p;
    
    const effort = resolveReasoningEffort();
    // Only add if it's a valid string value (not null, undefined, or empty)
    if (effort && typeof effort === 'string') {
        body.reasoning_effort = effort;
    }
    
    return body;
}

// ============================================================================
// STEP 4: Validate Settings (Optional but Recommended)
// ============================================================================

// If there's a validation function, update it:
/*
function validateSettings() {
    const validEfforts = Object.values(reasoning_effort_types);
    if (settings.reasoning_effort && !validEfforts.includes(settings.reasoning_effort)) {
        console.warn('[OpenAI] Invalid reasoning effort:', settings.reasoning_effort);
        settings.reasoning_effort = reasoning_effort_types.auto;
    }
}
*/

// This should automatically work since we added 'none' to the types object

// ============================================================================
// COMPLETE EXAMPLE - BEFORE AND AFTER
// ============================================================================

// BEFORE (typical openai.js structure):
/*
export const reasoning_effort_types = {
    auto: 'auto',
    low: 'low',
    medium: 'medium',
    high: 'high',
    min: 'min',
    max: 'max',
};

function resolveReasoningEffort() {
    switch (settings.reasoning_effort) {
        case reasoning_effort_types.auto:
            return undefined;
        case reasoning_effort_types.min:
            return [chat_completion_sources.OPENAI, chat_completion_sources.AZURE_OPENAI].includes(settings.chat_completion_source) && /^gpt-5/.test(model)
                ? reasoning_effort_types.min
                : reasoning_effort_types.low;
        case reasoning_effort_types.max:
            return reasoning_effort_types.high;
        default:
            return settings.reasoning_effort;
    }
}

async function generateChatCompletion(messages) {
    const body = {
        model: settings.model,
        messages: messages,
    };
    
    const reasoningEffort = resolveReasoningEffort();
    if (reasoningEffort) {
        body.reasoning_effort = reasoningEffort;
    }
    
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });
    
    return await response.json();
}
*/

// AFTER (with "none" support):
export const reasoning_effort_types = {
    auto: 'auto',
    none: 'none',  // ADDED
    low: 'low',
    medium: 'medium',
    high: 'high',
    min: 'min',
    max: 'max',
};

function resolveReasoningEffort() {
    switch (settings.reasoning_effort) {
        case reasoning_effort_types.auto:
            return undefined;
        case reasoning_effort_types.none:  // ADDED
            return null;  // Return null to skip reasoning
        case reasoning_effort_types.min:
            return [chat_completion_sources.OPENAI, chat_completion_sources.AZURE_OPENAI].includes(settings.chat_completion_source) && /^gpt-5/.test(model)
                ? reasoning_effort_types.min
                : reasoning_effort_types.low;
        case reasoning_effort_types.max:
            return reasoning_effort_types.high;
        default:
            return settings.reasoning_effort;
    }
}

async function generateChatCompletion(messages) {
    const body = {
        model: settings.model,
        messages: messages,
    };
    
    const reasoningEffort = resolveReasoningEffort();
    // MODIFIED: Check for null as well as undefined
    if (reasoningEffort !== null && reasoningEffort !== undefined) {
        body.reasoning_effort = reasoningEffort;
    }
    
    // ADDED: Logging for debugging
    console.log('[OpenAI] Reasoning effort:', reasoningEffort === null ? 'none (omitted)' : reasoningEffort || 'auto');
    
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });
    
    return await response.json();
}

// ============================================================================
// SUMMARY OF CHANGES
// ============================================================================

/**
 * What needs to be changed:
 * 
 * 1. Add 'none': 'none' to reasoning_effort_types export
 * 2. Add case for 'none' in resolveReasoningEffort() that returns null
 * 3. Ensure the null value prevents reasoning_effort from being added to API request
 * 4. Optional: Add logging to verify the behavior
 * 
 * That's it! Very minimal changes needed.
 */

// ============================================================================
// TESTING
// ============================================================================

/**
 * To verify it works:
 * 
 * 1. Check console logs when sending a message with "none" selected
 * 2. Use browser DevTools Network tab to inspect the API request
 * 3. Verify reasoning_effort is NOT in the request body when "none" is selected
 * 4. Verify reasoning_effort IS in the request body with other options
 * 
 * Expected request body with "none":
 * {
 *   "model": "gpt-4",
 *   "messages": [...],
 *   "temperature": 1.0
 *   // NO reasoning_effort field
 * }
 * 
 * Expected request body with "medium":
 * {
 *   "model": "gpt-4",
 *   "messages": [...],
 *   "temperature": 1.0,
 *   "reasoning_effort": "medium"
 * }
 */

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/**
 * Issue: "none" option appears but doesn't work
 * Solution: Check that resolveReasoningEffort() returns null for 'none' case
 * 
 * Issue: API errors when using "none"
 * Solution: Verify that null values don't add reasoning_effort to request body
 * 
 * Issue: Backend changes lost after update
 * Solution: Consider creating a git patch or using extension approach instead
 */

module.exports = {
    reasoning_effort_types,
    resolveReasoningEffort
};
